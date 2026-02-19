import * as fs from "fs/promises";
import * as path from "path";
import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { uriToFsPath } from "./util";

export const LANGUAGE_SERVER_DIAGNOSTIC_SOURCE = "openplanet-angelscript-ls";

const includeCacheTtlMs = 1500;
const includeProbeConcurrency = 8;

interface IncludeResolutionCacheEntry {
  value: string | undefined;
  expiresAt: number;
}

interface IncludeExistsCacheEntry {
  value: boolean;
  expiresAt: number;
}

const includeResolutionCache = new Map<string, IncludeResolutionCacheEntry>();
const includeExistsCache = new Map<string, IncludeExistsCacheEntry>();

export async function getIncludeDiagnostics(
  document: TextDocument,
  workspaceRoots: string[],
  includePaths: string[],
  maxIncludeDiagnostics: number
): Promise<Diagnostic[]> {
  const text = document.getText();
  const includeRegex = /^\s*#\s*include\s+"([^"\r\n]+)"/gm;
  const diagnostics: Diagnostic[] = [];

  let match: RegExpExecArray | null;
  while ((match = includeRegex.exec(text)) !== null) {
    if (diagnostics.length >= maxIncludeDiagnostics) {
      break;
    }

    const includePath = match[1];
    const resolved = await resolveIncludePath(
      document.uri,
      includePath,
      workspaceRoots,
      includePaths
    );
    if (resolved) {
      continue;
    }

    const fullMatch = match[0];
    const firstQuoteIndex = fullMatch.indexOf("\"");
    const startOffset = match.index + firstQuoteIndex + 1;
    const endOffset = startOffset + includePath.length;

    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: document.positionAt(startOffset),
        end: document.positionAt(endOffset)
      },
      message: `Unable to resolve include "${includePath}"`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: "missing-include"
    });
  }

  return diagnostics;
}

export async function resolveIncludePath(
  documentUri: string,
  includePath: string,
  workspaceRoots: string[],
  includePaths: string[]
): Promise<string | undefined> {
  const cacheKey = buildResolutionCacheKey(
    documentUri,
    includePath,
    workspaceRoots,
    includePaths
  );
  const now = Date.now();
  const cached = includeResolutionCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const candidates = buildIncludeCandidates(
    documentUri,
    includePath,
    workspaceRoots,
    includePaths
  );

  for (let i = 0; i < candidates.length; i += includeProbeConcurrency) {
    const batch = candidates.slice(i, i + includeProbeConcurrency);
    const existsBatch = await Promise.all(
      batch.map((candidate) => fileExists(candidate))
    );
    const foundIndex = existsBatch.findIndex((exists) => exists);
    if (foundIndex < 0) {
      continue;
    }

    const resolved = URI.file(batch[foundIndex]).toString();
    includeResolutionCache.set(cacheKey, {
      value: resolved,
      expiresAt: now + includeCacheTtlMs
    });
    return resolved;
  }

  includeResolutionCache.set(cacheKey, {
    value: undefined,
    expiresAt: now + includeCacheTtlMs
  });
  return undefined;
}

export function clearIncludeResolutionCache(): void {
  includeResolutionCache.clear();
  includeExistsCache.clear();
}

function buildIncludeCandidates(
  documentUri: string,
  includePath: string,
  workspaceRoots: string[],
  includePaths: string[]
): string[] {
  const candidates = new Set<string>();

  if (path.isAbsolute(includePath)) {
    candidates.add(path.normalize(includePath));
    return [...candidates];
  }

  const documentDirectory = path.dirname(uriToFsPath(documentUri));
  candidates.add(path.normalize(path.resolve(documentDirectory, includePath)));

  for (const workspaceRoot of workspaceRoots) {
    candidates.add(path.normalize(path.resolve(workspaceRoot, includePath)));
  }

  for (const includeBase of includePaths) {
    if (path.isAbsolute(includeBase)) {
      candidates.add(path.normalize(path.resolve(includeBase, includePath)));
      continue;
    }

    for (const workspaceRoot of workspaceRoots) {
      candidates.add(
        path.normalize(path.resolve(workspaceRoot, includeBase, includePath))
      );
    }
  }

  return [...candidates];
}

export function getIncludeAtPosition(
  document: TextDocument,
  lineNumber: number,
  character: number
): { pathText: string } | undefined {
  const lineStart = { line: lineNumber, character: 0 };
  const lineEnd = { line: lineNumber + 1, character: 0 };
  const lineText = document.getText({ start: lineStart, end: lineEnd });

  const includePattern = /#\s*include\s+"([^"\r\n]+)"/;
  const match = includePattern.exec(lineText);
  if (!match) {
    return undefined;
  }

  const pathText = match[1];
  const firstQuoteIndex = match[0].indexOf("\"");
  const pathStart = (match.index ?? 0) + firstQuoteIndex + 1;
  const pathEnd = pathStart + pathText.length;

  if (character < pathStart || character > pathEnd) {
    return undefined;
  }

  return { pathText };
}

async function fileExists(candidatePath: string): Promise<boolean> {
  const normalizedPath = path.normalize(candidatePath);
  const now = Date.now();
  const cached = includeExistsCache.get(normalizedPath);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  let exists = false;
  try {
    const stat = await fs.stat(candidatePath);
    exists = stat.isFile();
  } catch {
    exists = false;
  }

  includeExistsCache.set(normalizedPath, {
    value: exists,
    expiresAt: now + includeCacheTtlMs
  });
  return exists;
}

function buildResolutionCacheKey(
  documentUri: string,
  includePath: string,
  workspaceRoots: string[],
  includePaths: string[]
): string {
  return [
    documentUri,
    includePath,
    workspaceRoots.join("|"),
    includePaths.join("|")
  ].join("\n");
}
