import * as fs from "fs";
import * as path from "path";
import {
  Diagnostic,
  DiagnosticSeverity
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";
import { normalizeTypeText } from "./language";
import { uriToFsPath } from "./util";

interface ImportDiagnosticCodes {
  importDuplicateDeclarationCode: string;
  importDependencyMismatchCode: string;
  importForwardedDependencyWarningCode: string;
}

const infoTomlDependencyCache = new Map<
  string,
  { mtimeMs: number; dependencies: string[] }
>();

export function collectDuplicateImportDeclarationDiagnostics(
  analysis: DocumentAnalysis,
  source: string,
  codes: ImportDiagnosticCodes
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const seen = new Map<
    string,
    DocumentAnalysis["importFunctionDeclarations"][number]
  >();

  for (const declaration of analysis.importFunctionDeclarations) {
    const normalizedModule = normalizeImportModuleName(declaration.moduleName);
    const normalizedReturnType = normalizeTypeText(declaration.returnType);
    const normalizedParameterTypes = normalizeImportParameterTypeSignature(
      declaration.argsText
    );
    const signatureKey = [
      declaration.namespacePath.toLowerCase(),
      declaration.functionName.toLowerCase(),
      normalizedReturnType,
      normalizedParameterTypes,
      normalizedModule
    ].join("|");

    const existing = seen.get(signatureKey);
    if (existing) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: declaration.statementRange,
        message: `Duplicate import declaration for "${declaration.functionName}" from "${declaration.moduleName}".`,
        source,
        code: codes.importDuplicateDeclarationCode
      });
      continue;
    }

    seen.set(signatureKey, declaration);
  }

  return diagnostics;
}

export function collectImportDependencyDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  source: string,
  codes: ImportDiagnosticCodes
): Diagnostic[] {
  if (analysis.importFunctionDeclarations.length === 0) {
    return [];
  }

  const dependencies = loadInfoTomlDependenciesForDocument(document.uri);
  if (dependencies.length === 0) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  for (const declaration of analysis.importFunctionDeclarations) {
    if (shouldFlagOpSuffixDependencyMismatch(dependencies, declaration.moduleName)) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: declaration.moduleRange,
        message: `Import source "${declaration.moduleName}" is incompatible with dependency declaration (module requires ".op" suffix).`,
        source,
        code: codes.importDependencyMismatchCode
      });
      continue;
    }

    if (!shouldMirrorDependencyWarningsForImport(dependencies, declaration.moduleName)) {
      continue;
    }

    diagnostics.push({
      severity: DiagnosticSeverity.Warning,
      range: declaration.moduleRange,
      message: "Signed/Unsigned mismatch",
      source,
      code: codes.importForwardedDependencyWarningCode
    });
    diagnostics.push({
      severity: DiagnosticSeverity.Warning,
      range: declaration.moduleRange,
      message: "Sanity check: Use 'const string &in imported parameter' to pass a string by reference",
      source,
      code: codes.importForwardedDependencyWarningCode
    });
  }

  return diagnostics;
}

function loadInfoTomlDependenciesForDocument(documentUri: string): string[] {
  let filePath: string;
  try {
    filePath = uriToFsPath(documentUri);
  } catch {
    return [];
  }

  let current = path.dirname(filePath);
  let infoTomlPath: string | undefined;
  while (true) {
    const candidate = path.join(current, "info.toml");
    if (fs.existsSync(candidate)) {
      infoTomlPath = candidate;
      break;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  if (!infoTomlPath) {
    return [];
  }

  try {
    const stat = fs.statSync(infoTomlPath);
    const cached = infoTomlDependencyCache.get(infoTomlPath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.dependencies;
    }

    const text = fs.readFileSync(infoTomlPath, "utf8");
    const dependencies = parseInfoTomlDependencies(text);
    infoTomlDependencyCache.set(infoTomlPath, {
      mtimeMs: stat.mtimeMs,
      dependencies
    });
    return dependencies;
  } catch {
    return [];
  }
}

function parseInfoTomlDependencies(text: string): string[] {
  const sectionMatch = /\[\s*script\s*]([\s\S]*?)(?:\n\s*\[[^\]]+]|$)/i.exec(text);
  if (!sectionMatch) {
    return [];
  }

  const sectionText = sectionMatch[1];
  const dependencies = new Set<string>();
  for (const key of ["dependencies", "optional_dependencies"]) {
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

function shouldFlagOpSuffixDependencyMismatch(
  dependencies: string[],
  moduleName: string
): boolean {
  const moduleLeaf = getDependencyLeafName(moduleName);
  if (!moduleLeaf || moduleLeaf.endsWith(".op")) {
    return false;
  }

  const moduleBase = stripOpSuffix(moduleLeaf);
  const hasPlain = dependencies.some(
    (dependency) => stripOpSuffix(getDependencyLeafName(dependency)) === moduleBase
      && !getDependencyLeafName(dependency).endsWith(".op")
  );
  if (hasPlain) {
    return false;
  }

  return dependencies.some(
    (dependency) => getDependencyLeafName(dependency) === `${moduleBase}.op`
  );
}

function shouldMirrorDependencyWarningsForImport(
  dependencies: string[],
  moduleName: string
): boolean {
  const moduleBase = stripOpSuffix(getDependencyLeafName(moduleName));
  if (!moduleBase) {
    return false;
  }

  return dependencies.some((dependency) => {
    const dependencyLeaf = getDependencyLeafName(dependency);
    return dependencyLeaf === moduleBase && !dependencyLeaf.endsWith(".op");
  });
}

function getDependencyLeafName(value: string): string {
  const normalized = value.replace(/\\/g, "/").trim().toLowerCase();
  const parts = normalized.split("/").filter((part) => part.length > 0);
  return parts.length > 0 ? parts[parts.length - 1] : normalized;
}

function stripOpSuffix(value: string): string {
  return value.endsWith(".op") ? value.slice(0, -3) : value;
}

function normalizeImportModuleName(moduleName: string): string {
  const normalized = moduleName.trim().toLowerCase();
  return normalized.endsWith(".op") ? normalized.slice(0, -3) : normalized;
}

function normalizeImportParameterTypeSignature(argsText: string): string {
  if (!argsText.trim()) {
    return "";
  }

  const normalizedParts: string[] = [];
  for (const rawPart of splitTopLevelByComma(argsText)) {
    const withoutDefault = stripTopLevelDefaultValue(rawPart).trim();
    if (!withoutDefault) {
      continue;
    }

    const nameMatch = /\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(withoutDefault);
    const typeText = nameMatch
      ? withoutDefault.slice(0, nameMatch.index).trimEnd()
      : withoutDefault;
    const normalizedType = normalizeTypeText(typeText).trim();
    if (!normalizedType) {
      continue;
    }

    normalizedParts.push(normalizedType);
  }

  return normalizedParts.join(",");
}

function splitTopLevelByComma(text: string): string[] {
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

function stripTopLevelDefaultValue(text: string): string {
  const equalsIndex = text.indexOf("=");
  if (equalsIndex < 0) {
    return text;
  }
  return text.slice(0, equalsIndex);
}
