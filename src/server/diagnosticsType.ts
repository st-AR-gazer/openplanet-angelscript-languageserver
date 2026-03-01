import {
  Diagnostic,
  DiagnosticSeverity
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";

type GrammarDeclarationNodeLike = DocumentAnalysis["grammarProgram"]["declarations"][number];

export function collectUnknownTypeDiagnostics(
  analysis: DocumentAnalysis,
  isKnownType: (typeText: string | undefined) => boolean,
  source: string,
  unknownTypeCode: string
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const fn of analysis.functions) {
    if (
      fn.returnType &&
      fn.returnType !== "void" &&
      fn.returnType !== "~" &&
      !isKnownType(fn.returnType)
    ) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: fn.nameRange,
        message: `Unknown type "${fn.returnType}"`,
        source,
        code: unknownTypeCode
      });
    }

    for (const declaration of [...fn.parameters, ...fn.localDeclarations]) {
      if (!isKnownType(declaration.type)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: declaration.range,
          message: `Unknown type "${declaration.type}"`,
          source,
          code: unknownTypeCode
        });
      }
    }
  }

  return dedupeDiagnostics(diagnostics);
}

export function collectDefaultArgumentOrderingDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  source: string,
  defaultArgumentOrderingCode: string
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const validateParameters = (
    callableName: string,
    parameters: Array<{
      name: string;
      optional: boolean;
      start: number;
      end: number;
      nameStart: number;
      nameEnd: number;
    }>
  ): void => {
    let seenOptional = false;
    const earlierParameterNames: string[] = [];
    for (const parameter of parameters) {
      if (parameter.optional) {
        seenOptional = true;
        const defaultExpression = extractParameterDefaultExpression(
          analysis.text,
          parameter.start,
          parameter.end
        );
        if (defaultExpression) {
          const dependency = earlierParameterNames.find((name) =>
            containsUnqualifiedIdentifierToken(defaultExpression, name)
          );
          if (dependency) {
            diagnostics.push({
              severity: DiagnosticSeverity.Error,
              range: offsetToRange(
                document,
                parameter.nameStart,
                Math.max(parameter.nameStart + 1, parameter.nameEnd)
              ),
              message: `Default argument for "${parameter.name}" cannot reference parameter "${dependency}".`,
              source,
              code: defaultArgumentOrderingCode
            });
          }
        }
      } else if (seenOptional) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: offsetToRange(
            document,
            parameter.nameStart,
            Math.max(parameter.nameStart + 1, parameter.nameEnd)
          ),
          message: `Required parameter cannot appear after optional parameters in "${callableName}".`,
          source,
          code: defaultArgumentOrderingCode
        });
      }

      if (parameter.name.length > 0) {
        earlierParameterNames.push(parameter.name);
      }
    }
  };

  const visitDeclaration = (declaration: GrammarDeclarationNodeLike): void => {
    if (declaration.kind === "function") {
      validateParameters(declaration.name, declaration.parameters);
      return;
    }

    if (declaration.kind === "callable-declaration") {
      validateParameters(declaration.name, declaration.parameters);
      return;
    }

    if (declaration.kind === "namespace" || declaration.kind === "type") {
      for (const child of declaration.body) {
        visitDeclaration(child);
      }
    }
  };

  for (const declaration of analysis.grammarProgram.declarations) {
    visitDeclaration(declaration);
  }

  return diagnostics;
}

function extractParameterDefaultExpression(
  text: string,
  start: number,
  end: number
): string | undefined {
  if (end <= start) {
    return undefined;
  }

  const segment = text.slice(start, end);
  const equalsIndex = findTopLevelEqualsIndex(segment);
  if (equalsIndex < 0) {
    return undefined;
  }

  const defaultText = segment.slice(equalsIndex + 1).trim();
  return defaultText.length > 0 ? defaultText : undefined;
}

function findTopLevelEqualsIndex(text: string): number {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inSingleQuote || inDoubleQuote) {
      if (ch === "\\") {
        escapeNext = true;
      } else if (inSingleQuote && ch === "'") {
        inSingleQuote = false;
      } else if (inDoubleQuote && ch === "\"") {
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      continue;
    }
    if (ch === "\"") {
      inDoubleQuote = true;
      continue;
    }
    if (ch === "(") {
      parenDepth += 1;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch === "{") {
      braceDepth += 1;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
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

    if (
      ch === "=" &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0
    ) {
      const next = text[i + 1] ?? "";
      if (next === "=") {
        continue;
      }
      return i;
    }
  }

  return -1;
}

function containsUnqualifiedIdentifierToken(text: string, name: string): boolean {
  if (!text || !name) {
    return false;
  }

  let searchIndex = text.indexOf(name);
  while (searchIndex >= 0) {
    const before = text[searchIndex - 1];
    const after = text[searchIndex + name.length];
    if (!isIdentifierPartChar(before) && !isIdentifierPartChar(after)) {
      let previous = searchIndex - 1;
      while (previous >= 0 && /\s/.test(text[previous])) {
        previous -= 1;
      }

      let qualified = false;
      if (previous >= 1 && text[previous] === ":" && text[previous - 1] === ":") {
        qualified = true;
      } else if (previous >= 0 && text[previous] === ".") {
        qualified = true;
      }

      if (!qualified) {
        return true;
      }
    }
    searchIndex = text.indexOf(name, searchIndex + name.length);
  }

  return false;
}

function isIdentifierPartChar(ch: string | undefined): boolean {
  return !!ch && /[A-Za-z0-9_]/.test(ch);
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

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const deduped: Diagnostic[] = [];
  const seen = new Set<string>();

  for (const diagnostic of diagnostics) {
    const key = [
      diagnostic.range.start.line,
      diagnostic.range.start.character,
      diagnostic.range.end.line,
      diagnostic.range.end.character,
      diagnostic.severity ?? "none",
      diagnostic.code ?? "none",
      diagnostic.message
    ].join(":");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(diagnostic);
  }

  return deduped;
}
