import {
  InlayHint,
  InlayHintKind,
  Range
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type {
  DocumentAnalysis,
  FunctionDeclaration,
  VariableDeclaration
} from "./analysis";
import { normalizeTypeText } from "./language";
import type { CompletionIndex, InlayHintSettings } from "./types";

type WorkspaceFunctionDeclarationsByName = Map<
  string,
  Array<{ analysis: DocumentAnalysis; declaration: FunctionDeclaration }>
>;

interface ParsedInlayParameter {
  name: string;
  typeText: string;
  optional: boolean;
  variadic: boolean;
  isWritableReference: boolean;
}

interface ParsedInlaySignature {
  label: string;
  name: string;
  returnType: string;
  parameters: ParsedInlayParameter[];
}

interface ExpressionSlice {
  text: string;
  start: number;
  end: number;
}

const defaultInlayHintSettings: InlayHintSettings = {
  enable: true,
  parameterHintsForConstants: true,
  parameterHintsForComplexExpressions: true,
  parameterReferenceHints: true,
  parameterHintsForSingleParameterFunctions: false,
  typeHintsForAutos: true,
  parameterHintsIgnoredParameterNames: [
    "Object",
    "FunctionName",
    "Value",
    "InValue",
    "NewValue",
    "Condition",
    "Parameters",
    "Params"
  ],
  parameterHintsIgnoredFunctionNames: []
};

export function getInlayHints(
  document: TextDocument,
  analysis: DocumentAnalysis,
  completionIndex: CompletionIndex,
  hintRange: Range,
  settings: InlayHintSettings = defaultInlayHintSettings,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName,
  workspaceFunctionReturnTypes?: Map<string, string>
): InlayHint[] {
  if (!settings.enable) {
    return [];
  }

  const parameterHints = collectParameterHints(
    document,
    analysis,
    completionIndex,
    hintRange,
    settings,
    workspaceFunctionDeclarationsByName
  );

  const autoTypeHints = settings.typeHintsForAutos
    ? collectAutoTypeHints(
      document,
      analysis,
      completionIndex,
      hintRange,
      workspaceFunctionReturnTypes
    )
    : [];

  const deduped: InlayHint[] = [];
  const seen = new Set<string>();
  for (const hint of [...parameterHints, ...autoTypeHints]) {
    const key = `${hint.position.line}:${hint.position.character}:${String(hint.label)}:${hint.kind ?? "none"}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(hint);
  }

  return deduped;
}

function collectParameterHints(
  document: TextDocument,
  analysis: DocumentAnalysis,
  completionIndex: CompletionIndex,
  hintRange: Range,
  settings: InlayHintSettings,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): InlayHint[] {
  const maskedText = analysis.maskedText;
  const fullText = analysis.text;
  const hints: InlayHint[] = [];
  const rangeStartOffset = document.offsetAt(hintRange.start);
  const rangeEndOffset = document.offsetAt(hintRange.end);
  const ignoredParameterNames = new Set(
    settings.parameterHintsIgnoredParameterNames.map((name) => name.toLowerCase())
  );
  const ignoredFunctionNames = new Set(
    settings.parameterHintsIgnoredFunctionNames.map((name) => name.toLowerCase())
  );

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

    const argumentsList = collectArgumentSlices(maskedText, fullText, callSite);
    if (argumentsList.length === 0) {
      continue;
    }

    const signature = chooseSignatureForCall(signatures, argumentsList.length);
    if (!signature || signature.parameters.length === 0) {
      continue;
    }
    if (
      signature.parameters.length === 1 &&
      !settings.parameterHintsForSingleParameterFunctions
    ) {
      continue;
    }
    if (ignoredFunctionNames.has(signature.name.toLowerCase())) {
      continue;
    }

    for (let i = 0; i < argumentsList.length; i += 1) {
      const argument = argumentsList[i];
      const parameter = getSignatureParameterAt(signature, i);
      if (!parameter || !parameter.name) {
        continue;
      }
      if (ignoredParameterNames.has(parameter.name.toLowerCase())) {
        continue;
      }
      if (!shouldEmitParameterHint(argument.text, parameter, settings)) {
        continue;
      }
      if (argument.start < rangeStartOffset || argument.start > rangeEndOffset) {
        continue;
      }

      hints.push({
        position: document.positionAt(argument.start),
        label: `${parameter.name}:`,
        kind: InlayHintKind.Parameter,
        paddingRight: true
      });
    }
  }

  return hints;
}

function collectAutoTypeHints(
  document: TextDocument,
  analysis: DocumentAnalysis,
  completionIndex: CompletionIndex,
  hintRange: Range,
  workspaceFunctionReturnTypes?: Map<string, string>
): InlayHint[] {
  const hints: InlayHint[] = [];
  const rangeStartOffset = document.offsetAt(hintRange.start);
  const rangeEndOffset = document.offsetAt(hintRange.end);

  const pushAutoTypeHint = (
    declaration: VariableDeclaration,
    visibleDeclarations: VariableDeclaration[]
  ): void => {
    if (!isAutoTypeDeclaration(declaration.type)) {
      return;
    }
    if (declaration.end < rangeStartOffset || declaration.end > rangeEndOffset) {
      return;
    }

    const initializer = getInitializerForLocalDeclaration(
      analysis.text,
      declaration.end
    );
    if (!initializer) {
      return;
    }

    const inferredType = inferAutoTypeFromInitializer(
      initializer,
      visibleDeclarations,
      declaration.start,
      completionIndex,
      workspaceFunctionReturnTypes
    );
    if (!inferredType || isAutoTypeDeclaration(inferredType)) {
      return;
    }

    hints.push({
      position: document.positionAt(declaration.end),
      label: `: ${normalizeTypeText(inferredType) || inferredType}`,
      kind: InlayHintKind.Type,
      paddingLeft: true
    });
  };

  for (const fn of analysis.functions) {
    const visibleDeclarations = [...fn.parameters, ...fn.localDeclarations]
      .slice()
      .sort((a, b) => a.start - b.start);
    for (const declaration of fn.localDeclarations) {
      pushAutoTypeHint(declaration, visibleDeclarations);
    }
  }

  const globalDeclarations = analysis.globalDeclarations
    .slice()
    .sort((a, b) => a.start - b.start);
  for (const declaration of globalDeclarations) {
    pushAutoTypeHint(declaration, globalDeclarations);
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
): ParsedInlaySignature[] {
  if (qualifier === "dot") {
    return [];
  }

  const signatures = new Map<string, ParsedInlaySignature>();
  const addSignature = (label: string): void => {
    const parsed = parseInlaySignature(label);
    if (!parsed) {
      return;
    }
    const key = `${parsed.name}:${parsed.returnType}:${parsed.label}`;
    if (!signatures.has(key)) {
      signatures.set(key, parsed);
    }
  };

  if (qualifier === "none") {
    for (const declaration of workspaceFunctionDeclarationsByName?.get(callableName) ?? []) {
      addSignature(
        formatFunctionSignatureLabel(
          declaration.declaration.returnType,
          declaration.declaration.name,
          declaration.declaration.argsText
        )
      );
    }

    for (const signature of completionIndex.coreFunctionSignatures.get(callableName) ?? []) {
      addSignature(signature.trim());
    }
  }

  if (qualifier === "namespace") {
    const qualifiedName = getQualifiedCallableNameAtOffset(
      analysis.text,
      occurrenceStart,
      occurrenceEnd
    );
    if (!qualifiedName) {
      return [];
    }

    for (const signature of completionIndex.coreFunctionSignaturesByQualifiedName.get(
      qualifiedName
    ) ?? []) {
      addSignature(signature.trim());
    }
  }

  return [...signatures.values()];
}

function chooseSignatureForCall(
  signatures: ParsedInlaySignature[],
  argumentCount: number
): ParsedInlaySignature | undefined {
  let best: ParsedInlaySignature | undefined;
  let bestPenalty = Number.POSITIVE_INFINITY;

  for (const signature of signatures) {
    const parameterCount = signature.parameters.length;
    if (parameterCount === 0 && argumentCount > 0) {
      continue;
    }

    const penalty = Math.abs(parameterCount - argumentCount);
    if (penalty < bestPenalty) {
      best = signature;
      bestPenalty = penalty;
    }
  }

  return best;
}

function getSignatureParameterAt(
  signature: ParsedInlaySignature,
  argumentIndex: number
): ParsedInlayParameter | undefined {
  if (argumentIndex < signature.parameters.length) {
    return signature.parameters[argumentIndex];
  }

  const last = signature.parameters[signature.parameters.length - 1];
  return last?.variadic ? last : undefined;
}

function parseInlaySignature(label: string): ParsedInlaySignature | undefined {
  const openParen = label.indexOf("(");
  const closeParen = label.lastIndexOf(")");
  if (openParen < 0 || closeParen <= openParen) {
    return undefined;
  }

  const head = label.slice(0, openParen).trim();
  const nameMatch = /([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(head);
  if (!nameMatch) {
    return undefined;
  }

  const name = nameMatch[1];
  const returnType = head.slice(0, nameMatch.index).trim() || "void";
  const rawParameterText = label.slice(openParen + 1, closeParen).trim();
  const rawParameters =
    rawParameterText.length === 0 || rawParameterText === "void"
      ? []
      : splitTopLevelByComma(rawParameterText);
  const parameters = rawParameters
    .map((rawParameter) => parseInlayParameter(rawParameter))
    .filter(
      (parameter): parameter is ParsedInlayParameter => parameter !== undefined
    );

  return {
    label,
    name,
    returnType,
    parameters
  };
}

function parseInlayParameter(rawParameter: string): ParsedInlayParameter | undefined {
  const rawText = rawParameter.trim();
  if (!rawText) {
    return undefined;
  }

  if (rawText === "...") {
    return {
      name: "",
      typeText: "var",
      optional: true,
      variadic: true,
      isWritableReference: false
    };
  }

  const optional = hasTopLevelEquals(rawText);
  const withoutDefault = stripTopLevelDefaultValue(rawText).trim();
  if (!withoutDefault) {
    return undefined;
  }

  const nameMatch = /([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(withoutDefault);
  if (!nameMatch) {
    return undefined;
  }

  const name = nameMatch[1];
  const typeText = normalizeTypeText(
    withoutDefault.slice(0, nameMatch.index).trim()
  );
  if (!typeText) {
    return undefined;
  }

  const lowered = withoutDefault.toLowerCase();
  const isWritableReference =
    /\&\s*(?:out|inout)\b/.test(lowered) || /\b(?:out|inout)\b/.test(lowered);

  return {
    name,
    typeText,
    optional,
    variadic: typeText.includes("..."),
    isWritableReference
  };
}

function shouldEmitParameterHint(
  argumentText: string,
  parameter: ParsedInlayParameter,
  settings: InlayHintSettings
): boolean {
  const trimmed = argumentText.trim();
  if (!trimmed) {
    return false;
  }

  if (parameter.isWritableReference && settings.parameterReferenceHints) {
    return true;
  }

  if (isLiteralExpression(trimmed) && settings.parameterHintsForConstants) {
    return true;
  }

  if (isComplexExpression(trimmed) && settings.parameterHintsForComplexExpressions) {
    return true;
  }

  return false;
}

function isLiteralExpression(text: string): boolean {
  const trimmed = text.trim();
  if (
    trimmed === "true" ||
    trimmed === "false" ||
    trimmed === "null"
  ) {
    return true;
  }

  if (/^[+-]?\d+$/.test(trimmed)) {
    return true;
  }
  if (/^[+-]?(?:\d+\.\d*|\d*\.\d+)(?:[eE][+-]?\d+)?[fFdD]?$/.test(trimmed)) {
    return true;
  }
  if (/^"(?:\\.|[^"\\])*"$/.test(trimmed)) {
    return true;
  }
  if (/^'(?:\\.|[^'\\])'$/.test(trimmed)) {
    return true;
  }

  return false;
}

function isComplexExpression(text: string): boolean {
  if (isLiteralExpression(text)) {
    return false;
  }

  return !/^[A-Za-z_][A-Za-z0-9_]*(?:(?:\s*::\s*|\s*\.\s*)[A-Za-z_][A-Za-z0-9_]*|\s*\[[^\]]+\])*$/.test(
    text.trim()
  );
}

function getInitializerForLocalDeclaration(
  text: string,
  declarationEndOffset: number
): string | undefined {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;
  let equalsOffset = -1;

  for (let i = declarationEndOffset; i < text.length; i += 1) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

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

    const atTopLevel =
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0;

    if (atTopLevel && ch === ";" && equalsOffset >= 0) {
      const expression = text.slice(equalsOffset + 1, i).trim();
      return expression.length > 0 ? expression : undefined;
    }

    if (atTopLevel && ch === ";" && equalsOffset < 0) {
      return undefined;
    }

    if (
      atTopLevel &&
      ch === "=" &&
      next !== "=" &&
      text[i - 1] !== "!" &&
      text[i - 1] !== "<" &&
      text[i - 1] !== ">"
    ) {
      equalsOffset = i;
    }
  }

  return undefined;
}

function inferAutoTypeFromInitializer(
  initializer: string,
  visibleDeclarations: VariableDeclaration[],
  declarationStart: number,
  completionIndex: CompletionIndex,
  workspaceFunctionReturnTypes?: Map<string, string>
): string | undefined {
  const text = initializer.trim();
  if (!text) {
    return undefined;
  }

  if (text === "true" || text === "false") {
    return "bool";
  }
  if (/^"(?:\\.|[^"\\])*"$/.test(text)) {
    return "string";
  }
  if (/^'(?:\\.|[^'\\])'$/.test(text)) {
    return "int";
  }
  if (/^[+-]?\d+$/.test(text)) {
    return "int";
  }
  if (/^[+-]?(?:\d+\.\d*|\d*\.\d+)(?:[eE][+-]?\d+)?[fF]$/.test(text)) {
    return "float";
  }
  if (/^[+-]?(?:\d+\.\d*|\d*\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) {
    return "double";
  }

  const castMatch = /^cast\s*<\s*([^>]+?)\s*>\s*\(/.exec(text);
  if (castMatch) {
    return normalizeTypeText(castMatch[1]);
  }

  const callMatch = /^([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)\s*\(/.exec(
    text
  );
  if (callMatch) {
    const callable = callMatch[1];
    const callableLeaf = callable.split("::").pop() ?? callable;
    if (completionIndex.typeInfoByFullName.has(callable)) {
      return callableLeaf;
    }
    if (completionIndex.typeFullNamesByShortName.has(callableLeaf)) {
      return callableLeaf;
    }

    if (callable.includes("::")) {
      const qualifiedSignatures =
        completionIndex.coreFunctionSignaturesByQualifiedName.get(callable);
      const qualifiedReturn = parseReturnTypeFromSignature(
        qualifiedSignatures?.[0]
      );
      if (qualifiedReturn) {
        return qualifiedReturn;
      }
    }

    const workspaceReturn = workspaceFunctionReturnTypes?.get(callable);
    if (workspaceReturn) {
      return workspaceReturn;
    }
    const coreReturn = completionIndex.coreFunctionReturnTypes.get(callable);
    if (coreReturn) {
      return coreReturn;
    }
    const unqualifiedWorkspaceReturn =
      workspaceFunctionReturnTypes?.get(callableLeaf);
    if (unqualifiedWorkspaceReturn) {
      return unqualifiedWorkspaceReturn;
    }
    const unqualifiedCoreReturn =
      completionIndex.coreFunctionReturnTypes.get(callableLeaf);
    if (unqualifiedCoreReturn) {
      return unqualifiedCoreReturn;
    }
  }

  const identifierMatch = /^([A-Za-z_][A-Za-z0-9_]*)$/.exec(text);
  if (identifierMatch) {
    const name = identifierMatch[1];
    for (let i = visibleDeclarations.length - 1; i >= 0; i -= 1) {
      const declaration = visibleDeclarations[i];
      if (declaration.start >= declarationStart) {
        continue;
      }
      if (declaration.name !== name) {
        continue;
      }
      if (isAutoTypeDeclaration(declaration.type)) {
        continue;
      }
      return normalizeTypeText(declaration.type);
    }
  }

  return undefined;
}

function parseReturnTypeFromSignature(signature: string | undefined): string | undefined {
  if (!signature) {
    return undefined;
  }
  const openParen = signature.indexOf("(");
  if (openParen <= 0) {
    return undefined;
  }
  const head = signature.slice(0, openParen).trim();
  const nameMatch = /([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(head);
  if (!nameMatch) {
    return undefined;
  }
  const returnType = head.slice(0, nameMatch.index).trim();
  return returnType.length > 0 ? returnType : undefined;
}

function isAutoTypeDeclaration(typeText: string): boolean {
  const normalized = normalizeTypeText(typeText)
    .replace(/\bconst\b/g, " ")
    .replace(/[@&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return normalized === "auto";
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

function collectArgumentSlices(
  maskedText: string,
  fullText: string,
  callSite: { openParen: number; closeParen: number }
): ExpressionSlice[] {
  const slices: ExpressionSlice[] = [];
  let depth = 0;
  let segmentStart = callSite.openParen + 1;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = callSite.openParen + 1; i < callSite.closeParen; i += 1) {
    const ch = maskedText[i];
    const realCh = fullText[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (inSingleQuote || inDoubleQuote) {
      if (realCh === "\\") {
        escapeNext = true;
      } else if (inSingleQuote && realCh === "'") {
        inSingleQuote = false;
      } else if (inDoubleQuote && realCh === "\"") {
        inDoubleQuote = false;
      }
      continue;
    }
    if (realCh === "'") {
      inSingleQuote = true;
      continue;
    }
    if (realCh === "\"") {
      inDoubleQuote = true;
      continue;
    }

    if (ch === "(" || ch === "[" || ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === ")" || ch === "]" || ch === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (ch === "," && depth === 0) {
      pushArgumentSlice(slices, fullText, segmentStart, i);
      segmentStart = i + 1;
    }
  }

  pushArgumentSlice(slices, fullText, segmentStart, callSite.closeParen);
  return slices;
}

function pushArgumentSlice(
  output: ExpressionSlice[],
  fullText: string,
  start: number,
  end: number
): void {
  const trimmedStart = findFirstNonWhitespace(fullText, start, end);
  if (trimmedStart === undefined) {
    return;
  }
  const trimmedEnd = findLastNonWhitespace(fullText, trimmedStart, end);
  if (trimmedEnd === undefined || trimmedEnd <= trimmedStart) {
    return;
  }

  output.push({
    text: fullText.slice(trimmedStart, trimmedEnd),
    start: trimmedStart,
    end: trimmedEnd
  });
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

function findLastNonWhitespace(
  text: string,
  start: number,
  end: number
): number | undefined {
  for (let i = Math.min(end - 1, text.length - 1); i >= start; i -= 1) {
    if (!/\s/.test(text[i])) {
      return i + 1;
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
  let bracketDepth = 0;
  let braceDepth = 0;

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

    if (
      ch === "," &&
      parenDepth === 0 &&
      angleDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      parts.push(text.slice(segmentStart, i).trim());
      segmentStart = i + 1;
    }
  }

  parts.push(text.slice(segmentStart).trim());
  return parts.filter((part) => part.length > 0);
}

function hasTopLevelEquals(text: string): boolean {
  return findTopLevelEqualsIndex(text) >= 0;
}

function stripTopLevelDefaultValue(text: string): string {
  const equalsIndex = findTopLevelEqualsIndex(text);
  if (equalsIndex < 0) {
    return text;
  }
  return text.slice(0, equalsIndex);
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
