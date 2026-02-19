import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  DiagnosticSeverity,
  TextEdit,
  WorkspaceEdit
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  collectFunctionReturnTypes,
  DocumentAnalysis,
  getTypeResolutionContextAtPosition,
  resolveVisibleLocalDeclaration
} from "./analysis";
import {
  isIntrinsicCallableIdentifier,
  isLanguageKeyword,
  normalizeTypeText
} from "./language";
import {
  findLastDotOutsideParens,
  findResolvedMember,
  getResolvedMembersForType,
  tryResolveExpressionTypeFullName,
  tryResolveTypeFullNameFromTypeString
} from "./members";
import {
  evaluateAssignmentOperatorCompatibility,
  inferExpressionTypeFromText,
  parseCallableSignature as parseCompilerCallableSignature,
  resolveBestCallableOverload,
  type ExpressionFunctionSources,
  type ExpressionInferenceContext
} from "./compilerPipeline";
import type {
  CompletionIndex,
  DiagnosticSettings,
  ParserSettings
} from "./types";
import { LANGUAGE_SERVER_DIAGNOSTIC_SOURCE } from "./includes";

const caseMismatchCode = "case-mismatch-symbol";
const unknownSymbolCode = "unknown-symbol";
const unknownIdentifierCode = "unknown-identifier";
const unknownTypeCode = "unknown-type";
const arityMismatchCode = "arity-mismatch";
const callArgumentTypeMismatchCode = "call-argument-type-mismatch";
const assignmentTypeMismatchCode = "assignment-type-mismatch";
const returnTypeMismatchCode = "return-type-mismatch";
const operatorTypeMismatchCode = "operator-type-mismatch";
const invalidMemberCallCode = "invalid-member-call";
const caseMismatchMemberCode = "case-mismatch-member";
const unknownMemberCode = "unknown-member";
const syntaxUnclosedDelimiterCode = "syntax-unclosed-delimiter";
const syntaxUnexpectedClosingDelimiterCode = "syntax-unexpected-closing-delimiter";
const syntaxUnterminatedStringCode = "syntax-unterminated-string";
const syntaxUnterminatedBlockCommentCode = "syntax-unterminated-block-comment";
const syntaxUnparsableStatementCode = "syntax-unparsable-statement";

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

export function getSyntaxDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  parserSettings?: ParserSettings
): Diagnostic[] {
  const effectiveParserSettings: ParserSettings = {
    enableUnparsableStatementDiagnostics:
      parserSettings?.enableUnparsableStatementDiagnostics ?? true,
    maxDiagnostics: parserSettings?.maxDiagnostics ?? 200
  };

  return [
    ...collectUnterminatedLiteralDiagnostics(document),
    ...collectDelimiterDiagnostics(document, analysis.maskedText),
    ...collectGrammarDiagnostics(document, analysis, effectiveParserSettings)
  ];
}

interface DiagnosticData {
  replacements?: string[];
  edits?: Array<{
    range: Diagnostic["range"];
    newText: string;
    title?: string;
  }>;
}

export function getSemanticDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  settings: DiagnosticSettings,
  workspaceFunctionReturnTypes?: Map<string, string>
): Diagnostic[] {
  const enableSemanticBinding = settings.enableSemanticBinding ?? true;
  const enableTypeChecking = settings.enableTypeChecking ?? true;
  if (
    !settings.enableUnknownSymbols &&
    !settings.enableCaseMismatch &&
    !enableSemanticBinding &&
    !enableTypeChecking
  ) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];
  if (enableSemanticBinding && analysis.semanticBindingIssues.length > 0) {
    for (const issue of analysis.semanticBindingIssues) {
      if (diagnostics.length >= settings.maxSymbolDiagnostics) {
        break;
      }
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: issue.range,
        message: issue.message,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: issue.code
      });
    }
  }

  if (
    diagnostics.length >= settings.maxSymbolDiagnostics ||
    (!settings.enableUnknownSymbols && !settings.enableCaseMismatch)
  ) {
    return diagnostics;
  }

  const knownCallables = collectKnownCallableNames(allAnalyses, index);
  const knownIdentifiers = collectKnownIdentifierNames(
    analysis,
    allAnalyses,
    index,
    knownCallables
  );
  const knownCallablesLower = buildCaseInsensitiveLookup(knownCallables);
  const lineTextCache = new Map<number, string>();

  for (const occurrence of analysis.occurrences) {
    if (diagnostics.length >= settings.maxSymbolDiagnostics) {
      break;
    }

    if (isInsideAttributeBrackets(document, occurrence.range, lineTextCache)) {
      continue;
    }

    if (occurrence.qualifier === "dot") {
      const dotDiagnostic = buildUnknownMemberDiagnostic(
        document,
        analysis,
        allAnalyses,
        index,
        occurrence,
        settings,
        workspaceFunctionReturnTypes,
        lineTextCache
      );
      if (dotDiagnostic) {
        diagnostics.push(dotDiagnostic);
      }
      continue;
    }

    if (occurrence.qualifier !== "none" && occurrence.qualifier !== "namespace") {
      continue;
    }

    if (occurrence.isDeclaration || isLanguageKeyword(occurrence.name)) {
      continue;
    }

    if (occurrence.isCall) {
      if (occurrence.qualifier === "namespace") {
        const arityMismatch = buildArityMismatchDiagnostic(
          document,
          analysis,
          allAnalyses,
          index,
          occurrence
        );
        if (arityMismatch) {
          diagnostics.push(arityMismatch);
        }
        continue;
      }

      if (occurrence.functionIndex !== undefined) {
        const localDeclaration = resolveVisibleLocalDeclaration(
          analysis,
          occurrence.functionIndex,
          occurrence.name,
          occurrence.start
        );
        if (localDeclaration) {
          continue;
        }
      }

      if (isIntrinsicCallableIdentifier(occurrence.name)) {
        continue;
      }

      if (isKnownTypeName(index, occurrence.name)) {
        continue;
      }

      if (knownCallables.has(occurrence.name)) {
        const arityMismatch = buildArityMismatchDiagnostic(
          document,
          analysis,
          allAnalyses,
          index,
          occurrence
        );
        if (arityMismatch) {
          diagnostics.push(arityMismatch);
        }
        continue;
      }

      const normalizedName = occurrence.name.toLowerCase();
      const caseCandidates = knownCallablesLower.get(normalizedName) ?? [];
      if (settings.enableCaseMismatch && caseCandidates.length > 0) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: occurrence.range,
          message: `Case mismatch: "${occurrence.name}" should be "${caseCandidates[0]}"`,
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: caseMismatchCode,
          data: {
            replacements: caseCandidates
          } satisfies DiagnosticData
        });
        continue;
      }

      if (!settings.enableUnknownSymbols) {
        continue;
      }

      const suggestions = collectSuggestions(occurrence.name, knownCallables);
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: occurrence.range,
        message:
          suggestions.length > 0
            ? `Unknown symbol "${occurrence.name}". Did you mean ${formatSuggestions(
                suggestions
              )}?`
            : `Unknown symbol "${occurrence.name}"`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: unknownSymbolCode,
        data: {
          replacements: suggestions
        } satisfies DiagnosticData
      });
      continue;
    }

    if (!settings.enableUnknownSymbols) {
      continue;
    }

    if (isNamespacePrefix(analysis.text, occurrence.end)) {
      continue;
    }

    if (occurrence.functionIndex !== undefined) {
      const localDeclaration = resolveVisibleLocalDeclaration(
        analysis,
        occurrence.functionIndex,
        occurrence.name,
        occurrence.start
      );
      if (localDeclaration) {
        continue;
      }
    }

    if (isKnownTypeName(index, occurrence.name)) {
      continue;
    }

    if (looksLikeTypeContext(document, occurrence, lineTextCache)) {
      continue;
    }

    if (knownIdentifiers.has(occurrence.name)) {
      continue;
    }

    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: occurrence.range,
      message: `Unknown identifier "${occurrence.name}"`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: unknownIdentifierCode
    });
  }

  if (diagnostics.length < settings.maxSymbolDiagnostics) {
    const remaining = settings.maxSymbolDiagnostics - diagnostics.length;
    const unknownTypeDiagnostics = collectUnknownTypeDiagnostics(
      analysis,
      index
    );
    diagnostics.push(...unknownTypeDiagnostics.slice(0, remaining));
  }

  if (enableTypeChecking && diagnostics.length < settings.maxSymbolDiagnostics) {
    const remaining = settings.maxSymbolDiagnostics - diagnostics.length;
    const typeCompatibilityDiagnostics = collectTypeCompatibilityDiagnostics(
      document,
      analysis,
      allAnalyses,
      index,
      workspaceFunctionReturnTypes
    );
    diagnostics.push(...typeCompatibilityDiagnostics.slice(0, remaining));
  }

  return dedupeDiagnostics(diagnostics);
}

function buildUnknownMemberDiagnostic(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  occurrence: DocumentAnalysis["occurrences"][number],
  settings: DiagnosticSettings,
  workspaceFunctionReturnTypes?: Map<string, string>,
  lineTextCache?: Map<number, string>
): Diagnostic | undefined {
  const lineText = getLineText(
    document,
    occurrence.range.start.line,
    lineTextCache
  );
  const linePrefix = lineText.slice(0, occurrence.range.start.character);
  const dotIndex = findLastDotOutsideParens(linePrefix);
  if (dotIndex < 0) {
    return undefined;
  }

  const receiverText = linePrefix.slice(0, dotIndex).trimEnd();
  if (!receiverText) {
    return undefined;
  }

  const typeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    occurrence.range.start.line,
    occurrence.range.start.character,
    allAnalyses,
    workspaceFunctionReturnTypes
  );
  const receiverTypeFullName = tryResolveExpressionTypeFullName(
    index,
    receiverText,
    typeContext
  );
  if (!receiverTypeFullName) {
    return undefined;
  }

  const member = findResolvedMember(index, receiverTypeFullName, occurrence.name);
  if (member) {
    if (occurrence.isCall && member.kind !== "method") {
      return {
        severity: DiagnosticSeverity.Error,
        range: occurrence.range,
        message: `Cannot call property "${occurrence.name}" on type "${receiverTypeFullName}"`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: invalidMemberCallCode
      };
    }

    return undefined;
  }

  const memberNames = new Set(
    getResolvedMembersForType(index, receiverTypeFullName).map(
      (member) => member.name
    )
  );
  if (memberNames.size === 0) {
    return undefined;
  }

  const lowerMemberName = occurrence.name.toLowerCase();
  const caseCandidates = [...memberNames]
    .filter((name) => name.toLowerCase() === lowerMemberName)
    .sort((a, b) => a.localeCompare(b));

  if (settings.enableCaseMismatch && caseCandidates.length > 0) {
    return {
      severity: DiagnosticSeverity.Error,
      range: occurrence.range,
      message: `Case mismatch: "${occurrence.name}" should be "${caseCandidates[0]}" on type "${receiverTypeFullName}"`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: caseMismatchMemberCode,
      data: {
        replacements: caseCandidates
      } satisfies DiagnosticData
    };
  }

  if (!settings.enableUnknownSymbols) {
    return undefined;
  }

  const suggestions = collectSuggestions(occurrence.name, memberNames);
  return {
    severity: DiagnosticSeverity.Error,
    range: occurrence.range,
    message:
      suggestions.length > 0
        ? `Unknown member "${occurrence.name}" on type "${receiverTypeFullName}". Did you mean ${formatSuggestions(
            suggestions
          )}?`
        : `Unknown member "${occurrence.name}" on type "${receiverTypeFullName}"`,
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code: unknownMemberCode,
    data: {
      replacements: suggestions
    } satisfies DiagnosticData
  };
}

export function buildQuickFixCodeActions(
  documentUri: string,
  diagnostics: readonly Diagnostic[]
): CodeAction[] {
  const actions: CodeAction[] = [];
  const seen = new Set<string>();

  for (const diagnostic of diagnostics) {
    if (diagnostic.source !== LANGUAGE_SERVER_DIAGNOSTIC_SOURCE) {
      continue;
    }

    const data = toDiagnosticData(diagnostic.data);
    if (data.replacements && data.replacements.length > 0) {
      for (const replacement of data.replacements.slice(0, 3)) {
        const title = `Change to '${replacement}'`;
        const dedupeKey = `${diagnostic.range.start.line}:${diagnostic.range.start.character}:${replacement}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);

        const edit: WorkspaceEdit = {
          changes: {
            [documentUri]: [TextEdit.replace(diagnostic.range, replacement)]
          }
        };

        actions.push({
          title,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          edit
        });
      }
    }

    if (data.edits && data.edits.length > 0) {
      for (const item of data.edits.slice(0, 3)) {
        const title = item.title ?? "Apply suggested fix";
        const dedupeKey = `${item.range.start.line}:${item.range.start.character}:${item.newText}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);

        const edit: WorkspaceEdit = {
          changes: {
            [documentUri]: [TextEdit.replace(item.range, item.newText)]
          }
        };

        actions.push({
          title,
          kind: CodeActionKind.QuickFix,
          diagnostics: [diagnostic],
          edit
        });
      }
    }
  }

  return actions;
}

function collectKnownCallableNames(
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex
): Set<string> {
  const names = new Set<string>();

  for (const name of index.coreGlobalFunctionNames) {
    names.add(name);
  }
  for (const name of index.coreGlobalFuncdefNames) {
    names.add(name);
  }
  for (const analysis of allAnalyses) {
    for (const name of analysis.declaredCallableNames) {
      names.add(name);
    }
  }

  return names;
}

function collectKnownIdentifierNames(
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  knownCallables: Set<string>
): Set<string> {
  const names = new Set<string>(knownCallables);

  for (const valueName of index.coreGlobalValueNames) {
    names.add(valueName);
  }

  for (const fn of analysis.functions) {
    for (const parameter of fn.parameters) {
      names.add(parameter.name);
    }
    for (const declaration of fn.localDeclarations) {
      names.add(declaration.name);
    }
  }

  for (const otherAnalysis of allAnalyses) {
    for (const declarationName of otherAnalysis.declaredCallableNames) {
      names.add(declarationName);
    }
  }

  return names;
}

function collectUnknownTypeDiagnostics(
  analysis: DocumentAnalysis,
  index: CompletionIndex
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  for (const fn of analysis.functions) {
    if (
      fn.returnType &&
      fn.returnType !== "void" &&
      !isKnownTypeString(index, fn.returnType)
    ) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: fn.nameRange,
        message: `Unknown type "${fn.returnType}"`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: unknownTypeCode
      });
    }

    for (const declaration of [...fn.parameters, ...fn.localDeclarations]) {
      if (!isKnownTypeString(index, declaration.type)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: declaration.range,
          message: `Unknown type "${declaration.type}"`,
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: unknownTypeCode
        });
      }
    }
  }

  return dedupeDiagnostics(diagnostics);
}

type TypeCompatibility = "compatible" | "incompatible" | "unknown";

interface ParsedCallableParameter {
  rawText: string;
  typeText: string;
  optional: boolean;
  variadic: boolean;
}

interface ParsedCallableSignature {
  label: string;
  name: string;
  returnType: string;
  parameters: ParsedCallableParameter[];
  minArgs: number;
  maxArgs: number;
}

interface ExpressionSlice {
  text: string;
  start: number;
  end: number;
}

interface CallArgumentSlice {
  openParen: number;
  closeParen: number;
  args: ExpressionSlice[];
}

interface AssignmentExpressionSlice {
  operator: "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=";
  expression: ExpressionSlice;
}

interface ReturnStatementSlice {
  keywordStart: number;
  expression?: ExpressionSlice;
}

interface TypeDescriptor {
  raw: string;
  normalized: string;
  base: string;
  shortBase: string;
  genericArgs: TypeDescriptor[];
  isHandle: boolean;
  isReference: boolean;
  isNull: boolean;
  isTemplateParameter: boolean;
  isAny: boolean;
}

function collectTypeCompatibilityDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  workspaceFunctionReturnTypes?: Map<string, string>
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const effectiveReturnTypes =
    workspaceFunctionReturnTypes ?? collectFunctionReturnTypes(allAnalyses);
  const functionSources = buildExpressionFunctionSources(allAnalyses, index);

  for (const occurrence of analysis.occurrences) {
    if (!occurrence.isCall || occurrence.isDeclaration) {
      continue;
    }
    if (occurrence.qualifier === "dot") {
      continue;
    }
    if (isIntrinsicCallableIdentifier(occurrence.name)) {
      continue;
    }
    if (isKnownTypeName(index, occurrence.name)) {
      continue;
    }

    const callArguments = getCallArgumentsAtOccurrence(analysis.text, occurrence);
    if (!callArguments) {
      continue;
    }

    const signatures = collectParsedCallableSignaturesForOccurrence(
      document,
      allAnalyses,
      index,
      occurrence
    );
    if (signatures.length === 0) {
      continue;
    }

    const arityCandidates = signatures.filter(
      (candidate) =>
        callArguments.args.length >= candidate.minArgs &&
        callArguments.args.length <= candidate.maxArgs
    );
    if (arityCandidates.length === 0) {
      continue;
    }

    const actualTypes = callArguments.args.map((argument) =>
      inferExpressionTypeAtOffset(
        document,
        analysis,
        allAnalyses,
        index,
        argument.start,
        argument.text,
        effectiveReturnTypes,
        functionSources
      )
    );
    const resolution = resolveBestCallableOverload(
      index,
      arityCandidates,
      actualTypes
    );

    if (!resolution.matched && resolution.sawIncompatibleType) {
      const actualTypeText = actualTypes
        .map((value) => value ?? "unknown")
        .join(", ");
      const expected = arityCandidates
        .map((candidate) => candidate.label)
        .slice(0, 3)
        .join("; ");

      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: occurrence.range,
        message:
          expected.length > 0
            ? `No overload of "${occurrence.name}" accepts argument types (${actualTypeText}). Expected ${expected}.`
            : `No overload of "${occurrence.name}" accepts argument types (${actualTypeText}).`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: callArgumentTypeMismatchCode
      });
    }
  }

  for (const occurrence of analysis.occurrences) {
    if (
      occurrence.isDeclaration ||
      occurrence.isCall ||
      occurrence.qualifier !== "none" ||
      occurrence.functionIndex === undefined
    ) {
      continue;
    }

    const declaration = resolveVisibleLocalDeclaration(
      analysis,
      occurrence.functionIndex,
      occurrence.name,
      occurrence.start
    );
    if (!declaration) {
      continue;
    }

    const assignment = getDirectAssignmentAtOccurrence(analysis.text, occurrence);
    if (!assignment) {
      continue;
    }

    const actualType = inferExpressionTypeAtOffset(
      document,
      analysis,
      allAnalyses,
      index,
      assignment.expression.start,
      assignment.expression.text,
      effectiveReturnTypes,
      functionSources
    );
    const compatibility = evaluateAssignmentCompatibility(
      index,
      assignment.operator,
      declaration.type,
      actualType
    );
    if (compatibility !== "incompatible") {
      continue;
    }

    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: offsetToRange(
        document,
        assignment.expression.start,
        Math.max(assignment.expression.start + 1, assignment.expression.end)
      ),
      message:
        assignment.operator === "="
          ? `Cannot assign value of type "${actualType ?? "unknown"}" to "${declaration.type}".`
          : `Operator "${assignment.operator}" is not valid for "${declaration.type}" and "${actualType ?? "unknown"}".`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code:
        assignment.operator === "="
          ? assignmentTypeMismatchCode
          : operatorTypeMismatchCode
    });
  }

  for (const fn of analysis.functions) {
    for (const declaration of fn.localDeclarations) {
      const initializer = getInitializerForDeclaration(
        analysis.text,
        declaration.end,
        fn.bodyEnd
      );
      if (!initializer) {
        continue;
      }

      const actualType = inferExpressionTypeAtOffset(
        document,
        analysis,
        allAnalyses,
        index,
        initializer.start,
        initializer.text,
        effectiveReturnTypes,
        functionSources
      );
      if (
        evaluateAssignmentCompatibility(index, "=", declaration.type, actualType) !==
        "incompatible"
      ) {
        continue;
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          initializer.start,
          Math.max(initializer.start + 1, initializer.end)
        ),
        message: `Cannot assign value of type "${actualType ?? "unknown"}" to "${declaration.type}".`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: assignmentTypeMismatchCode
      });
    }
  }

  for (const fn of analysis.functions) {
    const expectedReturnType = normalizeTypeText(fn.returnType || "void") || "void";
    const returnStatements = collectReturnStatements(
      analysis.maskedText,
      analysis.text,
      fn.bodyStart,
      fn.bodyEnd
    );
    for (const statement of returnStatements) {
      if (expectedReturnType === "void") {
        if (!statement.expression || statement.expression.text.trim().length === 0) {
          continue;
        }

        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: offsetToRange(
            document,
            statement.expression.start,
            Math.max(statement.expression.start + 1, statement.expression.end)
          ),
          message: "Void function cannot return a value.",
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: returnTypeMismatchCode
        });
        continue;
      }

      if (!statement.expression || statement.expression.text.trim().length === 0) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: offsetToSingleCharRange(document, statement.keywordStart),
          message: `Function must return "${expectedReturnType}" value.`,
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: returnTypeMismatchCode
        });
        continue;
      }

      const actualReturnType = inferExpressionTypeAtOffset(
        document,
        analysis,
        allAnalyses,
        index,
        statement.expression.start,
        statement.expression.text,
        effectiveReturnTypes,
        functionSources
      );
      if (
        evaluateAssignmentCompatibility(
          index,
          "=",
          expectedReturnType,
          actualReturnType
        ) !== "incompatible"
      ) {
        continue;
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          statement.expression.start,
          Math.max(statement.expression.start + 1, statement.expression.end)
        ),
        message: `Cannot return "${actualReturnType ?? "unknown"}" from function returning "${expectedReturnType}".`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: returnTypeMismatchCode
      });
    }
  }

  return diagnostics;
}

function evaluateSignatureCandidateCompatibility(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  candidate: ParsedCallableSignature,
  argumentsList: ExpressionSlice[],
  workspaceFunctionReturnTypes: Map<string, string>
): { compatible: boolean; sawIncompatibleType: boolean } {
  let sawIncompatibleType = false;

  for (let i = 0; i < argumentsList.length; i += 1) {
    const parameter = candidate.parameters[Math.min(i, candidate.parameters.length - 1)];
    if (!parameter) {
      continue;
    }
    if (parameter.variadic) {
      continue;
    }

    const argument = argumentsList[i];
    const actualType = inferExpressionTypeAtOffset(
      document,
      analysis,
      allAnalyses,
      index,
      argument.start,
      argument.text,
      workspaceFunctionReturnTypes
    );
    const compatibility = evaluateAssignmentCompatibility(
      index,
      "=",
      parameter.typeText,
      actualType
    );
    if (compatibility === "incompatible") {
      sawIncompatibleType = true;
      return { compatible: false, sawIncompatibleType };
    }
  }

  return { compatible: true, sawIncompatibleType };
}

function collectParsedCallableSignaturesForOccurrence(
  document: TextDocument,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  occurrence: DocumentAnalysis["occurrences"][number]
): ParsedCallableSignature[] {
  const parsed: ParsedCallableSignature[] = [];
  const seen = new Set<string>();
  const labels = collectCallableSignaturesForOccurrence(
    document,
    allAnalyses,
    index,
    occurrence
  );

  for (const label of labels) {
    const signature = parseCallableSignature(label);
    if (!signature) {
      continue;
    }
    const key = `${signature.returnType}:${signature.label}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    parsed.push(signature);
  }

  return parsed;
}

function parseCallableSignature(signatureLabel: string): ParsedCallableSignature | undefined {
  return parseCompilerCallableSignature(signatureLabel);
}

function parseCallableParameter(rawParameter: string): ParsedCallableParameter | undefined {
  const parameterText = rawParameter.trim();
  if (!parameterText) {
    return undefined;
  }

  if (parameterText === "...") {
    return {
      rawText: parameterText,
      typeText: "var",
      optional: true,
      variadic: true
    };
  }

  const noDefault = stripTopLevelDefaultValue(parameterText).trim();
  if (!noDefault) {
    return undefined;
  }

  const optional = hasTopLevelEquals(parameterText);
  let typeText = noDefault;

  const trailingNameMatch = /\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(typeText);
  if (trailingNameMatch) {
    typeText = typeText.slice(0, trailingNameMatch.index).trimEnd();
  }

  typeText = normalizeTypeText(typeText).trim();
  if (!typeText) {
    return undefined;
  }

  return {
    rawText: parameterText,
    typeText,
    optional,
    variadic: typeText.includes("...")
  };
}

function buildExpressionFunctionSources(
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex
): ExpressionFunctionSources {
  const workspaceFunctionSignaturesByName = new Map<
    string,
    ParsedCallableSignature[]
  >();
  const coreFunctionSignaturesByName = new Map<string, ParsedCallableSignature[]>();
  const qualifiedFunctionSignaturesByName = new Map<
    string,
    ParsedCallableSignature[]
  >();

  const addSignature = (
    map: Map<string, ParsedCallableSignature[]>,
    key: string,
    signature: ParsedCallableSignature
  ): void => {
    const list = map.get(key);
    if (!list) {
      map.set(key, [signature]);
      return;
    }
    if (
      !list.some(
        (entry) =>
          entry.label === signature.label && entry.returnType === signature.returnType
      )
    ) {
      list.push(signature);
    }
  };

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.functions) {
      const parsed = parseCallableSignature(
        `${declaration.returnType} ${declaration.name}(${declaration.argsText})`
      );
      if (!parsed) {
        continue;
      }
      addSignature(workspaceFunctionSignaturesByName, declaration.name, parsed);
    }
  }

  for (const [functionName, labels] of index.coreFunctionSignatures) {
    for (const label of labels) {
      const parsed = parseCallableSignature(label);
      if (!parsed) {
        continue;
      }
      addSignature(coreFunctionSignaturesByName, functionName, parsed);
    }
  }

  for (const [qualifiedName, labels] of index.coreFunctionSignaturesByQualifiedName) {
    for (const label of labels) {
      const parsed = parseCallableSignature(label);
      if (!parsed) {
        continue;
      }
      addSignature(qualifiedFunctionSignaturesByName, qualifiedName, parsed);
    }
  }

  return {
    workspaceFunctionSignaturesByName,
    coreFunctionSignaturesByName,
    qualifiedFunctionSignaturesByName
  };
}

function inferExpressionTypeAtOffset(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  offset: number,
  expressionText: string,
  workspaceFunctionReturnTypes: Map<string, string>,
  functionSources?: ExpressionFunctionSources
): string | undefined {
  const safeOffset = Math.max(0, Math.min(offset, analysis.text.length));
  const position = document.positionAt(safeOffset);
  const typeResolutionContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    position.line,
    position.character,
    allAnalyses,
    workspaceFunctionReturnTypes
  );

  const effectiveFunctionSources =
    functionSources ?? buildExpressionFunctionSources(allAnalyses, index);
  const expressionContext: ExpressionInferenceContext = {
    localVariableTypes: typeResolutionContext.localVariableTypes,
    localFunctionReturnTypes: typeResolutionContext.localFunctionReturnTypes,
    functionSources: effectiveFunctionSources
  };

  const astBasedType = inferExpressionTypeFromText(
    index,
    expressionText,
    expressionContext
  );
  if (astBasedType) {
    return astBasedType;
  }

  return inferExpressionType(index, expressionText, typeResolutionContext, 0);
}

function inferExpressionType(
  index: CompletionIndex,
  expressionText: string,
  context: ReturnType<typeof getTypeResolutionContextAtPosition>,
  depth: number
): string | undefined {
  if (depth > 8) {
    return undefined;
  }

  let text = expressionText.trim();
  if (!text) {
    return undefined;
  }

  text = stripOuterParentheses(text);
  if (!text) {
    return undefined;
  }

  if (text === "true" || text === "false") {
    return "bool";
  }
  if (text === "null") {
    return "null";
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
  if (/^[+-]?(?:\d+\.\d*|\d*\.\d+)(?:[eE][+-]?\d+)?[fF]?$/.test(text)) {
    return /[fF]$/.test(text) ? "float" : "double";
  }
  if (/^[+-]?\d+(?:[eE][+-]?\d+)[fF]?$/.test(text)) {
    return /[fF]$/.test(text) ? "float" : "double";
  }

  const castMatch =
    /^cast\s*<\s*([^>]+?)\s*>\s*\(([\s\S]*)\)\s*$/.exec(text);
  if (castMatch) {
    return normalizeTypeText(castMatch[1]);
  }

  if (text.startsWith("!")) {
    return "bool";
  }
  if (/^not\b/.test(text)) {
    return "bool";
  }
  if (text.startsWith("+") || text.startsWith("-") || text.startsWith("~")) {
    return inferExpressionType(index, text.slice(1), context, depth + 1);
  }

  const binary = splitByTopLevelBinaryOperator(text);
  if (binary) {
    const leftType = inferExpressionType(index, binary.left, context, depth + 1);
    const rightType = inferExpressionType(index, binary.right, context, depth + 1);
    const result = inferBinaryOperatorResultType(binary.operator, leftType, rightType);
    if (result) {
      return result;
    }
  }

  const expressionType = tryResolveExpressionTypeFullName(index, text, context);
  if (expressionType) {
    return expressionType;
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(text)) {
    return (
      context.localVariableTypes.get(text) ??
      context.localFunctionReturnTypes.get(text)
    );
  }

  return undefined;
}

function splitByTopLevelBinaryOperator(
  text: string
): { left: string; operator: string; right: string } | undefined {
  const precedenceGroups = [
    ["||", "&&", " and ", " or ", " xor "],
    ["==", "!=", "<=", ">=", "<", ">", " is "],
    ["+", "-"],
    ["*", "/", "%"]
  ];

  for (const operators of precedenceGroups) {
    const split = findTopLevelBinarySplit(text, operators);
    if (!split) {
      continue;
    }

    const left = text.slice(0, split.index).trim();
    const right = text.slice(split.index + split.operator.length).trim();
    if (!left || !right) {
      continue;
    }
    return { left, operator: split.operator.trim(), right };
  }

  return undefined;
}

function findTopLevelBinarySplit(
  text: string,
  operators: string[]
): { index: number; operator: string } | undefined {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = text.length - 1; i >= 0; i -= 1) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inSingleQuote || inDoubleQuote) {
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (inSingleQuote && ch === "'") {
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
    if (ch === ")") {
      parenDepth += 1;
      continue;
    }
    if (ch === "(") {
      parenDepth = Math.max(0, parenDepth - 1);
      continue;
    }
    if (ch === "]") {
      bracketDepth += 1;
      continue;
    }
    if (ch === "[") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch === "}") {
      braceDepth += 1;
      continue;
    }
    if (ch === "{") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }
    if (ch === ">") {
      angleDepth += 1;
      continue;
    }
    if (ch === "<") {
      angleDepth = Math.max(0, angleDepth - 1);
      continue;
    }

    if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0 || angleDepth !== 0) {
      continue;
    }

    for (const operator of operators) {
      const startIndex = i - operator.length + 1;
      if (startIndex < 0) {
        continue;
      }
      if (text.slice(startIndex, i + 1) !== operator) {
        continue;
      }
      if ((operator === "+" || operator === "-") && isUnaryOperatorAt(text, startIndex)) {
        continue;
      }
      return { index: startIndex, operator };
    }
  }

  return undefined;
}

function isUnaryOperatorAt(text: string, operatorStart: number): boolean {
  const previousIndex = findPreviousNonWhitespaceIndex(text, operatorStart - 1);
  if (previousIndex < 0) {
    return true;
  }

  const previousChar = text[previousIndex];
  return (
    previousChar === "(" ||
    previousChar === "[" ||
    previousChar === "{" ||
    previousChar === "," ||
    previousChar === ":" ||
    previousChar === "?" ||
    previousChar === "=" ||
    previousChar === "!" ||
    previousChar === "+" ||
    previousChar === "-" ||
    previousChar === "*" ||
    previousChar === "/" ||
    previousChar === "%" ||
    previousChar === "&" ||
    previousChar === "|" ||
    previousChar === "^"
  );
}

function inferBinaryOperatorResultType(
  operator: string,
  leftType: string | undefined,
  rightType: string | undefined
): string | undefined {
  if (operator === "&&" || operator === "||" || operator === "and" || operator === "or") {
    if (isBoolTypeName(leftType) && isBoolTypeName(rightType)) {
      return "bool";
    }
    return undefined;
  }

  if (operator === "xor") {
    if (isBoolTypeName(leftType) && isBoolTypeName(rightType)) {
      return "bool";
    }
    if (isIntegerTypeName(leftType) && isIntegerTypeName(rightType)) {
      return "int";
    }
    return undefined;
  }

  if (
    operator === "==" ||
    operator === "!=" ||
    operator === "<" ||
    operator === ">" ||
    operator === "<=" ||
    operator === ">=" ||
    operator === "is"
  ) {
    return "bool";
  }

  if (operator === "+" && (isStringTypeName(leftType) || isStringTypeName(rightType))) {
    return "string";
  }

  if (operator === "%" && isIntegerTypeName(leftType) && isIntegerTypeName(rightType)) {
    return "int";
  }

  if (
    (operator === "+" || operator === "-" || operator === "*" || operator === "/" || operator === "%") &&
    isNumericTypeName(leftType) &&
    isNumericTypeName(rightType)
  ) {
    if (isFloatingTypeName(leftType) || isFloatingTypeName(rightType)) {
      return "double";
    }
    return "int";
  }

  return undefined;
}

function evaluateAssignmentCompatibility(
  index: CompletionIndex,
  operator: AssignmentExpressionSlice["operator"],
  leftType: string,
  rightType: string | undefined
): TypeCompatibility {
  return evaluateAssignmentOperatorCompatibility(index, operator, leftType, rightType);
}

function evaluateTypeCompatibility(
  index: CompletionIndex,
  expected: TypeDescriptor,
  actual: TypeDescriptor | undefined
): TypeCompatibility {
  if (expected.isAny || expected.isTemplateParameter) {
    return "compatible";
  }

  if (!actual) {
    return "unknown";
  }

  if (actual.isAny || actual.isTemplateParameter) {
    return "unknown";
  }

  if (actual.isNull) {
    if (expected.isHandle) {
      return "compatible";
    }
    return isPrimitiveTypeName(expected.normalized) ? "incompatible" : "unknown";
  }

  if (areTypeDescriptorsEquivalent(index, expected, actual)) {
    return "compatible";
  }

  if (isNumericTypeName(expected.normalized) && isNumericTypeName(actual.normalized)) {
    return "compatible";
  }

  if (isBoolTypeName(expected.normalized) || isStringTypeName(expected.normalized)) {
    return expected.shortBase === actual.shortBase ? "compatible" : "incompatible";
  }

  if (isPrimitiveTypeName(expected.normalized) && isPrimitiveTypeName(actual.normalized)) {
    return "incompatible";
  }

  const expectedFullName = tryResolveTypeFullNameFromTypeString(index, expected.normalized);
  const actualFullName = tryResolveTypeFullNameFromTypeString(index, actual.normalized);

  if (expectedFullName && actualFullName) {
    if (expectedFullName === actualFullName) {
      return "compatible";
    }
    if (isAssignableThroughInheritance(index, actualFullName, expectedFullName)) {
      return "compatible";
    }
    return "incompatible";
  }

  return "unknown";
}

function areTypeDescriptorsEquivalent(
  index: CompletionIndex,
  left: TypeDescriptor,
  right: TypeDescriptor
): boolean {
  if (left.shortBase !== right.shortBase) {
    const leftFull = tryResolveTypeFullNameFromTypeString(index, left.normalized);
    const rightFull = tryResolveTypeFullNameFromTypeString(index, right.normalized);
    if (!leftFull || !rightFull || leftFull !== rightFull) {
      return false;
    }
  }

  if (left.genericArgs.length !== right.genericArgs.length) {
    return false;
  }

  for (let i = 0; i < left.genericArgs.length; i += 1) {
    const expectedArg = left.genericArgs[i];
    const actualArg = right.genericArgs[i];
    const compatibility = evaluateTypeCompatibility(index, expectedArg, actualArg);
    if (compatibility === "incompatible") {
      return false;
    }
  }

  return true;
}

function isAssignableThroughInheritance(
  index: CompletionIndex,
  actualTypeFullName: string,
  expectedTypeFullName: string
): boolean {
  const visited = new Set<string>();
  let current = actualTypeFullName;

  while (!visited.has(current)) {
    visited.add(current);
    const typeInfo = index.typeInfoByFullName.get(current);
    if (!typeInfo?.parentShortName) {
      return false;
    }

    const parent = tryResolveTypeFullNameFromTypeString(
      index,
      typeInfo.parentShortName,
      typeInfo.namespace
    );
    if (!parent) {
      return false;
    }
    if (parent === expectedTypeFullName) {
      return true;
    }
    current = parent;
  }

  return false;
}

function parseTypeDescriptor(typeText: string | undefined): TypeDescriptor | undefined {
  if (!typeText) {
    return undefined;
  }

  let normalized = normalizeTypeText(typeText).trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized === "null") {
    return {
      raw: typeText,
      normalized,
      base: "null",
      shortBase: "null",
      genericArgs: [],
      isHandle: false,
      isReference: false,
      isNull: true,
      isTemplateParameter: false,
      isAny: false
    };
  }

  let isHandle = false;
  let isReference = false;

  normalized = normalized.replace(/\b(?:in|out|inout)\b/g, " ").replace(/\s+/g, " ").trim();
  normalized = normalized.replace(/&\s*(?:in|out|inout)\b/g, "&").trim();

  while (normalized.endsWith("@") || normalized.endsWith("&")) {
    if (normalized.endsWith("@")) {
      isHandle = true;
      normalized = normalized.slice(0, -1).trimEnd();
      continue;
    }
    if (normalized.endsWith("&")) {
      isReference = true;
      normalized = normalized.slice(0, -1).trimEnd();
      continue;
    }
  }

  const genericOpen = findTopLevelChar(normalized, "<");
  let base = normalized;
  let genericArgs: TypeDescriptor[] = [];
  if (genericOpen >= 0 && normalized.endsWith(">")) {
    base = normalized.slice(0, genericOpen).trim();
    const inner = normalized.slice(genericOpen + 1, -1);
    genericArgs = splitTopLevelByComma(inner)
      .map((part) => parseTypeDescriptor(part))
      .filter((value): value is TypeDescriptor => value !== undefined);
  }

  const shortBase = (base.split("::").pop() ?? base).toLowerCase();
  const isTemplateParameter =
    /^[A-Z][A-Za-z0-9_]*$/.test(base) && !base.includes("::");
  const isAny = shortBase === "auto" || shortBase === "var" || shortBase === "?";

  return {
    raw: typeText,
    normalized,
    base,
    shortBase,
    genericArgs,
    isHandle,
    isReference,
    isNull: false,
    isTemplateParameter,
    isAny
  };
}

function getCallArgumentsAtOccurrence(
  text: string,
  occurrence: DocumentAnalysis["occurrences"][number]
): CallArgumentSlice | undefined {
  const openParen = findNextNonWhitespaceIndex(text, occurrence.end);
  if (openParen < 0 || text[openParen] !== "(") {
    return undefined;
  }

  const args: ExpressionSlice[] = [];
  let currentStart = openParen + 1;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = openParen + 1; i < text.length; i += 1) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inSingleQuote || inDoubleQuote) {
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (inSingleQuote && ch === "'") {
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
      if (parenDepth > 0) {
        parenDepth -= 1;
        continue;
      }

      const segment = text.slice(currentStart, i).trim();
      if (segment.length > 0) {
        const segmentStart = currentStart + countLeadingWhitespace(text.slice(currentStart, i));
        const segmentEnd = i - countTrailingWhitespace(text.slice(currentStart, i));
        args.push({
          text: segment,
          start: segmentStart,
          end: segmentEnd
        });
      }

      return {
        openParen,
        closeParen: i,
        args
      };
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

    if (ch === "," && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      const segment = text.slice(currentStart, i).trim();
      if (segment.length > 0) {
        const segmentStart = currentStart + countLeadingWhitespace(text.slice(currentStart, i));
        const segmentEnd = i - countTrailingWhitespace(text.slice(currentStart, i));
        args.push({
          text: segment,
          start: segmentStart,
          end: segmentEnd
        });
      }
      currentStart = i + 1;
    }
  }

  return undefined;
}

function getDirectAssignmentAtOccurrence(
  text: string,
  occurrence: DocumentAnalysis["occurrences"][number]
): AssignmentExpressionSlice | undefined {
  const operators: AssignmentExpressionSlice["operator"][] = [
    "<<=",
    ">>=",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "&=",
    "|=",
    "^=",
    "="
  ];

  const leftTail = text.slice(occurrence.end);
  const leadingWs = countLeadingWhitespace(leftTail);
  const operatorStart = occurrence.end + leadingWs;
  const operatorSlice = text.slice(operatorStart, operatorStart + 3);

  let matchedOperator: AssignmentExpressionSlice["operator"] | undefined;
  for (const operator of operators) {
    if (operatorSlice.startsWith(operator)) {
      matchedOperator = operator;
      break;
    }
  }

  if (!matchedOperator) {
    return undefined;
  }

  if (matchedOperator === "=") {
    const next = text[operatorStart + 1];
    if (next === "=" || next === ">") {
      return undefined;
    }
  }

  const between = text.slice(occurrence.end, operatorStart).trim();
  if (between.length > 0) {
    return undefined;
  }

  const expressionStart = operatorStart + matchedOperator.length;
  const expressionEnd = findStatementExpressionEnd(text, expressionStart, [";"]);
  if (expressionEnd <= expressionStart) {
    return undefined;
  }

  const expressionRaw = text.slice(expressionStart, expressionEnd);
  const expressionText = expressionRaw.trim();
  if (!expressionText) {
    return undefined;
  }

  const leading = countLeadingWhitespace(expressionRaw);
  const trailing = countTrailingWhitespace(expressionRaw);

  return {
    operator: matchedOperator,
    expression: {
      text: expressionText,
      start: expressionStart + leading,
      end: expressionEnd - trailing
    }
  };
}

function getInitializerForDeclaration(
  text: string,
  declarationEnd: number,
  scopeEnd: number
): ExpressionSlice | undefined {
  const tail = text.slice(declarationEnd, scopeEnd);
  const leadingWs = countLeadingWhitespace(tail);
  const equalsOffset = declarationEnd + leadingWs;
  if (text[equalsOffset] !== "=") {
    return undefined;
  }
  if (text[equalsOffset + 1] === "=") {
    return undefined;
  }

  const expressionStart = equalsOffset + 1;
  const expressionEnd = findStatementExpressionEnd(text, expressionStart, [",", ";"]);
  if (expressionEnd <= expressionStart) {
    return undefined;
  }

  const expressionRaw = text.slice(expressionStart, expressionEnd);
  const expressionText = expressionRaw.trim();
  if (!expressionText) {
    return undefined;
  }

  const leading = countLeadingWhitespace(expressionRaw);
  const trailing = countTrailingWhitespace(expressionRaw);
  return {
    text: expressionText,
    start: expressionStart + leading,
    end: expressionEnd - trailing
  };
}

function findStatementExpressionEnd(
  text: string,
  startOffset: number,
  delimiters: string[]
): number {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = startOffset; i < text.length; i += 1) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inSingleQuote || inDoubleQuote) {
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (inSingleQuote && ch === "'") {
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

    if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) {
      continue;
    }

    if (delimiters.includes(ch)) {
      return i;
    }
  }

  return text.length;
}

function collectReturnStatements(
  maskedText: string,
  text: string,
  bodyStart: number,
  bodyEnd: number
): ReturnStatementSlice[] {
  const statements: ReturnStatementSlice[] = [];
  const returnKeyword = "return";

  for (let i = bodyStart + 1; i < bodyEnd; i += 1) {
    if (maskedText.slice(i, i + returnKeyword.length) !== returnKeyword) {
      continue;
    }

    const previous = i > 0 ? text[i - 1] : "";
    const next = text[i + returnKeyword.length] ?? "";
    if (isIdentifierChar(previous) || isIdentifierChar(next)) {
      continue;
    }

    const expressionStart = i + returnKeyword.length;
    const expressionEnd = findStatementExpressionEnd(text, expressionStart, [";"]);
    if (expressionEnd <= expressionStart) {
      continue;
    }

    const expressionRaw = text.slice(expressionStart, expressionEnd);
    const expressionText = expressionRaw.trim();
    if (!expressionText) {
      statements.push({ keywordStart: i });
    } else {
      const leading = countLeadingWhitespace(expressionRaw);
      const trailing = countTrailingWhitespace(expressionRaw);
      statements.push({
        keywordStart: i,
        expression: {
          text: expressionText,
          start: expressionStart + leading,
          end: expressionEnd - trailing
        }
      });
    }

    i = expressionEnd;
  }

  return statements;
}

function isIdentifierChar(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

function findTopLevelChar(text: string, target: string): number {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
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
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0 &&
      ch === target
    ) {
      return i;
    }
  }

  return -1;
}

function hasTopLevelEquals(text: string): boolean {
  return findTopLevelChar(text, "=") >= 0;
}

function stripTopLevelDefaultValue(text: string): string {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
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
      return text.slice(0, i);
    }
  }

  return text;
}

function stripOuterParentheses(text: string): string {
  let value = text.trim();
  while (value.startsWith("(") && value.endsWith(")")) {
    let depth = 0;
    let balanced = true;
    for (let i = 0; i < value.length; i += 1) {
      const ch = value[i];
      if (ch === "(") {
        depth += 1;
      } else if (ch === ")") {
        depth -= 1;
        if (depth < 0) {
          balanced = false;
          break;
        }
        if (depth === 0 && i < value.length - 1) {
          balanced = false;
          break;
        }
      }
    }
    if (!balanced || depth !== 0) {
      break;
    }
    value = value.slice(1, -1).trim();
  }
  return value;
}

function countLeadingWhitespace(text: string): number {
  let count = 0;
  while (count < text.length && /\s/.test(text[count])) {
    count += 1;
  }
  return count;
}

function countTrailingWhitespace(text: string): number {
  let count = 0;
  while (count < text.length && /\s/.test(text[text.length - 1 - count])) {
    count += 1;
  }
  return count;
}

function isPrimitiveTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  return (
    isBoolTypeName(typeName) ||
    isNumericTypeName(typeName) ||
    isStringTypeName(typeName)
  );
}

function isBoolTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  return (typeName.split("::").pop() ?? typeName).toLowerCase() === "bool";
}

function isStringTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  return (typeName.split("::").pop() ?? typeName).toLowerCase() === "string";
}

function isNumericTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  const short = (typeName.split("::").pop() ?? typeName).toLowerCase();
  return (
    short === "int" ||
    short === "int8" ||
    short === "int16" ||
    short === "int32" ||
    short === "int64" ||
    short === "uint" ||
    short === "uint8" ||
    short === "uint16" ||
    short === "uint32" ||
    short === "uint64" ||
    short === "float" ||
    short === "double"
  );
}

function isIntegerTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  const short = (typeName.split("::").pop() ?? typeName).toLowerCase();
  return (
    short === "int" ||
    short === "int8" ||
    short === "int16" ||
    short === "int32" ||
    short === "int64" ||
    short === "uint" ||
    short === "uint8" ||
    short === "uint16" ||
    short === "uint32" ||
    short === "uint64"
  );
}

function isFloatingTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  const short = (typeName.split("::").pop() ?? typeName).toLowerCase();
  return short === "float" || short === "double";
}

function buildArityMismatchDiagnostic(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  occurrence: DocumentAnalysis["occurrences"][number]
): Diagnostic | undefined {
  const argCount = getCallArgumentCountAtOccurrence(analysis.text, occurrence);
  if (argCount === undefined) {
    return undefined;
  }

  const signatureLabels = collectCallableSignaturesForOccurrence(
    document,
    allAnalyses,
    index,
    occurrence
  );
  if (signatureLabels.length === 0) {
    return undefined;
  }

  const ranges = signatureLabels
    .map((signature) => extractParameterCountRange(signature))
    .filter(
      (value): value is { min: number; max: number } => value !== undefined
    );
  if (ranges.length === 0) {
    return undefined;
  }

  const matches = ranges.some(
    (range) => argCount >= range.min && argCount <= range.max
  );
  if (matches) {
    return undefined;
  }

  const formatted = ranges
    .map((range) => (range.min === range.max ? `${range.min}` : `${range.min}-${range.max}`))
    .slice(0, 3)
    .join(", ");

  return {
    severity: DiagnosticSeverity.Error,
    range: occurrence.range,
    message: `No overload of "${occurrence.name}" accepts ${argCount} argument(s). Expected ${formatted}.`,
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code: arityMismatchCode
  };
}

function collectCallableSignaturesForOccurrence(
  document: TextDocument,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  occurrence: DocumentAnalysis["occurrences"][number]
): string[] {
  const signatures = new Set<string>();

  if (occurrence.qualifier === "namespace") {
    const qualifiedName = getQualifiedCallableNameAtOccurrence(
      document,
      occurrence
    );
    if (!qualifiedName) {
      return [];
    }

    for (const signature of index.coreFunctionSignaturesByQualifiedName.get(
      qualifiedName
    ) ?? []) {
      signatures.add(signature.trim());
    }
    return [...signatures];
  }

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.functions) {
      if (declaration.name !== occurrence.name) {
        continue;
      }

      signatures.add(
        `${declaration.returnType} ${declaration.name}(${declaration.argsText})`.trim()
      );
    }
  }

  for (const signature of index.coreFunctionSignatures.get(occurrence.name) ?? []) {
    signatures.add(signature.trim());
  }

  return [...signatures];
}

function getCallArgumentCountAtOccurrence(
  text: string,
  occurrence: DocumentAnalysis["occurrences"][number]
): number | undefined {
  const openParenIndex = findNextNonWhitespaceIndex(text, occurrence.end);
  if (openParenIndex < 0 || text[openParenIndex] !== "(") {
    return undefined;
  }

  let depth = 0;
  let topLevelCommas = 0;
  let sawValueToken = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = openParenIndex + 1; i < text.length; i += 1) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      if (depth === 0 && !/\s/.test(ch)) {
        sawValueToken = true;
      }
      continue;
    }

    if (inSingleQuote || inDoubleQuote) {
      if (ch === "\\") {
        escapeNext = true;
        continue;
      }
      if (inSingleQuote && ch === "'") {
        inSingleQuote = false;
      } else if (inDoubleQuote && ch === "\"") {
        inDoubleQuote = false;
      } else if (!/\s/.test(ch)) {
        sawValueToken = true;
      }
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      sawValueToken = true;
      continue;
    }
    if (ch === "\"") {
      inDoubleQuote = true;
      sawValueToken = true;
      continue;
    }

    if (ch === "(") {
      depth += 1;
      sawValueToken = true;
      continue;
    }
    if (ch === ")") {
      if (depth > 0) {
        depth -= 1;
        continue;
      }

      if (!sawValueToken) {
        return 0;
      }
      return topLevelCommas + 1;
    }

    if (depth === 0 && ch === ",") {
      topLevelCommas += 1;
      sawValueToken = false;
      continue;
    }

    if (!/\s/.test(ch)) {
      sawValueToken = true;
    }
  }

  return undefined;
}

function getQualifiedCallableNameAtOccurrence(
  document: TextDocument,
  occurrence: DocumentAnalysis["occurrences"][number]
): string | undefined {
  const line = occurrence.range.start.line;
  const lineText = getLineText(document, line);
  const callableStart = occurrence.range.start.character;
  const callableEnd = occurrence.range.end.character;
  const linePrefix = lineText.slice(0, callableEnd);
  const match =
    /([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)$/.exec(linePrefix);
  if (!match) {
    return undefined;
  }

  const qualifiedName = match[1];
  const unqualified = qualifiedName.split("::").pop();
  if (unqualified !== occurrence.name) {
    return undefined;
  }
  if (callableStart > callableEnd) {
    return undefined;
  }

  return qualifiedName;
}

function extractParameterCountRange(
  signature: string
): { min: number; max: number } | undefined {
  const openParen = signature.indexOf("(");
  const closeParen = signature.lastIndexOf(")");
  if (openParen < 0 || closeParen <= openParen) {
    return undefined;
  }

  const argsText = signature.slice(openParen + 1, closeParen).trim();
  if (!argsText || argsText === "void") {
    return { min: 0, max: 0 };
  }

  const args = splitTopLevelByComma(argsText);
  if (args.length === 0) {
    return { min: 0, max: 0 };
  }

  let required = 0;
  for (const arg of args) {
    if (!arg.includes("=")) {
      required += 1;
    }
  }

  return {
    min: required,
    max: args.length
  };
}

function splitTopLevelByComma(text: string): string[] {
  const parts: string[] = [];
  let start = 0;
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
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(text.slice(start).trim());
  return parts.filter((part) => part.length > 0);
}

function isKnownTypeString(index: CompletionIndex, typeString: string): boolean {
  if (!typeString || typeString === "auto") {
    return true;
  }

  return (
    tryResolveTypeFullNameFromTypeString(index, typeString) !== undefined ||
    isLanguageKeyword(typeString)
  );
}

function isNamespacePrefix(text: string, endOffset: number): boolean {
  const firstColon = findNextNonWhitespaceIndex(text, endOffset);
  if (firstColon < 0 || text[firstColon] !== ":") {
    return false;
  }

  const secondColon = findNextNonWhitespaceIndex(text, firstColon + 1);
  return secondColon >= 0 && text[secondColon] === ":";
}

function looksLikeTypeContext(
  document: TextDocument,
  occurrence: DocumentAnalysis["occurrences"][number],
  lineTextCache?: Map<number, string>
): boolean {
  const lineText = getLineText(document, occurrence.range.start.line, lineTextCache);
  const after = lineText.slice(occurrence.range.end.character);
  return /^\s+[A-Za-z_][A-Za-z0-9_]*\s*(?:[=;,\)\[])/.test(after);
}

function findNextNonWhitespaceIndex(text: string, index: number): number {
  for (let i = index; i < text.length; i += 1) {
    if (!/\s/.test(text[i])) {
      return i;
    }
  }
  return -1;
}

function findPreviousNonWhitespaceIndex(text: string, index: number): number {
  for (let i = index; i >= 0; i -= 1) {
    if (!/\s/.test(text[i])) {
      return i;
    }
  }
  return -1;
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
      diagnostic.code
    ].join(":");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(diagnostic);
  }

  return deduped;
}

function collectDelimiterDiagnostics(
  document: TextDocument,
  maskedText: string
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
        pushUnclosedDelimiterDiagnostic(document, diagnostics, stack[i]);
      }
      stack.length = matchingOpenIndex;
      continue;
    }

    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: offsetToSingleCharRange(document, i),
      message: `Unexpected closing delimiter "${ch}"`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: syntaxUnexpectedClosingDelimiterCode
    });
  }

  for (const unclosed of stack) {
    pushUnclosedDelimiterDiagnostic(document, diagnostics, unclosed);
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
  unclosed: { char: string; offset: number }
): void {
  diagnostics.push({
    severity: DiagnosticSeverity.Error,
    range: offsetToSingleCharRange(document, unclosed.offset),
    message: `Unclosed delimiter "${unclosed.char}" (expected "${matchingCloseByOpen[unclosed.char]}")`,
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code: syntaxUnclosedDelimiterCode
  });
}

function collectUnterminatedLiteralDiagnostics(
  document: TextDocument
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
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: syntaxUnterminatedStringCode
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
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: syntaxUnterminatedStringCode
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
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: syntaxUnterminatedBlockCommentCode
    });
  }

  if (inSingleQuote) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: offsetToSingleCharRange(document, singleQuoteStartOffset),
      message: "Unterminated single-quoted literal",
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: syntaxUnterminatedStringCode
    });
  }

  if (inDoubleQuote) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: offsetToSingleCharRange(document, doubleQuoteStartOffset),
      message: "Unterminated double-quoted literal",
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: syntaxUnterminatedStringCode
    });
  }

  return diagnostics;
}

function collectGrammarDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  parserSettings: ParserSettings
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
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: syntaxUnparsableStatementCode
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

function buildCaseInsensitiveLookup(
  names: Set<string>
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const name of names) {
    const key = name.toLowerCase();
    const existing = map.get(key) ?? [];
    if (!existing.includes(name)) {
      existing.push(name);
      existing.sort((a, b) => a.localeCompare(b));
      map.set(key, existing);
    }
  }
  return map;
}

function collectSuggestions(
  unknownName: string,
  candidates: Set<string>
): string[] {
  const lowerUnknown = unknownName.toLowerCase();
  const suggestions: string[] = [];

  for (const candidate of candidates) {
    const lowerCandidate = candidate.toLowerCase();
    if (
      lowerCandidate.startsWith(lowerUnknown) ||
      lowerUnknown.startsWith(lowerCandidate) ||
      lowerCandidate.includes(lowerUnknown)
    ) {
      suggestions.push(candidate);
    }
  }

  if (suggestions.length === 0) {
    const firstChar = lowerUnknown[0];
    if (firstChar) {
      for (const candidate of candidates) {
        if (candidate[0]?.toLowerCase() === firstChar) {
          suggestions.push(candidate);
        }
        if (suggestions.length >= 3) {
          break;
        }
      }
    }
  }

  return suggestions
    .slice(0, 5)
    .sort((a, b) => a.localeCompare(b));
}

function formatSuggestions(suggestions: string[]): string {
  const quoted = suggestions.slice(0, 3).map((item) => `"${item}"`);
  return quoted.join(", ");
}

function getLineText(
  document: TextDocument,
  lineNumber: number,
  lineTextCache?: Map<number, string>
): string {
  if (lineTextCache) {
    const cached = lineTextCache.get(lineNumber);
    if (cached !== undefined) {
      return cached;
    }
  }

  const lineText = document.getText({
    start: { line: lineNumber, character: 0 },
    end: { line: lineNumber + 1, character: 0 }
  });

  lineTextCache?.set(lineNumber, lineText);
  return lineText;
}

function isKnownTypeName(index: CompletionIndex, identifier: string): boolean {
  if (index.typeInfoByFullName.has(identifier)) {
    return true;
  }

  return index.typeFullNamesByShortName.has(identifier);
}

function isInsideAttributeBrackets(
  document: TextDocument,
  range: Diagnostic["range"],
  lineTextCache?: Map<number, string>
): boolean {
  const lineText = getLineText(document, range.start.line, lineTextCache);
  const before = lineText.slice(0, range.start.character);
  const after = lineText.slice(range.end.character);
  const lastOpen = before.lastIndexOf("[");
  const lastClose = before.lastIndexOf("]");
  if (lastOpen < 0 || lastOpen < lastClose) {
    return false;
  }

  return after.indexOf("]") >= 0;
}

function toDiagnosticData(value: unknown): DiagnosticData {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const output: DiagnosticData = {};

  if (Array.isArray(record.replacements)) {
    output.replacements = record.replacements.filter(
      (item): item is string => typeof item === "string" && item.length > 0
    );
  }

  if (Array.isArray(record.edits)) {
    output.edits = record.edits
      .map((item) => {
        if (typeof item !== "object" || item === null) {
          return undefined;
        }
        const maybeRecord = item as Record<string, unknown>;
        const maybeRange = maybeRecord.range as Diagnostic["range"] | undefined;
        const maybeNewText = maybeRecord.newText;
        const maybeTitle = maybeRecord.title;
        if (
          !maybeRange ||
          typeof maybeRange.start?.line !== "number" ||
          typeof maybeRange.start?.character !== "number" ||
          typeof maybeRange.end?.line !== "number" ||
          typeof maybeRange.end?.character !== "number" ||
          typeof maybeNewText !== "string" ||
          maybeNewText.length === 0
        ) {
          return undefined;
        }

        const normalizedTitle =
          typeof maybeTitle === "string" && maybeTitle.length > 0
            ? maybeTitle
            : undefined;
        if (normalizedTitle) {
          return {
            range: maybeRange,
            newText: maybeNewText,
            title: normalizedTitle
          };
        }

        return {
          range: maybeRange,
          newText: maybeNewText
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== undefined);
  }

  return output;
}
