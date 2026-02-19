import type {
  Range,
  SemanticTokens,
  SemanticTokensDelta
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";
import { resolveVisibleLocalDeclaration } from "./analysis";
import type { CompletionIndex, SemanticTokenMode } from "./types";

export const semanticTokenTypes = [
  "namespace",
  "type",
  "class",
  "interface",
  "enum",
  "enumMember",
  "function",
  "method",
  "property",
  "variable",
  "parameter"
] as const;

export const semanticTokenModifiers = [
  "declaration",
  "readonly"
] as const;

export interface SemanticTokenSnapshot {
  resultId: string;
  data: number[];
}

const tokenTypeToIndex = new Map<string, number>(
  semanticTokenTypes.map((type, index) => [type, index])
);
const tokenModifierToBit = new Map<string, number>(
  semanticTokenModifiers.map((modifier, index) => [modifier, 1 << index])
);

const primitiveTypeNames = new Set<string>([
  "void",
  "bool",
  "int",
  "int8",
  "int16",
  "int32",
  "int64",
  "uint",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "float",
  "double",
  "string",
  "vec2",
  "vec3",
  "vec4",
  "int2",
  "int3",
  "nat2",
  "nat3",
  "mat3",
  "mat4",
  "iso3",
  "iso4",
  "quat",
  "array",
  "dictionary",
  "MwId",
  "auto"
]);

interface SemanticTokenEntry {
  line: number;
  character: number;
  length: number;
  tokenType: number;
  tokenModifiers: number;
}

export interface BuildDocumentSemanticTokensOptions {
  mode?: SemanticTokenMode;
}

export function buildDocumentSemanticTokens(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  completionIndex: CompletionIndex,
  requestedRange?: Range,
  options?: BuildDocumentSemanticTokensOptions
): SemanticTokens {
  const entries: SemanticTokenEntry[] = [];
  const workspaceTypeNames = collectWorkspaceTypeNames(allAnalyses);
  const mode = options?.mode ?? "balanced";

  const pushEntry = (
    range: Range,
    type: (typeof semanticTokenTypes)[number],
    modifiers: (typeof semanticTokenModifiers)[number][] = []
  ): void => {
    if (!isRangeInsideRequestedRange(range, requestedRange)) {
      return;
    }

    const tokenType = tokenTypeToIndex.get(type);
    if (tokenType === undefined) {
      return;
    }

    let tokenModifiers = 0;
    for (const modifier of modifiers) {
      tokenModifiers |= tokenModifierToBit.get(modifier) ?? 0;
    }

    const line = range.start.line;
    const character = range.start.character;
    const length = Math.max(0, range.end.character - range.start.character);
    if (length <= 0) {
      return;
    }

    entries.push({
      line,
      character,
      length,
      tokenType,
      tokenModifiers
    });
  };

  if (mode === "balanced") {
    for (const typeDeclaration of analysis.typeDeclarations) {
      if (typeDeclaration.kind === "class") {
        pushEntry(typeDeclaration.nameRange, "class", ["declaration"]);
        continue;
      }
      if (typeDeclaration.kind === "interface") {
        pushEntry(typeDeclaration.nameRange, "interface", ["declaration"]);
        continue;
      }
      pushEntry(typeDeclaration.nameRange, "enum", ["declaration"]);
    }

    for (const fn of analysis.functions) {
      pushEntry(fn.nameRange, "function", ["declaration"]);
      for (const parameter of fn.parameters) {
        pushEntry(parameter.range, "parameter", ["declaration"]);
      }
      for (const localDeclaration of fn.localDeclarations) {
        pushEntry(localDeclaration.range, "variable", ["declaration"]);
      }
    }
  } else {
    for (const fn of analysis.functions) {
      for (const parameter of fn.parameters) {
        pushEntry(parameter.range, "parameter", ["declaration"]);
      }
      for (const localDeclaration of fn.localDeclarations) {
        pushEntry(localDeclaration.range, "variable", ["declaration"]);
      }
    }
  }

  for (const occurrence of analysis.occurrences) {
    if (!isRangeInsideRequestedRange(occurrence.range, requestedRange)) {
      continue;
    }
    if (occurrence.isDeclaration) {
      continue;
    }

    if (mode === "balanced") {
      if (occurrence.qualifier === "dot") {
        pushEntry(occurrence.range, occurrence.isCall ? "method" : "property");
        continue;
      }

      if (occurrence.qualifier === "namespace") {
        pushEntry(occurrence.range, occurrence.isCall ? "function" : "enumMember");
        continue;
      }

      if (isNamespacePrefix(analysis.text, occurrence.end)) {
        pushEntry(occurrence.range, "namespace");
        continue;
      }
    }

    if (occurrence.functionIndex !== undefined) {
      const localDeclaration = resolveVisibleLocalDeclaration(
        analysis,
        occurrence.functionIndex,
        occurrence.name,
        occurrence.start
      );
      if (localDeclaration) {
        pushEntry(
          occurrence.range,
          localDeclaration.isParameter ? "parameter" : "variable"
        );
        continue;
      }
    }

    if (mode === "balanced") {
      if (occurrence.isCall) {
        pushEntry(occurrence.range, "function");
        continue;
      }

      if (isTypeName(occurrence.name, completionIndex, workspaceTypeNames)) {
        pushEntry(occurrence.range, "type");
        continue;
      }
    }
  }

  const deduped = dedupeAndSortTokens(entries);
  return {
    data: encodeSemanticTokenEntries(deduped)
  };
}

export function withSemanticTokenResultId(
  tokens: SemanticTokens,
  resultId: string
): SemanticTokens {
  return {
    data: tokens.data,
    resultId
  };
}

export function buildSemanticTokenDelta(
  previous: SemanticTokenSnapshot,
  next: SemanticTokenSnapshot
): SemanticTokensDelta {
  if (isSemanticTokenDataEqual(previous.data, next.data)) {
    return {
      resultId: next.resultId,
      edits: []
    };
  }

  return {
    resultId: next.resultId,
    edits: [
      {
        start: 0,
        deleteCount: previous.data.length,
        data: next.data
      }
    ]
  };
}

function isSemanticTokenDataEqual(left: number[], right: number[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }

  return true;
}

function collectWorkspaceTypeNames(analyses: DocumentAnalysis[]): Set<string> {
  const names = new Set<string>();
  for (const analysis of analyses) {
    for (const typeDeclaration of analysis.typeDeclarations) {
      names.add(typeDeclaration.name);
      names.add(typeDeclaration.fullName);
    }
  }

  return names;
}

function isTypeName(
  candidate: string,
  completionIndex: CompletionIndex,
  workspaceTypeNames: Set<string>
): boolean {
  if (workspaceTypeNames.has(candidate)) {
    return true;
  }
  if (primitiveTypeNames.has(candidate)) {
    return true;
  }
  if (completionIndex.typeInfoByFullName.has(candidate)) {
    return true;
  }

  return completionIndex.typeFullNamesByShortName.has(candidate);
}

function isRangeInsideRequestedRange(
  range: Range,
  requestedRange?: Range
): boolean {
  if (!requestedRange) {
    return true;
  }

  if (range.end.line < requestedRange.start.line) {
    return false;
  }
  if (range.start.line > requestedRange.end.line) {
    return false;
  }
  if (
    range.end.line === requestedRange.start.line &&
    range.end.character <= requestedRange.start.character
  ) {
    return false;
  }
  if (
    range.start.line === requestedRange.end.line &&
    range.start.character >= requestedRange.end.character
  ) {
    return false;
  }

  return true;
}

function dedupeAndSortTokens(entries: SemanticTokenEntry[]): SemanticTokenEntry[] {
  entries.sort((left, right) => {
    if (left.line !== right.line) {
      return left.line - right.line;
    }
    if (left.character !== right.character) {
      return left.character - right.character;
    }
    if (left.length !== right.length) {
      return left.length - right.length;
    }

    return 0;
  });

  const deduped: SemanticTokenEntry[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const key = `${entry.line}:${entry.character}:${entry.length}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(entry);
  }

  return deduped;
}

function encodeSemanticTokenEntries(entries: SemanticTokenEntry[]): number[] {
  const data: number[] = [];
  let previousLine = 0;
  let previousCharacter = 0;

  for (const entry of entries) {
    const deltaLine = entry.line - previousLine;
    const deltaStart =
      deltaLine === 0 ? entry.character - previousCharacter : entry.character;
    data.push(
      deltaLine,
      deltaStart,
      entry.length,
      entry.tokenType,
      entry.tokenModifiers
    );
    previousLine = entry.line;
    previousCharacter = entry.character;
  }

  return data;
}

function isNamespacePrefix(text: string, endOffset: number): boolean {
  const firstColon = findNextNonWhitespaceIndex(text, endOffset);
  if (firstColon < 0 || text[firstColon] !== ":") {
    return false;
  }

  const secondColon = findNextNonWhitespaceIndex(text, firstColon + 1);
  return secondColon >= 0 && text[secondColon] === ":";
}

function findNextNonWhitespaceIndex(text: string, index: number): number {
  for (let i = index; i < text.length; i += 1) {
    if (!/\s/.test(text[i])) {
      return i;
    }
  }
  return -1;
}
