import {
  Diagnostic,
  DiagnosticSeverity,
  Range
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { DocumentAnalysis } from "./analysis";
import type { GrammarDeclarationNode, GrammarProgramNode } from "./grammarPipeline";
import type { CompletionIndex } from "./types";
import { LANGUAGE_SERVER_DIAGNOSTIC_SOURCE } from "./includes";

export interface BoundSymbol {
  kind: "namespace" | "using" | "type" | "function" | "import" | "funcdef" | "variable";
  name: string;
  fullName: string;
  scopePath: string;
  range: Range;
}

export interface LateBoundReference {
  name: string;
  qualifier: "none" | "dot" | "namespace";
  range: Range;
  isCall: boolean;
}

export interface BinderResult {
  symbolsByFullName: Map<string, BoundSymbol[]>;
  namespacePaths: Set<string>;
  diagnostics: Diagnostic[];
  lateReferences: LateBoundReference[];
}

interface BinderContext {
  symbolsByFullName: Map<string, BoundSymbol[]>;
  namespacePaths: Set<string>;
  diagnostics: Diagnostic[];
  seenByScopeAndKind: Map<string, BoundSymbol>;
}

export function runBinderPhase(
  document: TextDocument,
  analysis: DocumentAnalysis,
  index: CompletionIndex
): BinderResult {
  const context: BinderContext = {
    symbolsByFullName: new Map(),
    namespacePaths: new Set<string>(),
    diagnostics: [],
    seenByScopeAndKind: new Map()
  };

  bindProgramDeclarations(document, analysis.grammarProgram, context, "");
  bindAnalysisSymbols(document, analysis, context);
  bindSemanticBindingIssues(analysis, context);
  bindUsingNamespaceAvailabilityChecks(document, analysis, index, context);

  const lateReferences: LateBoundReference[] = analysis.occurrences
    .filter((occurrence) => !occurrence.isDeclaration)
    .map((occurrence) => ({
      name: occurrence.name,
      qualifier: occurrence.qualifier,
      range: occurrence.range,
      isCall: occurrence.isCall
    }));

  return {
    symbolsByFullName: context.symbolsByFullName,
    namespacePaths: context.namespacePaths,
    diagnostics: context.diagnostics,
    lateReferences
  };
}

function bindProgramDeclarations(
  document: TextDocument,
  program: GrammarProgramNode,
  context: BinderContext,
  namespacePath: string
): void {
  for (const declaration of program.declarations) {
    bindDeclarationNode(document, declaration, context, namespacePath);
  }
}

function bindDeclarationNode(
  document: TextDocument,
  declaration: GrammarDeclarationNode,
  context: BinderContext,
  namespacePath: string
): void {
  if (declaration.kind === "namespace") {
    const fullNamespace = namespacePath
      ? `${namespacePath}::${declaration.name}`
      : declaration.name;
    const symbol: BoundSymbol = {
      kind: "namespace",
      name: declaration.name,
      fullName: fullNamespace,
      scopePath: namespacePath,
      range: offsetToRange(document, declaration.nameStart, declaration.nameEnd)
    };
    registerSymbol(symbol, context);
    context.namespacePaths.add(fullNamespace);

    for (const child of declaration.body) {
      bindDeclarationNode(document, child, context, fullNamespace);
    }
    return;
  }

  if (declaration.kind === "using") {
    const symbol: BoundSymbol = {
      kind: "using",
      name: declaration.namespacePath,
      fullName: declaration.namespacePath,
      scopePath: namespacePath,
      range: offsetToRange(document, declaration.namespaceStart, declaration.namespaceEnd)
    };
    registerSymbol(symbol, context);
    return;
  }

  if (declaration.kind === "type") {
    const fullTypeName = namespacePath
      ? `${namespacePath}::${declaration.name}`
      : declaration.name;
    const symbol: BoundSymbol = {
      kind: "type",
      name: declaration.name,
      fullName: fullTypeName,
      scopePath: namespacePath,
      range: offsetToRange(document, declaration.nameStart, declaration.nameEnd)
    };
    registerSymbol(symbol, context);
    return;
  }

  if (declaration.kind === "function") {
    const fullFunctionName = namespacePath
      ? `${namespacePath}::${declaration.name}`
      : declaration.name;
    const symbol: BoundSymbol = {
      kind: "function",
      name: declaration.name,
      fullName: fullFunctionName,
      scopePath: namespacePath,
      range: offsetToRange(document, declaration.nameStart, declaration.nameEnd)
    };
    registerSymbol(symbol, context);
    return;
  }

  if (declaration.kind === "callable-declaration") {
    const fullCallableName = namespacePath
      ? `${namespacePath}::${declaration.name}`
      : declaration.name;
    const symbol: BoundSymbol = {
      kind: declaration.declarationKind,
      name: declaration.name,
      fullName: fullCallableName,
      scopePath: namespacePath,
      range: offsetToRange(document, declaration.nameStart, declaration.nameEnd)
    };
    registerSymbol(symbol, context);
  }
}

function bindAnalysisSymbols(
  _document: TextDocument,
  analysis: DocumentAnalysis,
  context: BinderContext
): void {
  for (const typeDeclaration of analysis.typeDeclarations) {
    if (hasSymbolOfKind(context, typeDeclaration.fullName, "type")) {
      continue;
    }
    const symbol: BoundSymbol = {
      kind: "type",
      name: typeDeclaration.name,
      fullName: typeDeclaration.fullName,
      scopePath: extractScope(typeDeclaration.fullName),
      range: typeDeclaration.nameRange
    };
    registerSymbol(symbol, context);
  }

  for (const fn of analysis.functions) {
    if (hasSymbolOfKind(context, fn.name, "function")) {
      continue;
    }
    const symbol: BoundSymbol = {
      kind: "function",
      name: fn.name,
      fullName: fn.name,
      scopePath: "",
      range: fn.nameRange
    };
    registerSymbol(symbol, context);
  }

  for (const fn of analysis.functions) {
    const scopePath = `function:${fn.name}@${fn.start}`;
    for (const parameter of fn.parameters) {
      const declarationScopePath = `${scopePath}:${parameter.scopeStart}-${parameter.scopeEnd}`;
      const symbol: BoundSymbol = {
        kind: "variable",
        name: parameter.name,
        fullName: `${declarationScopePath}::${parameter.name}`,
        scopePath: declarationScopePath,
        range: parameter.range
      };
      registerSymbol(symbol, context);
    }
    for (const declaration of fn.localDeclarations) {
      const declarationScopePath = `${scopePath}:${declaration.scopeStart}-${declaration.scopeEnd}`;
      const symbol: BoundSymbol = {
        kind: "variable",
        name: declaration.name,
        fullName: `${declarationScopePath}::${declaration.name}`,
        scopePath: declarationScopePath,
        range: declaration.range
      };
      registerSymbol(symbol, context);
    }
  }
}

function bindSemanticBindingIssues(
  analysis: DocumentAnalysis,
  context: BinderContext
): void {
  for (const issue of analysis.semanticBindingIssues) {
    context.diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: issue.range,
      message: issue.message,
      source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
      code: issue.code
    });
  }
}

function bindUsingNamespaceAvailabilityChecks(
  document: TextDocument,
  analysis: DocumentAnalysis,
  index: CompletionIndex,
  context: BinderContext
): void {
  for (const declaration of analysis.grammarProgram.declarations) {
    collectUsingNamespaceAvailabilityDiagnostics(document, declaration, index, context);
  }
}

function collectUsingNamespaceAvailabilityDiagnostics(
  document: TextDocument,
  declaration: GrammarDeclarationNode,
  index: CompletionIndex,
  context: BinderContext
): void {
  if (declaration.kind === "using") {
    const namespacePath = declaration.namespacePath.trim();
    if (!namespacePath) {
      return;
    }
    const knownInBinder = context.namespacePaths.has(namespacePath);
    const knownInIndex =
      index.namespaceBuckets.has(namespacePath) || index.namespaceChildren.has(namespacePath);
    if (!knownInBinder && !knownInIndex) {
      context.diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: offsetToRange(document, declaration.namespaceStart, declaration.namespaceEnd),
        message: `Unknown namespace "${namespacePath}" in using directive.`,
        source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
        code: "using-namespace-unknown"
      });
    }
    return;
  }

  if (declaration.kind === "namespace") {
    for (const child of declaration.body) {
      collectUsingNamespaceAvailabilityDiagnostics(document, child, index, context);
    }
    return;
  }

  if (declaration.kind === "type") {
    for (const child of declaration.body) {
      collectUsingNamespaceAvailabilityDiagnostics(document, child, index, context);
    }
  }
}

function registerSymbol(symbol: BoundSymbol, context: BinderContext): void {
  const existing = context.symbolsByFullName.get(symbol.fullName) ?? [];
  if (
    existing.some((entry) => rangesAreEquivalent(entry.range, symbol.range) && entry.kind === symbol.kind)
  ) {
    return;
  }
  existing.push(symbol);
  context.symbolsByFullName.set(symbol.fullName, existing);

  if (
    symbol.kind === "namespace" ||
    symbol.kind === "function" ||
    symbol.kind === "import" ||
    symbol.kind === "funcdef"
  ) {
    return;
  }

  const scopeKey = `${symbol.scopePath}|${symbol.kind}|${symbol.name}`;
  const previous = context.seenByScopeAndKind.get(scopeKey);
  if (!previous) {
    context.seenByScopeAndKind.set(scopeKey, symbol);
    return;
  }

  if (rangesAreEquivalent(previous.range, symbol.range)) {
    return;
  }

  context.diagnostics.push({
    severity: DiagnosticSeverity.Error,
    range: symbol.range,
    message: `Duplicate ${symbol.kind} declaration "${symbol.name}".`,
    source: LANGUAGE_SERVER_DIAGNOSTIC_SOURCE,
    code: "binding-duplicate-declaration"
  });
}

function offsetToRange(document: TextDocument, start: number, end: number): Range {
  const safeStart = Math.max(0, start);
  const safeEnd = Math.max(safeStart, end);
  return Range.create(document.positionAt(safeStart), document.positionAt(safeEnd));
}

function extractScope(fullName: string): string {
  const split = fullName.lastIndexOf("::");
  if (split < 0) {
    return "";
  }
  return fullName.slice(0, split);
}

function rangesAreEquivalent(left: Range, right: Range): boolean {
  return (
    left.start.line === right.start.line &&
    left.start.character === right.start.character &&
    left.end.line === right.end.line &&
    left.end.character === right.end.character
  );
}

function hasSymbolOfKind(
  context: BinderContext,
  fullName: string,
  kind: BoundSymbol["kind"]
): boolean {
  const entries = context.symbolsByFullName.get(fullName);
  if (!entries || entries.length === 0) {
    return false;
  }
  return entries.some((entry) => entry.kind === kind);
}
