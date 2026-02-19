import {
  InlayHint,
  InlayHintKind,
  Range
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis, FunctionDeclaration } from "./analysis";
import type { CompletionIndex } from "./types";

type WorkspaceFunctionDeclarationsByName = Map<
  string,
  Array<{ analysis: DocumentAnalysis; declaration: FunctionDeclaration }>
>;

export function getInlayHints(
  document: TextDocument,
  analysis: DocumentAnalysis,
  completionIndex: CompletionIndex,
  hintRange: Range,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): InlayHint[] {
  const maskedText = analysis.maskedText;
  const hints: InlayHint[] = [];
  const rangeStartOffset = document.offsetAt(hintRange.start);
  const rangeEndOffset = document.offsetAt(hintRange.end);

  for (const occurrence of analysis.occurrences) {
    if (!occurrence.isCall) {
      continue;
    }
    if (occurrence.start < rangeStartOffset || occurrence.start > rangeEndOffset) {
      continue;
    }
    if (occurrence.qualifier === "dot") {
      continue;
    }

    const signatures = collectSignaturesForOccurrence(
      document,
      analysis,
      completionIndex,
      occurrence.start,
      occurrence.end,
      occurrence.name,
      occurrence.qualifier,
      workspaceFunctionDeclarationsByName
    );
    if (signatures.length === 0) {
      continue;
    }

    const callSite = getCallArgumentBoundaries(maskedText, occurrence.end);
    if (!callSite) {
      continue;
    }

    const argumentStarts = collectArgumentStartOffsets(maskedText, callSite);
    if (argumentStarts.length === 0) {
      continue;
    }

    const parameterNames = chooseParameterNamesForCall(signatures, argumentStarts.length);
    if (!parameterNames || parameterNames.length === 0) {
      continue;
    }

    for (let i = 0; i < argumentStarts.length && i < parameterNames.length; i += 1) {
      const parameterName = parameterNames[i];
      if (!parameterName) {
        continue;
      }

      const argumentStart = argumentStarts[i];
      if (argumentStart < rangeStartOffset || argumentStart > rangeEndOffset) {
        continue;
      }

      hints.push({
        position: document.positionAt(argumentStart),
        label: `${parameterName}:`,
        kind: InlayHintKind.Parameter,
        paddingRight: true
      });
    }
  }

  return hints;
}

function collectSignaturesForOccurrence(
  document: TextDocument,
  analysis: DocumentAnalysis,
  completionIndex: CompletionIndex,
  occurrenceStart: number,
  occurrenceEnd: number,
  callableName: string,
  qualifier: "none" | "dot" | "namespace",
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): string[] {
  if (qualifier === "dot") {
    return [];
  }

  const signatures = new Set<string>();

  if (qualifier === "none") {
    for (const declaration of workspaceFunctionDeclarationsByName?.get(callableName) ?? []) {
      signatures.add(
        formatFunctionSignatureLabel(
          declaration.declaration.returnType,
          declaration.declaration.name,
          declaration.declaration.argsText
        )
      );
    }

    for (const signature of completionIndex.coreFunctionSignatures.get(callableName) ?? []) {
      signatures.add(signature.trim());
    }
  }

  if (qualifier === "namespace") {
    const qualifiedName = getQualifiedCallableNameAtOffset(
      document.getText(),
      occurrenceStart,
      occurrenceEnd
    );
    if (!qualifiedName) {
      return [];
    }

    for (const signature of completionIndex.coreFunctionSignaturesByQualifiedName.get(
      qualifiedName
    ) ?? []) {
      signatures.add(signature.trim());
    }
  }

  return [...signatures];
}

function chooseParameterNamesForCall(
  signatures: string[],
  argumentCount: number
): string[] | undefined {
  let best: string[] | undefined;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (const signature of signatures) {
    const names = extractParameterNames(signature);
    if (names.length === 0) {
      if (argumentCount === 0) {
        return [];
      }
      continue;
    }

    const penalty = Math.abs(names.length - argumentCount);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      best = names;
    }
  }

  return best;
}

function extractParameterNames(signature: string): string[] {
  const openParen = signature.indexOf("(");
  const closeParen = signature.lastIndexOf(")");
  if (openParen < 0 || closeParen <= openParen) {
    return [];
  }

  const argsText = signature.slice(openParen + 1, closeParen).trim();
  if (!argsText || argsText === "void") {
    return [];
  }

  const names: string[] = [];
  for (const arg of splitTopLevelByComma(argsText)) {
    const base = arg.split("=")[0].trim();
    const match = /([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(base);
    if (!match) {
      names.push("");
      continue;
    }
    names.push(match[1]);
  }

  return names;
}

function getCallArgumentBoundaries(
  text: string,
  occurrenceEnd: number
): { openParen: number; closeParen: number } | undefined {
  let openParen = occurrenceEnd;
  while (openParen < text.length && /\s/.test(text[openParen])) {
    openParen += 1;
  }
  if (openParen >= text.length || text[openParen] !== "(") {
    return undefined;
  }

  let depth = 0;
  for (let i = openParen; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return { openParen, closeParen: i };
      }
    }
  }

  return undefined;
}

function collectArgumentStartOffsets(
  text: string,
  callSite: { openParen: number; closeParen: number }
): number[] {
  const starts: number[] = [];
  let depth = 0;
  let segmentStart = callSite.openParen + 1;

  for (let i = callSite.openParen + 1; i < callSite.closeParen; i += 1) {
    const ch = text[i];
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (ch === "," && depth === 0) {
      const argStart = findFirstNonWhitespace(text, segmentStart, i);
      if (argStart !== undefined) {
        starts.push(argStart);
      }
      segmentStart = i + 1;
    }
  }

  const lastStart = findFirstNonWhitespace(text, segmentStart, callSite.closeParen);
  if (lastStart !== undefined) {
    starts.push(lastStart);
  }

  return starts;
}

function findFirstNonWhitespace(
  text: string,
  start: number,
  end: number
): number | undefined {
  for (let i = start; i < end && i < text.length; i += 1) {
    if (!/\s/.test(text[i])) {
      return i;
    }
  }
  return undefined;
}

function formatFunctionSignatureLabel(
  returnType: string,
  functionName: string,
  argsText: string
): string {
  const normalizedArgs = argsText.trim();
  return `${returnType} ${functionName}(${normalizedArgs})`.trim();
}

function getQualifiedCallableNameAtOffset(
  text: string,
  occurrenceStart: number,
  occurrenceEnd: number
): string | undefined {
  let start = occurrenceStart;
  while (start > 0 && /[A-Za-z0-9_:]/.test(text[start - 1])) {
    start -= 1;
  }

  const candidate = text.slice(start, occurrenceEnd);
  if (!/^([A-Za-z_][A-Za-z0-9_]*)(::[A-Za-z_][A-Za-z0-9_]*)+$/.test(candidate)) {
    return undefined;
  }

  return candidate;
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
