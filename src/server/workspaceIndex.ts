import * as fs from "fs/promises";
import type { Dirent } from "fs";
import * as path from "path";
import * as zlib from "zlib";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocument as TextDocumentImpl } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { analyzeDocument, type DocumentAnalysis } from "./analysis";
import type { Logger } from "./types";
import { getBaseUserFolderPath, resolveUserPath } from "./util";

const ignoredDirectoryNames = new Set<string>([
  ".git",
  "node_modules",
  "out",
  "dist",
  "build"
]);

const defaultReadConcurrency = 24;
const defaultDependencyReadConcurrency = 16;

export interface DependencyBuildOptions {
  enableInfoTomlDependencies: boolean;
  includeOptionalDependencies: boolean;
  pluginRoots: string[];
  symbolsBaseUserFolderPath: string;
  maxDepth: number;
  maxFiles: number;
}

export interface WorkspaceAnalysisIndexBuildOptions {
  dependencies?: DependencyBuildOptions;
}

interface ImportSourceMatch {
  kind: "folder" | "op";
  path: string;
}

interface DependencyDocument {
  uri: string;
  text: string;
}

export async function buildWorkspaceAnalysisIndex(
  workspaceRoots: string[],
  openDocumentUris: Set<string>,
  logger: Logger,
  options?: WorkspaceAnalysisIndexBuildOptions
): Promise<Map<string, DocumentAnalysis>> {
  const filePaths = await collectWorkspaceAngelScriptFiles(workspaceRoots, logger);
  const analyses = new Map<string, DocumentAnalysis>();

  if (filePaths.length > 0) {
    const entries = await mapWithConcurrency(
      filePaths,
      defaultReadConcurrency,
      async (filePath) => {
        const uri = URI.file(filePath).toString();
        if (openDocumentUris.has(uri)) {
          return undefined;
        }

        return loadWorkspaceDocumentAnalysisFromFilePath(filePath, logger);
      }
    );

    for (const entry of entries) {
      if (!entry) {
        continue;
      }

      analyses.set(entry.uri, entry.analysis);
    }
  }

  const dependencyOptions = options?.dependencies;
  if (dependencyOptions?.enableInfoTomlDependencies) {
    const dependencyDocuments = await collectDependencyDocuments(
      workspaceRoots,
      dependencyOptions,
      logger
    );
    const dependencyEntries = await mapWithConcurrency(
      dependencyDocuments,
      defaultDependencyReadConcurrency,
      async (dependencyDocument) => {
        if (openDocumentUris.has(dependencyDocument.uri)) {
          return undefined;
        }

        try {
          const document = createWorkspaceTextDocument(
            dependencyDocument.uri,
            dependencyDocument.text
          );
          return {
            uri: dependencyDocument.uri,
            analysis: analyzeDocument(document)
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          logger.warn(
            `[workspace-index] Failed to index dependency ${dependencyDocument.uri}: ${message}`
          );
          return undefined;
        }
      }
    );

    for (const entry of dependencyEntries) {
      if (!entry || analyses.has(entry.uri)) {
        continue;
      }
      analyses.set(entry.uri, entry.analysis);
    }
  }

  return analyses;
}

export async function loadWorkspaceDocumentAnalysis(
  documentUri: string,
  logger: Logger
): Promise<DocumentAnalysis | undefined> {
  if (!documentUri.startsWith("file:")) {
    return undefined;
  }

  try {
    const filePath = URI.parse(documentUri).fsPath;
    const loaded = await loadWorkspaceDocumentAnalysisFromFilePath(filePath, logger);
    return loaded?.analysis;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(
      `[workspace-index] Failed to parse URI ${documentUri}: ${message}`
    );
    return undefined;
  }
}

export async function collectDependencyAngelScriptUrisForPlugin(
  pluginRootPath: string,
  workspaceRoots: string[],
  options: DependencyBuildOptions,
  logger: Logger
): Promise<string[]> {
  if (!options.enableInfoTomlDependencies || options.maxFiles <= 0) {
    return [];
  }

  const infoTomlText = await readFileIfExists(path.join(pluginRootPath, "info.toml"));
  if (!infoTomlText) {
    return [];
  }

  const rootDependencyNames = parseInfoTomlDependencies(
    infoTomlText,
    options.includeOptionalDependencies
  );
  if (rootDependencyNames.length === 0) {
    return [];
  }

  const pluginRoots = await resolvePluginRoots(
    workspaceRoots,
    options.pluginRoots,
    options.symbolsBaseUserFolderPath
  );
  if (pluginRoots.length === 0) {
    return [];
  }

  const maxDepth = Math.max(0, options.maxDepth);
  const maxFiles = Math.max(0, options.maxFiles);
  const queue = rootDependencyNames.map((moduleName) => ({
    moduleName,
    depth: 0
  }));
  const visitedModules = new Set<string>();
  const seenUris = new Set<string>();
  const uris: string[] = [];

  while (queue.length > 0 && uris.length < maxFiles) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const moduleKey = current.moduleName.toLowerCase();
    if (visitedModules.has(moduleKey)) {
      continue;
    }
    visitedModules.add(moduleKey);

    const matches = await findImportSourceMatches(current.moduleName, pluginRoots);
    if (matches.length === 0) {
      logger.info(
        `[workspace-index] No source folder found for dependency "${current.moduleName}".`
      );
      continue;
    }

    for (const match of matches) {
      if (uris.length >= maxFiles) {
        break;
      }

      if (match.kind === "folder") {
        const folderFiles = await collectFolderAngelScriptFiles(match.path);
        for (const filePath of folderFiles) {
          if (uris.length >= maxFiles) {
            break;
          }

          const uri = URI.file(filePath).toString();
          if (seenUris.has(uri)) {
            continue;
          }
          seenUris.add(uri);
          uris.push(uri);
        }

        if (current.depth < maxDepth) {
          const dependencyInfoTomlText = await readFileIfExists(
            path.join(match.path, "info.toml")
          );
          if (dependencyInfoTomlText) {
            for (const dependencyName of parseInfoTomlDependencies(
              dependencyInfoTomlText,
              options.includeOptionalDependencies
            )) {
              const dependencyKey = dependencyName.toLowerCase();
              if (!visitedModules.has(dependencyKey)) {
                queue.push({
                  moduleName: dependencyName,
                  depth: current.depth + 1
                });
              }
            }
          }
        }
        continue;
      }

      const entries = await readOpAngelScriptEntries(match.path);
      for (const entry of entries) {
        if (uris.length >= maxFiles) {
          break;
        }
        if (seenUris.has(entry.uri)) {
          continue;
        }
        seenUris.add(entry.uri);
        uris.push(entry.uri);
      }
    }
  }

  return uris.sort((a, b) => a.localeCompare(b));
}

function createWorkspaceTextDocument(uri: string, text: string): TextDocument {
  return TextDocumentImpl.create(uri, "openplanet-angelscript", 0, text);
}

async function loadWorkspaceDocumentAnalysisFromFilePath(
  filePath: string,
  logger: Logger
): Promise<{ uri: string; analysis: DocumentAnalysis } | undefined> {
  const uri = URI.file(filePath).toString();

  let text = "";
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(
      `[workspace-index] Failed to read ${filePath}: ${message}`
    );
    return undefined;
  }

  const document = createWorkspaceTextDocument(uri, text);
  return {
    uri,
    analysis: analyzeDocument(document)
  };
}

async function collectWorkspaceAngelScriptFiles(
  workspaceRoots: string[],
  logger: Logger
): Promise<string[]> {
  const filePaths: string[] = [];

  for (const workspaceRoot of workspaceRoots) {
    let rootStat;
    try {
      rootStat = await fs.stat(workspaceRoot);
    } catch {
      continue;
    }

    if (!rootStat.isDirectory()) {
      continue;
    }

    await walkDirectory(workspaceRoot, filePaths, logger);
  }

  filePaths.sort((a, b) => a.localeCompare(b));
  return filePaths;
}

async function collectDependencyDocuments(
  workspaceRoots: string[],
  options: DependencyBuildOptions,
  logger: Logger
): Promise<DependencyDocument[]> {
  const normalizedMaxDepth = Math.max(0, options.maxDepth);
  const normalizedMaxFiles = Math.max(0, options.maxFiles);
  if (normalizedMaxFiles === 0) {
    return [];
  }

  const pluginRoots = await resolvePluginRoots(
    workspaceRoots,
    options.pluginRoots,
    options.symbolsBaseUserFolderPath
  );
  if (pluginRoots.length === 0) {
    return [];
  }

  const rootDependencyNames = new Set<string>();
  for (const workspaceRoot of workspaceRoots) {
    const infoTomlPath = path.join(workspaceRoot, "info.toml");
    const infoTomlText = await readFileIfExists(infoTomlPath);
    if (!infoTomlText) {
      continue;
    }
    for (const name of parseInfoTomlDependencies(
      infoTomlText,
      options.includeOptionalDependencies
    )) {
      rootDependencyNames.add(name);
    }
  }

  if (rootDependencyNames.size === 0) {
    return [];
  }

  const queue: Array<{ moduleName: string; depth: number }> = [...rootDependencyNames].map(
    (moduleName) => ({
      moduleName,
      depth: 0
    })
  );
  const visitedModules = new Set<string>();
  const documents: DependencyDocument[] = [];
  const seenUris = new Set<string>();

  while (queue.length > 0 && documents.length < normalizedMaxFiles) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    const moduleKey = current.moduleName.toLowerCase();
    if (visitedModules.has(moduleKey)) {
      continue;
    }
    visitedModules.add(moduleKey);

    const matches = await findImportSourceMatches(current.moduleName, pluginRoots);
    if (matches.length === 0) {
      continue;
    }

    for (const match of matches) {
      if (documents.length >= normalizedMaxFiles) {
        break;
      }

      if (match.kind === "folder") {
        const folderFiles = await collectFolderAngelScriptFiles(match.path);
        const remaining = normalizedMaxFiles - documents.length;
        for (const filePath of folderFiles.slice(0, remaining)) {
          const text = await readFileIfExists(filePath);
          if (!text) {
            continue;
          }
          const uri = URI.file(filePath).toString();
          if (seenUris.has(uri)) {
            continue;
          }
          seenUris.add(uri);
          documents.push({ uri, text });
        }

        if (current.depth < normalizedMaxDepth) {
          const infoTomlText = await readFileIfExists(path.join(match.path, "info.toml"));
          if (infoTomlText) {
            for (const dependencyName of parseInfoTomlDependencies(
              infoTomlText,
              options.includeOptionalDependencies
            )) {
              const dependencyKey = dependencyName.toLowerCase();
              if (!visitedModules.has(dependencyKey)) {
                queue.push({
                  moduleName: dependencyName,
                  depth: current.depth + 1
                });
              }
            }
          }
        }
        continue;
      }

      const entries = await readOpAngelScriptEntries(match.path);
      const remaining = normalizedMaxFiles - documents.length;
      for (const entry of entries.slice(0, remaining)) {
        if (seenUris.has(entry.uri)) {
          continue;
        }
        seenUris.add(entry.uri);
        documents.push(entry);
      }
    }
  }

  return documents;
}

async function walkDirectory(
  rootDirectory: string,
  output: string[],
  logger: Logger
): Promise<void> {
  const stack = [rootDirectory];
  const visitedDirectories = new Set<string>();

  while (stack.length > 0) {
    const currentPath = stack.pop();
    if (!currentPath) {
      continue;
    }

    const currentDirectoryKey = await resolveDirectoryTraversalKey(currentPath);
    if (visitedDirectories.has(currentDirectoryKey)) {
      continue;
    }
    visitedDirectories.add(currentDirectoryKey);

    let entries: Dirent[];
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(
        `[workspace-index] Failed to read directory ${currentPath}: ${message}`
      );
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const entryKind = await resolveDirentKind(currentPath, entry);

      if (entryKind === "directory") {
        if (ignoredDirectoryNames.has(entry.name)) {
          continue;
        }

        stack.push(fullPath);
        continue;
      }

      if (entryKind !== "file") {
        continue;
      }

      if (!entry.name.toLowerCase().endsWith(".as")) {
        continue;
      }

      output.push(fullPath);
    }
  }
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

  const roots: string[] = [];
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) {
        roots.push(candidate);
      }
    } catch { }
  }

  return roots.sort((a, b) => a.localeCompare(b));
}

async function findImportSourceMatches(
  moduleName: string,
  pluginRoots: string[]
): Promise<ImportSourceMatch[]> {
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
            path: fullPath
          });
        } else if (moduleNameMatchesEntryName(moduleName, entry.name)) {
          fuzzyMatches.push({
            kind: "folder",
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
          path: fullPath
        });
      } else if (moduleNameMatchesEntryName(moduleName, baseName)) {
        fuzzyMatches.push({
          kind: "op",
          path: fullPath
        });
      }
    }
  }

  return exactMatches.length > 0 ? exactMatches : fuzzyMatches;
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

async function collectFolderAngelScriptFiles(folderPath: string): Promise<string[]> {
  const files: string[] = [];
  const stack = [folderPath];
  const visitedDirectories = new Set<string>();

  while (stack.length > 0) {
    const currentPath = stack.pop();
    if (!currentPath) {
      continue;
    }

    const currentDirectoryKey = await resolveDirectoryTraversalKey(currentPath);
    if (visitedDirectories.has(currentDirectoryKey)) {
      continue;
    }
    visitedDirectories.add(currentDirectoryKey);

    let entries: Dirent[];
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const entryKind = await resolveDirentKind(currentPath, entry);
      if (entryKind === "directory") {
        stack.push(fullPath);
        continue;
      }
      if (entryKind !== "file" || !entry.name.toLowerCase().endsWith(".as")) {
        continue;
      }
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

async function readOpAngelScriptEntries(
  opFilePath: string
): Promise<DependencyDocument[]> {
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(opFilePath);
  } catch {
    return [];
  }

  const entries = extractZipAngelScriptEntries(buffer);
  return entries.map((entry) => ({
    uri: `opdep://${encodeURIComponent(opFilePath)}!/${encodeURIComponent(
      entry.name
    )}`,
    text: entry.text
  }));
}

function extractZipAngelScriptEntries(
  buffer: Buffer
): Array<{ name: string; text: string }> {
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

async function readFileIfExists(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

function parseInfoTomlDependencies(
  text: string,
  includeOptionalDependencies: boolean
): string[] {
  const sectionMatch = /\[\s*script\s*]([\s\S]*?)(?:\n\s*\[[^\]]+]|$)/i.exec(text);
  if (!sectionMatch) {
    return [];
  }

  const sectionText = sectionMatch[1];
  const dependencies = new Set<string>();
  for (const key of includeOptionalDependencies
    ? ["dependencies", "optional_dependencies"]
    : ["dependencies"]) {
    const arrayMatch = new RegExp(
      `(?:^|\\n)\\s*${key}\\s*=\\s*\\[([\\s\\S]*?)\\]`,
      "i"
    ).exec(sectionText);
    if (!arrayMatch) {
      continue;
    }

    const listBody = arrayMatch[1];
    const stringPattern = /"((?:\\.|[^"\\])*)"/g;
    let match: RegExpExecArray | null;
    while ((match = stringPattern.exec(listBody)) !== null) {
      const dependencyName = decodeTomlString(match[1]).trim();
      if (dependencyName.length > 0) {
        dependencies.add(dependencyName);
      }
    }
  }

  return [...dependencies];
}

function decodeTomlString(raw: string): string {
  return raw
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

async function resolveDirectoryTraversalKey(directoryPath: string): Promise<string> {
  try {
    return path.normalize(await fs.realpath(directoryPath)).toLowerCase();
  } catch {
    return path.normalize(path.resolve(directoryPath)).toLowerCase();
  }
}

async function mapWithConcurrency<TInput, TOutput>(
  inputs: readonly TInput[],
  concurrency: number,
  mapper: (input: TInput) => Promise<TOutput>
): Promise<TOutput[]> {
  if (inputs.length === 0) {
    return [];
  }

  const clampedConcurrency = Math.max(1, Math.min(concurrency, inputs.length));
  const results = new Array<TOutput>(inputs.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      if (currentIndex >= inputs.length) {
        return;
      }

      results[currentIndex] = await mapper(inputs[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: clampedConcurrency }, () => worker())
  );
  return results;
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
