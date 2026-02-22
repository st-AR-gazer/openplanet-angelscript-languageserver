import {
  Diagnostic,
  DiagnosticSeverity
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";
import type { ParserSettings } from "./types";

interface ParserDiagnosticCodes {
  syntaxUnclosedDelimiterCode: string;
  syntaxUnexpectedClosingDelimiterCode: string;
  syntaxUnterminatedStringCode: string;
  syntaxUnterminatedBlockCommentCode: string;
  syntaxUnparsableStatementCode: string;
}

const matchingCloseByOpen: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}"
};

const matchingOpenByClose: Record<string, string> = {
  ")": "(",
  "]": "[",
  "}": "{"
};

export function collectParserSyntaxDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  parserSettings: ParserSettings,
  source: string,
  codes: ParserDiagnosticCodes
): Diagnostic[] {
  return [
    ...collectUnterminatedLiteralDiagnostics(document, source, codes),
    ...collectDelimiterDiagnostics(document, analysis.maskedText, source, codes),
    ...collectGrammarDiagnostics(document, analysis, parserSettings, source, codes)
  ];
}

function collectDelimiterDiagnostics(
  document: TextDocument,
  maskedText: string,
  source: string,
  codes: ParserDiagnosticCodes
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const stack: Array<{ char: string; offset: number }> = [];

  for (let i = 0; i < maskedText.length; i += 1) {
    const ch = maskedText[i];
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push({ char: ch, offset: i });
      continue;
    }

    if (ch !== ")" && ch !== "]" && ch !== "}") {
      continue;
    }

    const expectedOpen = matchingOpenByClose[ch];
    const top = stack[stack.length - 1];
    if (top && top.char === expectedOpen) {
      stack.pop();
      continue;
    }

    const matchingOpenIndex = findLastMatchingOpenIndex(stack, expectedOpen);
    if (matchingOpenIndex >= 0) {
      for (let i = stack.length - 1; i > matchingOpenIndex; i -= 1) {
        pushUnclosedDelimiterDiagnostic(document, diagnostics, stack[i], source, codes);
      }
      stack.length = matchingOpenIndex;
      continue;
    }

    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: offsetToSingleCharRange(document, i),
      message: `Unexpected closing delimiter "${ch}"`,
      source,
      code: codes.syntaxUnexpectedClosingDelimiterCode
    });
  }

  for (const unclosed of stack) {
    pushUnclosedDelimiterDiagnostic(document, diagnostics, unclosed, source, codes);
  }

  return diagnostics;
}

function findLastMatchingOpenIndex(
  stack: Array<{ char: string; offset: number }>,
  expectedOpen: string
): number {
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    if (stack[i].char === expectedOpen) {
      return i;
    }
  }

  return -1;
}

function pushUnclosedDelimiterDiagnostic(
  document: TextDocument,
  diagnostics: Diagnostic[],
  unclosed: { char: string; offset: number },
  source: string,
  codes: ParserDiagnosticCodes
): void {
  diagnostics.push({
    severity: DiagnosticSeverity.Error,
    range: offsetToSingleCharRange(document, unclosed.offset),
    message: `Unclosed delimiter "${unclosed.char}" (expected "${matchingCloseByOpen[unclosed.char]}")`,
    source,
    code: codes.syntaxUnclosedDelimiterCode
  });
}

function collectUnterminatedLiteralDiagnostics(
  document: TextDocument,
  source: string,
  codes: ParserDiagnosticCodes
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const text = document.getText();

  let inLineComment = false;
  let inBlockComment = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;
  let blockCommentStartOffset = -1;
  let singleQuoteStartOffset = -1;
  let doubleQuoteStartOffset = -1;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inSingleQuote) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (ch === "'") {
        inSingleQuote = false;
        continue;
      }
      if (ch === "\n" || ch === "\r") {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: offsetToSingleCharRange(document, singleQuoteStartOffset),
          message: "Unterminated single-quoted literal",
          source,
          code: codes.syntaxUnterminatedStringCode
        });
        inSingleQuote = false;
        escapeNext = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (ch === "\"") {
        inDoubleQuote = false;
        continue;
      }
      if (ch === "\n" || ch === "\r") {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: offsetToSingleCharRange(document, doubleQuoteStartOffset),
          message: "Unterminated double-quoted literal",
          source,
          code: codes.syntaxUnterminatedStringCode
        });
        inDoubleQuote = false;
        escapeNext = false;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      blockCommentStartOffset = i;
      i += 1;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      singleQuoteStartOffset = i;
      continue;
    }

    if (ch === "\"") {
      inDoubleQuote = true;
      doubleQuoteStartOffset = i;
      continue;
    }
  }

  if (inBlockComment) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: offsetToRange(document, blockCommentStartOffset, blockCommentStartOffset + 2),
      message: "Unterminated block comment",
      source,
      code: codes.syntaxUnterminatedBlockCommentCode
    });
  }

  if (inSingleQuote) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: offsetToSingleCharRange(document, singleQuoteStartOffset),
      message: "Unterminated single-quoted literal",
      source,
      code: codes.syntaxUnterminatedStringCode
    });
  }

  if (inDoubleQuote) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: offsetToSingleCharRange(document, doubleQuoteStartOffset),
      message: "Unterminated double-quoted literal",
      source,
      code: codes.syntaxUnterminatedStringCode
    });
  }

  return diagnostics;
}

function collectGrammarDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  parserSettings: ParserSettings,
  source: string,
  codes: ParserDiagnosticCodes
): Diagnostic[] {
  if (
    !parserSettings.enableUnparsableStatementDiagnostics ||
    parserSettings.maxDiagnostics <= 0 ||
    analysis.grammarErrors.length === 0
  ) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  for (const error of analysis.grammarErrors) {
    if (diagnostics.length >= parserSettings.maxDiagnostics) {
      break;
    }

    const end = Math.max(error.start + 1, error.end);
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: document.positionAt(error.start),
        end: document.positionAt(end)
      },
      message: error.message,
      source,
      code: codes.syntaxUnparsableStatementCode
    });
  }

  return diagnostics;
}

function offsetToSingleCharRange(
  document: TextDocument,
  offset: number
): Diagnostic["range"] {
  const safeOffset = Math.max(0, offset);
  return offsetToRange(document, safeOffset, safeOffset + 1);
}

function offsetToRange(
  document: TextDocument,
  startOffset: number,
  endOffset: number
): Diagnostic["range"] {
  const maxOffset = document.getText().length;
  const safeStart = Math.max(0, Math.min(startOffset, maxOffset));
  const safeEnd = Math.max(safeStart, Math.min(endOffset, maxOffset));

  return {
    start: document.positionAt(safeStart),
    end: document.positionAt(safeEnd)
  };
}
