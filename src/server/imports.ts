import * as fs from "fs/promises";
import type { Dirent } from "fs";
import * as path from "path";
import * as zlib from "zlib";
import { Diagnostic, DiagnosticSeverity, Range } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocument as TextDocumentImpl } from "vscode-languageserver-textdocument";
import { analyzeDocument, type DocumentAnalysis } from "./analysis";
import { normalizeTypeText } from "./language";
import { LANGUAGE_SERVER_DIAGNOSTIC_SOURCE } from "./includes";
import type { ImportValidationSettings } from "./types";
import { getBaseUserFolderPath, resolveUserPath } from "./util";

const importSourceNotFoundCode = "import-source-not-found";
const importSourceFolderOnlyCode = "import-source-folder-only";
const importFunctionNotFoundCode = "import-function-not-found";
const importFunctionSignatureMismatchCode = "import-function-signature-mismatch";

const folderScanCacheTtlMs = 2500;
const sourceMatchCacheTtlMs = 2500;

interface ImportSourceMatch {
  kind: "folder" | "op";
  root: string;
  path: string;
}

interface CachedSourceMatches {
  value: ImportSourceMatch[];
  expiresAt: number;
}

interface CallableSignature {
  name: string;
  returnType: string;
  parameterTypes: string[];
  parameterText: string;
  minArgs: number;
  maxArgs: number;
  label: string;
}

interface FunctionIndex {
  signaturesByName: Map<string, CallableSignature[]>;
}

interface CachedFunctionIndex {
  value: FunctionIndex;
  expiresAt: number;
}

interface ImportExpectedSignature {
  returnType: string;
  parameterTypes: string[];
  argumentCount: number;
}

interface QuickFixEditData {
  range: Range;
  newText: string;
  title?: string;
}

interface ImportDiagnosticData {
  replacements?: string[];
  edits?: QuickFixEditData[];
}

const sourceMatchCache = new Map<string, CachedSourceMatches>();
const folderFunctionIndexCache = new Map<string, CachedFunctionIndex>();
const opFunctionIndexCache = new Map<string, CachedFunctionIndex>();

export async function getImportDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  workspaceRoots: string[],
  importSettings: ImportValidationSettings,
  symbolsBaseUserFolderPath: string
): Promise<Diagnostic[]> {
  if (!importSettings.enable || importSettings.maxDiagnostics <= 0) {
    return [];
  }

  if (analysis.importFunctionDeclarations.length === 0) {
    return [];
  }

  const pluginRoots = await resolvePluginRoots(
    workspaceRoots,
    importSettings.pluginRoots,
    symbolsBaseUserFolderPath
  );
  const diagnostics: Diagnostic[] = [];

  for (const declaration of analysis.importFunctionDeclarations) {
    if (diagnostics.length >= importSettings.maxDiagnostics) {
      break;
    }

    const moduleName = declaration.moduleName;
    const matches = await findImportSourceMatches(moduleName, pluginRoots);

    if (matches.length === 0) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: declaration.moduleRange,
        message: `Unable to resolve import source "${moduleName}" in configured plugin roots.`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: importSourceNotFoundCode
      });
      continue;
    }

    const hasFolderMatch = matches.some((entry) => entry.kind === "folder");
    const hasOpMatch = matches.some((entry) => entry.kind === "op");
    if (hasFolderMatch && !hasOpMatch) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: declaration.moduleRange,
        message: `Import source "${moduleName}" only matched folder targets (no .op package match).`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: importSourceFolderOnlyCode
      });
      if (diagnostics.length >= importSettings.maxDiagnostics) {
        break;
      }
    }

    const callableCandidates = new Map<string, CallableSignature>();
    const availableCallableNames = new Set<string>();

    for (const match of matches) {
      const functionIndex =
        match.kind === "folder"
          ? await getFolderFunctionIndex(match.path)
          : await getOpFunctionIndex(match.path);

      for (const [name, signatures] of functionIndex.signaturesByName.entries()) {
        availableCallableNames.add(name);
        if (name !== declaration.functionName) {
          continue;
        }

        for (const signature of signatures) {
          callableCandidates.set(signature.label, signature);
        }
      }
    }

    if (callableCandidates.size === 0) {
      const replacementNames = collectSuggestions(
        declaration.functionName,
        availableCallableNames
      );
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: declaration.functionNameRange,
        message:
          replacementNames.length > 0
            ? `Imported function "${declaration.functionName}" was not found in source "${moduleName}". Did you mean ${formatSuggestions(
                replacementNames
              )}?`
            : `Imported function "${declaration.functionName}" was not found in source "${moduleName}".`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: importFunctionNotFoundCode,
        data: {
          replacements: replacementNames
        } satisfies ImportDiagnosticData
      });
      continue;
    }

    const expectedSignature = parseExpectedImportSignature(
      declaration.returnType,
      declaration.argsText
    );
    const candidates = [...callableCandidates.values()];
    const matchingCandidate = candidates.find((candidate) =>
      isImportSignatureCompatible(expectedSignature, candidate)
    );
    if (matchingCandidate) {
      continue;
    }

    const rankedCandidates = rankCallableCandidates(expectedSignature, candidates).slice(0, 3);
    const edits = rankedCandidates.map((candidate) => {
      const replacementText = formatImportDeclarationReplacement(
        declaration.functionName,
        declaration.moduleName,
        candidate
      );
      return {
        range: declaration.statementRange,
        newText: replacementText,
        title: `Use signature: ${candidate.label}`
      } satisfies QuickFixEditData;
    });

    const candidatePreview = rankedCandidates.map((candidate) => candidate.label);
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: declaration.statementRange,
      message:
        candidatePreview.length > 0
          ? `Imported signature "${declaration.returnType} ${declaration.functionName}(${formatSignatureArgs(
              expectedSignature.parameterTypes
            )})" does not match exports in "${moduleName}". Closest: ${formatSuggestions(
              candidatePreview
            )}.`
          : `Imported signature for "${declaration.functionName}" does not match exports in "${moduleName}".`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: importFunctionSignatureMismatchCode,
      data: {
        edits
      } satisfies ImportDiagnosticData
    });
  }

  return diagnostics;
}

export function clearImportValidationCache(): void {
  sourceMatchCache.clear();
  folderFunctionIndexCache.clear();
  opFunctionIndexCache.clear();
}

async function resolvePluginRoots(
  workspaceRoots: string[],
  configuredPluginRoots: string[],
  symbolsBaseUserFolderPath: string
): Promise<string[]> {
  const candidates = new Set<string>();
  const baseUserFolderPath = getBaseUserFolderPath(symbolsBaseUserFolderPath);
  candidates.add(
    path.normalize(path.join(baseUserFolderPath, "OpenplanetNext", "Plugins"))
  );

  if (configuredPluginRoots.length > 0) {
    for (const configuredRoot of configuredPluginRoots) {
      if (path.isAbsolute(configuredRoot)) {
        candidates.add(path.normalize(resolveUserPath(configuredRoot)));
        continue;
      }

      for (const workspaceRoot of workspaceRoots) {
        candidates.add(path.normalize(path.resolve(workspaceRoot, configuredRoot)));
      }
    }
  } else {
    for (const workspaceRoot of workspaceRoots) {
      addWorkspacePluginRootCandidates(candidates, workspaceRoot);
    }
  }

  const existingRoots: string[] = [];
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        existingRoots.push(candidate);
      }
    } catch { }
  }

  return existingRoots.sort((a, b) => a.localeCompare(b));
}

async function findImportSourceMatches(
  moduleName: string,
  pluginRoots: string[]
): Promise<ImportSourceMatch[]> {
  const cacheKey = `${moduleName.toLowerCase()}\n${pluginRoots.join("|")}`;
  const now = Date.now();
  const cached = sourceMatchCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const normalizedModule = moduleName.toLowerCase();
  const exactMatches: ImportSourceMatch[] = [];
  const fuzzyMatches: ImportSourceMatch[] = [];

  for (const pluginRoot of pluginRoots) {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(pluginRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(pluginRoot, entry.name);
      const entryKind = await resolveDirentKind(pluginRoot, entry);
      if (entryKind === "directory") {
        if (entry.name.toLowerCase() === normalizedModule) {
          exactMatches.push({
            kind: "folder",
            root: pluginRoot,
            path: fullPath
          });
        } else if (moduleNameMatchesEntryName(moduleName, entry.name)) {
          fuzzyMatches.push({
            kind: "folder",
            root: pluginRoot,
            path: fullPath
          });
        }
        continue;
      }

      if (entryKind !== "file") {
        continue;
      }

      if (!entry.name.toLowerCase().endsWith(".op")) {
        continue;
      }

      const baseName = entry.name.slice(0, -3);
      if (baseName.toLowerCase() === normalizedModule) {
        exactMatches.push({
          kind: "op",
          root: pluginRoot,
          path: fullPath
        });
      } else if (moduleNameMatchesEntryName(moduleName, baseName)) {
        fuzzyMatches.push({
          kind: "op",
          root: pluginRoot,
          path: fullPath
        });
      }
    }
  }

  const matches = exactMatches.length > 0 ? exactMatches : fuzzyMatches;

  sourceMatchCache.set(cacheKey, {
    value: matches,
    expiresAt: now + sourceMatchCacheTtlMs
  });

  return matches;
}

function addWorkspacePluginRootCandidates(
  candidates: Set<string>,
  workspaceRoot: string
): void {
  const root = path.normalize(workspaceRoot);
  const parent = path.dirname(root);

  candidates.add(path.normalize(path.join(root, "plugins")));
  candidates.add(path.normalize(path.join(root, "deps")));
  candidates.add(root);

  if (parent !== root) {
    candidates.add(parent);
    candidates.add(path.normalize(path.join(parent, "plugins")));
    candidates.add(path.normalize(path.join(parent, "deps")));
  }

  const rootBase = path.basename(root).toLowerCase();
  if (parent !== root && (rootBase === "plugins" || rootBase === "deps")) {
    candidates.add(parent);
    candidates.add(path.normalize(path.join(parent, "plugins")));
    candidates.add(path.normalize(path.join(parent, "deps")));
  }
}

function moduleNameMatchesEntryName(moduleName: string, entryName: string): boolean {
  const normalizedModule = normalizeModuleLookup(moduleName);
  const normalizedEntry = normalizeModuleLookup(entryName);
  if (!normalizedModule || !normalizedEntry) {
    return false;
  }
  if (normalizedEntry === normalizedModule) {
    return true;
  }

  return normalizedModule.length >= 4 && normalizedEntry.endsWith(normalizedModule);
}

function normalizeModuleLookup(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.op$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

async function resolveDirentKind(
  parentPath: string,
  entry: Dirent
): Promise<"directory" | "file" | "other"> {
  if (entry.isDirectory()) {
    return "directory";
  }
  if (entry.isFile()) {
    return "file";
  }
  if (!entry.isSymbolicLink()) {
    return "other";
  }

  try {
    const resolved = await fs.stat(path.join(parentPath, entry.name));
    if (resolved.isDirectory()) {
      return "directory";
    }
    if (resolved.isFile()) {
      return "file";
    }
  } catch { }

  return "other";
}

async function getFolderFunctionIndex(folderPath: string): Promise<FunctionIndex> {
  const now = Date.now();
  const cached = folderFunctionIndexCache.get(folderPath);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const filePaths = await collectFolderAngelScriptFiles(folderPath);
  const analysisResults = await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        const text = await fs.readFile(filePath, "utf8");
        const uri = `import-folder://${encodeURIComponent(filePath)}`;
        const document = TextDocumentImpl.create(uri, "openplanet-angelscript", 0, text);
        return analyzeDocument(document);
      } catch {
        return undefined;
      }
    })
  );

  const index = buildFunctionIndexFromAnalyses(
    analysisResults.filter((analysis): analysis is DocumentAnalysis => analysis !== undefined)
  );
  folderFunctionIndexCache.set(folderPath, {
    value: index,
    expiresAt: now + folderScanCacheTtlMs
  });
  return index;
}

async function getOpFunctionIndex(opFilePath: string): Promise<FunctionIndex> {
  const now = Date.now();
  const cached = opFunctionIndexCache.get(opFilePath);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  let buffer: Buffer;
  try {
    buffer = await fs.readFile(opFilePath);
  } catch {
    return emptyFunctionIndex();
  }

  const entries = extractZipAngelScriptEntries(buffer);
  const analyses: DocumentAnalysis[] = [];
  for (const entry of entries) {
    const uri = `import-op://${encodeURIComponent(opFilePath)}!/${encodeURIComponent(
      entry.name
    )}`;
    const document = TextDocumentImpl.create(uri, "openplanet-angelscript", 0, entry.text);
    analyses.push(analyzeDocument(document));
  }

  const index = buildFunctionIndexFromAnalyses(analyses);
  opFunctionIndexCache.set(opFilePath, {
    value: index,
    expiresAt: now + folderScanCacheTtlMs
  });
  return index;
}

async function collectFolderAngelScriptFiles(folderPath: string): Promise<string[]> {
  const files: string[] = [];
  const stack = [folderPath];
  const visitedDirectories = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const currentDirectoryKey = await resolveDirectoryTraversalKey(current);
    if (visitedDirectories.has(currentDirectoryKey)) {
      continue;
    }
    visitedDirectories.add(currentDirectoryKey);

    let entries: Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const entryKind = await resolveDirentKind(current, entry);
      if (entryKind === "directory") {
        stack.push(fullPath);
        continue;
      }

      if (entryKind !== "file") {
        continue;
      }

      if (!entry.name.toLowerCase().endsWith(".as")) {
        continue;
      }

      files.push(fullPath);
    }
  }

  return files;
}

async function resolveDirectoryTraversalKey(directoryPath: string): Promise<string> {
  try {
    return path.normalize(await fs.realpath(directoryPath)).toLowerCase();
  } catch {
    return path.normalize(path.resolve(directoryPath)).toLowerCase();
  }
}

function extractZipAngelScriptEntries(buffer: Buffer): Array<{ name: string; text: string }> {
  const entries: Array<{ name: string; text: string }> = [];
  const eocdOffset = findEndOfCentralDirectoryOffset(buffer);
  if (eocdOffset < 0) {
    return entries;
  }

  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let pointer = centralDirectoryOffset;

  for (let i = 0; i < totalEntries; i += 1) {
    if (pointer + 46 > buffer.length) {
      break;
    }

    const headerSignature = buffer.readUInt32LE(pointer);
    if (headerSignature !== 0x02014b50) {
      break;
    }

    const compressionMethod = buffer.readUInt16LE(pointer + 10);
    const compressedSize = buffer.readUInt32LE(pointer + 20);
    const fileNameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localHeaderOffset = buffer.readUInt32LE(pointer + 42);
    const nameStart = pointer + 46;
    const nameEnd = nameStart + fileNameLength;
    if (nameEnd > buffer.length) {
      break;
    }

    const name = buffer.toString("utf8", nameStart, nameEnd);
    pointer = nameEnd + extraLength + commentLength;
    if (!name.toLowerCase().endsWith(".as")) {
      continue;
    }

    const entryText = extractZipEntryText(
      buffer,
      localHeaderOffset,
      compressionMethod,
      compressedSize
    );
    if (entryText === undefined) {
      continue;
    }

    entries.push({ name, text: entryText });
  }

  return entries;
}

function findEndOfCentralDirectoryOffset(buffer: Buffer): number {
  const minimumSize = 22;
  if (buffer.length < minimumSize) {
    return -1;
  }

  const maxCommentLength = 0xffff;
  const start = Math.max(0, buffer.length - minimumSize - maxCommentLength);
  for (let i = buffer.length - minimumSize; i >= start; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      return i;
    }
  }

  return -1;
}

function extractZipEntryText(
  buffer: Buffer,
  localHeaderOffset: number,
  compressionMethod: number,
  compressedSize: number
): string | undefined {
  if (localHeaderOffset < 0 || localHeaderOffset + 30 > buffer.length) {
    return undefined;
  }

  const localSignature = buffer.readUInt32LE(localHeaderOffset);
  if (localSignature !== 0x04034b50) {
    return undefined;
  }

  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraLength;
  const dataEnd = dataStart + compressedSize;
  if (dataEnd > buffer.length || dataStart < 0) {
    return undefined;
  }

  const compressedData = buffer.subarray(dataStart, dataEnd);
  try {
    if (compressionMethod === 0) {
      return compressedData.toString("utf8");
    }
    if (compressionMethod === 8) {
      return zlib.inflateRawSync(compressedData).toString("utf8");
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function buildFunctionIndexFromAnalyses(analyses: DocumentAnalysis[]): FunctionIndex {
  const signaturesByName = new Map<string, CallableSignature[]>();

  for (const analysis of analyses) {
    for (const fn of analysis.functions) {
      const signature = buildCallableSignature(fn.name, fn.returnType, fn.argsText);
      const signatures = signaturesByName.get(fn.name) ?? [];
      if (!signatures.some((entry) => entry.label === signature.label)) {
        signatures.push(signature);
      }
      signaturesByName.set(fn.name, signatures);
    }
  }

  return { signaturesByName };
}

function emptyFunctionIndex(): FunctionIndex {
  return { signaturesByName: new Map<string, CallableSignature[]>() };
}

function buildCallableSignature(
  name: string,
  returnTypeText: string,
  argsText: string
): CallableSignature {
  const parameterEntries = extractParameterEntries(argsText);
  const parameterTypes = parameterEntries.map((entry) => entry.type);
  const minArgs = parameterEntries.reduce(
    (count, entry) => (entry.optional ? count : count + 1),
    0
  );
  const maxArgs = parameterEntries.length;
  const normalizedReturnType = normalizeSignatureType(returnTypeText || "void");
  const parameterText = argsText.trim();
  return {
    name,
    returnType: normalizedReturnType || "void",
    parameterTypes,
    parameterText,
    minArgs,
    maxArgs,
    label: `${normalizedReturnType || "void"} ${name}(${parameterText || "void"})`
  };
}

function parseExpectedImportSignature(
  returnTypeText: string,
  argsText: string
): ImportExpectedSignature {
  const parameterEntries = extractParameterEntries(argsText);
  return {
    returnType: normalizeSignatureType(returnTypeText || "void") || "void",
    parameterTypes: parameterEntries.map((entry) => entry.type),
    argumentCount: parameterEntries.length
  };
}

function isImportSignatureCompatible(
  expected: ImportExpectedSignature,
  candidate: CallableSignature
): boolean {
  if (!areTypesEquivalent(expected.returnType, candidate.returnType)) {
    return false;
  }
  if (
    expected.argumentCount < candidate.minArgs ||
    expected.argumentCount > candidate.maxArgs
  ) {
    return false;
  }
  for (let i = 0; i < expected.parameterTypes.length; i += 1) {
    const expectedType = expected.parameterTypes[i];
    const candidateType = candidate.parameterTypes[i];
    if (!candidateType || !areTypesEquivalent(expectedType, candidateType)) {
      return false;
    }
  }

  return true;
}

function rankCallableCandidates(
  expected: ImportExpectedSignature,
  candidates: CallableSignature[]
): CallableSignature[] {
  return candidates.slice().sort((left, right) => {
    const leftScore = scoreCallableCandidate(expected, left);
    const rightScore = scoreCallableCandidate(expected, right);
    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }
    return left.label.localeCompare(right.label);
  });
}

function scoreCallableCandidate(
  expected: ImportExpectedSignature,
  candidate: CallableSignature
): number {
  let score = 0;
  if (areTypesEquivalent(expected.returnType, candidate.returnType)) {
    score += 10;
  }
  if (
    expected.argumentCount >= candidate.minArgs &&
    expected.argumentCount <= candidate.maxArgs
  ) {
    score += 6;
  }

  const comparableCount = Math.min(
    expected.parameterTypes.length,
    candidate.parameterTypes.length
  );
  for (let i = 0; i < comparableCount; i += 1) {
    if (areTypesEquivalent(expected.parameterTypes[i], candidate.parameterTypes[i])) {
      score += 2;
    }
  }

  score -= Math.abs(expected.argumentCount - candidate.parameterTypes.length);
  return score;
}

function formatImportDeclarationReplacement(
  functionName: string,
  moduleName: string,
  candidate: CallableSignature
): string {
  const parameterText = candidate.parameterText.trim() || "void";
  return `import ${candidate.returnType} ${functionName}(${parameterText}) from "${moduleName}";`;
}

function formatSignatureArgs(parameterTypes: string[]): string {
  if (parameterTypes.length === 0) {
    return "void";
  }

  return parameterTypes.join(", ");
}

function extractParameterEntries(
  argsText: string
): Array<{ type: string; optional: boolean }> {
  const args = splitTopLevelByComma(argsText.trim());
  if (args.length === 0 || (args.length === 1 && args[0] === "void")) {
    return [];
  }

  const parameters: Array<{ type: string; optional: boolean }> = [];
  for (const arg of args) {
    const optional = arg.includes("=");
    const rawType = extractArgumentType(arg);
    const normalized = normalizeSignatureType(rawType);
    if (!normalized || normalized === "void") {
      continue;
    }
    parameters.push({ type: normalized, optional });
  }

  return parameters;
}

function extractArgumentType(argText: string): string {
  const withoutDefault = argText.split("=")[0].trim();
  if (!withoutDefault) {
    return "";
  }
  if (withoutDefault === "void") {
    return "void";
  }

  const nameMatch = /([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(withoutDefault);
  if (!nameMatch) {
    return withoutDefault;
  }

  const nameStart = withoutDefault.lastIndexOf(nameMatch[1]);
  if (nameStart <= 0) {
    return withoutDefault;
  }

  const typeCandidate = withoutDefault.slice(0, nameStart).trim();
  if (!typeCandidate) {
    return withoutDefault;
  }

  return typeCandidate;
}

function normalizeSignatureType(rawTypeText: string): string {
  let normalized = normalizeTypeText(rawTypeText).trim();
  if (!normalized) {
    return normalized;
  }

  normalized = normalized.replace(/\b(const|in|out|inout)\b/g, " ").trim();
  normalized = normalized.replace(/\s+/g, " ");
  normalized = normalized.replace(/\s*::\s*/g, "::");
  normalized = normalized.replace(/\s*<\s*/g, "<");
  normalized = normalized.replace(/\s*>\s*/g, ">");
  normalized = normalized.replace(/\s*,\s*/g, ", ");
  normalized = normalized.replace(/\s*@\s*/g, "@");
  normalized = normalized.replace(/\s*&\s*/g, "&");
  return normalized.trim();
}

function areTypesEquivalent(left: string, right: string): boolean {
  return normalizeSignatureType(left) === normalizeSignatureType(right);
}

function collectSuggestions(target: string, values: Iterable<string>): string[] {
  const unique = [...new Set(values)];
  if (unique.length === 0) {
    return [];
  }

  const lower = target.toLowerCase();
  const ranked = unique
    .map((value) => ({
      value,
      score: levenshteinDistance(lower, value.toLowerCase())
    }))
    .sort((a, b) => a.score - b.score || a.value.localeCompare(b.value));

  return ranked.slice(0, 3).map((entry) => entry.value);
}

function formatSuggestions(values: string[]): string {
  if (values.length === 0) {
    return "";
  }
  if (values.length === 1) {
    return `"${values[0]}"`;
  }
  if (values.length === 2) {
    return `"${values[0]}" or "${values[1]}"`;
  }

  return `"${values[0]}", "${values[1]}", or "${values[2]}"`;
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  if (left.length === 0) {
    return right.length;
  }
  if (right.length === 0) {
    return left.length;
  }

  const previous: number[] = [];
  const current: number[] = [];
  for (let j = 0; j <= right.length; j += 1) {
    previous[j] = j;
  }

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
      );
    }
    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[right.length];
}

function splitTopLevelByComma(text: string): string[] {
  if (!text) {
    return [];
  }

  const parts: string[] = [];
  let segmentStart = 0;
  let parenDepth = 0;
  let angleDepth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (ch === "<") {
      angleDepth += 1;
      continue;
    }
    if (ch === ">") {
      angleDepth = Math.max(0, angleDepth - 1);
      continue;
    }

    if (ch === "," && parenDepth === 0 && angleDepth === 0) {
      parts.push(text.slice(segmentStart, i).trim());
      segmentStart = i + 1;
    }
  }

  parts.push(text.slice(segmentStart).trim());
  return parts.filter((part) => part.length > 0);
}
