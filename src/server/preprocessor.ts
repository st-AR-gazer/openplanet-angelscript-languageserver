import * as fs from "fs";
import * as path from "path";
import {
  Diagnostic,
  DiagnosticSeverity
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  buildOpenplanetPreprocessorModel,
  type PreprocessorBuildOptions,
  type PreprocessorModel
} from "openplanet-angelscript-core";
import { LANGUAGE_SERVER_DIAGNOSTIC_SOURCE } from "./includes";
import { collectGameProfilePreprocessorDefines } from "./gameProfiles";
import type { OpenplanetLanguageServerSettings } from "./types";
import { uriToFsPath } from "./util";

export const unknownPreprocessorDefineCode = "unknown-preprocessor-define";
export const preprocessorSyntaxCode = "preprocessor-syntax";

interface InfoTomlPreprocessorConfig {
  defines: string[];
  dependencies: string[];
  optionalDependencies: string[];
}

export interface GameProfilePreprocessorOptions {
  trueDefines?: Iterable<string>;
  falseDefines?: Iterable<string>;
}

interface BuildDocumentPreprocessorOptions extends GameProfilePreprocessorOptions {
  knownDependencyKeys?: Iterable<string>;
  dependencyMacroFallback?: PreprocessorBuildOptions["dependencyMacroFallback"];
}

const infoTomlPreprocessorCache = new Map<
  string,
  { mtimeMs: number; config: InfoTomlPreprocessorConfig }
>();

export function collectPreprocessorDiagnostics(
  document: TextDocument,
  options?: BuildDocumentPreprocessorOptions
): Diagnostic[] {
  const model = buildDocumentPreprocessorModel(document, {
    trueDefines: options?.trueDefines,
    falseDefines: options?.falseDefines,
    dependencyMacroFallback: "unknown"
  });

  return model.diagnostics.map((diagnostic) => ({
    severity: DiagnosticSeverity.Error,
    range: {
      start: {
        line: diagnostic.line,
        character: diagnostic.character
      },
      end: {
        line: diagnostic.line,
        character: Math.max(diagnostic.character + 1, diagnostic.endCharacter)
      }
    },
    message: diagnostic.message,
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code:
      diagnostic.code === "unknown-preprocessor-define"
        ? unknownPreprocessorDefineCode
        : preprocessorSyntaxCode
  }));
}

export function filterDiagnosticsForInactivePreprocessorBranches(
  document: TextDocument,
  diagnostics: Diagnostic[],
  knownDependencyKeys: Iterable<string>,
  options?: BuildDocumentPreprocessorOptions
): Diagnostic[] {
  if (diagnostics.length === 0) {
    return diagnostics;
  }

  const model = buildDocumentPreprocessorModel(document, {
    knownDependencyKeys,
    trueDefines: options?.trueDefines,
    falseDefines: options?.falseDefines,
    dependencyMacroFallback: "false"
  });

  return diagnostics.filter((diagnostic) => {
    const lineState = model.lineStates[diagnostic.range.start.line];
    return lineState !== false;
  });
}

export function buildDocumentPreprocessorModel(
  document: TextDocument,
  options?: BuildDocumentPreprocessorOptions
): PreprocessorModel {
  const infoToml = loadInfoTomlPreprocessorConfigForDocument(document.uri);
  const buildOptions: PreprocessorBuildOptions & GameProfilePreprocessorOptions = {
    defines: infoToml.defines,
    trueDefines: options?.trueDefines,
    falseDefines: options?.falseDefines,
    dependencies: options?.knownDependencyKeys ?? infoToml.dependencies,
    optionalDependencies: infoToml.optionalDependencies,
    dependencyMacroFallback: options?.dependencyMacroFallback ?? "unknown"
  };
  return buildOpenplanetPreprocessorModel(document.getText(), buildOptions);
}

export function getGameProfilePreprocessorOptions(
  settings: OpenplanetLanguageServerSettings
): GameProfilePreprocessorOptions {
  return collectGameProfilePreprocessorDefines(settings.symbols);
}

function loadInfoTomlPreprocessorConfigForDocument(
  documentUri: string
): InfoTomlPreprocessorConfig {
  let filePath: string;
  try {
    filePath = uriToFsPath(documentUri);
  } catch {
    return emptyInfoTomlPreprocessorConfig();
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
    return emptyInfoTomlPreprocessorConfig();
  }

  try {
    const stat = fs.statSync(infoTomlPath);
    const cached = infoTomlPreprocessorCache.get(infoTomlPath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.config;
    }

    const text = fs.readFileSync(infoTomlPath, "utf8");
    const config = parseInfoTomlPreprocessorConfig(text);
    infoTomlPreprocessorCache.set(infoTomlPath, {
      mtimeMs: stat.mtimeMs,
      config
    });
    return config;
  } catch {
    return emptyInfoTomlPreprocessorConfig();
  }
}

function parseInfoTomlPreprocessorConfig(text: string): InfoTomlPreprocessorConfig {
  const sectionMatch = /\[\s*script\s*]([\s\S]*?)(?:\n\s*\[[^\]]+]|$)/i.exec(text);
  if (!sectionMatch) {
    return emptyInfoTomlPreprocessorConfig();
  }

  const sectionText = sectionMatch[1];
  return {
    defines: parseStringArray(sectionText, "defines"),
    dependencies: parseStringArray(sectionText, "dependencies"),
    optionalDependencies: parseStringArray(sectionText, "optional_dependencies")
  };
}

function parseStringArray(sectionText: string, key: string): string[] {
  const keyPattern = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const arrayMatch = new RegExp(
    `(?:^|\\n)\\s*${keyPattern}\\s*=\\s*\\[([\\s\\S]*?)\\]`,
    "i"
  ).exec(sectionText);
  if (!arrayMatch) {
    return [];
  }

  const values: string[] = [];
  const stringPattern = /"((?:\\.|[^"\\])*)"/g;
  let match: RegExpExecArray | null;
  while ((match = stringPattern.exec(arrayMatch[1])) !== null) {
    const value = decodeTomlString(match[1]).trim();
    if (value.length > 0) {
      values.push(value);
    }
  }
  return values;
}

function decodeTomlString(raw: string): string {
  return raw
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

function emptyInfoTomlPreprocessorConfig(): InfoTomlPreprocessorConfig {
  return {
    defines: [],
    dependencies: [],
    optionalDependencies: []
  };
}
