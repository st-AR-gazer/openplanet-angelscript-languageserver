import {
  DocumentHighlight,
  DocumentHighlightKind,
  Location,
  Range,
  SignatureHelp,
  SignatureInformation,
  SymbolInformation,
  SymbolKind,
  TextEdit,
  WorkspaceEdit
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  DocumentAnalysis,
  FunctionDeclaration,
  IdentifierOccurrence,
  getOccurrenceAtOffset,
  resolveVisibleLocalDeclaration
} from "./analysis";
import { isIdentifier, isLanguageKeyword } from "./language";
import {
  findResolvedMember,
  tryResolveExpressionTypeFullName,
  tryResolveTypeFullNameFromTypeString
} from "./members";
import type { CompletionIndex, TypeResolutionContext } from "./types";

interface LocalSymbolTarget {
  kind: "local";
  analysis: DocumentAnalysis;
  functionIndex: number;
  declarationId: string;
  declarationRange: Range;
}

interface FunctionSymbolTarget {
  kind: "function";
  name: string;
  namespacePath?: string;
}

interface GlobalSymbolTarget {
  kind: "global";
  name: string;
  declarationUri: string;
  declarationRange: Range;
}

interface EnumLabelSymbolTarget {
  kind: "enum-label";
  name: string;
  enumFullName: string;
  namespacePath: string;
  declarationUri: string;
  declarationRange: Range;
  declarationStart: number;
}

type SymbolTarget =
  | LocalSymbolTarget
  | GlobalSymbolTarget
  | EnumLabelSymbolTarget
  | FunctionSymbolTarget;

interface SymbolOccurrenceWithUri {
  uri: string;
  analysis: DocumentAnalysis;
  occurrence: IdentifierOccurrence;
}

interface EnumLabelDeclarationRecord {
  analysis: DocumentAnalysis;
  name: string;
  start: number;
  end: number;
  range: Range;
  enumFullName: string;
  namespacePath: string;
}

export type WorkspaceFunctionDeclarationsByName = Map<
  string,
  Array<{ analysis: DocumentAnalysis; declaration: FunctionDeclaration }>
>;

export function getSymbolDefinitionAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  lineNumber: number,
  character: number,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Location | null {
  const offset = document.offsetAt({ line: lineNumber, character });
  const target = resolveSymbolTargetAtOffset(
    analysis,
    allAnalyses,
    offset,
    workspaceFunctionDeclarationsByName
  );
  if (!target) {
    return null;
  }

  if (target.kind === "local") {
    return Location.create(target.analysis.uri, target.declarationRange);
  }
  if (target.kind === "global") {
    return Location.create(target.declarationUri, target.declarationRange);
  }
  if (target.kind === "enum-label") {
    return Location.create(target.declarationUri, target.declarationRange);
  }

  const declarations = collectFunctionDeclarationsByName(
    allAnalyses,
    target.name,
    workspaceFunctionDeclarationsByName
  );
  const filteredDeclarations = filterFunctionDeclarationsForTarget(declarations, target);
  if (filteredDeclarations.length === 0) {
    return null;
  }

  const preferred =
    filteredDeclarations.find((declaration) => declaration.analysis.uri === document.uri) ??
    filteredDeclarations[0];

  return Location.create(preferred.analysis.uri, preferred.declaration.nameRange);
}

export function getDeclarationAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  lineNumber: number,
  character: number,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Location | null {
  return getSymbolDefinitionAtPosition(
    document,
    analysis,
    allAnalyses,
    lineNumber,
    character,
    workspaceFunctionDeclarationsByName
  );
}

export function getImplementationAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  lineNumber: number,
  character: number,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Location[] | null {
  const offset = document.offsetAt({ line: lineNumber, character });
  const target = resolveSymbolTargetAtOffset(
    analysis,
    allAnalyses,
    offset,
    workspaceFunctionDeclarationsByName
  );
  if (!target || target.kind !== "function") {
    return null;
  }

  const declarations = collectFunctionDeclarationsByName(
    allAnalyses,
    target.name,
    workspaceFunctionDeclarationsByName
  );
  const filteredDeclarations = filterFunctionDeclarationsForTarget(declarations, target);
  if (filteredDeclarations.length === 0) {
    return null;
  }

  const activeDeclaration = filteredDeclarations.find(
    (entry) =>
      entry.analysis.uri === document.uri &&
      offset >= entry.declaration.nameStart &&
      offset <= entry.declaration.nameEnd
  );

  const implementations = filteredDeclarations
    .filter((entry) => {
      if (!activeDeclaration) {
        return true;
      }

      return !(
        entry.analysis.uri === activeDeclaration.analysis.uri &&
        entry.declaration.nameStart === activeDeclaration.declaration.nameStart
      );
    })
    .map((entry) =>
      Location.create(entry.analysis.uri, entry.declaration.nameRange)
    );

  if (implementations.length > 0) {
    return implementations;
  }

  return filteredDeclarations.map((entry) =>
    Location.create(entry.analysis.uri, entry.declaration.nameRange)
  );
}

export function getReferencesAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  lineNumber: number,
  character: number,
  includeDeclaration: boolean,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Location[] {
  const offset = document.offsetAt({ line: lineNumber, character });
  const target = resolveSymbolTargetAtOffset(
    analysis,
    allAnalyses,
    offset,
    workspaceFunctionDeclarationsByName
  );
  if (!target) {
    return [];
  }

  const occurrences = collectSymbolOccurrences(target, allAnalyses);
  return occurrences
    .filter((entry) => includeDeclaration || !entry.occurrence.isDeclaration)
    .map((entry) => Location.create(entry.uri, entry.occurrence.range));
}

export function getDocumentHighlightsAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  lineNumber: number,
  character: number,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): DocumentHighlight[] {
  const offset = document.offsetAt({ line: lineNumber, character });
  const target = resolveSymbolTargetAtOffset(
    analysis,
    allAnalyses,
    offset,
    workspaceFunctionDeclarationsByName
  );
  if (!target) {
    return [];
  }

  return collectSymbolOccurrences(target, allAnalyses)
    .filter((entry) => entry.uri === document.uri)
    .map((entry) => ({
      range: entry.occurrence.range,
      kind: entry.occurrence.isDeclaration
        ? DocumentHighlightKind.Write
        : DocumentHighlightKind.Read
    }));
}

export function getPrepareRenameRangeAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  lineNumber: number,
  character: number,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Range | null {
  const offset = document.offsetAt({ line: lineNumber, character });
  const occurrence = getOccurrenceAtOffset(analysis, offset);
  if (!occurrence) {
    return null;
  }

  const target = resolveSymbolTargetAtOffset(
    analysis,
    allAnalyses,
    offset,
    workspaceFunctionDeclarationsByName
  );
  if (!target) {
    return null;
  }

  return occurrence.range;
}

export function getRenameWorkspaceEditAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  lineNumber: number,
  character: number,
  newName: string,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): WorkspaceEdit | null {
  if (!isIdentifier(newName) || isLanguageKeyword(newName)) {
    return null;
  }

  const offset = document.offsetAt({ line: lineNumber, character });
  const target = resolveSymbolTargetAtOffset(
    analysis,
    allAnalyses,
    offset,
    workspaceFunctionDeclarationsByName
  );
  if (!target) {
    return null;
  }

  const occurrences = collectSymbolOccurrences(target, allAnalyses);
  if (occurrences.length === 0) {
    return null;
  }

  const changes: Record<string, TextEdit[]> = {};

  for (const occurrence of occurrences) {
    const edits = changes[occurrence.uri] ?? [];
    edits.push(TextEdit.replace(occurrence.occurrence.range, newName));
    changes[occurrence.uri] = edits;
  }

  return { changes };
}

export function getWorkspaceSymbols(
  allAnalyses: DocumentAnalysis[],
  query: string
): SymbolInformation[] {
  const normalizedQuery = query.trim().toLowerCase();
  const symbols: SymbolInformation[] = [];
  const seen = new Set<string>();

  for (const analysis of allAnalyses) {
    for (const typeDeclaration of analysis.typeDeclarations) {
      if (
        normalizedQuery.length > 0 &&
        !typeDeclaration.fullName.toLowerCase().includes(normalizedQuery) &&
        !typeDeclaration.name.toLowerCase().includes(normalizedQuery)
      ) {
        continue;
      }

      const key = `${analysis.uri}:${typeDeclaration.start}:${typeDeclaration.kind}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      symbols.push(
        SymbolInformation.create(
          typeDeclaration.fullName,
          mapTypeDeclarationKindToSymbolKind(typeDeclaration.kind),
          typeDeclaration.range,
          analysis.uri
        )
      );
    }

    for (const declaration of analysis.functions) {
      if (
        normalizedQuery.length > 0 &&
        !declaration.name.toLowerCase().includes(normalizedQuery)
      ) {
        continue;
      }

      const key = `${analysis.uri}:${declaration.nameStart}:function`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      symbols.push(
        SymbolInformation.create(
          declaration.name,
          SymbolKind.Function,
          declaration.nameRange,
          analysis.uri
        )
      );
    }
  }

  symbols.sort((a, b) => {
    const leftName = a.name.toLowerCase();
    const rightName = b.name.toLowerCase();
    if (leftName !== rightName) {
      return leftName.localeCompare(rightName);
    }

    return a.location.uri.localeCompare(b.location.uri);
  });

  return symbols;
}

export function getTypeDefinitionAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  completionIndex: CompletionIndex,
  lineNumber: number,
  character: number,
  typeContext: TypeResolutionContext,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Location | null {
  const offset = document.offsetAt({ line: lineNumber, character });
  const occurrence =
    getOccurrenceAtOffset(analysis, offset) ??
    (offset > 0 ? getOccurrenceAtOffset(analysis, offset - 1) : undefined);
  if (!occurrence) {
    return null;
  }

  const typeFullName = resolveOccurrenceTypeFullName(
    document,
    analysis,
    allAnalyses,
    occurrence,
    completionIndex,
    typeContext,
    workspaceFunctionDeclarationsByName
  );
  if (!typeFullName) {
    return null;
  }

  const typeDeclaration = findTypeDeclarationByFullNameOrShortName(
    allAnalyses,
    typeFullName
  );
  if (!typeDeclaration) {
    return null;
  }

  return Location.create(typeDeclaration.analysis.uri, typeDeclaration.declaration.nameRange);
}

export function getSignatureHelpAtPosition(
  document: TextDocument,
  allAnalyses: DocumentAnalysis[],
  completionIndex: CompletionIndex,
  lineNumber: number,
  character: number,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): SignatureHelp | null {
  const offset = document.offsetAt({ line: lineNumber, character });
  const callContext = getCallContextAtOffset(document.getText(), offset);
  if (!callContext) {
    return null;
  }

  const labels = new Set<string>();
  if (!callContext.callableName.includes("::")) {
    for (const declaration of collectFunctionDeclarationsByName(
      allAnalyses,
      callContext.unqualifiedName,
      workspaceFunctionDeclarationsByName
    )) {
      labels.add(
        formatFunctionSignatureLabel(
          declaration.declaration.returnType,
          declaration.declaration.name,
          declaration.declaration.argsText
        )
      );
    }
  }

  const coreSignatures = callContext.callableName.includes("::")
    ? completionIndex.coreFunctionSignaturesByQualifiedName.get(
        callContext.callableName
      ) ??
      completionIndex.coreFunctionSignatures.get(callContext.unqualifiedName) ??
      []
    : completionIndex.coreFunctionSignatures.get(callContext.unqualifiedName) ?? [];

  for (const signature of coreSignatures) {
    labels.add(signature.trim());
  }

  if (labels.size === 0) {
    return null;
  }

  const requestedParameter = Math.max(0, callContext.activeParameter);
  const signatureEntries = [...labels].map((label) => {
    const parameterLabels = extractParameterLabels(label);
    return {
      label,
      parameterLabels,
      parameterRange: extractParameterCountRange(label),
      signature: SignatureInformation.create(label, ...parameterLabels)
    };
  });
  const activeSignature = selectBestActiveSignatureIndex(
    signatureEntries,
    requestedParameter
  );
  const selectedParameters = signatureEntries[activeSignature]?.parameterLabels ?? [];
  const activeParameter =
    selectedParameters.length > 0
      ? Math.min(requestedParameter, selectedParameters.length - 1)
      : 0;

  return {
    signatures: signatureEntries.map((entry) => entry.signature),
    activeSignature,
    activeParameter
  };
}

function resolveSymbolTargetAtOffset(
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  offset: number,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): SymbolTarget | undefined {
  const occurrence = getOccurrenceAtOffset(analysis, offset);
  if (!occurrence) {
    return undefined;
  }

  if (occurrence.qualifier === "dot") {
    return undefined;
  }

  if (occurrence.qualifier === "none" && occurrence.functionIndex !== undefined) {
    const declaration = resolveVisibleLocalDeclaration(
      analysis,
      occurrence.functionIndex,
      occurrence.name,
      occurrence.start
    );

    if (declaration) {
      return {
        kind: "local",
        analysis,
        functionIndex: occurrence.functionIndex,
        declarationId: declaration.id,
        declarationRange: declaration.range
      };
    }
  }

  if (!occurrence.isCall) {
    const globalDeclaration = resolveGlobalDeclarationAtOccurrence(
      analysis,
      allAnalyses,
      occurrence
    );
    if (globalDeclaration) {
      return {
        kind: "global",
        name: globalDeclaration.declaration.name,
        declarationUri: globalDeclaration.analysis.uri,
        declarationRange: globalDeclaration.declaration.range
      };
    }
  }

  if (!occurrence.isCall) {
    const enumLabelDeclaration = resolveEnumLabelDeclarationAtOccurrence(
      analysis,
      allAnalyses,
      occurrence
    );
    if (enumLabelDeclaration) {
      return {
        kind: "enum-label",
        name: enumLabelDeclaration.name,
        enumFullName: enumLabelDeclaration.enumFullName,
        namespacePath: enumLabelDeclaration.namespacePath,
        declarationUri: enumLabelDeclaration.analysis.uri,
        declarationRange: enumLabelDeclaration.range,
        declarationStart: enumLabelDeclaration.start
      };
    }
  }

  const functionTarget = resolveFunctionTargetAtOccurrence(
    analysis,
    allAnalyses,
    occurrence,
    workspaceFunctionDeclarationsByName
  );
  if (functionTarget) {
    return functionTarget;
  }

  return undefined;
}

function resolveFunctionTargetAtOccurrence(
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  occurrence: IdentifierOccurrence,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): FunctionSymbolTarget | undefined {
  if (occurrence.qualifier === "dot") {
    return undefined;
  }

  const declarations = collectFunctionDeclarationsByName(
    allAnalyses,
    occurrence.name,
    workspaceFunctionDeclarationsByName
  );
  if (declarations.length === 0) {
    return undefined;
  }

  if (occurrence.qualifier === "namespace") {
    const qualifiedName = getQualifiedGlobalNameForOccurrence(analysis, occurrence);
    if (!qualifiedName) {
      return undefined;
    }

    const matching = declarations.filter(
      (entry) => getQualifiedFunctionName(entry.declaration) === qualifiedName
    );
    if (matching.length === 0) {
      return undefined;
    }

    return {
      kind: "function",
      name: occurrence.name,
      namespacePath: getNamespacePathFromQualifiedName(qualifiedName)
    };
  }

  const declaration = findFunctionDeclarationAtOccurrence(analysis, occurrence);
  if (declaration) {
    return {
      kind: "function",
      name: declaration.name,
      namespacePath: declaration.namespacePath
    };
  }

  if (occurrence.qualifier !== "none") {
    return undefined;
  }

  const resolvedNamespacePath = resolveUnqualifiedFunctionNamespacePathForOccurrence(
    analysis,
    allAnalyses,
    occurrence,
    workspaceFunctionDeclarationsByName
  );

  return resolvedNamespacePath === undefined
    ? {
        kind: "function",
        name: occurrence.name
      }
    : {
        kind: "function",
        name: occurrence.name,
        namespacePath: resolvedNamespacePath
      };
}

function resolveGlobalDeclarationAtOccurrence(
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  occurrence: IdentifierOccurrence
):
  | {
      analysis: DocumentAnalysis;
      declaration: DocumentAnalysis["globalDeclarations"][number];
    }
  | undefined {
  const globalName =
    occurrence.qualifier === "namespace"
      ? getQualifiedGlobalNameForOccurrence(analysis, occurrence)
      : occurrence.qualifier === "none"
        ? occurrence.name
        : undefined;
  if (!globalName) {
    return undefined;
  }

  const declarations = collectGlobalDeclarationsByName(allAnalyses, globalName);
  if (declarations.length === 0) {
    return undefined;
  }

  const exact = declarations.find(
    (entry) =>
      entry.analysis.uri === analysis.uri &&
      entry.declaration.start === occurrence.start
  );
  if (exact) {
    return exact;
  }

  return declarations.find((entry) => entry.analysis.uri === analysis.uri) ?? declarations[0];
}

function resolveEnumLabelDeclarationAtOccurrence(
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  occurrence: IdentifierOccurrence
): EnumLabelDeclarationRecord | undefined {
  if (occurrence.qualifier === "dot" || occurrence.isCall) {
    return undefined;
  }
  if (occurrence.qualifier !== "none" && occurrence.qualifier !== "namespace") {
    return undefined;
  }
  if (
    occurrence.qualifier === "none" &&
    !isCaseLabelOccurrence(analysis, occurrence)
  ) {
    return undefined;
  }

  const qualifiedPath =
    occurrence.qualifier === "namespace"
      ? getQualifiedGlobalNameForOccurrence(analysis, occurrence)
      : undefined;
  const records = collectEnumLabelDeclarationRecords(allAnalyses).filter((record) => {
    if (record.name !== occurrence.name) {
      return false;
    }

    if (!qualifiedPath) {
      return true;
    }

    const enumScoped = `${record.enumFullName}::${record.name}`;
    const namespaceScoped = record.namespacePath
      ? `${record.namespacePath}::${record.name}`
      : record.name;
    return qualifiedPath === enumScoped || qualifiedPath === namespaceScoped;
  });

  if (records.length === 0) {
    return undefined;
  }

  return (
    records.find(
      (record) =>
        record.analysis.uri === analysis.uri &&
        record.start === occurrence.start
    ) ??
    records.find((record) => record.analysis.uri === analysis.uri) ??
    records[0]
  );
}

function collectEnumLabelDeclarationRecords(
  allAnalyses: DocumentAnalysis[]
): EnumLabelDeclarationRecord[] {
  const records: EnumLabelDeclarationRecord[] = [];

  for (const analysis of allAnalyses) {
    const visitDeclarations = (
      declarations: DocumentAnalysis["grammarProgram"]["declarations"],
      namespacePath: string
    ): void => {
      for (const declaration of declarations) {
        if (declaration.kind === "namespace") {
          const childNamespace = namespacePath
            ? `${namespacePath}::${declaration.name}`
            : declaration.name;
          visitDeclarations(declaration.body, childNamespace);
          continue;
        }

        if (declaration.kind === "type") {
          if (declaration.typeKind === "enum") {
            const enumFullName = namespacePath
              ? `${namespacePath}::${declaration.name}`
              : declaration.name;
            for (const child of declaration.body) {
              if (child.kind !== "statement") {
                continue;
              }

              const statementText = analysis.text.slice(child.start, child.end);
              const segments = splitTopLevelByCommaWithOffsets(
                statementText,
                child.start
              );
              for (const segment of segments) {
                const nameMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(segment.text);
                if (!nameMatch) {
                  continue;
                }

                const name = nameMatch[1];
                const relativeStart = segment.text.indexOf(name);
                if (relativeStart < 0) {
                  continue;
                }

                const start = segment.start + relativeStart;
                const end = start + name.length;
                records.push({
                  analysis,
                  name,
                  start,
                  end,
                  range: offsetRange(analysis, start, end),
                  enumFullName,
                  namespacePath
                });
              }
            }
          }

          visitDeclarations(declaration.body, namespacePath);
        }
      }
    };

    visitDeclarations(analysis.grammarProgram.declarations, "");
  }

  records.sort((a, b) => {
    if (a.analysis.uri === b.analysis.uri) {
      return a.start - b.start;
    }
    return a.analysis.uri.localeCompare(b.analysis.uri);
  });

  return records;
}

function collectGlobalDeclarationsByName(
  allAnalyses: DocumentAnalysis[],
  globalName: string
): Array<{ analysis: DocumentAnalysis; declaration: DocumentAnalysis["globalDeclarations"][number] }> {
  const declarations: Array<{
    analysis: DocumentAnalysis;
    declaration: DocumentAnalysis["globalDeclarations"][number];
  }> = [];

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.globalDeclarations) {
      if (declaration.name !== globalName) {
        continue;
      }
      declarations.push({ analysis, declaration });
    }
  }

  declarations.sort((a, b) => {
    if (a.analysis.uri === b.analysis.uri) {
      return a.declaration.start - b.declaration.start;
    }
    return a.analysis.uri.localeCompare(b.analysis.uri);
  });

  return declarations;
}

function getQualifiedGlobalNameForOccurrence(
  analysis: DocumentAnalysis,
  occurrence: IdentifierOccurrence
): string | undefined {
  if (occurrence.qualifier !== "namespace") {
    return undefined;
  }

  const lineText = getAnalysisLineText(analysis, occurrence.range.start.line);
  if (!lineText) {
    return undefined;
  }

  const prefix = lineText.slice(0, occurrence.range.start.character);
  const match =
    /([A-Za-z_][A-Za-z0-9_]*(?:\s*::\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*::\s*$/.exec(
      prefix
    );
  if (!match) {
    return undefined;
  }

  const leftPath = match[1].replace(/\s*::\s*/g, "::");
  return `${leftPath}::${occurrence.name}`;
}

function findFunctionDeclarationAtOccurrence(
  analysis: DocumentAnalysis,
  occurrence: IdentifierOccurrence
): FunctionDeclaration | undefined {
  return analysis.functions.find(
    (declaration) => declaration.nameStart === occurrence.start
  );
}

function getQualifiedFunctionName(declaration: FunctionDeclaration): string {
  return declaration.namespacePath
    ? `${declaration.namespacePath}::${declaration.name}`
    : declaration.name;
}

function getNamespacePathFromQualifiedName(qualifiedName: string): string {
  const separatorIndex = qualifiedName.lastIndexOf("::");
  return separatorIndex < 0 ? "" : qualifiedName.slice(0, separatorIndex);
}

function resolveOccurrenceNamespacePath(
  analysis: DocumentAnalysis,
  occurrence: IdentifierOccurrence
): string {
  if (occurrence.functionIndex !== undefined) {
    return analysis.functions[occurrence.functionIndex]?.namespacePath ?? "";
  }

  return findEnclosingNamespacePathAtOffset(
    analysis.grammarProgram.declarations,
    occurrence.start,
    ""
  );
}

function findEnclosingNamespacePathAtOffset(
  declarations: DocumentAnalysis["grammarProgram"]["declarations"],
  offset: number,
  namespacePath: string
): string {
  for (const declaration of declarations) {
    if (declaration.kind !== "namespace") {
      continue;
    }
    if (offset < declaration.start || offset > declaration.end) {
      continue;
    }

    const childNamespacePath = namespacePath
      ? `${namespacePath}::${declaration.name}`
      : declaration.name;
    return findEnclosingNamespacePathAtOffset(
      declaration.body,
      offset,
      childNamespacePath
    );
  }

  return namespacePath;
}

function collectUsingNamespacePathsBeforeOffset(
  maskedText: string,
  offset: number
): Set<string> {
  const visibleText = maskedText.slice(0, Math.max(0, offset));
  const namespaces = new Set<string>();
  const pattern =
    /\busing\s+namespace\s+([A-Za-z_][A-Za-z0-9_]*(?:\s*::\s*[A-Za-z_][A-Za-z0-9_]*)*)\s*;/g;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(visibleText)) !== null) {
    const namespacePath = match[1]
      .split("::")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
      .join("::");
    if (namespacePath.length > 0) {
      namespaces.add(namespacePath);
    }
  }

  return namespaces;
}

function resolveUnqualifiedFunctionNamespacePathForOccurrence(
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  occurrence: IdentifierOccurrence,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): string | undefined {
  if (occurrence.qualifier !== "none") {
    return undefined;
  }

  const declarations = collectFunctionDeclarationsByName(
    allAnalyses,
    occurrence.name,
    workspaceFunctionDeclarationsByName
  );
  if (declarations.length === 0) {
    return undefined;
  }

  const activeNamespacePath = resolveOccurrenceNamespacePath(analysis, occurrence);
  if (
    declarations.some(
      (entry) => entry.declaration.namespacePath === activeNamespacePath
    )
  ) {
    return activeNamespacePath;
  }

  if (declarations.some((entry) => entry.declaration.namespacePath === "")) {
    return "";
  }

  const usingNamespacePaths = collectUsingNamespacePathsBeforeOffset(
    analysis.maskedText,
    occurrence.start
  );
  const visibleNamespaces = [
    ...new Set(
      declarations
        .map((entry) => entry.declaration.namespacePath)
        .filter(
          (namespacePath) =>
            namespacePath.length > 0 && usingNamespacePaths.has(namespacePath)
        )
    )
  ];

  return visibleNamespaces.length === 1 ? visibleNamespaces[0] : undefined;
}

function collectSymbolOccurrences(
  target: SymbolTarget,
  allAnalyses: DocumentAnalysis[]
): SymbolOccurrenceWithUri[] {
  if (target.kind === "local") {
    const entries: SymbolOccurrenceWithUri[] = [];
    const analysis = target.analysis;

    for (const occurrence of analysis.occurrences) {
      if (occurrence.qualifier !== "none") {
        continue;
      }
      if (occurrence.functionIndex !== target.functionIndex) {
        continue;
      }
      if (occurrence.name !== getLocalDeclarationName(target, analysis)) {
        continue;
      }

      const declaration = resolveVisibleLocalDeclaration(
        analysis,
        target.functionIndex,
        occurrence.name,
        occurrence.start
      );
      if (!declaration || declaration.id !== target.declarationId) {
        continue;
      }

      entries.push({
        uri: analysis.uri,
        analysis,
        occurrence
      });
    }

    return dedupeOccurrences(entries);
  }

  if (target.kind === "global") {
    const entries: SymbolOccurrenceWithUri[] = [];
    const isQualifiedGlobal = target.name.includes("::");
    const unqualifiedName = target.name.split("::").pop() ?? target.name;

    for (const analysis of allAnalyses) {
      const globalDeclarationByStart = new Map<number, string>(
        analysis.globalDeclarations.map((declaration) => [
          declaration.start,
          declaration.name
        ])
      );

      for (const occurrence of analysis.occurrences) {
        if (occurrence.name !== unqualifiedName) {
          continue;
        }

        if (isQualifiedGlobal) {
          const qualifiedName =
            occurrence.qualifier === "namespace"
              ? getQualifiedGlobalNameForOccurrence(analysis, occurrence)
              : globalDeclarationByStart.get(occurrence.start);
          if (qualifiedName !== target.name) {
            continue;
          }
        } else {
          if (occurrence.qualifier !== "none") {
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

          if (occurrence.isCall || analysis.functionNameDeclarationOffsets.has(occurrence.start)) {
            continue;
          }

          const declaredGlobalName = globalDeclarationByStart.get(occurrence.start);
          if (occurrence.isDeclaration && declaredGlobalName !== target.name) {
            continue;
          }
        }

        entries.push({
          uri: analysis.uri,
          analysis,
          occurrence
        });
      }
    }

    return dedupeOccurrences(entries);
  }

  if (target.kind === "enum-label") {
    const entries: SymbolOccurrenceWithUri[] = [];
    const expectedScopedName = `${target.enumFullName}::${target.name}`;
    const expectedNamespaceName = target.namespacePath
      ? `${target.namespacePath}::${target.name}`
      : target.name;

    for (const analysis of allAnalyses) {
      for (const occurrence of analysis.occurrences) {
        if (
          occurrence.name !== target.name ||
          occurrence.isCall ||
          occurrence.qualifier === "dot"
        ) {
          continue;
        }

        if (occurrence.qualifier === "namespace") {
          const qualified = getQualifiedGlobalNameForOccurrence(analysis, occurrence);
          if (
            qualified !== expectedScopedName &&
            qualified !== expectedNamespaceName
          ) {
            continue;
          }
        } else {
          const isDeclarationMatch =
            occurrence.isDeclaration &&
            analysis.uri === target.declarationUri &&
            occurrence.start === target.declarationStart;
          if (!isDeclarationMatch && !isCaseLabelOccurrence(analysis, occurrence)) {
            continue;
          }
        }

        entries.push({
          uri: analysis.uri,
          analysis,
          occurrence
        });
      }
    }

    return dedupeOccurrences(entries);
  }

  const entries: SymbolOccurrenceWithUri[] = [];
  const declarations = collectFunctionDeclarationsByName(allAnalyses, target.name);
  const filteredDeclarations = filterFunctionDeclarationsForTarget(declarations, target);
  const qualifiedDeclarationNames = new Set(
    filteredDeclarations.map((entry) => getQualifiedFunctionName(entry.declaration))
  );

  for (const analysis of allAnalyses) {
    for (const occurrence of analysis.occurrences) {
      if (occurrence.name !== target.name) {
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

      if (!occurrence.isCall && !analysis.functionNameDeclarationOffsets.has(occurrence.start)) {
        continue;
      }

      if (
        target.namespacePath !== undefined &&
        !doesFunctionOccurrenceMatchTarget(
          analysis,
          allAnalyses,
          occurrence,
          target,
          qualifiedDeclarationNames
        )
      ) {
        continue;
      }

      if (target.namespacePath === undefined && occurrence.qualifier !== "none") {
        continue;
      }

      entries.push({
        uri: analysis.uri,
        analysis,
        occurrence
      });
    }
  }

  return dedupeOccurrences(entries);
}

function doesFunctionOccurrenceMatchTarget(
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  occurrence: IdentifierOccurrence,
  target: FunctionSymbolTarget,
  qualifiedDeclarationNames: ReadonlySet<string>
): boolean {
  if (occurrence.qualifier === "namespace") {
    const qualifiedName = getQualifiedGlobalNameForOccurrence(analysis, occurrence);
    return !!qualifiedName && qualifiedDeclarationNames.has(qualifiedName);
  }

  const declaration = findFunctionDeclarationAtOccurrence(analysis, occurrence);
  if (declaration) {
    return qualifiedDeclarationNames.has(getQualifiedFunctionName(declaration));
  }

  if (occurrence.qualifier !== "none") {
    return false;
  }

  const resolvedNamespacePath = resolveUnqualifiedFunctionNamespacePathForOccurrence(
    analysis,
    allAnalyses,
    occurrence
  );
  if (resolvedNamespacePath === undefined) {
    return false;
  }

  const qualifiedName = resolvedNamespacePath
    ? `${resolvedNamespacePath}::${target.name}`
    : target.name;
  return qualifiedDeclarationNames.has(qualifiedName);
}

function filterFunctionDeclarationsForTarget(
  declarations: Array<{ analysis: DocumentAnalysis; declaration: FunctionDeclaration }>,
  target: FunctionSymbolTarget
): Array<{ analysis: DocumentAnalysis; declaration: FunctionDeclaration }> {
  if (target.namespacePath === undefined) {
    return declarations;
  }

  return declarations.filter(
    (entry) => entry.declaration.namespacePath === target.namespacePath
  );
}

function getLocalDeclarationName(
  target: LocalSymbolTarget,
  analysis: DocumentAnalysis
): string {
  const fn = analysis.functions[target.functionIndex];
  if (!fn) {
    return "";
  }

  for (const declaration of [...fn.parameters, ...fn.localDeclarations]) {
    if (declaration.id === target.declarationId) {
      return declaration.name;
    }
  }

  return "";
}

function collectFunctionDeclarationsByName(
  allAnalyses: DocumentAnalysis[],
  functionName: string,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Array<{ analysis: DocumentAnalysis; declaration: FunctionDeclaration }> {
  if (workspaceFunctionDeclarationsByName) {
    return workspaceFunctionDeclarationsByName.get(functionName) ?? [];
  }

  const declarations: Array<{
    analysis: DocumentAnalysis;
    declaration: FunctionDeclaration;
  }> = [];

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.functions) {
      if (declaration.name === functionName) {
        declarations.push({ analysis, declaration });
      }
    }
  }

  declarations.sort((a, b) => {
    if (a.analysis.uri === b.analysis.uri) {
      return a.declaration.start - b.declaration.start;
    }
    return a.analysis.uri.localeCompare(b.analysis.uri);
  });

  return declarations;
}

function mapTypeDeclarationKindToSymbolKind(kind: "class" | "interface" | "enum"): SymbolKind {
  switch (kind) {
    case "class":
      return SymbolKind.Class;
    case "interface":
      return SymbolKind.Interface;
    case "enum":
      return SymbolKind.Enum;
  }
}

function resolveOccurrenceTypeFullName(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  occurrence: IdentifierOccurrence,
  completionIndex: CompletionIndex,
  typeContext: TypeResolutionContext,
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): string | undefined {
  if (occurrence.qualifier === "dot") {
    const receiverText = extractReceiverExpressionForOffset(
      document,
      occurrence.start
    );
    if (!receiverText) {
      return undefined;
    }

    const receiverTypeFullName = tryResolveExpressionTypeFullName(
      completionIndex,
      receiverText,
      typeContext
    );
    if (!receiverTypeFullName) {
      return undefined;
    }

    const member = findResolvedMember(
      completionIndex,
      receiverTypeFullName,
      occurrence.name
    );
    if (!member) {
      return undefined;
    }

    const rawType = occurrence.isCall
      ? member.returnType
      : member.kind === "property"
        ? member.type
        : undefined;
    if (!rawType) {
      return undefined;
    }

    const preferredNamespace =
      completionIndex.typeInfoByFullName.get(receiverTypeFullName)?.namespace;
    return tryResolveTypeFullNameFromTypeString(
      completionIndex,
      rawType,
      preferredNamespace
    ) ?? normalizeTypeLookupName(rawType);
  }

  if (occurrence.qualifier !== "none" && occurrence.qualifier !== "namespace") {
    return undefined;
  }

  if (occurrence.functionIndex !== undefined) {
    const localDeclaration = resolveVisibleLocalDeclaration(
      analysis,
      occurrence.functionIndex,
      occurrence.name,
      occurrence.start
    );
    if (localDeclaration) {
      return tryResolveTypeFullNameFromTypeString(
        completionIndex,
        localDeclaration.type
      ) ?? normalizeTypeLookupName(localDeclaration.type);
    }
  }

  if (occurrence.isCall) {
    for (const declaration of collectFunctionDeclarationsByName(
      allAnalyses,
      occurrence.name,
      workspaceFunctionDeclarationsByName
    )) {
      const resolved = tryResolveTypeFullNameFromTypeString(
        completionIndex,
        declaration.declaration.returnType
      );
      if (resolved) {
        return resolved;
      }
    }

    const returnType = completionIndex.coreFunctionReturnTypes.get(occurrence.name);
    if (returnType) {
      return (
        tryResolveTypeFullNameFromTypeString(completionIndex, returnType) ??
        normalizeTypeLookupName(returnType)
      );
    }
  }

  return (
    tryResolveTypeFullNameFromTypeString(completionIndex, occurrence.name) ??
    normalizeTypeLookupName(occurrence.name)
  );
}

function extractReceiverExpressionForOffset(
  document: TextDocument,
  identifierStartOffset: number
): string | undefined {
  const position = document.positionAt(identifierStartOffset);
  const lineStartOffset = document.offsetAt({ line: position.line, character: 0 });
  const linePrefix = document.getText({
    start: { line: position.line, character: 0 },
    end: position
  });
  const dotIndex = linePrefix.lastIndexOf(".");
  if (dotIndex < 0) {
    return undefined;
  }

  const receiver = linePrefix.slice(0, dotIndex).trim();
  if (!receiver) {
    return undefined;
  }

  if (document.offsetAt(position) < lineStartOffset + dotIndex) {
    return undefined;
  }

  return receiver;
}

function findTypeDeclarationByFullNameOrShortName(
  allAnalyses: DocumentAnalysis[],
  typeFullName: string
): { analysis: DocumentAnalysis; declaration: DocumentAnalysis["typeDeclarations"][number] } | undefined {
  const normalizedTypeFullName = normalizeTypeLookupName(typeFullName);
  const shortName = normalizedTypeFullName.split("::").pop() ?? normalizedTypeFullName;

  let byShortName: {
    analysis: DocumentAnalysis;
    declaration: DocumentAnalysis["typeDeclarations"][number];
  } | undefined;

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.typeDeclarations) {
      if (declaration.fullName === normalizedTypeFullName) {
        return { analysis, declaration };
      }

      if (!byShortName && declaration.name === shortName) {
        byShortName = { analysis, declaration };
      }
    }
  }

  return byShortName;
}

function offsetRange(
  analysis: DocumentAnalysis,
  startOffset: number,
  endOffset: number
): Range {
  return {
    start: offsetPosition(analysis.text, startOffset),
    end: offsetPosition(analysis.text, endOffset)
  };
}

function offsetPosition(
  text: string,
  offset: number
): { line: number; character: number } {
  const boundedOffset = Math.max(0, Math.min(offset, text.length));
  let line = 0;
  let character = 0;

  for (let i = 0; i < boundedOffset; i += 1) {
    const ch = text[i];
    if (ch === "\n") {
      line += 1;
      character = 0;
      continue;
    }

    if (ch !== "\r") {
      character += 1;
    }
  }

  return { line, character };
}

function isCaseLabelOccurrence(
  analysis: DocumentAnalysis,
  occurrence: IdentifierOccurrence
): boolean {
  if (occurrence.qualifier !== "none" || occurrence.isCall) {
    return false;
  }

  const lineText = getAnalysisLineText(analysis, occurrence.range.start.line);
  if (!lineText) {
    return false;
  }

  const prefix = lineText.slice(0, occurrence.range.start.character);
  const suffix = lineText.slice(occurrence.range.end.character);
  return /\bcase\s+$/.test(prefix) && /^\s*:/.test(suffix);
}

function normalizeTypeLookupName(typeText: string): string {
  let normalized = typeText.trim();
  if (!normalized) {
    return normalized;
  }

  const genericIndex = normalized.indexOf("<");
  if (genericIndex >= 0) {
    normalized = normalized.slice(0, genericIndex).trim();
  }

  normalized = normalized.replace(/[@&]+$/g, "").trim();
  return normalized;
}

function getAnalysisLineText(
  analysis: DocumentAnalysis,
  lineNumber: number
): string {
  const lines = analysis.text.replace(/\r/g, "").split("\n");
  return lines[lineNumber] ?? "";
}

function dedupeOccurrences(
  occurrences: SymbolOccurrenceWithUri[]
): SymbolOccurrenceWithUri[] {
  const deduped: SymbolOccurrenceWithUri[] = [];
  const seen = new Set<string>();

  for (const occurrence of occurrences) {
    const key = `${occurrence.uri}:${occurrence.occurrence.start}:${occurrence.occurrence.end}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(occurrence);
  }

  return deduped;
}

function formatFunctionSignatureLabel(
  returnType: string,
  functionName: string,
  argsText: string
): string {
  const normalizedArgs = argsText.trim();
  return `${returnType} ${functionName}(${normalizedArgs})`.trim();
}

function extractParameterLabels(label: string): string[] {
  const openParen = label.indexOf("(");
  const closeParen = label.lastIndexOf(")");
  if (openParen < 0 || closeParen <= openParen) {
    return [];
  }

  const argsText = label.slice(openParen + 1, closeParen).trim();
  if (!argsText || argsText === "void") {
    return [];
  }

  return splitTopLevelByComma(argsText);
}

function extractParameterCountRange(
  label: string
): { min: number; max: number } | undefined {
  const openParen = label.indexOf("(");
  const closeParen = label.lastIndexOf(")");
  if (openParen < 0 || closeParen <= openParen) {
    return undefined;
  }

  const argsText = label.slice(openParen + 1, closeParen).trim();
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

  return { min: required, max: args.length };
}

function selectBestActiveSignatureIndex(
  signatures: Array<{
    parameterRange: { min: number; max: number } | undefined;
    parameterLabels: string[];
  }>,
  requestedParameter: number
): number {
  if (signatures.length === 0) {
    return 0;
  }

  const requestedArgCount = requestedParameter + 1;
  let bestIndex = 0;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let i = 0; i < signatures.length; i += 1) {
    const entry = signatures[i];
    const range = entry.parameterRange ?? {
      min: entry.parameterLabels.length,
      max: entry.parameterLabels.length
    };

    let score = 0;
    if (requestedArgCount < range.min) {
      score += (range.min - requestedArgCount) * 100;
    } else if (requestedArgCount > range.max) {
      score += (requestedArgCount - range.max) * 1000;
    }

    score += Math.max(0, range.max - requestedArgCount);

    if (score < bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
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

function splitTopLevelByCommaWithOffsets(
  text: string,
  startOffset: number
): Array<{ text: string; start: number }> {
  const segments: Array<{ text: string; start: number }> = [];
  let segmentStart = 0;
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
      segments.push({
        text: text.slice(segmentStart, i),
        start: startOffset + segmentStart
      });
      segmentStart = i + 1;
    }
  }

  segments.push({
    text: text.slice(segmentStart),
    start: startOffset + segmentStart
  });
  return segments;
}

function getCallContextAtOffset(
  text: string,
  offset: number
): {
  callableName: string;
  unqualifiedName: string;
  activeParameter: number;
} | undefined {
  let depth = 0;

  for (let i = Math.min(offset - 1, text.length - 1); i >= 0; i -= 1) {
    const ch = text[i];
    if (ch === ")") {
      depth += 1;
      continue;
    }
    if (ch === "(") {
      if (depth > 0) {
        depth -= 1;
        continue;
      }

      const callableName = readCallableNameBefore(text, i);
      if (!callableName) {
        return undefined;
      }
      const unqualifiedName = getUnqualifiedCallableName(callableName);
      if (!unqualifiedName) {
        return undefined;
      }

      const activeParameter = countTopLevelCommas(text, i + 1, offset);
      return { callableName, unqualifiedName, activeParameter };
    }
  }

  return undefined;
}

function readCallableNameBefore(text: string, offset: number): string | undefined {
  let end = offset - 1;
  while (end >= 0 && /\s/.test(text[end])) {
    end -= 1;
  }
  if (end < 0) {
    return undefined;
  }

  let start = end;
  while (start >= 0 && /[A-Za-z0-9_:]/.test(text[start])) {
    start -= 1;
  }

  const callableName = text.slice(start + 1, end + 1);
  if (!isQualifiedCallableName(callableName)) {
    return undefined;
  }

  return callableName;
}

function isQualifiedCallableName(value: string): boolean {
  return /^([A-Za-z_][A-Za-z0-9_]*)(::[A-Za-z_][A-Za-z0-9_]*)*$/.test(value);
}

function getUnqualifiedCallableName(callableName: string): string | undefined {
  const parts = callableName.split("::");
  const identifier = parts[parts.length - 1];
  return isIdentifier(identifier) ? identifier : undefined;
}

function countTopLevelCommas(text: string, start: number, end: number): number {
  let commas = 0;
  let depth = 0;

  for (let i = start; i < end && i < text.length; i += 1) {
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
      commas += 1;
    }
  }

  return commas;
}
