import { Range } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";

export interface InlineValuesRequestParams {
  textDocument: {
    uri: string;
  };
  range: Range;
}

export type InlineValuePayload =
  | {
    kind: "variableLookup";
    range: Range;
    variableName: string;
    caseSensitiveLookup?: boolean;
  }
  | {
    kind: "evaluatableExpression";
    range: Range;
    expression?: string;
  }
  | {
    kind: "text";
    range: Range;
    text: string;
  };

export function getInlineValuesForRange(
  _document: TextDocument,
  analysis: DocumentAnalysis,
  viewRange: Range
): InlineValuePayload[] {
  const inlineValues: InlineValuePayload[] = [];
  const seen = new Set<string>();

  const pushVariableLookup = (name: string, range: Range): void => {
    const key = `${range.start.line}:${range.start.character}:${range.end.line}:${range.end.character}:${name}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    inlineValues.push({
      kind: "variableLookup",
      range,
      variableName: name,
      caseSensitiveLookup: true
    });
  };

  for (const fn of analysis.functions) {
    for (const parameter of fn.parameters) {
      if (!rangesOverlap(parameter.range, viewRange)) {
        continue;
      }
      pushVariableLookup(parameter.name, parameter.range);
    }

    for (const local of fn.localDeclarations) {
      if (!rangesOverlap(local.range, viewRange)) {
        continue;
      }
      pushVariableLookup(local.name, local.range);
    }
  }

  return inlineValues;
}

function rangesOverlap(left: Range, right: Range): boolean {
  return comparePositions(left.end, right.start) >= 0 &&
    comparePositions(right.end, left.start) >= 0;
}

function comparePositions(
  left: { line: number; character: number },
  right: { line: number; character: number }
): number {
  if (left.line !== right.line) {
    return left.line - right.line;
  }
  return left.character - right.character;
}
