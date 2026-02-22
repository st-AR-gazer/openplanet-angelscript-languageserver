import { Range } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";
import type { InlineValueSettings } from "./types";

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
  document: TextDocument,
  analysis: DocumentAnalysis,
  viewRange: Range,
  settings: InlineValueSettings
): InlineValuePayload[] {
  if (!settings.enable) {
    return [];
  }

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

  const pushEvaluatableExpression = (
    expression: string,
    range: Range
  ): void => {
    const key = `${range.start.line}:${range.start.character}:${range.end.line}:${range.end.character}:expr:${expression}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    inlineValues.push({
      kind: "evaluatableExpression",
      range,
      expression
    });
  };

  for (const fn of analysis.functions) {
    const functionInType = isFunctionInsideTypeDeclaration(analysis, fn.start);

    if (settings.showInlineValueForParameters) {
      for (const parameter of fn.parameters) {
        if (!rangesOverlap(parameter.range, viewRange)) {
          continue;
        }
        pushVariableLookup(parameter.name, parameter.range);
      }
    }

    if (settings.showInlineValueForLocalVariables) {
      for (const local of fn.localDeclarations) {
        if (!rangesOverlap(local.range, viewRange)) {
          continue;
        }
        pushVariableLookup(local.name, local.range);
      }
    }

    if (
      settings.showInlineValueForFunctionThisObject &&
      functionInType &&
      rangesOverlap(fn.nameRange, viewRange)
    ) {
      pushEvaluatableExpression("this", fn.nameRange);
    }

    if (settings.showInlineValueForMemberAssignment && functionInType) {
      for (const assignment of collectThisMemberAssignmentRanges(document, fn)) {
        if (!rangesOverlap(assignment.range, viewRange)) {
          continue;
        }
        pushEvaluatableExpression(`this.${assignment.name}`, assignment.range);
      }
    }
  }

  return inlineValues;
}

function isFunctionInsideTypeDeclaration(
  analysis: DocumentAnalysis,
  functionOffset: number
): boolean {
  return analysis.typeDeclarations.some(
    (typeDeclaration) =>
      typeDeclaration.kind !== "enum" &&
      typeDeclaration.start <= functionOffset &&
      functionOffset <= typeDeclaration.end
  );
}

function collectThisMemberAssignmentRanges(
  document: TextDocument,
  fn: DocumentAnalysis["functions"][number]
): Array<{ name: string; range: Range }> {
  const assignments: Array<{ name: string; range: Range }> = [];
  const bodyStart = fn.bodyStart + 1;
  const bodyEnd = Math.max(bodyStart, fn.bodyEnd);
  if (bodyEnd <= bodyStart) {
    return assignments;
  }

  const bodyText = document.getText({
    start: document.positionAt(bodyStart),
    end: document.positionAt(bodyEnd)
  });
  const assignmentPattern = /\bthis\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/g;
  let match: RegExpExecArray | null;
  while ((match = assignmentPattern.exec(bodyText)) !== null) {
    const memberName = match[1];
    const fullMatch = match[0];
    const memberOffsetInMatch = fullMatch.indexOf(memberName);
    if (!memberName || memberOffsetInMatch < 0) {
      continue;
    }

    const absoluteStart = bodyStart + match.index + memberOffsetInMatch;
    const absoluteEnd = absoluteStart + memberName.length;
    assignments.push({
      name: memberName,
      range: {
        start: document.positionAt(absoluteStart),
        end: document.positionAt(absoluteEnd)
      }
    });
  }

  return assignments;
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
