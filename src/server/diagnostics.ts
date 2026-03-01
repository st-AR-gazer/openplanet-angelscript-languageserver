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
import { runBinderPhase } from "./binderPipeline";
import {
  isIntrinsicCallableIdentifier,
  isKeywordLikeToken,
  isLanguageKeyword,
  normalizeTypeText
} from "./language";
import {
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
  ParserSettings,
  TypeInfo
} from "./types";
import { LANGUAGE_SERVER_DIAGNOSTIC_SOURCE } from "./includes";
import { annotateDiagnosticsWithCompilerText } from "./diagnosticTextParity";
import { collectParserSyntaxDiagnostics } from "./diagnosticsParser";
import {
  collectDuplicateImportDeclarationDiagnostics as collectDuplicateImportDeclarationDiagnosticsFromModule,
  collectImportDependencyDiagnostics as collectImportDependencyDiagnosticsFromModule
} from "./diagnosticsImport";
import {
  collectInheritanceContractDiagnostics as collectInheritanceContractDiagnosticsFromModule,
  collectReservedKeywordIdentifierDiagnostics as collectReservedKeywordIdentifierDiagnosticsFromModule,
  collectVariableShadowingDiagnostics as collectVariableShadowingDiagnosticsFromModule
} from "./diagnosticsBinder";
import {
  collectDefaultArgumentOrderingDiagnostics as collectDefaultArgumentOrderingDiagnosticsFromModule,
  collectUnknownTypeDiagnostics as collectUnknownTypeDiagnosticsFromModule
} from "./diagnosticsType";

const caseMismatchCode = "case-mismatch-symbol";
const unknownSymbolCode = "unknown-symbol";
const unknownIdentifierCode = "unknown-identifier";
const unknownTypeCode = "unknown-type";
const reservedKeywordIdentifierCode = "reserved-keyword-identifier";
const arityMismatchCode = "arity-mismatch";
const callArgumentTypeMismatchCode = "call-argument-type-mismatch";
const assignmentTypeMismatchCode = "assignment-type-mismatch";
const returnTypeMismatchCode = "return-type-mismatch";
const operatorTypeMismatchCode = "operator-type-mismatch";
const invalidMemberCallCode = "invalid-member-call";
const caseMismatchMemberCode = "case-mismatch-member";
const unknownMemberCode = "unknown-member";
const implicitConversionNotExactCode = "implicit-conversion-not-exact";
const stringByValueParameterCode = "string-parameter-pass-by-value";
const syntaxUnclosedDelimiterCode = "syntax-unclosed-delimiter";
const syntaxUnexpectedClosingDelimiterCode = "syntax-unexpected-closing-delimiter";
const syntaxUnterminatedStringCode = "syntax-unterminated-string";
const syntaxUnterminatedBlockCommentCode = "syntax-unterminated-block-comment";
const syntaxUnparsableStatementCode = "syntax-unparsable-statement";
const defaultArgumentOrderingCode = "default-argument-ordering";
const bindingShadowingCode = "binding-shadowing";
const inheritanceContractCode = "inheritance-contract-mismatch";
const importDuplicateDeclarationCode = "import-duplicate-declaration";
const importDependencyMismatchCode = "import-dependency-mismatch";
const importForwardedDependencyWarningCode = "import-forwarded-dependency-warning";

const indexedContainerTypeNames = new Set<string>([
  "array",
  "mwsarray",
  "mwstridedarray",
  "mwfastarray",
  "mwfastbuffer",
  "mwnodpool",
  "mwrefbuffer"
]);

const mutableIndexedObjectTypeNames = new Set<string>(["json::value"]);

const intrinsicGenericTypeBases = new Set<string>(["array", "dictionary"]);

export function getSyntaxDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  parserSettings?: ParserSettings
): Diagnostic[] {
  const effectiveParserSettings: ParserSettings = {
    enableUnparsableStatementDiagnostics:
      parserSettings?.enableUnparsableStatementDiagnostics ?? true,
    enableDebugOutput: parserSettings?.enableDebugOutput ?? false,
    crashOnParseError: parserSettings?.crashOnParseError ?? false,
    maxDiagnostics: parserSettings?.maxDiagnostics ?? 200
  };

  return collectParserSyntaxDiagnostics(
    document,
    analysis,
    effectiveParserSettings,
    LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    {
      syntaxUnclosedDelimiterCode,
      syntaxUnexpectedClosingDelimiterCode,
      syntaxUnterminatedStringCode,
      syntaxUnterminatedBlockCommentCode,
      syntaxUnparsableStatementCode
    }
  );
}

interface DiagnosticData {
  replacements?: string[];
  edits?: Array<{
    range: Diagnostic["range"];
    newText: string;
    title?: string;
  }>;
  compilerStage?: "binder" | "symbol-resolution" | "type-checker";
  reservedKeywordContext?: string;
}

function withDiagnosticStage(
  diagnostic: Diagnostic,
  stage: NonNullable<DiagnosticData["compilerStage"]>
): Diagnostic {
  const existingData =
    diagnostic.data && typeof diagnostic.data === "object"
      ? (diagnostic.data as Record<string, unknown>)
      : {};
  return {
    ...diagnostic,
    data: {
      ...existingData,
      compilerStage: stage
    } satisfies DiagnosticData
  };
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

  const workspaceTypeCatalog = collectWorkspaceTypeCatalog(allAnalyses);
  const effectiveIndex = createWorkspaceTypeAwareIndex(
    index,
    workspaceTypeCatalog.byFullName
  );

  const diagnostics: Diagnostic[] = [];
  const lineTextCache = new Map<number, string>();
  const typeMemberVariableNamesCache = new Map<string, Set<string>>();
  const binderResult = enableSemanticBinding
    ? runBinderPhase(document, analysis, effectiveIndex)
    : undefined;
  if (enableSemanticBinding && (binderResult?.diagnostics.length ?? 0) > 0) {
    for (const diagnostic of binderResult?.diagnostics ?? []) {
      if (
        shouldSuppressPreprocessorDuplicateFunctionDiagnostic(
          document,
          diagnostic,
          lineTextCache
        )
      ) {
        continue;
      }
      if (diagnostics.length >= settings.maxSymbolDiagnostics) {
        break;
      }
      diagnostics.push(withDiagnosticStage(diagnostic, "binder"));
    }
  }

  if (enableSemanticBinding && diagnostics.length < settings.maxSymbolDiagnostics) {
    const remaining = settings.maxSymbolDiagnostics - diagnostics.length;
    const reservedKeywordDiagnostics =
      collectReservedKeywordIdentifierDiagnosticsFromModule(analysis, {
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        reservedKeywordIdentifierCode
      });
    diagnostics.push(
      ...reservedKeywordDiagnostics
        .slice(0, remaining)
        .map((diagnostic) => withDiagnosticStage(diagnostic, "binder"))
    );
  }
  if (enableSemanticBinding && diagnostics.length < settings.maxSymbolDiagnostics) {
    const remaining = settings.maxSymbolDiagnostics - diagnostics.length;
    const duplicateImportDiagnostics =
      collectDuplicateImportDeclarationDiagnosticsFromModule(
        analysis,
        LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        {
          importDuplicateDeclarationCode,
          importDependencyMismatchCode,
          importForwardedDependencyWarningCode
        }
      );
    diagnostics.push(
      ...duplicateImportDiagnostics
        .slice(0, remaining)
        .map((diagnostic) => withDiagnosticStage(diagnostic, "binder"))
    );
  }
  if (enableSemanticBinding && diagnostics.length < settings.maxSymbolDiagnostics) {
    const remaining = settings.maxSymbolDiagnostics - diagnostics.length;
    const dependencyImportDiagnostics =
      collectImportDependencyDiagnosticsFromModule(
        document,
        analysis,
        LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        {
          importDuplicateDeclarationCode,
          importDependencyMismatchCode,
          importForwardedDependencyWarningCode
        }
      );
    diagnostics.push(
      ...dependencyImportDiagnostics
        .slice(0, remaining)
        .map((diagnostic) => withDiagnosticStage(diagnostic, "binder"))
    );
  }

  if (
    diagnostics.length >= settings.maxSymbolDiagnostics ||
    (!settings.enableUnknownSymbols && !settings.enableCaseMismatch)
  ) {
    return diagnostics;
  }

  const knownCallables = collectKnownCallableNames(allAnalyses, effectiveIndex);
  const knownTypeNames = collectKnownTypeNames(allAnalyses, effectiveIndex);
  const knownIdentifiers = collectKnownIdentifierNames(
    analysis,
    allAnalyses,
    effectiveIndex,
    knownCallables
  );
  const knownCallablesLower = buildCaseInsensitiveLookup(knownCallables);

  for (const occurrence of analysis.occurrences) {
    if (diagnostics.length >= settings.maxSymbolDiagnostics) {
      break;
    }

    if (isInsideAttributeBrackets(document, occurrence.range, lineTextCache)) {
      continue;
    }
    if (isInsidePreprocessorDirectiveLine(document, occurrence.range, lineTextCache)) {
      continue;
    }

    if (occurrence.qualifier === "dot") {
      const dotDiagnostic = buildUnknownMemberDiagnostic(
        document,
        analysis,
        allAnalyses,
        effectiveIndex,
        occurrence,
        settings,
        workspaceFunctionReturnTypes,
        lineTextCache
      );
      if (dotDiagnostic) {
        diagnostics.push(withDiagnosticStage(dotDiagnostic, "symbol-resolution"));
      }
      continue;
    }

    if (occurrence.qualifier !== "none" && occurrence.qualifier !== "namespace") {
      continue;
    }

    if (
      occurrence.isDeclaration ||
      isLanguageKeyword(occurrence.name) ||
      isKeywordLikeToken(occurrence.name)
    ) {
      continue;
    }

    if (occurrence.isCall) {
      if (occurrence.qualifier === "namespace") {
        const arityMismatch = buildArityMismatchDiagnostic(
          document,
          analysis,
          allAnalyses,
          effectiveIndex,
          occurrence
        );
        if (arityMismatch) {
          diagnostics.push(withDiagnosticStage(arityMismatch, "symbol-resolution"));
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

      if (isKnownTypeName(effectiveIndex, occurrence.name, knownTypeNames)) {
        continue;
      }

      if (knownCallables.has(occurrence.name)) {
        const arityMismatch = buildArityMismatchDiagnostic(
          document,
          analysis,
          allAnalyses,
          effectiveIndex,
          occurrence
        );
        if (arityMismatch) {
          diagnostics.push(withDiagnosticStage(arityMismatch, "symbol-resolution"));
        }
        continue;
      }

      const normalizedName = occurrence.name.toLowerCase();
      const caseCandidates = knownCallablesLower.get(normalizedName) ?? [];
      if (settings.enableCaseMismatch && caseCandidates.length > 0) {
        diagnostics.push(withDiagnosticStage({
          severity: DiagnosticSeverity.Error,
          range: occurrence.range,
          message: `Case mismatch: "${occurrence.name}" should be "${caseCandidates[0]}"`,
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: caseMismatchCode,
          data: {
            replacements: caseCandidates
          } satisfies DiagnosticData
        }, "symbol-resolution"));
        continue;
      }

      if (!settings.enableUnknownSymbols) {
        continue;
      }

      const suggestions = collectSuggestions(occurrence.name, knownCallables);
      diagnostics.push(withDiagnosticStage({
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
      }, "symbol-resolution"));
      continue;
    }

    if (!settings.enableUnknownSymbols) {
      continue;
    }

    if (isNamespacePrefix(analysis.text, occurrence.end)) {
      if (
        occurrence.qualifier === "none" &&
        isKnownNamespacePath(
          occurrence.name,
          effectiveIndex,
          allAnalyses,
          knownTypeNames
        )
      ) {
        continue;
      }
    }

    if (isInsideImportParameterDeclaration(analysis, occurrence)) {
      continue;
    }
    if (isInsideImportDeclaration(analysis, occurrence)) {
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

    if (isKnownTypeName(effectiveIndex, occurrence.name, knownTypeNames)) {
      continue;
    }

    if (looksLikeTypeContext(document, occurrence, lineTextCache)) {
      continue;
    }

    if (
      isKnownNamespaceInUsingDirective(
        document,
        occurrence,
        effectiveIndex,
        lineTextCache
      )
    ) {
      continue;
    }

    if (
      isKnownNamespaceQualifiedIdentifier(
        document,
        occurrence,
        effectiveIndex,
        allAnalyses,
        lineTextCache,
        knownTypeNames
      )
    ) {
      continue;
    }

    if (
      isInKnownTypeScopedQualifiedChain(
        document,
        occurrence,
        effectiveIndex,
        allAnalyses,
        knownTypeNames,
        lineTextCache
      )
    ) {
      continue;
    }

    if (knownIdentifiers.has(occurrence.name)) {
      continue;
    }
    if (
      isKnownImplicitMemberVariableIdentifier(
        analysis,
        occurrence.start,
        occurrence.name,
        typeMemberVariableNamesCache
      )
    ) {
      continue;
    }
    const memberVariableTypes = getMemberVariableTypesForOffset(
      analysis,
      occurrence.start,
      workspaceTypeCatalog
    );
    if (memberVariableTypes?.has(occurrence.name)) {
      continue;
    }

    diagnostics.push(withDiagnosticStage({
      severity: DiagnosticSeverity.Error,
      range: occurrence.range,
      message: `Unknown identifier "${occurrence.name}"`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: unknownIdentifierCode
    }, "symbol-resolution"));
  }

  if (diagnostics.length < settings.maxSymbolDiagnostics) {
    const remaining = settings.maxSymbolDiagnostics - diagnostics.length;
    const unknownTypeDiagnostics = collectUnknownTypeDiagnosticsFromModule(
      analysis,
      (typeText) => isKnownTypeString(effectiveIndex, typeText, knownTypeNames),
      LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      unknownTypeCode
    );
    diagnostics.push(
      ...unknownTypeDiagnostics
        .slice(0, remaining)
        .map((diagnostic) => withDiagnosticStage(diagnostic, "type-checker"))
    );
  }

  if (enableTypeChecking && diagnostics.length < settings.maxSymbolDiagnostics) {
    const remaining = settings.maxSymbolDiagnostics - diagnostics.length;
    const typeCompatibilityDiagnostics = collectTypeCompatibilityDiagnostics(
      document,
      analysis,
      allAnalyses,
      effectiveIndex,
      workspaceFunctionReturnTypes,
      workspaceTypeCatalog
    );
    diagnostics.push(
      ...typeCompatibilityDiagnostics
        .slice(0, remaining)
        .map((diagnostic) => withDiagnosticStage(diagnostic, "type-checker"))
    );
  }

  return annotateDiagnosticsWithCompilerText(
    dedupeDiagnostics(diagnostics),
    document,
    analysis
  );
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
  const receiverText = extractReceiverTextForMemberOccurrence(
    lineText,
    occurrence.range.start.character
  );
  if (!receiverText) {
    return undefined;
  }

  const typeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    occurrence.range.start.line,
    occurrence.range.start.character,
    allAnalyses,
    workspaceFunctionReturnTypes,
    index
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
  if (
    shouldSuppressKnownEngineMemberGap(
      receiverTypeFullName,
      occurrence.name
    )
  ) {
    return undefined;
  }
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
  for (const declaration of analysis.globalDeclarations) {
    names.add(declaration.name);
    const shortName = declaration.name.split("::").pop();
    if (shortName) {
      names.add(shortName);
    }
  }
  for (const declaration of analysis.identifierDeclarations) {
    names.add(declaration.name);
  }
  for (const typeDeclaration of analysis.typeDeclarations) {
    names.add(typeDeclaration.name);
    names.add(typeDeclaration.fullName);
  }
  for (const enumLabel of collectEnumLabelNamesFromAnalysis(analysis)) {
    names.add(enumLabel);
  }

  for (const otherAnalysis of allAnalyses) {
    for (const declarationName of otherAnalysis.declaredCallableNames) {
      names.add(declarationName);
    }
    for (const declaration of otherAnalysis.globalDeclarations) {
      names.add(declaration.name);
      const shortName = declaration.name.split("::").pop();
      if (shortName) {
        names.add(shortName);
      }
    }
    for (const declaration of otherAnalysis.identifierDeclarations) {
      names.add(declaration.name);
    }
    for (const typeDeclaration of otherAnalysis.typeDeclarations) {
      names.add(typeDeclaration.name);
      names.add(typeDeclaration.fullName);
    }
    for (const enumLabel of collectEnumLabelNamesFromAnalysis(otherAnalysis)) {
      names.add(enumLabel);
    }
  }

  return names;
}

function collectEnumLabelNamesFromAnalysis(
  analysis: DocumentAnalysis
): Set<string> {
  const labels = new Set<string>();
  const sourceText = analysis.maskedText || analysis.text;
  const enumPattern = /\benum\s+[A-Za-z_][A-Za-z0-9_]*\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = enumPattern.exec(sourceText)) !== null) {
    const openBraceIndex = sourceText.indexOf("{", match.index);
    if (openBraceIndex < 0) {
      continue;
    }
    const closeBraceIndex = findMatchingClosingBrace(sourceText, openBraceIndex);
    if (closeBraceIndex < 0) {
      continue;
    }

    const bodyText = sourceText.slice(openBraceIndex + 1, closeBraceIndex);
    for (const segment of splitTopLevelByComma(bodyText)) {
      const nameMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(segment);
      if (nameMatch) {
        labels.add(nameMatch[1]);
      }
    }

    enumPattern.lastIndex = closeBraceIndex + 1;
  }

  return labels;
}

function findMatchingClosingBrace(text: string, openBraceIndex: number): number {
  if (openBraceIndex < 0 || openBraceIndex >= text.length || text[openBraceIndex] !== "{") {
    return -1;
  }

  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = openBraceIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }
    if (!inDoubleQuote && ch === "'") {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (!inSingleQuote && ch === "\"") {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (inSingleQuote || inDoubleQuote) {
      continue;
    }

    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function collectKnownTypeNames(
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex
): Set<string> {
  const names = new Set<string>();

  for (const fullName of index.typeInfoByFullName.keys()) {
    names.add(fullName);
    const shortName = fullName.split("::").pop();
    if (shortName) {
      names.add(shortName);
    }
  }

  for (const [shortName, fullNames] of index.typeFullNamesByShortName.entries()) {
    names.add(shortName);
    for (const fullName of fullNames) {
      names.add(fullName);
    }
  }

  for (const funcdefName of index.coreGlobalFuncdefNames) {
    names.add(funcdefName);
  }

  for (const analysis of allAnalyses) {
    for (const typeDeclaration of analysis.typeDeclarations) {
      names.add(typeDeclaration.name);
      names.add(typeDeclaration.fullName);
    }
    collectFuncdefNamesFromDeclarations(analysis.grammarProgram.declarations, names);
  }

  return names;
}

function collectFuncdefNamesFromDeclarations(
  declarations: readonly GrammarDeclarationNodeLike[],
  output: Set<string>
): void {
  for (const declaration of declarations) {
    if (declaration.kind === "callable-declaration") {
      if (declaration.declarationKind === "funcdef") {
        output.add(declaration.name);
      }
      continue;
    }

    if (declaration.kind === "namespace" || declaration.kind === "type") {
      collectFuncdefNamesFromDeclarations(declaration.body, output);
    }
  }
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
  hasOmittedArgument: boolean;
  omittedArgumentOffset?: number;
}

interface AssignmentExpressionSlice {
  operator: "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=";
  expression: ExpressionSlice;
}

interface ReturnStatementSlice {
  keywordStart: number;
  expression?: ExpressionSlice;
}

interface BinaryOperatorSlice {
  left: string;
  leftStart: number;
  leftEnd: number;
  operator: string;
  operatorStart: number;
  operatorEnd: number;
  right: string;
  rightStart: number;
  rightEnd: number;
}

type GrammarDeclarationNodeLike = DocumentAnalysis["grammarProgram"]["declarations"][number];
type GrammarFunctionNodeLike = Extract<GrammarDeclarationNodeLike, { kind: "function" }>;
type GrammarStatementNodeLike = NonNullable<GrammarFunctionNodeLike["body"]>["statements"][number];
type GrammarSimpleStatementNodeLike = Extract<GrammarStatementNodeLike, { kind: "statement" }>;

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

export interface WorkspaceTypeCatalog {
  byFullName: Map<string, TypeInfo>;
  memberVariableTypesByFullName: Map<string, Map<string, string>>;
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

function collectTypeCompatibilityDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  workspaceFunctionReturnTypes?: Map<string, string>,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const effectiveReturnTypes =
    workspaceFunctionReturnTypes ?? collectFunctionReturnTypes(allAnalyses);
  const effectiveWorkspaceTypeCatalog =
    workspaceTypeCatalog ?? collectWorkspaceTypeCatalog(allAnalyses);
  const functionSources = buildExpressionFunctionSources(allAnalyses, index);
  const lineTextCache = new Map<number, string>();
  diagnostics.push(
    ...collectDefaultArgumentOrderingDiagnosticsFromModule(
      document,
      analysis,
      LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      defaultArgumentOrderingCode
    )
  );

  for (const occurrence of analysis.occurrences) {
    if (!occurrence.isCall || occurrence.isDeclaration) {
      continue;
    }

    const callArguments = getCallArgumentsAtOccurrence(analysis.text, occurrence);
    if (!callArguments) {
      continue;
    }
    if (callArguments.hasOmittedArgument) {
      const offset = callArguments.omittedArgumentOffset ?? callArguments.openParen + 1;
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: offsetToSingleCharRange(document, offset),
        message: "Omitted call arguments are not supported.",
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: syntaxUnparsableStatementCode
      });
      continue;
    }

    if (occurrence.qualifier === "dot") {
      const memberDiagnostic = buildMemberCallCompatibilityDiagnostic(
        document,
        analysis,
        allAnalyses,
        index,
        occurrence,
        callArguments,
        effectiveReturnTypes,
        functionSources,
        lineTextCache,
        effectiveWorkspaceTypeCatalog
      );
      if (memberDiagnostic) {
        diagnostics.push(memberDiagnostic);
      }
      continue;
    }

    if (isIntrinsicCallableIdentifier(occurrence.name)) {
      continue;
    }
    if (isKnownTypeName(index, occurrence.name)) {
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
        functionSources,
        effectiveWorkspaceTypeCatalog
      )
    );
    const hasUnknownActualType = actualTypes.some((value) =>
      isEffectivelyUnknownArgumentType(value)
    );
    if (hasUnknownActualType) {
      continue;
    }
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
      continue;
    }

    if (!resolution.matched || !resolution.best) {
      continue;
    }
    if (
      isAmbiguousCallableResolution(
        index,
        resolution.best,
        arityCandidates,
        actualTypes
      )
    ) {
      const actualTypeText = actualTypes
        .map((value) => value ?? "unknown")
        .join(", ");
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: occurrence.range,
        message: `Call to "${occurrence.name}" is ambiguous for argument types (${actualTypeText}).`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: callArgumentTypeMismatchCode
      });
      continue;
    }

    const handleModeDiagnostic = buildHandleModeCallDiagnostic(
      document,
      occurrence,
      callArguments,
      resolution.best
    );
    if (handleModeDiagnostic) {
      diagnostics.push(handleModeDiagnostic);
      continue;
    }

    for (let i = 0; i < callArguments.args.length; i += 1) {
      const parameter = getCallableParameterForArgumentIndex(resolution.best, i);
      const argument = callArguments.args[i];
      if (!parameter || !argument) {
        continue;
      }

      if (
        !isImplicitConversionNotExact(
          parameter.typeText,
          actualTypes[i],
          argument.text
        )
      ) {
        continue;
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: offsetToRange(
          document,
          argument.start,
          Math.max(argument.start + 1, argument.end)
        ),
        message: "Implicit conversion of value is not exact",
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: implicitConversionNotExactCode
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
      functionSources,
      effectiveWorkspaceTypeCatalog
    );
    const handleNullComparisonWarning = buildHandleNullComparisonWarningDiagnostic(
      document,
      analysis,
      allAnalyses,
      index,
      assignment.expression,
      effectiveReturnTypes,
      functionSources,
      effectiveWorkspaceTypeCatalog
    );
    if (handleNullComparisonWarning) {
      diagnostics.push(handleNullComparisonWarning);
    }
    const assignmentBinary = splitByTopLevelBinaryOperator(assignment.expression.text);
    if (assignmentBinary) {
      const strictBinaryDiagnostic = buildStrictBinaryCompatibilityDiagnostic(
        document,
        analysis,
        allAnalyses,
        index,
        assignment.expression.start,
        assignmentBinary,
        effectiveReturnTypes,
        functionSources,
        effectiveWorkspaceTypeCatalog
      );
      if (strictBinaryDiagnostic) {
        diagnostics.push(strictBinaryDiagnostic);
        continue;
      }
    }
    if (!actualType) {
      const unresolvedDiagnostic = buildUnresolvedExpressionDiagnostic(
        document,
        analysis,
        allAnalyses,
        index,
        assignment.expression,
        effectiveReturnTypes,
        functionSources,
        effectiveWorkspaceTypeCatalog
      );
      if (unresolvedDiagnostic) {
        diagnostics.push(unresolvedDiagnostic);
      }
      continue;
    }
    const compatibility = evaluateAssignmentCompatibility(
      index,
      assignment.operator,
      declaration.type,
      actualType
    );
    if (compatibility === "incompatible") {
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
      continue;
    }

    if (
      assignment.operator === "=" &&
      isImplicitConversionNotExact(
        declaration.type,
        actualType,
        assignment.expression.text
      )
    ) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: offsetToRange(
          document,
          assignment.expression.start,
          Math.max(assignment.expression.start + 1, assignment.expression.end)
        ),
        message: "Implicit conversion of value is not exact",
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: implicitConversionNotExactCode
      });
    }
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

      if (containsUnqualifiedIdentifierToken(initializer.text, declaration.name)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: declaration.range,
          message: `'${declaration.name}' is not initialized.`,
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: implicitConversionNotExactCode
        });
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: offsetToRange(
            document,
            initializer.start,
            Math.max(initializer.start + 1, initializer.end)
          ),
          message: `Cannot use "${declaration.name}" in its own initializer.`,
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: assignmentTypeMismatchCode
        });
        continue;
      }

      const handleNullComparisonWarning = buildHandleNullComparisonWarningDiagnostic(
        document,
        analysis,
        allAnalyses,
        index,
        initializer,
        effectiveReturnTypes,
        functionSources,
        effectiveWorkspaceTypeCatalog
      );
      if (handleNullComparisonWarning) {
        diagnostics.push(handleNullComparisonWarning);
      }
      const initializerBinary = splitByTopLevelBinaryOperator(initializer.text);
      if (initializerBinary) {
        const strictBinaryDiagnostic = buildStrictBinaryCompatibilityDiagnostic(
          document,
          analysis,
          allAnalyses,
          index,
          initializer.start,
          initializerBinary,
          effectiveReturnTypes,
          functionSources,
          effectiveWorkspaceTypeCatalog
        );
        if (strictBinaryDiagnostic) {
          diagnostics.push(strictBinaryDiagnostic);
          continue;
        }
      }

      const actualType = inferExpressionTypeAtOffset(
        document,
        analysis,
        allAnalyses,
        index,
        initializer.start,
        initializer.text,
        effectiveReturnTypes,
        functionSources,
        effectiveWorkspaceTypeCatalog
      );
      if (!actualType) {
        const unresolvedDiagnostic = buildUnresolvedExpressionDiagnostic(
          document,
          analysis,
          allAnalyses,
          index,
          initializer,
          effectiveReturnTypes,
          functionSources,
          effectiveWorkspaceTypeCatalog
        );
        if (unresolvedDiagnostic) {
          diagnostics.push(unresolvedDiagnostic);
        }
        continue;
      }
      const compatibility = evaluateAssignmentCompatibility(
        index,
        "=",
        declaration.type,
        actualType
      );
      if (compatibility === "incompatible") {
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
        continue;
      }

      if (
        isImplicitConversionNotExact(
          declaration.type,
          actualType,
          initializer.text
        )
      ) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: offsetToRange(
            document,
            initializer.start,
            Math.max(initializer.start + 1, initializer.end)
          ),
          message: "Implicit conversion of value is not exact",
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: implicitConversionNotExactCode
        });
      }
    }
  }

  diagnostics.push(
    ...collectVariableShadowingDiagnosticsFromModule(analysis, {
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      bindingShadowingCode
    })
  );
  diagnostics.push(
    ...collectInheritanceContractDiagnosticsFromModule(
      document,
      analysis,
      allAnalyses,
      index,
      effectiveWorkspaceTypeCatalog,
      {
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        inheritanceContractCode
      }
    )
  );

  for (const fn of analysis.functions) {
    for (const parameter of fn.parameters) {
      if (
        !isStringParameterPassedByValue(parameter.type) ||
        parameter.name.startsWith("_")
      ) {
        continue;
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: parameter.range,
        message: `Sanity check: Use 'const string &in ${parameter.name}' to pass a string by reference (prefix the parameter name with an underscore to ignore this warning)`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: stringByValueParameterCode
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
        functionSources,
        effectiveWorkspaceTypeCatalog
      );
      if (!actualReturnType) {
        continue;
      }
      const returnCompatibility = evaluateAssignmentCompatibility(
        index,
        "=",
        expectedReturnType,
        actualReturnType
      );
      if (returnCompatibility === "incompatible") {
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
        continue;
      }

      if (
        isImplicitConversionNotExact(
          expectedReturnType,
          actualReturnType,
          statement.expression.text
        )
      ) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: offsetToRange(
            document,
            statement.expression.start,
            Math.max(statement.expression.start + 1, statement.expression.end)
          ),
          message: "Implicit conversion of value is not exact",
          source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
          code: implicitConversionNotExactCode
        });
      }
    }
  }

  diagnostics.push(
    ...collectStandaloneExpressionOperatorDiagnostics(
      document,
      analysis,
      allAnalyses,
      index,
      effectiveReturnTypes,
      functionSources,
      effectiveWorkspaceTypeCatalog
    )
  );

  const deduped = dedupeDiagnostics(diagnostics);
  const hasErrorDiagnostics = deduped.some(
    (diagnostic) =>
      diagnostic.severity === undefined ||
      diagnostic.severity === DiagnosticSeverity.Error
  );
  if (!hasErrorDiagnostics) {
    return deduped;
  }

  return deduped.filter((diagnostic) => {
    if (diagnostic.severity !== DiagnosticSeverity.Warning) {
      return true;
    }
    return (
      typeof diagnostic.code !== "string" ||
      diagnostic.code !== stringByValueParameterCode
    );
  });
}

function collectStandaloneExpressionOperatorDiagnostics(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  workspaceFunctionReturnTypes: Map<string, string>,
  functionSources: ExpressionFunctionSources,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const grammarFunctions: GrammarFunctionNodeLike[] = [];
  collectGrammarFunctionNodes(analysis.grammarProgram.declarations, grammarFunctions);

  for (const grammarFunction of grammarFunctions) {
    if (!grammarFunction.body) {
      continue;
    }

    const simpleStatements: GrammarSimpleStatementNodeLike[] = [];
    for (const statement of grammarFunction.body.statements) {
      collectSimpleStatements(statement, simpleStatements);
    }

    for (const statement of simpleStatements) {
      const statementRaw = analysis.text.slice(statement.start, statement.end);
      if (!statementRaw) {
        continue;
      }

      const leading = countLeadingWhitespace(statementRaw);
      const trailing = countTrailingWhitespace(statementRaw);
      const statementStart = statement.start + leading;
      const statementEnd = statement.end - trailing;
      if (statementEnd <= statementStart) {
        continue;
      }

      let expressionText = analysis.text.slice(statementStart, statementEnd);
      if (!expressionText.endsWith(";")) {
        continue;
      }
      expressionText = expressionText.slice(0, -1).trimEnd();
      if (!expressionText) {
        continue;
      }

      if (/^(?:return|break|continue|throw)\b/.test(expressionText)) {
        continue;
      }
      const assignmentDiagnostic = buildStandaloneAssignmentExpressionDiagnostic(
        document,
        analysis,
        allAnalyses,
        index,
        statementStart,
        expressionText,
        workspaceFunctionReturnTypes,
        functionSources,
        workspaceTypeCatalog
      );
      if (assignmentDiagnostic) {
        diagnostics.push(assignmentDiagnostic);
        continue;
      }
      if (splitTopLevelAssignmentExpression(expressionText)) {
        continue;
      }

      const binary = splitByTopLevelBinaryOperator(expressionText);
      if (
        binary &&
        (binary.operator === "==" || binary.operator === "!=")
      ) {
        const leftIsNull = binary.left.trim() === "null";
        const rightIsNull = binary.right.trim() === "null";
        if (leftIsNull !== rightIsNull) {
          const nonNullStart = leftIsNull ? binary.rightStart : binary.leftStart;
          const nonNullText = leftIsNull ? binary.right : binary.left;
          const nonNullType = inferExpressionTypeAtOffset(
            document,
            analysis,
            allAnalyses,
            index,
            statementStart + nonNullStart,
            nonNullText,
            workspaceFunctionReturnTypes,
            functionSources,
            workspaceTypeCatalog
          );
          if (nonNullType && nonNullType.includes("@")) {
            diagnostics.push({
              severity: DiagnosticSeverity.Warning,
              range: offsetToRange(
                document,
                statementStart + binary.operatorStart,
                Math.max(statementStart + binary.operatorStart + 1, statementStart + binary.operatorEnd)
              ),
              message: "The operand is implicitly converted to handle in order to compare them",
              source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
              code: implicitConversionNotExactCode
            });
          }
        }
      }
      if (binary) {
        const strictBinaryDiagnostic = buildStrictBinaryCompatibilityDiagnostic(
          document,
          analysis,
          allAnalyses,
          index,
          statementStart,
          binary,
          workspaceFunctionReturnTypes,
          functionSources,
          workspaceTypeCatalog
        );
        if (strictBinaryDiagnostic) {
          diagnostics.push(strictBinaryDiagnostic);
          continue;
        }
      }

      const expressionType = inferExpressionTypeAtOffset(
        document,
        analysis,
        allAnalyses,
        index,
        statementStart,
        expressionText,
        workspaceFunctionReturnTypes,
        functionSources,
        workspaceTypeCatalog
      );
      if (expressionType) {
        continue;
      }

      if (!binary) {
        continue;
      }

      const leftType = inferExpressionTypeAtOffset(
        document,
        analysis,
        allAnalyses,
        index,
        statementStart + binary.leftStart,
        binary.left,
        workspaceFunctionReturnTypes,
        functionSources,
        workspaceTypeCatalog
      );
      const rightType = inferExpressionTypeAtOffset(
        document,
        analysis,
        allAnalyses,
        index,
        statementStart + binary.rightStart,
        binary.right,
        workspaceFunctionReturnTypes,
        functionSources,
        workspaceTypeCatalog
      );
      if (!leftType || !rightType) {
        continue;
      }
      if (inferBinaryOperatorResultType(binary.operator, leftType, rightType)) {
        continue;
      }

      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          statementStart + binary.operatorStart,
          Math.max(statementStart + binary.operatorStart + 1, statementStart + binary.operatorEnd)
        ),
        message: `Operator "${binary.operator}" is not valid for "${leftType}" and "${rightType}".`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: operatorTypeMismatchCode
      });
    }
  }

  return diagnostics;
}

function isKnownImplicitMemberVariableIdentifier(
  analysis: DocumentAnalysis,
  offset: number,
  identifierName: string,
  cache: Map<string, Set<string>>
): boolean {
  if (!identifierName) {
    return false;
  }

  const containingType = getContainingTypeDeclarationAtOffset(analysis, offset);
  if (!containingType || containingType.kind === "enum") {
    return false;
  }

  const cacheKey = `${analysis.uri}:${containingType.start}:${containingType.end}`;
  let memberNames = cache.get(cacheKey);
  if (!memberNames) {
    const declarationText = analysis.text.slice(containingType.start, containingType.end);
    memberNames = collectTypeMemberVariableNamesFromDeclarationText(declarationText);
    cache.set(cacheKey, memberNames);
  }

  return memberNames.has(identifierName);
}

function getContainingTypeDeclarationAtOffset(
  analysis: DocumentAnalysis,
  offset: number
): DocumentAnalysis["typeDeclarations"][number] | undefined {
  let best: DocumentAnalysis["typeDeclarations"][number] | undefined;
  for (const declaration of analysis.typeDeclarations) {
    if (offset < declaration.start || offset > declaration.end) {
      continue;
    }
    if (
      !best ||
      declaration.end - declaration.start < best.end - best.start
    ) {
      best = declaration;
    }
  }
  return best;
}

function collectTypeMemberVariableNamesFromDeclarationText(
  declarationText: string
): Set<string> {
  const names = new Set<string>();
  if (!declarationText) {
    return names;
  }

  const bodyStart = declarationText.indexOf("{");
  const bodyEnd = declarationText.lastIndexOf("}");
  if (bodyStart < 0 || bodyEnd <= bodyStart) {
    return names;
  }
  const bodyText = declarationText.slice(bodyStart + 1, bodyEnd);

  let statementStart = 0;
  let braceDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  const processStatement = (statementText: string): void => {
    const withoutComments = statementText
      .replace(/\/\/[^\r\n]*/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .trim();
    if (!withoutComments) {
      return;
    }
    if (withoutComments.includes("(")) {
      return;
    }

    const noSemicolon = withoutComments.endsWith(";")
      ? withoutComments.slice(0, -1).trimEnd()
      : withoutComments;
    if (!noSemicolon) {
      return;
    }

    const match =
      /^(?:\s*(?:shared|private|protected|const|final|static)\s+)*([A-Za-z_][A-Za-z0-9_:<>@&\[\]]*)\s+(.+)$/.exec(
        noSemicolon
      );
    if (!match) {
      return;
    }

    const declaratorsText = match[2];
    for (const segment of splitTopLevelByComma(declaratorsText)) {
      const nameMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(segment);
      if (!nameMatch) {
        continue;
      }
      const name = nameMatch[1];
      const afterName = segment.slice(nameMatch[0].length).trimStart();
      if (afterName.startsWith("(")) {
        continue;
      }
      names.add(name);
    }
  };

  for (let i = 0; i < bodyText.length; i += 1) {
    const ch = bodyText[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }
    if (!inDoubleQuote && ch === "'") {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (!inSingleQuote && ch === "\"") {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
    if (inSingleQuote || inDoubleQuote) {
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
    if (ch === ";" && braceDepth === 0) {
      const statement = bodyText.slice(statementStart, i + 1);
      processStatement(statement);
      statementStart = i + 1;
    }
  }

  return names;
}

function buildStrictBinaryCompatibilityDiagnostic(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  statementStart: number,
  binary: BinaryOperatorSlice,
  workspaceFunctionReturnTypes: Map<string, string>,
  functionSources: ExpressionFunctionSources,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): Diagnostic | undefined {
  const leftType = inferExpressionTypeAtOffset(
    document,
    analysis,
    allAnalyses,
    index,
    statementStart + binary.leftStart,
    binary.left,
    workspaceFunctionReturnTypes,
    functionSources,
    workspaceTypeCatalog
  );
  const rightType = inferExpressionTypeAtOffset(
    document,
    analysis,
    allAnalyses,
    index,
    statementStart + binary.rightStart,
    binary.right,
    workspaceFunctionReturnTypes,
    functionSources,
    workspaceTypeCatalog
  );
  if (!leftType || !rightType) {
    return undefined;
  }

  const op = binary.operator;
  const isLogicalOp = op === "&&" || op === "||" || op === "and" || op === "or";
  if (isLogicalOp) {
    if (!isBoolTypeName(leftType) || !isBoolTypeName(rightType)) {
      return {
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          statementStart + binary.operatorStart,
          Math.max(statementStart + binary.operatorStart + 1, statementStart + binary.operatorEnd)
        ),
        message: `Operator "${op}" is not valid for "${leftType}" and "${rightType}".`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: operatorTypeMismatchCode
      };
    }
    return undefined;
  }

  const isComparisonOp =
    op === "==" || op === "!=" || op === "<" || op === ">" || op === "<=" || op === ">=";
  if (!isComparisonOp) {
    return undefined;
  }

  const leftIsBool = isBoolTypeName(leftType);
  const rightIsBool = isBoolTypeName(rightType);
  const leftIsNumeric = isNumericTypeName(leftType);
  const rightIsNumeric = isNumericTypeName(rightType);
  const leftIsString = isTextStringTypeName(leftType);
  const rightIsString = isTextStringTypeName(rightType);
  if (
    (leftIsBool && rightIsNumeric) ||
    (rightIsBool && leftIsNumeric)
  ) {
    return {
      severity: DiagnosticSeverity.Error,
      range: offsetToRange(
        document,
        statementStart + binary.operatorStart,
        Math.max(statementStart + binary.operatorStart + 1, statementStart + binary.operatorEnd)
      ),
      message: `Operator "${op}" is not valid for "${leftType}" and "${rightType}".`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: operatorTypeMismatchCode
    };
  }

  const leftIsBuiltinComparable = leftIsBool || leftIsNumeric || leftIsString;
  const rightIsBuiltinComparable = rightIsBool || rightIsNumeric || rightIsString;
  if (leftIsBuiltinComparable && rightIsBuiltinComparable) {
    const comparableCategoryMatch =
      (leftIsNumeric && rightIsNumeric) ||
      (leftIsBool && rightIsBool) ||
      (leftIsString && rightIsString);
    if (!comparableCategoryMatch) {
      return {
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          statementStart + binary.operatorStart,
          Math.max(statementStart + binary.operatorStart + 1, statementStart + binary.operatorEnd)
        ),
        message: `Operator "${op}" is not valid for "${leftType}" and "${rightType}".`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: operatorTypeMismatchCode
      };
    }
  }

  return undefined;
}

interface IndexAccessExpressionSlice {
  objectText: string;
  objectStart: number;
  objectEnd: number;
  indexText: string;
  indexStart: number;
  indexEnd: number;
  openBracket: number;
  closeBracket: number;
}

function buildUnresolvedExpressionDiagnostic(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  expression: ExpressionSlice,
  workspaceFunctionReturnTypes: Map<string, string>,
  functionSources: ExpressionFunctionSources,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): Diagnostic | undefined {
  const binary = splitByTopLevelBinaryOperator(expression.text);
  if (binary) {
    const strictBinaryDiagnostic = buildStrictBinaryCompatibilityDiagnostic(
      document,
      analysis,
      allAnalyses,
      index,
      expression.start,
      binary,
      workspaceFunctionReturnTypes,
      functionSources,
      workspaceTypeCatalog
    );
    if (strictBinaryDiagnostic) {
      return strictBinaryDiagnostic;
    }

    const leftType = inferExpressionTypeAtOffset(
      document,
      analysis,
      allAnalyses,
      index,
      expression.start + binary.leftStart,
      binary.left,
      workspaceFunctionReturnTypes,
      functionSources,
      workspaceTypeCatalog
    );
    const rightType = inferExpressionTypeAtOffset(
      document,
      analysis,
      allAnalyses,
      index,
      expression.start + binary.rightStart,
      binary.right,
      workspaceFunctionReturnTypes,
      functionSources,
      workspaceTypeCatalog
    );
    if (
      leftType &&
      rightType &&
      !inferBinaryOperatorResultType(binary.operator, leftType, rightType)
    ) {
      return {
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          expression.start + binary.operatorStart,
          Math.max(expression.start + binary.operatorStart + 1, expression.start + binary.operatorEnd)
        ),
        message: `Operator "${binary.operator}" is not valid for "${leftType}" and "${rightType}".`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: operatorTypeMismatchCode
      };
    }
  }

  const indexAccess = splitTopLevelIndexAccessExpression(expression.text, expression.start);
  if (!indexAccess) {
    return undefined;
  }

  if (looksLikeInvalidNumericLiteralSuffix(indexAccess.indexText)) {
    return {
      severity: DiagnosticSeverity.Error,
      range: offsetToRange(
        document,
        indexAccess.indexStart,
        Math.max(indexAccess.indexStart + 1, indexAccess.indexEnd)
      ),
      message: "Invalid numeric literal suffix.",
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: syntaxUnparsableStatementCode
    };
  }

  const objectType = inferExpressionTypeAtOffset(
    document,
    analysis,
    allAnalyses,
    index,
    indexAccess.objectStart,
    indexAccess.objectText,
    workspaceFunctionReturnTypes,
    functionSources,
    workspaceTypeCatalog
  );
  const indexType = inferExpressionTypeAtOffset(
    document,
    analysis,
    allAnalyses,
    index,
    indexAccess.indexStart,
    indexAccess.indexText,
    workspaceFunctionReturnTypes,
    functionSources,
    workspaceTypeCatalog
  );
  if (!objectType || !indexType) {
    return undefined;
  }
  if (supportsIndexAccess(index, objectType, indexType)) {
    return undefined;
  }

  return {
    severity: DiagnosticSeverity.Error,
    range: offsetToRange(
      document,
      indexAccess.openBracket,
      Math.max(indexAccess.openBracket + 1, indexAccess.closeBracket + 1)
    ),
    message: `Type "${objectType}" doesn't support the indexing operator for "${indexType}".`,
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code: operatorTypeMismatchCode
  };
}

function supportsIndexAccess(
  index: CompletionIndex,
  objectTypeText: string,
  indexTypeText: string
): boolean {
  const objectDescriptor = parseTypeDescriptor(objectTypeText);
  const indexDescriptor = parseTypeDescriptor(indexTypeText);
  if (!objectDescriptor || !indexDescriptor) {
    return false;
  }

  if (objectDescriptor.isAny || indexDescriptor.isAny) {
    return true;
  }

  const normalizedObject = objectDescriptor.normalized.toLowerCase();
  if (normalizedObject.includes("json::value")) {
    return true;
  }

  const normalizedObjectNoQualifiers = normalizedObject
    .replace(/\b(?:const|in|out|inout)\b/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[@&]+$/g, "")
    .trim();
  if (/\[\s*\]$/.test(normalizedObjectNoQualifiers)) {
    return isNumericTypeName(indexDescriptor.base);
  }

  if (indexedContainerTypeNames.has(objectDescriptor.shortBase)) {
    return isNumericTypeName(indexDescriptor.base);
  }

  if (intrinsicGenericTypeBases.has(objectDescriptor.shortBase)) {
    if (objectDescriptor.shortBase === "dictionary") {
      return isTextStringTypeName(indexDescriptor.base) || isTextStringTypeName(indexTypeText);
    }
    return isNumericTypeName(indexDescriptor.base);
  }

  return hasLikelyIndexer(index, objectTypeText);
}

function splitTopLevelIndexAccessExpression(
  text: string,
  startOffset: number
): IndexAccessExpressionSlice | undefined {
  if (!text) {
    return undefined;
  }

  const leading = countLeadingWhitespace(text);
  const trailing = countTrailingWhitespace(text);
  const trimmedStart = startOffset + leading;
  const trimmedEnd = startOffset + text.length - trailing;
  if (trimmedEnd <= trimmedStart) {
    return undefined;
  }

  const trimmed = text.slice(leading, text.length - trailing);
  if (!trimmed.endsWith("]")) {
    return undefined;
  }

  let parenDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let bracketDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;
  let currentTopLevelOpen = -1;
  let lastTopLevelOpen = -1;
  let lastTopLevelClose = -1;

  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (inSingleQuote) {
      if (ch === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (inDoubleQuote) {
      if (ch === "\"") {
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

    if (parenDepth > 0 || braceDepth > 0 || angleDepth > 0) {
      continue;
    }

    if (ch === "[") {
      if (bracketDepth === 0) {
        currentTopLevelOpen = i;
      }
      bracketDepth += 1;
      continue;
    }
    if (ch === "]") {
      if (bracketDepth === 0) {
        return undefined;
      }
      bracketDepth -= 1;
      if (bracketDepth === 0 && currentTopLevelOpen >= 0) {
        lastTopLevelOpen = currentTopLevelOpen;
        lastTopLevelClose = i;
      }
    }
  }

  if (
    bracketDepth !== 0 ||
    lastTopLevelOpen < 0 ||
    lastTopLevelClose !== trimmed.length - 1
  ) {
    return undefined;
  }

  const objectRaw = trimmed.slice(0, lastTopLevelOpen);
  const objectLeading = countLeadingWhitespace(objectRaw);
  const objectTrailing = countTrailingWhitespace(objectRaw);
  const objectStart = trimmedStart + objectLeading;
  const objectEnd = trimmedStart + lastTopLevelOpen - objectTrailing;
  if (objectEnd <= objectStart) {
    return undefined;
  }

  const indexRaw = trimmed.slice(lastTopLevelOpen + 1, lastTopLevelClose);
  const indexLeading = countLeadingWhitespace(indexRaw);
  const indexTrailing = countTrailingWhitespace(indexRaw);
  const indexStart = trimmedStart + lastTopLevelOpen + 1 + indexLeading;
  const indexEnd = trimmedStart + lastTopLevelClose - indexTrailing;
  if (indexEnd <= indexStart) {
    return undefined;
  }

  return {
    objectText: trimmed.slice(objectStart - trimmedStart, objectEnd - trimmedStart),
    objectStart,
    objectEnd,
    indexText: trimmed.slice(indexStart - trimmedStart, indexEnd - trimmedStart),
    indexStart,
    indexEnd,
    openBracket: trimmedStart + lastTopLevelOpen,
    closeBracket: trimmedStart + lastTopLevelClose
  };
}

function looksLikeInvalidNumericLiteralSuffix(text: string): boolean {
  const candidate = text.trim();
  if (!candidate) {
    return false;
  }

  if (/^0x[0-9a-f]+$/i.test(candidate) || /^0b[01]+$/i.test(candidate)) {
    return false;
  }

  return /^\d+[A-Za-z_][A-Za-z0-9_]*$/.test(candidate);
}

function buildStandaloneAssignmentExpressionDiagnostic(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  statementStart: number,
  expressionText: string,
  workspaceFunctionReturnTypes: Map<string, string>,
  functionSources: ExpressionFunctionSources,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): Diagnostic | undefined {
  const assignment = splitTopLevelAssignmentExpression(expressionText);
  if (!assignment) {
    return undefined;
  }

  const lhsText = assignment.left.trim();
  if (!lhsText || !lhsText.includes("[") || !lhsText.endsWith("]")) {
    return undefined;
  }

  const lhsStart = statementStart + assignment.leftStart;
  const lhsType = inferExpressionTypeAtOffset(
    document,
    analysis,
    allAnalyses,
    index,
    lhsStart,
    lhsText,
    workspaceFunctionReturnTypes,
    functionSources,
    workspaceTypeCatalog
  );
  if (!lhsType) {
    return undefined;
  }

  const lhsDescriptor = parseTypeDescriptor(lhsType);
  if (lhsDescriptor?.isReference) {
    return undefined;
  }

  const lhsIndexAccess = splitTopLevelIndexAccessExpression(lhsText, lhsStart);
  if (lhsIndexAccess) {
    const indexReceiverType = inferExpressionTypeAtOffset(
      document,
      analysis,
      allAnalyses,
      index,
      lhsIndexAccess.objectStart,
      lhsIndexAccess.objectText,
      workspaceFunctionReturnTypes,
      functionSources,
      workspaceTypeCatalog
    );
    if (
      !indexReceiverType ||
      isMutableIndexedContainerType(indexReceiverType) ||
      hasLikelyWritableIndexer(index, indexReceiverType)
    ) {
      return undefined;
    }
  }

  return {
    severity: DiagnosticSeverity.Error,
    range: offsetToRange(
      document,
      lhsStart,
      Math.max(lhsStart + 1, lhsStart + lhsText.length)
    ),
    message: "Expression is not an l-value",
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code: assignmentTypeMismatchCode
  };
}

function isMutableIndexedContainerType(typeText: string | undefined): boolean {
  if (!typeText) {
    return false;
  }
  if (/\bconst\b/i.test(typeText)) {
    return false;
  }

  const normalizedType = normalizeTypeText(typeText).toLowerCase();
  if (mutableIndexedObjectTypeNames.has(normalizedType)) {
    return true;
  }

  const normalizedNoQualifier = normalizedType
    .replace(/\b(?:in|out|inout)\b/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[@&]+$/g, "")
    .trim();
  if (/\[\s*]$/.test(normalizedNoQualifier)) {
    return true;
  }

  const descriptor = parseTypeDescriptor(typeText);
  if (!descriptor) {
    return false;
  }

  if (mutableIndexedObjectTypeNames.has(descriptor.base.toLowerCase())) {
    return true;
  }
  return (
    indexedContainerTypeNames.has(descriptor.shortBase) ||
    intrinsicGenericTypeBases.has(descriptor.shortBase)
  );
}

function hasLikelyWritableIndexer(
  index: CompletionIndex,
  typeText: string | undefined
): boolean {
  if (!typeText || /\bconst\b/i.test(typeText)) {
    return false;
  }

  const descriptor = parseTypeDescriptor(typeText);
  const candidates = [
    descriptor?.normalized,
    descriptor?.base,
    normalizeTypeText(typeText).trim()
  ].filter((value): value is string => !!value && value.length > 0);

  for (const candidate of candidates) {
    const fullName = tryResolveTypeFullNameFromTypeString(index, candidate);
    if (!fullName) {
      continue;
    }

    const members = getResolvedMembersForType(index, fullName);
    if (
      members.some(
        (member) => member.kind === "method" && member.name === "opIndex"
      )
    ) {
      return true;
    }
  }

  return false;
}

function hasLikelyIndexer(
  index: CompletionIndex,
  typeText: string | undefined
): boolean {
  if (!typeText) {
    return false;
  }

  const descriptor = parseTypeDescriptor(typeText);
  const candidates = [
    descriptor?.normalized,
    descriptor?.base,
    normalizeTypeText(typeText).trim()
  ].filter((value): value is string => !!value && value.length > 0);

  for (const candidate of candidates) {
    const fullName = tryResolveTypeFullNameFromTypeString(index, candidate);
    if (!fullName) {
      continue;
    }

    const members = getResolvedMembersForType(index, fullName);
    if (
      members.some(
        (member) => member.kind === "method" && member.name === "opIndex"
      )
    ) {
      return true;
    }
  }

  return false;
}

export function collectWorkspaceTypeCatalog(
  allAnalyses: DocumentAnalysis[]
): WorkspaceTypeCatalog {
  const byFullName = new Map<string, TypeInfo>();

  for (const analysis of allAnalyses) {
    collectWorkspaceTypeInfosFromDeclarations(
      analysis.grammarProgram.declarations,
      "",
      analysis.text,
      byFullName
    );
  }

  const memberVariableTypesByFullName = new Map<string, Map<string, string>>();
  for (const [fullName, typeInfo] of byFullName) {
    const memberTypes = new Map<string, string>();
    for (const member of typeInfo.members) {
      if (member.kind !== "property" || !member.type) {
        continue;
      }
      memberTypes.set(member.name, member.type);
    }
    memberVariableTypesByFullName.set(fullName, memberTypes);
  }

  return {
    byFullName,
    memberVariableTypesByFullName
  };
}

function collectWorkspaceTypeInfosFromDeclarations(
  declarations: readonly GrammarDeclarationNodeLike[],
  namespacePath: string,
  sourceText: string,
  output: Map<string, TypeInfo>
): void {
  for (const declaration of declarations) {
    if (declaration.kind === "namespace") {
      const childNamespace = namespacePath
        ? `${namespacePath}::${declaration.name}`
        : declaration.name;
      collectWorkspaceTypeInfosFromDeclarations(
        declaration.body,
        childNamespace,
        sourceText,
        output
      );
      continue;
    }

    if (declaration.kind !== "type") {
      continue;
    }

    const fullName = namespacePath
      ? `${namespacePath}::${declaration.name}`
      : declaration.name;
    const parentShortName = extractParentTypeNameFromDeclarationHeader(
      sourceText,
      declaration
    );
    const members = collectWorkspaceTypeMembersFromTypeDeclaration(
      declaration,
      fullName
    );
    const existing = output.get(fullName);
    if (existing) {
      output.set(fullName, {
        ...existing,
        parentShortName: existing.parentShortName ?? parentShortName,
        members: mergeTypeMembers(existing.members, members)
      });
    } else {
      output.set(fullName, {
        fullName,
        shortName: declaration.name,
        namespace: namespacePath,
        parentShortName,
        members
      });
    }

    collectWorkspaceTypeInfosFromDeclarations(
      declaration.body,
      fullName,
      sourceText,
      output
    );
  }
}

function extractParentTypeNameFromDeclarationHeader(
  sourceText: string,
  declaration: Extract<GrammarDeclarationNodeLike, { kind: "type" }>
): string | undefined {
  if (declaration.typeKind === "enum") {
    return undefined;
  }

  const declarationText = sourceText.slice(declaration.start, declaration.end);
  const openBrace = declarationText.indexOf("{");
  if (openBrace < 0) {
    return undefined;
  }

  const header = declarationText.slice(0, openBrace);
  const extendsMatch = /:\s*([^,{]+)/.exec(header);
  if (!extendsMatch) {
    return undefined;
  }

  const parent = normalizeTypeText(extendsMatch[1]).trim();
  return parent.length > 0 ? parent : undefined;
}

function collectWorkspaceTypeMembersFromTypeDeclaration(
  declaration: Extract<GrammarDeclarationNodeLike, { kind: "type" }>,
  typeName: string
): TypeInfo["members"] {
  const members: TypeInfo["members"] = [];

  for (const child of declaration.body) {
    if (child.kind === "variable-declaration") {
      const propertyType = normalizeTypeText(child.typeText).trim();
      if (!propertyType) {
        continue;
      }
      for (const declarator of child.declarators) {
        if (!declarator.name) {
          continue;
        }
        members.push({
          kind: "property",
          name: declarator.name,
          type: propertyType
        });
      }
      continue;
    }

    if (child.kind !== "function" && child.kind !== "callable-declaration") {
      continue;
    }

    const returnType = normalizeTypeText(child.returnTypeText).trim();
    const args = child.parameters
      .map((parameter) =>
        parameter.name
          ? `${parameter.typeText} ${parameter.name}`
          : parameter.typeText
      )
      .join(", ");
    members.push({
      kind: "method",
      name: child.name,
      returnType: returnType || typeName,
      args
    });
  }

  return mergeTypeMembers([], members);
}

function mergeTypeMembers(
  base: TypeInfo["members"],
  incoming: TypeInfo["members"]
): TypeInfo["members"] {
  const merged: TypeInfo["members"] = [...base];
  const seen = new Set<string>(
    base.map((member) =>
      member.kind === "property"
        ? `property|${member.name}|${member.type ?? ""}`
        : `method|${member.name}|${member.returnType ?? ""}|${member.args ?? ""}`
    )
  );

  for (const member of incoming) {
    const key =
      member.kind === "property"
        ? `property|${member.name}|${member.type ?? ""}`
        : `method|${member.name}|${member.returnType ?? ""}|${member.args ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(member);
  }

  return merged;
}

export function createWorkspaceTypeAwareIndex(
  index: CompletionIndex,
  workspaceTypesByFullName: Map<string, TypeInfo>
): CompletionIndex {
  if (workspaceTypesByFullName.size === 0) {
    return index;
  }

  const typeInfoByFullName = new Map(index.typeInfoByFullName);
  const typeFullNamesByShortName = new Map<string, string[]>();
  for (const [shortName, fullNames] of index.typeFullNamesByShortName) {
    typeFullNamesByShortName.set(shortName, [...fullNames]);
  }

  for (const [fullName, typeInfo] of workspaceTypesByFullName) {
    const existing = typeInfoByFullName.get(fullName);
    if (existing) {
      typeInfoByFullName.set(fullName, {
        ...existing,
        members: mergeTypeMembers(existing.members, typeInfo.members)
      });
    } else {
      typeInfoByFullName.set(fullName, {
        ...typeInfo,
        members: [...typeInfo.members]
      });
    }

    const shortNames = [
      typeInfo.shortName,
      fullName.split("::").pop() ?? typeInfo.shortName
    ];
    for (const shortName of shortNames) {
      const existingFullNames = typeFullNamesByShortName.get(shortName);
      if (!existingFullNames) {
        typeFullNamesByShortName.set(shortName, [fullName]);
        continue;
      }
      if (!existingFullNames.includes(fullName)) {
        existingFullNames.push(fullName);
      }
    }
  }

  return {
    ...index,
    typeInfoByFullName,
    typeFullNamesByShortName,
    resolvedMembersCache: new Map(),
    resolvedMemberCompletionsCache: new Map()
  };
}

function getMemberVariableTypesForOffset(
  analysis: DocumentAnalysis,
  offset: number,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): Map<string, string> | undefined {
  if (!workspaceTypeCatalog) {
    return undefined;
  }

  let bestType: DocumentAnalysis["typeDeclarations"][number] | undefined;
  for (const typeDeclaration of analysis.typeDeclarations) {
    if (offset < typeDeclaration.start || offset > typeDeclaration.end) {
      continue;
    }

    if (
      !bestType ||
      typeDeclaration.end - typeDeclaration.start <
        bestType.end - bestType.start
    ) {
      bestType = typeDeclaration;
    }
  }

  if (!bestType) {
    return undefined;
  }

  const candidates = [bestType.fullName, bestType.name].filter(
    (value) => value.length > 0
  );
  for (const candidate of candidates) {
    const memberTypes =
      workspaceTypeCatalog.memberVariableTypesByFullName.get(candidate);
    if (memberTypes) {
      return memberTypes;
    }
  }

  return undefined;
}

function collectGrammarFunctionNodes(
  declarations: readonly GrammarDeclarationNodeLike[],
  output: GrammarFunctionNodeLike[]
): void {
  for (const declaration of declarations) {
    if (declaration.kind === "function") {
      output.push(declaration);
      continue;
    }
    if (declaration.kind === "namespace" || declaration.kind === "type") {
      collectGrammarFunctionNodes(declaration.body, output);
    }
  }
}

function collectSimpleStatements(
  statement: GrammarStatementNodeLike,
  output: GrammarSimpleStatementNodeLike[]
): void {
  if (statement.kind === "statement") {
    output.push(statement);
    return;
  }
  if (statement.kind === "block") {
    for (const nested of statement.statements) {
      collectSimpleStatements(nested, output);
    }
    return;
  }
  if (statement.kind !== "variable-declaration" && statement.body) {
    collectSimpleStatements(statement.body, output);
  }
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

function buildMemberCallCompatibilityDiagnostic(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  occurrence: DocumentAnalysis["occurrences"][number],
  callArguments: CallArgumentSlice,
  workspaceFunctionReturnTypes: Map<string, string>,
  functionSources: ExpressionFunctionSources,
  lineTextCache: Map<number, string>,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): Diagnostic | undefined {
  const receiverTypeFullName = resolveMemberReceiverTypeAtOccurrence(
    document,
    analysis,
    allAnalyses,
    index,
    occurrence,
    workspaceFunctionReturnTypes,
    lineTextCache
  );
  if (!receiverTypeFullName) {
    return undefined;
  }

  const methodSignatures = collectParsedMemberSignaturesForOccurrence(
    index,
    receiverTypeFullName,
    occurrence.name
  );
  if (
    isDictionaryLikeType(receiverTypeFullName) &&
    (occurrence.name === "Get" || occurrence.name === "Set")
  ) {
    return undefined;
  }
  if (methodSignatures.length === 0) {
    return undefined;
  }

  const arityCandidates = methodSignatures.filter(
    (candidate) =>
      callArguments.args.length >= candidate.minArgs &&
      callArguments.args.length <= candidate.maxArgs
  );
  if (arityCandidates.length === 0) {
    const formatted = methodSignatures
      .map((candidate) =>
        candidate.minArgs === candidate.maxArgs
          ? `${candidate.minArgs}`
          : `${candidate.minArgs}-${candidate.maxArgs}`
      )
      .slice(0, 3)
      .join(", ");

    return {
      severity: DiagnosticSeverity.Error,
      range: occurrence.range,
      message: `No overload of "${occurrence.name}" on "${receiverTypeFullName}" accepts ${callArguments.args.length} argument(s). Expected ${formatted}.`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: arityMismatchCode
    };
  }

  const actualTypes = callArguments.args.map((argument) =>
    inferExpressionTypeAtOffset(
      document,
      analysis,
      allAnalyses,
      index,
      argument.start,
      argument.text,
      workspaceFunctionReturnTypes,
      functionSources,
      workspaceTypeCatalog
    )
  );
  const hasUnknownActualType = actualTypes.some((value) =>
    isEffectivelyUnknownArgumentType(value)
  );
  if (hasUnknownActualType) {
    return undefined;
  }
  const resolution = resolveBestCallableOverload(index, arityCandidates, actualTypes);
  if (
    resolution.matched &&
    resolution.best &&
    isAmbiguousCallableResolution(
      index,
      resolution.best,
      arityCandidates,
      actualTypes
    )
  ) {
    const actualTypeText = actualTypes.map((value) => value ?? "unknown").join(", ");
    return {
      severity: DiagnosticSeverity.Error,
      range: occurrence.range,
      message: `Call to "${occurrence.name}" on "${receiverTypeFullName}" is ambiguous for argument types (${actualTypeText}).`,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: callArgumentTypeMismatchCode
    };
  }

  if (resolution.matched || !resolution.sawIncompatibleType) {
    return undefined;
  }

  const actualTypeText = actualTypes.map((value) => value ?? "unknown").join(", ");
  const expected = arityCandidates
    .map((candidate) => candidate.label)
    .slice(0, 3)
    .join("; ");

  return {
    severity: DiagnosticSeverity.Error,
    range: occurrence.range,
    message:
      expected.length > 0
        ? `No overload of "${occurrence.name}" on "${receiverTypeFullName}" accepts argument types (${actualTypeText}). Expected ${expected}.`
        : `No overload of "${occurrence.name}" on "${receiverTypeFullName}" accepts argument types (${actualTypeText}).`,
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code: callArgumentTypeMismatchCode
  };
}

function resolveMemberReceiverTypeAtOccurrence(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  occurrence: DocumentAnalysis["occurrences"][number],
  workspaceFunctionReturnTypes: Map<string, string>,
  lineTextCache: Map<number, string>
): string | undefined {
  const lineText = getLineText(document, occurrence.range.start.line, lineTextCache);
  const receiverText = extractReceiverTextForMemberOccurrence(
    lineText,
    occurrence.range.start.character
  );
  if (!receiverText) {
    return undefined;
  }

  const typeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    occurrence.range.start.line,
    occurrence.range.start.character,
    allAnalyses,
    workspaceFunctionReturnTypes,
    index
  );
  return tryResolveExpressionTypeFullName(index, receiverText, typeContext);
}

function extractReceiverTextForMemberOccurrence(
  lineText: string,
  memberStartCharacter: number
): string | undefined {
  if (memberStartCharacter <= 0 || memberStartCharacter > lineText.length) {
    return undefined;
  }

  let dotIndex = memberStartCharacter - 1;
  while (dotIndex >= 0 && /\s/.test(lineText[dotIndex])) {
    dotIndex -= 1;
  }
  if (dotIndex < 0 || lineText[dotIndex] !== ".") {
    return undefined;
  }

  const receiverEnd = dotIndex;
  let cursor = receiverEnd - 1;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  while (cursor >= 0) {
    const ch = lineText[cursor];
    if (ch === ")") {
      parenDepth += 1;
      cursor -= 1;
      continue;
    }
    if (ch === "]") {
      bracketDepth += 1;
      cursor -= 1;
      continue;
    }
    if (ch === "}") {
      braceDepth += 1;
      cursor -= 1;
      continue;
    }

    if (parenDepth > 0) {
      if (ch === "(") {
        parenDepth -= 1;
      }
      cursor -= 1;
      continue;
    }
    if (bracketDepth > 0) {
      if (ch === "[") {
        bracketDepth -= 1;
      }
      cursor -= 1;
      continue;
    }
    if (braceDepth > 0) {
      if (ch === "{") {
        braceDepth -= 1;
      }
      cursor -= 1;
      continue;
    }

    const isNamespaceSep =
      ch === ":" &&
      ((cursor > 0 && lineText[cursor - 1] === ":") ||
        (cursor + 1 < lineText.length && lineText[cursor + 1] === ":"));
    if (isNamespaceSep) {
      cursor -= 1;
      continue;
    }

    if (/\s/.test(ch)) {
      const previousWord = readPreviousIdentifierToken(lineText, cursor - 1);
      if (
        previousWord === "is" ||
        previousWord === "isnot" ||
        previousWord === "and" ||
        previousWord === "or" ||
        previousWord === "xor"
      ) {
        break;
      }
      cursor -= 1;
      continue;
    }

    if (
      ch === "," ||
      ch === ";" ||
      ch === "=" ||
      ch === "?" ||
      ch === ":" ||
      ch === "+" ||
      ch === "-" ||
      ch === "*" ||
      ch === "/" ||
      ch === "%" ||
      ch === "!" ||
      ch === "&" ||
      ch === "|" ||
      ch === "^" ||
      ch === "(" ||
      ch === "{"
    ) {
      break;
    }

    cursor -= 1;
  }

  const receiverStart = cursor + 1;
  const receiverText = lineText.slice(receiverStart, receiverEnd).trim();
  return receiverText.length > 0 ? receiverText : undefined;
}

function readPreviousIdentifierToken(
  text: string,
  startIndex: number
): string | undefined {
  let end = startIndex;
  while (end >= 0 && /\s/.test(text[end])) {
    end -= 1;
  }
  if (end < 0 || !/[A-Za-z_]/.test(text[end])) {
    return undefined;
  }

  let start = end;
  while (start >= 0 && /[A-Za-z0-9_]/.test(text[start])) {
    start -= 1;
  }

  const token = text.slice(start + 1, end + 1).trim();
  return token.length > 0 ? token.toLowerCase() : undefined;
}

function collectParsedMemberSignaturesForOccurrence(
  index: CompletionIndex,
  receiverTypeFullName: string,
  memberName: string
): ParsedCallableSignature[] {
  const signatures: ParsedCallableSignature[] = [];
  const seen = new Set<string>();

  for (const member of getResolvedMembersForType(index, receiverTypeFullName)) {
    if (member.kind !== "method" || member.name !== memberName) {
      continue;
    }

    const signature = parseCallableSignature(
      `${normalizeTypeText(member.returnType || "void") || "void"} ${member.name}(${(member.args || "").trim()})`
    );
    if (!signature) {
      continue;
    }
    const adjustedSignature = adjustKnownMemberSignatureArity(
      receiverTypeFullName,
      memberName,
      signature
    );

    const key = `${adjustedSignature.returnType}:${adjustedSignature.label}:${adjustedSignature.minArgs}:${adjustedSignature.maxArgs}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    signatures.push(adjustedSignature);
  }

  return signatures;
}

function adjustKnownMemberSignatureArity(
  receiverTypeFullName: string,
  memberName: string,
  signature: ParsedCallableSignature
): ParsedCallableSignature {
  if (
    receiverTypeFullName === "string" &&
    memberName === "Split" &&
    signature.minArgs === 2 &&
    signature.maxArgs === 2 &&
    signature.parameters.length === 2 &&
    /^int\b/i.test(signature.parameters[1]?.typeText ?? "")
  ) {
    return {
      ...signature,
      minArgs: 1
    };
  }

  return signature;
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
  functionSources?: ExpressionFunctionSources,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): string | undefined {
  const safeOffset = Math.max(0, Math.min(offset, analysis.text.length));
  const position = document.positionAt(safeOffset);
  const typeResolutionContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    position.line,
    position.character,
    allAnalyses,
    workspaceFunctionReturnTypes,
    index
  );

  const effectiveFunctionSources =
    functionSources ?? buildExpressionFunctionSources(allAnalyses, index);
  const memberVariableTypes = getMemberVariableTypesForOffset(
    analysis,
    safeOffset,
    workspaceTypeCatalog
  );
  const expressionContext: ExpressionInferenceContext = {
    localVariableTypes: typeResolutionContext.localVariableTypes,
    localFunctionReturnTypes: typeResolutionContext.localFunctionReturnTypes,
    functionSources: effectiveFunctionSources,
    memberVariableTypes
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

function getCallableParameterForArgumentIndex(
  signature: ParsedCallableSignature,
  argumentIndex: number
): ParsedCallableParameter | undefined {
  if (argumentIndex < signature.parameters.length) {
    return signature.parameters[argumentIndex];
  }
  if (signature.parameters.length === 0) {
    return undefined;
  }

  const last = signature.parameters[signature.parameters.length - 1];
  return last.variadic ? last : undefined;
}

function isAmbiguousCallableResolution(
  index: CompletionIndex,
  best: ParsedCallableSignature,
  candidates: ParsedCallableSignature[],
  actualTypes: Array<string | undefined>
): boolean {
  for (const candidate of candidates) {
    if (
      candidate.label === best.label &&
      candidate.returnType === best.returnType
    ) {
      continue;
    }

    const bestThenCandidate = resolveBestCallableOverload(
      index,
      [best, candidate],
      actualTypes
    );
    const candidateThenBest = resolveBestCallableOverload(
      index,
      [candidate, best],
      actualTypes
    );
    if (
      !bestThenCandidate.matched ||
      !candidateThenBest.matched ||
      !bestThenCandidate.best ||
      !candidateThenBest.best
    ) {
      continue;
    }
    if (bestThenCandidate.best.label !== candidateThenBest.best.label) {
      return true;
    }
  }

  return false;
}

function buildHandleModeCallDiagnostic(
  document: TextDocument,
  occurrence: DocumentAnalysis["occurrences"][number],
  callArguments: CallArgumentSlice,
  signature: ParsedCallableSignature
): Diagnostic | undefined {
  for (let i = 0; i < callArguments.args.length; i += 1) {
    const argument = callArguments.args[i];
    const parameter = getCallableParameterForArgumentIndex(signature, i);
    if (!argument || !parameter) {
      continue;
    }

    const parameterText = parameter.rawText.toLowerCase();
    const hasReference = parameterText.includes("&");

    const hasInout = /\binout\b/.test(parameterText);
    const hasOut = hasInout || /\bout\b/.test(parameterText);
    const hasIn = hasInout || /\bin\b/.test(parameterText);

    if (!hasReference) {
      continue;
    }

    if (hasOut && !isLikelyAssignableReferenceArgument(argument.text)) {
      return {
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          argument.start,
          Math.max(argument.start + 1, argument.end)
        ),
        message: `Out parameter of "${occurrence.name}" requires an assignable argument.`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: callArgumentTypeMismatchCode
      };
    }

    if (hasIn && argument.text.trim() === "null") {
      return {
        severity: DiagnosticSeverity.Error,
        range: offsetToRange(
          document,
          argument.start,
          Math.max(argument.start + 1, argument.end)
        ),
        message: `Null cannot be passed to reference parameter of "${occurrence.name}".`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: callArgumentTypeMismatchCode
      };
    }
  }

  return undefined;
}

function isLikelyAssignableReferenceArgument(expressionText: string): boolean {
  const trimmed = expressionText.trim();
  if (!trimmed) {
    return false;
  }

  return /^[A-Za-z_][A-Za-z0-9_]*(?:(?:\s*::\s*|\s*\.\s*)[A-Za-z_][A-Za-z0-9_]*|\s*\[[^\]]+\])*$/.test(
    trimmed
  );
}

function buildHandleNullComparisonWarningDiagnostic(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  index: CompletionIndex,
  expression: ExpressionSlice,
  workspaceFunctionReturnTypes: Map<string, string>,
  functionSources: ExpressionFunctionSources,
  workspaceTypeCatalog?: WorkspaceTypeCatalog
): Diagnostic | undefined {
  const binary = splitByTopLevelBinaryOperator(expression.text);
  if (!binary || (binary.operator !== "==" && binary.operator !== "!=")) {
    return undefined;
  }

  const leftIsNull = binary.left.trim() === "null";
  const rightIsNull = binary.right.trim() === "null";
  if (leftIsNull === rightIsNull) {
    return undefined;
  }

  const nonNullStart = leftIsNull ? binary.rightStart : binary.leftStart;
  const nonNullText = leftIsNull ? binary.right : binary.left;
  const nonNullType = inferExpressionTypeAtOffset(
    document,
    analysis,
    allAnalyses,
    index,
    expression.start + nonNullStart,
    nonNullText,
    workspaceFunctionReturnTypes,
    functionSources,
    workspaceTypeCatalog
  );
  if (!nonNullType || !nonNullType.includes("@")) {
    return undefined;
  }

  return {
    severity: DiagnosticSeverity.Warning,
    range: offsetToRange(
      document,
      expression.start + binary.operatorStart,
      Math.max(expression.start + binary.operatorStart + 1, expression.start + binary.operatorEnd)
    ),
    message: "The operand is implicitly converted to handle in order to compare them",
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code: implicitConversionNotExactCode
  };
}

function isImplicitConversionNotExact(
  expectedTypeText: string | undefined,
  actualTypeText: string | undefined,
  expressionText: string
): boolean {
  const expectedBase = getTypeBaseName(expectedTypeText);
  const actualBase = getTypeBaseName(actualTypeText);
  if (!isIntegerTypeName(expectedBase) || !isFloatingTypeName(actualBase)) {
    return false;
  }

  const literalValue = parseFloatingPointLiteralValue(expressionText);
  if (literalValue === undefined) {
    return false;
  }

  return !isExactIntegerNumber(literalValue);
}

function parseFloatingPointLiteralValue(expressionText: string): number | undefined {
  const text = expressionText.trim().replace(/\s+/g, "");
  if (!text) {
    return undefined;
  }

  if (
    !/^[+-]?(?:(?:\d+\.\d*|\d*\.\d+)(?:[eE][+-]?\d+)?|\d+(?:[eE][+-]?\d+))[fFdD]?$/.test(
      text
    )
  ) {
    return undefined;
  }

  const numericPart = text.replace(/[fFdD]$/, "");
  const value = Number(numericPart);
  return Number.isFinite(value) ? value : undefined;
}

function isExactIntegerNumber(value: number): boolean {
  return Math.abs(value - Math.trunc(value)) < 1e-9;
}

function isStringParameterPassedByValue(typeText: string): boolean {
  const normalized = normalizeParameterType(typeText);
  if (!normalized || normalized.includes("&")) {
    return false;
  }
  return getTypeBaseName(normalized) === "string";
}

function normalizeParameterType(typeText: string): string {
  return normalizeTypeText(typeText)
    .replace(/\b(const|in|out|inout)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTypeBaseName(typeText: string | undefined): string {
  if (!typeText) {
    return "";
  }

  const normalized = normalizeTypeText(typeText)
    .replace(/\b(const|in|out|inout)\b/g, " ")
    .replace(/[@&]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return "";
  }

  const withoutTemplate = normalized.split("<")[0].trim();
  if (!withoutTemplate) {
    return "";
  }

  const token = withoutTemplate.split(/\s+/)[0];
  return (token.split("::").pop() ?? token).toLowerCase();
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

  if (/^[A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)+$/.test(text)) {
    return (
      context.localVariableTypes.get(text) ??
      context.localFunctionReturnTypes.get(text)
    );
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
): BinaryOperatorSlice | undefined {
  if (hasTopLevelConditionalOperator(text)) {
    return undefined;
  }

  const precedenceGroups = [
    ["||", "&&", " and ", " or ", " xor "],
    ["==", "!=", "<=", ">=", "<", ">", " is ", " !is "],
    ["+", "-"],
    ["*", "/", "%"]
  ];

  for (const operators of precedenceGroups) {
    const split = findTopLevelBinarySplit(text, operators);
    if (!split) {
      continue;
    }

    const leftRaw = text.slice(0, split.index);
    const rightRaw = text.slice(split.index + split.operator.length);
    const leftLeading = countLeadingWhitespace(leftRaw);
    const leftTrailing = countTrailingWhitespace(leftRaw);
    const rightLeading = countLeadingWhitespace(rightRaw);
    const rightTrailing = countTrailingWhitespace(rightRaw);
    const operatorLeading = countLeadingWhitespace(split.operator);
    const operatorTrailing = countTrailingWhitespace(split.operator);

    const leftStart = leftLeading;
    const leftEnd = leftRaw.length - leftTrailing;
    const rightStart = split.index + split.operator.length + rightLeading;
    const rightEnd = text.length - rightTrailing;
    const operatorStart = split.index + operatorLeading;
    const operatorEnd = split.index + split.operator.length - operatorTrailing;

    if (
      leftStart >= leftEnd ||
      rightStart >= rightEnd ||
      operatorStart >= operatorEnd
    ) {
      continue;
    }

    return {
      left: text.slice(leftStart, leftEnd),
      leftStart,
      leftEnd,
      operator: split.operator.trim(),
      operatorStart,
      operatorEnd,
      right: text.slice(rightStart, rightEnd),
      rightStart,
      rightEnd
    };
  }

  return undefined;
}

function hasTopLevelConditionalOperator(text: string): boolean {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
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

    if (
      ch === "?" &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      return true;
    }
  }

  return false;
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
    if (
      (ch === "<" || ch === ">") &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0 &&
      hasWhitespaceAroundOperator(text, i) &&
      operators.includes(ch)
    ) {
      return { index: i, operator: ch };
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

function hasWhitespaceAroundOperator(text: string, operatorIndex: number): boolean {
  const before = text[operatorIndex - 1] ?? "";
  const after = text[operatorIndex + 1] ?? "";
  return /\s/.test(before) && /\s/.test(after);
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

  if (operator === "==" || operator === "!=") {
    if (isNumericTypeName(leftType) && isNumericTypeName(rightType)) {
      return "bool";
    }
    if (isBoolTypeName(leftType) && isBoolTypeName(rightType)) {
      return "bool";
    }
    if (isTextStringTypeName(leftType) && isTextStringTypeName(rightType)) {
      return "bool";
    }
    const normalizedLeft = normalizeTypeText(leftType || "");
    const normalizedRight = normalizeTypeText(rightType || "");
    if (normalizedLeft && normalizedRight && normalizedLeft === normalizedRight) {
      return "bool";
    }
    return undefined;
  }

  if (operator === "<" || operator === ">" || operator === "<=" || operator === ">=") {
    if (isNumericTypeName(leftType) && isNumericTypeName(rightType)) {
      return "bool";
    }
    if (isTextStringTypeName(leftType) && isTextStringTypeName(rightType)) {
      return "bool";
    }
    return undefined;
  }

  if (operator === "is" || operator === "!is") {
    return leftType && rightType ? "bool" : undefined;
  }

  if (operator === "+" && (isTextStringTypeName(leftType) || isTextStringTypeName(rightType))) {
    return isWideStringTypeName(leftType) || isWideStringTypeName(rightType)
      ? "wstring"
      : "string";
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
  return evaluateAssignmentOperatorCompatibility(
    index,
    operator,
    normalizeReferenceAssignmentTargetType(leftType),
    rightType
  );
}

function normalizeReferenceAssignmentTargetType(typeText: string): string {
  if (!typeText.includes("&")) {
    return typeText;
  }

  const normalized = normalizeTypeText(typeText)
    .replace(/&\s*(?:inout|in|out)\b/g, " ")
    .replace(/\b(?:inout|in|out)\b/g, " ")
    .replace(/&/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized || typeText;
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
    return isPrimitiveTypeName(expected.normalized) ? "incompatible" : "unknown";
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

  if (isBoolTypeName(expected.normalized)) {
    return expected.shortBase === actual.shortBase ? "compatible" : "incompatible";
  }

  if (isTextStringTypeName(expected.normalized)) {
    return isTextStringTypeName(actual.normalized) ? "compatible" : "incompatible";
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
  let sawSeparator = false;
  let omittedArgumentOffset: number | undefined;
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

      const parsedSegment = parseCallArgumentSegment(text, currentStart, i);
      if (parsedSegment) {
        args.push(parsedSegment);
      } else if (sawSeparator && omittedArgumentOffset === undefined) {
        omittedArgumentOffset = currentStart;
      }

      return {
        openParen,
        closeParen: i,
        args,
        hasOmittedArgument: omittedArgumentOffset !== undefined,
        omittedArgumentOffset
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
      const parsedSegment = parseCallArgumentSegment(text, currentStart, i);
      if (parsedSegment) {
        args.push(parsedSegment);
      } else if (omittedArgumentOffset === undefined) {
        omittedArgumentOffset = currentStart;
      }
      sawSeparator = true;
      currentStart = i + 1;
    }
  }

  return undefined;
}

function parseCallArgumentSegment(
  source: string,
  start: number,
  end: number
): ExpressionSlice | undefined {
  if (end <= start) {
    return undefined;
  }

  const raw = source.slice(start, end);
  const leading = countLeadingWhitespace(raw);
  const trailing = countTrailingWhitespace(raw);
  const trimmedStart = start + leading;
  const trimmedEnd = end - trailing;
  if (trimmedEnd <= trimmedStart) {
    return undefined;
  }

  const trimmed = source.slice(trimmedStart, trimmedEnd);
  const namedMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*:(?!:)\s*([\s\S]+)$/.exec(trimmed);
  if (namedMatch) {
    const valueText = namedMatch[2].trim();
    if (valueText.length > 0) {
      const valueStartInTrimmed = trimmed.indexOf(namedMatch[2]);
      if (valueStartInTrimmed >= 0) {
        const valueStart =
          trimmedStart +
          valueStartInTrimmed +
          countLeadingWhitespace(namedMatch[2]);
        const valueEnd = valueStart + valueText.length;
        return {
          text: valueText,
          start: valueStart,
          end: valueEnd
        };
      }
    }
  }

  return {
    text: trimmed,
    start: trimmedStart,
    end: trimmedEnd
  };
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
    if (
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0 &&
      ch === target
    ) {
      return i;
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
  }

  return -1;
}

function hasTopLevelEquals(text: string): boolean {
  return findTopLevelChar(text, "=") >= 0;
}

function findTopLevelAssignmentOperator(
  text: string
): AssignmentExpressionSlice["operator"] | undefined {
  return findTopLevelAssignmentSplit(text)?.operator;
}

function splitTopLevelAssignmentExpression(
  text: string
):
  | {
      operator: AssignmentExpressionSlice["operator"];
      left: string;
      leftStart: number;
      leftEnd: number;
      right: string;
      rightStart: number;
      rightEnd: number;
    }
  | undefined {
  const split = findTopLevelAssignmentSplit(text);
  if (!split) {
    return undefined;
  }

  const leftRaw = text.slice(0, split.index);
  const rightRaw = text.slice(split.index + split.operator.length);
  const leftLeading = countLeadingWhitespace(leftRaw);
  const leftTrailing = countTrailingWhitespace(leftRaw);
  const rightLeading = countLeadingWhitespace(rightRaw);
  const rightTrailing = countTrailingWhitespace(rightRaw);

  const leftStart = leftLeading;
  const leftEnd = leftRaw.length - leftTrailing;
  const rightStart = split.index + split.operator.length + rightLeading;
  const rightEnd = text.length - rightTrailing;
  if (leftStart >= leftEnd || rightStart >= rightEnd) {
    return undefined;
  }

  return {
    operator: split.operator,
    left: text.slice(leftStart, leftEnd),
    leftStart,
    leftEnd,
    right: text.slice(rightStart, rightEnd),
    rightStart,
    rightEnd
  };
}

function findTopLevelAssignmentSplit(
  text: string
): { index: number; operator: AssignmentExpressionSlice["operator"] } | undefined {
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

    if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0 || angleDepth !== 0) {
      continue;
    }

    for (const operator of operators) {
      if (!text.startsWith(operator, i)) {
        continue;
      }

      if (operator === "=") {
        const previous = i > 0 ? text[i - 1] : "";
        const next = i + 1 < text.length ? text[i + 1] : "";
        if (
          previous === "=" ||
          previous === "!" ||
          previous === "<" ||
          previous === ">" ||
          next === "=" ||
          next === ">"
        ) {
          continue;
        }
      }

      return { index: i, operator };
    }
  }

  return undefined;
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
    isTextStringTypeName(typeName)
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

function isWideStringTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  return (typeName.split("::").pop() ?? typeName).toLowerCase() === "wstring";
}

function isTextStringTypeName(typeName: string | undefined): boolean {
  return isStringTypeName(typeName) || isWideStringTypeName(typeName);
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
  let bracketDepth = 0;
  let braceDepth = 0;
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

    if (ch === "[") {
      bracketDepth += 1;
      sawValueToken = true;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }
    if (ch === "{") {
      braceDepth += 1;
      sawValueToken = true;
      continue;
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1);
      continue;
    }

    if (depth === 0 && bracketDepth === 0 && braceDepth === 0 && ch === ",") {
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
    if (findTopLevelEqualsIndex(arg) < 0) {
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
      ch === "," &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0
    ) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(text.slice(start).trim());
  return parts.filter((part) => part.length > 0);
}

function isKnownTypeString(
  index: CompletionIndex,
  typeString: string | undefined,
  knownTypeNames?: Set<string>
): boolean {
  if (!typeString || typeString === "auto") {
    return true;
  }

  const candidates = expandTypeLookupCandidates(typeString);
  for (const candidate of candidates) {
    const compact = candidate.replace(/\s+/g, "");
    const genericBase = compact.split("<")[0] ?? compact;
    const shortName = candidate.split("::").pop() ?? candidate;

    if (
      knownTypeNames?.has(candidate) ||
      knownTypeNames?.has(shortName) ||
      isPrimitiveTypeName(candidate) ||
      isPrimitiveTypeName(shortName) ||
      isLanguageKeyword(candidate) ||
      isLanguageKeyword(shortName) ||
      intrinsicGenericTypeBases.has(genericBase.toLowerCase())
    ) {
      return true;
    }

    if (isKnownTypeScopedCandidate(index, candidate, knownTypeNames)) {
      return true;
    }

    if (tryResolveTypeFullNameFromTypeString(index, candidate) !== undefined) {
      return true;
    }
  }

  return false;
}

function isKnownTypeScopedCandidate(
  index: CompletionIndex,
  candidate: string,
  knownTypeNames?: Set<string>
): boolean {
  const parts = candidate
    .split("::")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length < 2) {
    return false;
  }

  for (let i = parts.length - 1; i >= 1; i -= 1) {
    const prefix = parts.slice(0, i).join("::");
    if (isKnownTypeName(index, prefix, knownTypeNames)) {
      return true;
    }
  }

  return false;
}

function expandTypeLookupCandidates(typeString: string): string[] {
  const normalizedType = normalizeTypeText(typeString).trim();
  if (!normalizedType) {
    return [];
  }

  const candidates = new Set<string>();
  const push = (value: string): void => {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) {
      return;
    }
    candidates.add(normalized);
  };

  push(normalizedType);
  push(normalizeArrayBracketShorthand(normalizedType));
  push(stripTrailingIdentifierFromType(normalizedType));

  const withoutQualifiers = normalizedType
    .replace(/\b(const|in|out|inout)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  push(withoutQualifiers);
  push(normalizeArrayBracketShorthand(withoutQualifiers));
  push(stripTrailingIdentifierFromType(withoutQualifiers));

  for (const value of [...candidates]) {
    push(value.replace(/(?:\s*[@&])+$/g, "").trim());
  }

  return [...candidates];
}

function normalizeArrayBracketShorthand(typeText: string): string {
  let text = typeText.trim();
  if (!text.includes("[]")) {
    return text;
  }

  let handleSuffix = "";
  const handleMatch = /([@&]+)$/.exec(text);
  if (handleMatch) {
    handleSuffix = handleMatch[1];
    text = text.slice(0, -handleSuffix.length).trimEnd();
  }

  let depth = 0;
  while (text.endsWith("[]")) {
    depth += 1;
    text = text.slice(0, -2).trimEnd();
  }
  if (depth === 0 || !text) {
    return typeText.trim();
  }

  let converted = text;
  for (let i = 0; i < depth; i += 1) {
    converted = `array<${converted}>`;
  }
  return `${converted}${handleSuffix}`.trim();
}

function stripTrailingIdentifierFromType(typeText: string): string {
  const value = typeText.trim();
  const trailingNameMatch = /^(.*\S)\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(value);
  if (!trailingNameMatch) {
    return value;
  }
  const maybeType = trailingNameMatch[1].trimEnd();
  if (!maybeType) {
    return value;
  }
  return maybeType;
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
  let i = 0;
  while (i < after.length && /\s/.test(after[i])) {
    i += 1;
  }
  if (i >= after.length) {
    return false;
  }

  if (after[i] === "<") {
    let angleDepth = 0;
    while (i < after.length) {
      const ch = after[i];
      if (ch === "<") {
        angleDepth += 1;
      } else if (ch === ">") {
        angleDepth -= 1;
        if (angleDepth === 0) {
          i += 1;
          break;
        }
      }
      i += 1;
    }
    if (angleDepth !== 0) {
      return false;
    }
    while (i < after.length && /\s/.test(after[i])) {
      i += 1;
    }
    while (i < after.length && after[i] === ">") {
      i += 1;
      while (i < after.length && /\s/.test(after[i])) {
        i += 1;
      }
    }
  }

  if (i < after.length && (after[i] === "@" || after[i] === "&")) {
    i += 1;
    while (i < after.length && /\s/.test(after[i])) {
      i += 1;
    }

    const modeMatch = /^(inout|out|in)\b/.exec(after.slice(i));
    if (modeMatch) {
      i += modeMatch[1].length;
      while (i < after.length && /\s/.test(after[i])) {
        i += 1;
      }
    }
  }

  if (!isIdentifierStartChar(after[i])) {
    return false;
  }

  i += 1;
  while (i < after.length && isIdentifierPartChar(after[i])) {
    i += 1;
  }
  while (i < after.length && /\s/.test(after[i])) {
    i += 1;
  }

  const terminator = after[i] ?? "";
  return terminator === "=" || terminator === ";" || terminator === "," || terminator === ")" || terminator === "[";
}

function isIdentifierStartChar(ch: string | undefined): boolean {
  if (!ch) {
    return false;
  }
  return /[A-Za-z_]/.test(ch);
}

function isIdentifierPartChar(ch: string | undefined): boolean {
  if (!ch) {
    return false;
  }
  return /[A-Za-z0-9_]/.test(ch);
}

function isEffectivelyUnknownArgumentType(
  typeText: string | undefined
): boolean {
  if (typeof typeText !== "string" || typeText.trim().length === 0) {
    return true;
  }
  const descriptor = parseTypeDescriptor(typeText);
  return descriptor?.isAny ?? false;
}

function containsUnqualifiedIdentifierToken(text: string, name: string): boolean {
  if (!text || !name) {
    return false;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escapedName}\\b`, "g");
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? -1;
    if (start < 0) {
      continue;
    }
    if (isOffsetInsideQuotedLiteral(text, start)) {
      continue;
    }

    let prev = start - 1;
    while (prev >= 0 && /\s/.test(text[prev])) {
      prev -= 1;
    }
    if (prev >= 0 && text[prev] === ".") {
      continue;
    }
    if (prev >= 1 && text[prev] === ":" && text[prev - 1] === ":") {
      continue;
    }
    return true;
  }
  return false;
}

function isOffsetInsideQuotedLiteral(text: string, offset: number): boolean {
  if (offset < 0 || offset >= text.length) {
    return false;
  }

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i += 1) {
    if (i === offset) {
      return inSingleQuote || inDoubleQuote;
    }

    const ch = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if ((inSingleQuote || inDoubleQuote) && ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (!inDoubleQuote && ch === "'") {
      inSingleQuote = !inSingleQuote;
      continue;
    }
    if (!inSingleQuote && ch === "\"") {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }
  }

  return false;
}

function isKnownNamespaceInUsingDirective(
  document: TextDocument,
  occurrence: DocumentAnalysis["occurrences"][number],
  index: CompletionIndex,
  lineTextCache?: Map<number, string>
): boolean {
  const lineText = getLineText(document, occurrence.range.start.line, lineTextCache);
  const match =
    /^\s*using\s+namespace\s+([A-Za-z_][A-Za-z0-9_]*(?:\s*::\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*;/.exec(
      lineText
    );
  if (!match) {
    return false;
  }

  const pathStart = lineText.indexOf(match[1]);
  if (pathStart < 0) {
    return false;
  }

  const pathEnd = pathStart + match[1].length;
  if (
    occurrence.range.start.character < pathStart ||
    occurrence.range.end.character > pathEnd
  ) {
    return false;
  }

  const namespacePath = match[1]
    .split("::")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join("::");
  if (!namespacePath) {
    return false;
  }

  return (
    index.namespaceBuckets.has(namespacePath) ||
    index.namespaceChildren.has(namespacePath)
  );
}

function isInsideImportParameterDeclaration(
  analysis: DocumentAnalysis,
  occurrence: DocumentAnalysis["occurrences"][number]
): boolean {
  for (const declaration of analysis.importFunctionDeclarations) {
    if (
      occurrence.start >= declaration.argsStart &&
      occurrence.end <= declaration.argsEnd
    ) {
      return true;
    }
  }
  return false;
}

function isInsideImportDeclaration(
  analysis: DocumentAnalysis,
  occurrence: DocumentAnalysis["occurrences"][number]
): boolean {
  for (const declaration of analysis.importFunctionDeclarations) {
    if (
      occurrence.start >= declaration.statementStart &&
      occurrence.end <= declaration.statementEnd
    ) {
      return true;
    }
  }
  return false;
}

function isKnownNamespaceQualifiedIdentifier(
  document: TextDocument,
  occurrence: DocumentAnalysis["occurrences"][number],
  index: CompletionIndex,
  allAnalyses: DocumentAnalysis[],
  lineTextCache?: Map<number, string>,
  knownTypeNames?: Set<string>
): boolean {
  if (occurrence.qualifier !== "namespace") {
    return false;
  }

  const lineText = getLineText(document, occurrence.range.start.line, lineTextCache);
  const linePrefix = lineText.slice(0, occurrence.range.end.character);
  const match =
    /([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)$/.exec(linePrefix);
  if (!match) {
    return false;
  }

  const qualifiedName = match[1];
  const parts = qualifiedName.split("::").filter((part) => part.length > 0);
  if (parts.length < 2) {
    return false;
  }

  const symbolName = parts[parts.length - 1];
  if (symbolName !== occurrence.name) {
    return false;
  }

  if (isKnownTypeName(index, qualifiedName, knownTypeNames)) {
    return true;
  }

  if (isKnownWorkspaceQualifiedIdentifier(qualifiedName, allAnalyses)) {
    return true;
  }

  const parentNamespace = parts.slice(0, -1).join("::");
  if (
    !isKnownNamespacePath(
      parentNamespace,
      index,
      allAnalyses,
      knownTypeNames
    )
  ) {
    return false;
  }

  const bucket = index.namespaceBuckets.get(parentNamespace);
  if (bucket?.items.some((item) => item.label === symbolName)) {
    return true;
  }

  if (
    isTypeScopedQualifiedPath(qualifiedName, index, allAnalyses, knownTypeNames)
  ) {
    return true;
  }

  return allAnalyses.some((analysis) =>
    analysis.globalDeclarations.some((declaration) => {
      if (!declaration.name.startsWith(`${parentNamespace}::`)) {
        return false;
      }
      return (declaration.name.split("::").pop() ?? "") === symbolName;
    })
  );
}

function isTypeScopedQualifiedPath(
  qualifiedName: string,
  index: CompletionIndex,
  allAnalyses: DocumentAnalysis[],
  knownTypeNames?: Set<string>
): boolean {
  const parts = qualifiedName.split("::").filter((part) => part.length > 0);
  if (parts.length < 2) {
    return false;
  }

  for (let i = parts.length - 1; i >= 1; i -= 1) {
    const typePrefix = parts.slice(0, i).join("::");
    if (isKnownTypeName(index, typePrefix, knownTypeNames)) {
      return true;
    }
    if (
      allAnalyses.some((analysis) =>
        analysis.typeDeclarations.some(
          (declaration) => declaration.fullName === typePrefix
        )
      )
    ) {
      return true;
    }
  }

  return false;
}

function isKnownWorkspaceQualifiedIdentifier(
  qualifiedName: string,
  allAnalyses: DocumentAnalysis[]
): boolean {
  for (const analysis of allAnalyses) {
    if (analysis.declaredCallableNames.has(qualifiedName)) {
      return true;
    }
    if (analysis.typeDeclarations.some((declaration) => declaration.fullName === qualifiedName)) {
      return true;
    }
    if (analysis.globalDeclarations.some((declaration) => declaration.name === qualifiedName)) {
      return true;
    }
  }

  return false;
}

function isKnownNamespacePath(
  namespacePath: string,
  index: CompletionIndex,
  allAnalyses: DocumentAnalysis[],
  knownTypeNames?: Set<string>
): boolean {
  if (!namespacePath) {
    return false;
  }

  if (
    index.namespaceBuckets.has(namespacePath) ||
    index.namespaceChildren.has(namespacePath)
  ) {
    return true;
  }

  if (isKnownTypeName(index, namespacePath, knownTypeNames)) {
    return true;
  }

  const prefix = `${namespacePath}::`;
  if (knownTypeNames) {
    for (const typeName of knownTypeNames) {
      if (typeName.startsWith(prefix)) {
        return true;
      }
    }
  }

  for (const analysis of allAnalyses) {
    if (analysis.typeDeclarations.some((declaration) => declaration.fullName.startsWith(prefix))) {
      return true;
    }
    if (analysis.globalDeclarations.some((declaration) => declaration.name.startsWith(prefix))) {
      return true;
    }
    for (const callableName of analysis.declaredCallableNames) {
      if (callableName.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}

function isInKnownTypeScopedQualifiedChain(
  document: TextDocument,
  occurrence: DocumentAnalysis["occurrences"][number],
  index: CompletionIndex,
  allAnalyses: DocumentAnalysis[],
  knownTypeNames?: Set<string>,
  lineTextCache?: Map<number, string>
): boolean {
  const lineText = getLineText(document, occurrence.range.start.line, lineTextCache);
  if (!lineText.includes("::")) {
    return false;
  }

  const occurrenceStart = occurrence.range.start.character;
  const occurrenceEnd = occurrence.range.end.character;
  const qualifiedPathPattern =
    /[A-Za-z_][A-Za-z0-9_]*(?:\s*::\s*[A-Za-z_][A-Za-z0-9_]*)+/g;

  let match: RegExpExecArray | null;
  while ((match = qualifiedPathPattern.exec(lineText)) !== null) {
    const matchStart = match.index ?? -1;
    if (matchStart < 0) {
      continue;
    }
    const rawPath = match[0];
    const matchEnd = matchStart + rawPath.length;
    if (occurrenceStart < matchStart || occurrenceEnd > matchEnd) {
      continue;
    }

    const segments: Array<{ name: string; start: number; end: number }> = [];
    const segmentPattern = /[A-Za-z_][A-Za-z0-9_]*/g;
    let segmentMatch: RegExpExecArray | null;
    while ((segmentMatch = segmentPattern.exec(rawPath)) !== null) {
      const localStart = segmentMatch.index ?? -1;
      if (localStart < 0) {
        continue;
      }
      const name = segmentMatch[0];
      segments.push({
        name,
        start: matchStart + localStart,
        end: matchStart + localStart + name.length
      });
    }
    if (segments.length < 2) {
      continue;
    }

    const segmentIndex = segments.findIndex(
      (segment) =>
        occurrenceStart >= segment.start &&
        occurrenceEnd <= segment.end &&
        occurrence.name === segment.name
    );
    if (segmentIndex <= 0) {
      continue;
    }

    for (let i = segmentIndex - 1; i >= 0; i -= 1) {
      const prefix = segments.slice(0, i + 1).map((segment) => segment.name).join("::");
      if (isKnownTypeName(index, prefix, knownTypeNames)) {
        return true;
      }
      if (
        allAnalyses.some((analysis) =>
          analysis.typeDeclarations.some(
            (declaration) => declaration.fullName === prefix
          )
        )
      ) {
        return true;
      }
    }
  }

  return false;
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

function isKnownTypeName(
  index: CompletionIndex,
  identifier: string,
  knownTypeNames?: Set<string>
): boolean {
  if (knownTypeNames?.has(identifier)) {
    return true;
  }

  if (isPrimitiveTypeName(identifier)) {
    return true;
  }

  if (index.typeInfoByFullName.has(identifier)) {
    return true;
  }

  return index.typeFullNamesByShortName.has(identifier);
}

function isDictionaryLikeType(typeFullName: string): boolean {
  const normalized = normalizeTypeText(typeFullName).toLowerCase();
  const short = (normalized.split("::").pop() ?? normalized).toLowerCase();
  return short === "dictionary";
}

function shouldSuppressKnownEngineMemberGap(
  receiverTypeFullName: string,
  memberName: string
): boolean {
  const typeName = receiverTypeFullName.toLowerCase();
  if (
    (typeName === "game::cgamectnapp" || typeName === "cgamectnapp") &&
    memberName === "Viewport"
  ) {
    return true;
  }
  if (
    (typeName === "trackmania::ctrackmania" || typeName === "ctrackmania") &&
    (memberName === "Network" || memberName === "Editor")
  ) {
    return true;
  }

  return false;
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

function isInsidePreprocessorDirectiveLine(
  document: TextDocument,
  range: Diagnostic["range"],
  lineTextCache?: Map<number, string>
): boolean {
  const lineText = getLineText(document, range.start.line, lineTextCache).trimStart();
  return lineText.startsWith("#");
}

function shouldSuppressPreprocessorDuplicateFunctionDiagnostic(
  document: TextDocument,
  diagnostic: Diagnostic,
  lineTextCache?: Map<number, string>
): boolean {
  if (diagnostic.code !== "binding-duplicate-declaration") {
    return false;
  }

  if (!/Duplicate function declaration/.test(diagnostic.message)) {
    return false;
  }

  const text = document.getText();
  if (!/#\s*if\b/.test(text) || !/#\s*else\b/.test(text)) {
    return false;
  }

  return !isInsidePreprocessorDirectiveLine(document, diagnostic.range, lineTextCache);
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
