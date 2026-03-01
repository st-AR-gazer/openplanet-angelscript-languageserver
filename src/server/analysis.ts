import {
  DocumentSymbol,
  Range,
  SymbolKind
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  isLanguageKeyword,
  normalizeTypeText
} from "./language";
import {
  parseDocumentStructure,
  type ParsedCallableDeclarationNode,
  type ParsedFunctionNode,
  type ParsedTypeNode,
  type ParserToken
} from "./parser";
import {
  parseGrammarPipeline,
  type GrammarDeclarationNode,
  type GrammarFunctionDeclarationNode,
  type GrammarParseError,
  type GrammarProgramNode,
  type GrammarStatementNode,
  type GrammarTypeDeclarationNode
} from "./grammarPipeline";
import {
  inferExpressionTypeFromText,
  type ExpressionFunctionSources
} from "./compilerPipeline";
import type { CompletionIndex, TypeResolutionContext } from "./types";

export interface VariableDeclaration {
  id: string;
  name: string;
  type: string;
  start: number;
  end: number;
  range: Range;
  scopeStart: number;
  scopeEnd: number;
  isParameter: boolean;
}

export interface FunctionDeclaration {
  id: string;
  name: string;
  namespacePath: string;
  hasDeclarationAttributes: boolean;
  returnType: string;
  argsText: string;
  start: number;
  end: number;
  range: Range;
  nameStart: number;
  nameEnd: number;
  nameRange: Range;
  bodyStart: number;
  bodyEnd: number;
  parameters: VariableDeclaration[];
  localDeclarations: VariableDeclaration[];
}

export type IdentifierQualifier = "none" | "dot" | "namespace";

export interface IdentifierOccurrence {
  name: string;
  start: number;
  end: number;
  range: Range;
  qualifier: IdentifierQualifier;
  isCall: boolean;
  isDeclaration: boolean;
  functionIndex: number | undefined;
}

export interface IncludeDirective {
  pathText: string;
  start: number;
  end: number;
  range: Range;
}

export interface ImportFunctionDeclaration {
  id: string;
  statementStart: number;
  statementEnd: number;
  statementRange: Range;
  moduleName: string;
  moduleStart: number;
  moduleEnd: number;
  moduleRange: Range;
  returnType: string;
  functionName: string;
  functionNameStart: number;
  functionNameEnd: number;
  functionNameRange: Range;
  argsStart: number;
  argsEnd: number;
  argsText: string;
}

export type TypeDeclarationKind = "class" | "interface" | "enum";

export interface TypeDeclaration {
  id: string;
  name: string;
  fullName: string;
  kind: TypeDeclarationKind;
  start: number;
  end: number;
  range: Range;
  nameRange: Range;
}

export interface IdentifierDeclaration {
  id: string;
  name: string;
  start: number;
  end: number;
  range: Range;
}

export interface DocumentAnalysis {
  uri: string;
  version: number;
  text: string;
  maskedText: string;
  grammarProgram: GrammarProgramNode;
  grammarErrors: GrammarParseError[];
  includes: IncludeDirective[];
  importFunctionDeclarations: ImportFunctionDeclaration[];
  typeDeclarations: TypeDeclaration[];
  identifierDeclarations: IdentifierDeclaration[];
  globalDeclarations: VariableDeclaration[];
  functions: FunctionDeclaration[];
  declaredCallableNames: Set<string>;
  functionNameDeclarationOffsets: Set<number>;
  occurrences: IdentifierOccurrence[];
  semanticBindingIssues: SemanticBindingIssue[];
  documentSymbols: DocumentSymbol[];
}

export interface SemanticBindingIssue {
  code: "binding-duplicate-declaration" | "binding-use-before-declaration";
  message: string;
  range: Range;
}

const localDeclarationPattern =
  /(?:^|[;{}()\n]\s*)(?:const\s+)?([A-Za-z_][A-Za-z0-9_:<>@&]*)\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?=[=;,\)])/gm;

const invalidLocalTypeKeywords = new Set<string>([
  "if",
  "for",
  "while",
  "switch",
  "case",
  "default",
  "return",
  "break",
  "continue",
  "else",
  "catch",
  "do",
  "try",
  "throw",
  "is",
  "isnot",
  "and",
  "or",
  "xor",
  "not"
]);

function hasOnlyDoubleColonSeparators(typeText: string): boolean {
  const compact = typeText.replace(/\s+/g, "");
  for (let i = 0; i < compact.length; i += 1) {
    if (compact[i] !== ":") {
      continue;
    }

    if (compact[i + 1] !== ":" || compact[i - 1] === ":") {
      return false;
    }

    i += 1;
  }

  return true;
}

function isPlausibleDeclarationTypeText(rawType: string): boolean {
  const normalizedType = normalizeTypeText(rawType).trim();
  if (!normalizedType) {
    return false;
  }
  if (!hasOnlyDoubleColonSeparators(normalizedType)) {
    return false;
  }
  if (invalidLocalTypeKeywords.has(normalizedType.toLowerCase())) {
    return false;
  }
  return true;
}

const emptyExpressionFunctionSources: ExpressionFunctionSources = {
  workspaceFunctionSignaturesByName: new Map(),
  coreFunctionSignaturesByName: new Map(),
  qualifiedFunctionSignaturesByName: new Map()
};

interface BlockRange {
  start: number;
  end: number;
}

interface GrammarFunctionWithNamespace {
  declaration: GrammarFunctionDeclarationNode;
  namespacePath: string;
}

interface CallableDeclaration {
  name: string;
  start: number;
  end: number;
  range: Range;
}

export function analyzeDocument(document: TextDocument): DocumentAnalysis {
  const text = document.getText();
  const maskedText = maskCommentsAndStrings(text);
  const grammar = parseGrammarPipeline(text);
  const grammarFunctions = collectGrammarFunctionDeclarations(grammar.program);
  const parsedStructure = parseDocumentStructure(maskedText);
  const tokens = parsedStructure.tokens;
  const includes = parseIncludeDirectives(text, document);
  const importFunctionDeclarations = parseImportFunctionDeclarations(
    text,
    parsedStructure.callableDeclarations,
    document
  );
  const typeDeclarations = parseTypeDeclarationsFromGrammarProgram(
    grammar.program,
    parsedStructure.typeDeclarations,
    document
  );
  const globalDeclarations = collectGlobalVariableDeclarationsFromGrammarProgram(
    grammar.program,
    document,
    text
  );
  const identifierDeclarations = collectIdentifierDeclarationsFromGrammarProgram(
    grammar.program,
    document,
    text
  );
  const functions = parseFunctions(
    maskedText,
    parsedStructure.functions,
    grammarFunctions,
    document
  );
  const callableDeclarations = parseCallableDeclarations(
    parsedStructure.callableDeclarations,
    document
  );
  const functionNameDeclarationOffsets = new Set<number>(
    functions.map((fn) => fn.nameStart)
  );
  const declarationOffsets = new Set<number>();
  const declaredCallableNames = new Set<string>();

  for (const fn of functions) {
    declarationOffsets.add(fn.nameStart);
    declaredCallableNames.add(fn.name);
    for (const parameter of fn.parameters) {
      declarationOffsets.add(parameter.start);
    }
    for (const localDeclaration of fn.localDeclarations) {
      declarationOffsets.add(localDeclaration.start);
    }
  }
  for (const typeDeclaration of typeDeclarations) {
    declarationOffsets.add(typeDeclaration.start);
  }
  for (const globalDeclaration of globalDeclarations) {
    declarationOffsets.add(globalDeclaration.start);
  }
  for (const declaration of identifierDeclarations) {
    declarationOffsets.add(declaration.start);
  }
  for (const callableDeclaration of callableDeclarations) {
    declarationOffsets.add(callableDeclaration.start);
    declaredCallableNames.add(callableDeclaration.name);
  }

  const occurrences = collectIdentifierOccurrences(
    tokens,
    functions,
    declarationOffsets,
    document
  );
  const semanticBindingIssues = collectSemanticBindingIssues(
    functions,
    occurrences
  );
  const documentSymbols = buildDocumentSymbols(functions);

  return {
    uri: document.uri,
    version: document.version,
    text,
    maskedText,
    grammarProgram: grammar.program,
    grammarErrors: grammar.errors,
    includes,
    importFunctionDeclarations,
    typeDeclarations,
    identifierDeclarations,
    globalDeclarations,
    functions,
    declaredCallableNames,
    functionNameDeclarationOffsets,
    occurrences,
    semanticBindingIssues,
    documentSymbols
  };
}

function parseIncludeDirectives(
  text: string,
  document: TextDocument
): IncludeDirective[] {
  const includes: IncludeDirective[] = [];
  const includePattern = /^\s*#\s*include\s+"([^"\r\n]+)"/gm;
  let match: RegExpExecArray | null;

  while ((match = includePattern.exec(text)) !== null) {
    const includePath = match[1];
    const fullMatch = match[0];
    const firstQuoteIndex = fullMatch.indexOf("\"");
    if (firstQuoteIndex < 0) {
      continue;
    }

    const start = match.index + firstQuoteIndex + 1;
    const end = start + includePath.length;
    includes.push({
      pathText: includePath,
      start,
      end,
      range: offsetsToRange(document, start, end)
    });
  }

  return includes;
}

function parseImportFunctionDeclarations(
  text: string,
  parsedCallables: ParsedCallableDeclarationNode[],
  document: TextDocument
): ImportFunctionDeclaration[] {
  const declarations: ImportFunctionDeclaration[] = [];
  const importModifierPattern =
    /^(?:const|shared|private|protected|final|override|external)\b/;
  for (const parsedCallable of parsedCallables) {
    if (parsedCallable.kind !== "import") {
      continue;
    }

    const functionName = parsedCallable.name;
    const functionNameStart = parsedCallable.start;
    const functionNameEnd = parsedCallable.end;

    const statementTail = text.slice(
      parsedCallable.closeParen + 1,
      parsedCallable.statementEnd
    );
    const fromMatch = /\bfrom\s*"([^"\r\n]+)"/.exec(statementTail);
    if (!fromMatch) {
      continue;
    }

    const moduleName = (fromMatch[1] ?? "").trim();
    if (!moduleName) {
      continue;
    }

    const firstQuoteIndex = fromMatch[0].indexOf("\"");
    if (firstQuoteIndex < 0) {
      continue;
    }

    const moduleStart =
      parsedCallable.closeParen + 1 + fromMatch.index + firstQuoteIndex + 1;
    const moduleEnd = moduleStart + moduleName.length;
    const argsText = text
      .slice(parsedCallable.openParen + 1, parsedCallable.closeParen)
      .trim();
    const rawPrefix = text.slice(
      parsedCallable.statementStart + "import".length,
      functionNameStart
    );
    let normalizedPrefix = rawPrefix.trim();
    while (importModifierPattern.test(normalizedPrefix)) {
      normalizedPrefix = normalizedPrefix
        .replace(importModifierPattern, "")
        .trimStart();
    }
    const returnType = normalizeTypeText(normalizedPrefix) || "void";

    declarations.push({
      id: `${document.uri}:import:${functionNameStart}`,
      statementStart: parsedCallable.statementStart,
      statementEnd: parsedCallable.statementEnd,
      statementRange: offsetsToRange(
        document,
        parsedCallable.statementStart,
        parsedCallable.statementEnd
      ),
      moduleName,
      moduleStart,
      moduleEnd,
      moduleRange: offsetsToRange(document, moduleStart, moduleEnd),
      returnType,
      functionName,
      functionNameStart,
      functionNameEnd,
      functionNameRange: offsetsToRange(document, functionNameStart, functionNameEnd),
      argsStart: parsedCallable.openParen + 1,
      argsEnd: parsedCallable.closeParen,
      argsText
    });
  }

  return declarations;
}

export function getOccurrenceAtOffset(
  analysis: DocumentAnalysis,
  offset: number
): IdentifierOccurrence | undefined {
  const occurrences = analysis.occurrences;
  let left = 0;
  let right = occurrences.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;
    const occurrence = occurrences[mid];
    if (offset < occurrence.start) {
      right = mid - 1;
      continue;
    }
    if (offset > occurrence.end) {
      left = mid + 1;
      continue;
    }

    return occurrence;
  }

  return undefined;
}

export function getTypeResolutionContextAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  lineNumber: number,
  character: number,
  allAnalyses: DocumentAnalysis[],
  workspaceFunctionReturnTypes?: Map<string, string>,
  completionIndex?: CompletionIndex
): TypeResolutionContext {
  const offset = document.offsetAt({ line: lineNumber, character });
  const localVariableTypes = new Map<string, string>();
  const localFunctionReturnTypes =
    workspaceFunctionReturnTypes ?? collectFunctionReturnTypes(allAnalyses);
  const functionIndex = findFunctionIndexAtOffset(analysis.functions, offset);
  const activeNamespacePath =
    functionIndex !== undefined ? analysis.functions[functionIndex]?.namespacePath ?? "" : "";

  for (const candidate of allAnalyses) {
    if (candidate.uri === analysis.uri) {
      continue;
    }
    for (const declaration of candidate.globalDeclarations) {
      const declarationType = resolveVisibleDeclarationType(
        declaration,
        candidate.text,
        localVariableTypes,
        localFunctionReturnTypes,
        completionIndex
      );
      addGlobalDeclarationTypeAlias(
        localVariableTypes,
        declaration,
        activeNamespacePath,
        declarationType
      );
    }
  }
  for (const declaration of analysis.globalDeclarations) {
    const declarationType = resolveVisibleDeclarationType(
      declaration,
      analysis.text,
      localVariableTypes,
      localFunctionReturnTypes,
      completionIndex
    );
    addGlobalDeclarationTypeAlias(
      localVariableTypes,
      declaration,
      activeNamespacePath,
      declarationType
    );
  }

  if (functionIndex === undefined) {
    return { localVariableTypes, localFunctionReturnTypes };
  }

  const fn = analysis.functions[functionIndex];
  const declarations = [...fn.parameters, ...fn.localDeclarations]
    .slice()
    .sort((a, b) => a.start - b.start);

  for (const declaration of declarations) {
    if (declaration.start > offset) {
      continue;
    }

    if (offset < declaration.scopeStart || offset > declaration.scopeEnd) {
      continue;
    }

    localVariableTypes.set(
      declaration.name,
      resolveVisibleDeclarationType(
        declaration,
        analysis.text,
        localVariableTypes,
        localFunctionReturnTypes,
        completionIndex
      )
    );
  }

  return { localVariableTypes, localFunctionReturnTypes };
}

function addGlobalDeclarationTypeAlias(
  localVariableTypes: Map<string, string>,
  declaration: VariableDeclaration,
  activeNamespacePath: string,
  declarationType: string
): void {
  localVariableTypes.set(declaration.name, declarationType);

  const namespaceSeparator = declaration.name.lastIndexOf("::");
  if (namespaceSeparator < 0) {
    return;
  }
  const declarationNamespacePath = declaration.name.slice(0, namespaceSeparator);
  if (declarationNamespacePath !== activeNamespacePath) {
    return;
  }

  const shortName = declaration.name.slice(namespaceSeparator + 2);
  if (!shortName) {
    return;
  }

  localVariableTypes.set(shortName, declarationType);
}

function resolveVisibleDeclarationType(
  declaration: VariableDeclaration,
  sourceText: string,
  visibleVariableTypes: Map<string, string>,
  visibleFunctionReturnTypes: Map<string, string>,
  completionIndex?: CompletionIndex
): string {
  const declaredType = declaration.type;
  if (!completionIndex || !isAutoTypeDeclaration(declaredType)) {
    return declaredType;
  }

  const initializer = getInitializerForDeclaration(sourceText, declaration.end);
  if (!initializer) {
    return declaredType;
  }

  const inferredType = inferExpressionTypeFromText(completionIndex, initializer, {
    localVariableTypes: visibleVariableTypes,
    localFunctionReturnTypes: visibleFunctionReturnTypes,
    functionSources: emptyExpressionFunctionSources
  });
  if (!inferredType || isAutoTypeDeclaration(inferredType)) {
    return declaredType;
  }

  return normalizeTypeText(inferredType) || inferredType;
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

function getInitializerForDeclaration(
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

    if (atTopLevel && (ch === ";" || ch === ",") && equalsOffset >= 0) {
      const expression = text.slice(equalsOffset + 1, i).trim();
      return expression.length > 0 ? expression : undefined;
    }

    if (atTopLevel && (ch === ";" || ch === ",") && equalsOffset < 0) {
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

export function collectFunctionReturnTypes(
  analyses: DocumentAnalysis[]
): Map<string, string> {
  const returnTypes = new Map<string, string>();

  for (const analysis of analyses) {
    for (const fn of analysis.functions) {
      if (!fn.returnType) {
        continue;
      }

      if (!returnTypes.has(fn.name)) {
        returnTypes.set(fn.name, fn.returnType);
      }
    }
  }

  return returnTypes;
}

export function resolveVisibleLocalDeclaration(
  analysis: DocumentAnalysis,
  functionIndex: number,
  name: string,
  offset: number
): VariableDeclaration | undefined {
  const fn = analysis.functions[functionIndex];
  if (!fn) {
    return undefined;
  }

  let best: VariableDeclaration | undefined;
  const candidates = [...fn.parameters, ...fn.localDeclarations];
  for (const declaration of candidates) {
    if (declaration.name !== name) {
      continue;
    }
    if (declaration.start > offset) {
      continue;
    }
    if (offset < declaration.scopeStart || offset > declaration.scopeEnd) {
      continue;
    }

    if (!best || declaration.start >= best.start) {
      best = declaration;
    }
  }

  return best;
}

function collectSemanticBindingIssues(
  functions: FunctionDeclaration[],
  occurrences: IdentifierOccurrence[]
): SemanticBindingIssue[] {
  const issues: SemanticBindingIssue[] = [];
  const seenIssueKeys = new Set<string>();

  const pushIssue = (
    code: SemanticBindingIssue["code"],
    message: string,
    range: Range
  ): void => {
    const key = `${code}:${range.start.line}:${range.start.character}:${range.end.line}:${range.end.character}:${message}`;
    if (seenIssueKeys.has(key)) {
      return;
    }
    seenIssueKeys.add(key);
    issues.push({ code, message, range });
  };

  for (let functionIndex = 0; functionIndex < functions.length; functionIndex += 1) {
    const fn = functions[functionIndex];

    const firstParameterByName = new Map<string, VariableDeclaration>();
    for (const parameter of fn.parameters.slice().sort((a, b) => a.start - b.start)) {
      const previous = firstParameterByName.get(parameter.name);
      if (previous) {
        pushIssue(
          "binding-duplicate-declaration",
          `Duplicate parameter declaration "${parameter.name}".`,
          parameter.range
        );
        continue;
      }
      firstParameterByName.set(parameter.name, parameter);
    }

    const firstLocalByScopeAndName = new Map<string, VariableDeclaration>();
    for (const declaration of fn.localDeclarations.slice().sort((a, b) => a.start - b.start)) {
      const key = `${declaration.scopeStart}:${declaration.scopeEnd}:${declaration.name}`;
      const previous = firstLocalByScopeAndName.get(key);
      if (previous) {
        pushIssue(
          "binding-duplicate-declaration",
          `Duplicate local declaration "${declaration.name}" in the same scope.`,
          declaration.range
        );
        continue;
      }
      firstLocalByScopeAndName.set(key, declaration);
    }

    const declarations = [...fn.parameters, ...fn.localDeclarations]
      .slice()
      .sort((a, b) => a.start - b.start);
    const references = occurrences.filter(
      (occurrence) =>
        occurrence.functionIndex === functionIndex &&
        !occurrence.isDeclaration &&
        !occurrence.isCall &&
        occurrence.qualifier === "none"
    );

    for (const reference of references) {
      const visible = resolveVisibleDeclarationFromList(
        declarations,
        reference.name,
        reference.start
      );
      if (visible) {
        continue;
      }

      const future = findFutureDeclarationInScope(
        declarations,
        reference.name,
        reference.start
      );
      if (!future) {
        continue;
      }

      pushIssue(
        "binding-use-before-declaration",
        `Identifier "${reference.name}" is used before its declaration.`,
        reference.range
      );
    }
  }

  return issues.sort((a, b) => {
    if (a.range.start.line !== b.range.start.line) {
      return a.range.start.line - b.range.start.line;
    }
    if (a.range.start.character !== b.range.start.character) {
      return a.range.start.character - b.range.start.character;
    }
    return a.message.localeCompare(b.message);
  });
}

function resolveVisibleDeclarationFromList(
  declarations: VariableDeclaration[],
  name: string,
  offset: number
): VariableDeclaration | undefined {
  let best: VariableDeclaration | undefined;
  for (const declaration of declarations) {
    if (declaration.name !== name) {
      continue;
    }
    if (declaration.start > offset) {
      continue;
    }
    if (offset < declaration.scopeStart || offset > declaration.scopeEnd) {
      continue;
    }

    if (!best || declaration.start >= best.start) {
      best = declaration;
    }
  }
  return best;
}

function findFutureDeclarationInScope(
  declarations: VariableDeclaration[],
  name: string,
  offset: number
): VariableDeclaration | undefined {
  let best: VariableDeclaration | undefined;
  for (const declaration of declarations) {
    if (declaration.name !== name) {
      continue;
    }
    if (declaration.start <= offset) {
      continue;
    }
    if (offset < declaration.scopeStart || offset > declaration.scopeEnd) {
      continue;
    }

    if (!best || declaration.start < best.start) {
      best = declaration;
    }
  }

  return best;
}

function parseFunctions(
  maskedText: string,
  nodes: ParsedFunctionNode[],
  grammarFunctions: GrammarFunctionWithNamespace[],
  document: TextDocument
): FunctionDeclaration[] {
  const functions: FunctionDeclaration[] = [];
  const grammarFunctionByBodyRange = new Map<string, GrammarFunctionWithNamespace>();
  for (const grammarFunction of grammarFunctions) {
    if (
      grammarFunction.declaration.openBrace === undefined ||
      grammarFunction.declaration.closeBrace === undefined
    ) {
      continue;
    }

    const key = `${grammarFunction.declaration.openBrace}:${grammarFunction.declaration.closeBrace}`;
    if (!grammarFunctionByBodyRange.has(key)) {
      grammarFunctionByBodyRange.set(key, grammarFunction);
    }
  }

  for (const node of nodes) {
    const argsText = maskedText.slice(node.openParen + 1, node.closeParen);
    const grammarFunctionWithNamespace = grammarFunctionByBodyRange.get(
      `${node.openBrace}:${node.closeBrace}`
    );
    const grammarFunction = grammarFunctionWithNamespace?.declaration;
    const declarationStartOffset = grammarFunction?.start ?? node.nameStart;
    const hasDeclarationAttributes = hasDeclarationAttributesBeforeName(
      maskedText,
      declarationStartOffset,
      node.nameStart
    );
    const blockRanges = buildBlockRanges(maskedText, node.openBrace, node.closeBrace);
    const fallbackParameters = parseParameters(
      document,
      argsText,
      node.openParen + 1,
      node.openBrace + 1,
      node.closeBrace
    );
    const grammarParameters = grammarFunction
      ? parseParametersFromGrammarFunction(document, grammarFunction)
      : [];
    const parameters =
      grammarParameters.length > 0 || argsText.trim() === "" || argsText.trim() === "void"
        ? grammarParameters
        : fallbackParameters;

    const fallbackLocalDeclarations = parseLocalDeclarations(
      document,
      maskedText.slice(node.openBrace + 1, node.closeBrace),
      node.openBrace + 1,
      node.closeBrace,
      blockRanges
    );
    const grammarLocalDeclarations = grammarFunction
      ? collectLocalDeclarationsFromGrammarFunction(document, grammarFunction)
      : [];
    const localDeclarations = mergeVariableDeclarations(
      grammarLocalDeclarations,
      fallbackLocalDeclarations
    );

    functions.push({
      id: `${document.uri}:${node.nameStart}`,
      name: node.name,
      namespacePath: grammarFunctionWithNamespace?.namespacePath ?? "",
      hasDeclarationAttributes,
      returnType: grammarFunction?.returnTypeText || node.returnType,
      argsText: argsText.trim(),
      start: node.nameStart,
      end: node.closeBrace + 1,
      range: offsetsToRange(document, node.nameStart, node.closeBrace + 1),
      nameStart: node.nameStart,
      nameEnd: node.nameEnd,
      nameRange: offsetsToRange(document, node.nameStart, node.nameEnd),
      bodyStart: node.openBrace,
      bodyEnd: node.closeBrace,
      parameters,
      localDeclarations
    });
  }

  return functions.sort((a, b) => a.bodyStart - b.bodyStart);
}

function hasDeclarationAttributesBeforeName(
  text: string,
  declarationStartOffset: number,
  declarationNameOffset: number
): boolean {
  if (
    declarationStartOffset < 0 ||
    declarationNameOffset <= declarationStartOffset ||
    declarationNameOffset > text.length
  ) {
    return false;
  }

  let cursor = declarationStartOffset;
  let foundAttribute = false;
  while (cursor < declarationNameOffset) {
    while (cursor < declarationNameOffset && /\s/.test(text[cursor] ?? "")) {
      cursor += 1;
    }
    if (cursor >= declarationNameOffset || text[cursor] !== "[") {
      break;
    }

    const closeOffset = findMatchingBracketOffset(text, cursor, declarationNameOffset);
    if (closeOffset < 0) {
      break;
    }

    foundAttribute = true;
    cursor = closeOffset + 1;
  }

  return foundAttribute;
}

function findMatchingBracketOffset(
  text: string,
  openOffset: number,
  maxExclusiveOffset: number
): number {
  let depth = 0;
  for (let i = openOffset; i < maxExclusiveOffset; i += 1) {
    const ch = text[i];
    if (ch === "[") {
      depth += 1;
      continue;
    }
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function parseParametersFromGrammarFunction(
  document: TextDocument,
  grammarFunction: GrammarFunctionDeclarationNode
): VariableDeclaration[] {
  if (
    grammarFunction.openBrace === undefined ||
    grammarFunction.closeBrace === undefined
  ) {
    return [];
  }

  const declarations: VariableDeclaration[] = [];
  for (const parameter of grammarFunction.parameters) {
    const rawType = parameter.typeText.trim();
    const normalizedType = normalizeTypeText(rawType);
    if (!normalizedType || !parameter.name) {
      continue;
    }

    declarations.push({
      id: `${document.uri}:${parameter.nameStart}`,
      name: parameter.name,
      type: rawType,
      start: parameter.nameStart,
      end: parameter.nameEnd,
      range: offsetsToRange(document, parameter.nameStart, parameter.nameEnd),
      scopeStart: grammarFunction.openBrace + 1,
      scopeEnd: grammarFunction.closeBrace,
      isParameter: true
    });
  }

  return declarations;
}

function collectLocalDeclarationsFromGrammarFunction(
  document: TextDocument,
  grammarFunction: GrammarFunctionDeclarationNode
): VariableDeclaration[] {
  if (
    !grammarFunction.body ||
    grammarFunction.openBrace === undefined ||
    grammarFunction.closeBrace === undefined
  ) {
    return [];
  }

  const declarations: VariableDeclaration[] = [];
  const sourceText = document.getText();

  const collectForInitializerDeclarations = (
    statementStart: number,
    statementEnd: number
  ): void => {
    const openParenOffset = findNextNonWhitespaceIndex(sourceText, statementStart + "for".length);
    if (openParenOffset < 0 || sourceText[openParenOffset] !== "(") {
      return;
    }

    const closeParenOffset = findMatchingDelimiterOffset(
      sourceText,
      openParenOffset,
      statementEnd,
      "(",
      ")"
    );
    if (closeParenOffset < 0) {
      return;
    }

    const initializerStart = openParenOffset + 1;
    const headerText = sourceText.slice(initializerStart, closeParenOffset);
    const firstSemicolonInHeader = findTopLevelHeaderDelimiterIndex(headerText, ";");
    if (firstSemicolonInHeader < 0) {
      return;
    }

    const initializerText = headerText.slice(0, firstSemicolonInHeader);
    const initializerDeclarations = parseForInitializerDeclarations(
      initializerText,
      initializerStart
    );

    for (const declaration of initializerDeclarations) {
      declarations.push({
        id: `${document.uri}:${declaration.start}`,
        name: declaration.name,
        type: declaration.typeText,
        start: declaration.start,
        end: declaration.end,
        range: offsetsToRange(document, declaration.start, declaration.end),
        scopeStart: declaration.start,
        scopeEnd: statementEnd,
        isParameter: false
      });
    }
  };

  const visitStatement = (
    statement: GrammarStatementNode,
    scopeStart: number,
    scopeEnd: number
  ): void => {
    if (statement.kind === "block") {
      const blockScopeStart = statement.start + 1;
      const blockScopeEnd = Math.max(blockScopeStart, statement.end - 1);
      for (const nested of statement.statements) {
        visitStatement(nested, blockScopeStart, blockScopeEnd);
      }
      return;
    }

    if (statement.kind === "variable-declaration") {
      const rawType = statement.typeText.trim();
      const normalizedType = normalizeTypeText(rawType);
      if (!normalizedType) {
        return;
      }

      for (const declarator of statement.declarators) {
        if (!declarator.name) {
          continue;
        }
        declarations.push({
          id: `${document.uri}:${declarator.nameStart}`,
          name: declarator.name,
          type: rawType,
          start: declarator.nameStart,
          end: declarator.nameEnd,
          range: offsetsToRange(document, declarator.nameStart, declarator.nameEnd),
          scopeStart,
          scopeEnd,
          isParameter: false
        });
      }
      return;
    }

    if (statement.kind === "for") {
      collectForInitializerDeclarations(statement.start, statement.end);
    }

    if (statement.kind !== "statement" && statement.body) {
      visitStatement(statement.body, scopeStart, scopeEnd);
    }
  };

  const topScopeStart = grammarFunction.openBrace + 1;
  const topScopeEnd = grammarFunction.closeBrace;
  for (const statement of grammarFunction.body.statements) {
    visitStatement(statement, topScopeStart, topScopeEnd);
  }

  return declarations.sort((a, b) => a.start - b.start);
}

function parseForInitializerDeclarations(
  initializerText: string,
  initializerStartOffset: number
): Array<{ typeText: string; name: string; start: number; end: number }> {
  const typeAndDeclarators =
    /^\s*((?:const\s+)?[A-Za-z_][A-Za-z0-9_:<>@&]*)\s+([\s\S]+)$/.exec(
      initializerText
    );
  if (!typeAndDeclarators) {
    return [];
  }

  const typeText = typeAndDeclarators[1].trim();
  if (!isPlausibleDeclarationTypeText(typeText)) {
    return [];
  }

  const declaratorsText = typeAndDeclarators[2];
  if (!declaratorsText.trim()) {
    return [];
  }

  const declaratorsStartOffset =
    initializerStartOffset + (typeAndDeclarators[0].length - declaratorsText.length);
  const segments = splitCommaSeparatedWithOffsets(
    declaratorsText,
    declaratorsStartOffset
  );
  const declarations: Array<{ typeText: string; name: string; start: number; end: number }> = [];

  for (const segment of segments) {
    const nameMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(segment.text);
    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[1];
    const nameStartInSegment = segment.text.indexOf(name);
    if (nameStartInSegment < 0) {
      continue;
    }

    const trailing = segment.text.slice(nameStartInSegment + name.length).trimStart();
    if (trailing.startsWith("(")) {
      continue;
    }

    const nameStart = segment.start + nameStartInSegment;
    declarations.push({
      typeText,
      name,
      start: nameStart,
      end: nameStart + name.length
    });
  }

  return declarations;
}

function mergeVariableDeclarations(
  primary: VariableDeclaration[],
  fallback: VariableDeclaration[]
): VariableDeclaration[] {
  if (primary.length === 0) {
    return fallback.slice().sort((a, b) => a.start - b.start);
  }

  const merged = [...primary];
  const existingStarts = new Set(primary.map((declaration) => declaration.start));
  for (const declaration of fallback) {
    if (existingStarts.has(declaration.start)) {
      continue;
    }
    merged.push(declaration);
  }

  return merged.sort((a, b) => a.start - b.start);
}

function collectGrammarFunctionDeclarations(
  program: GrammarProgramNode
): GrammarFunctionWithNamespace[] {
  const declarations: GrammarFunctionWithNamespace[] = [];

  const visitDeclaration = (
    declaration: GrammarDeclarationNode,
    namespacePath: string
  ): void => {
    if (declaration.kind === "namespace") {
      const childNamespacePath = namespacePath
        ? `${namespacePath}::${declaration.name}`
        : declaration.name;
      for (const child of declaration.body) {
        visitDeclaration(child, childNamespacePath);
      }
      return;
    }

    if (declaration.kind === "function") {
      declarations.push({
        declaration,
        namespacePath
      });
      return;
    }

    if (declaration.kind === "type") {
      for (const child of declaration.body) {
        visitDeclaration(child, namespacePath);
      }
    }
  };

  for (const declaration of program.declarations) {
    visitDeclaration(declaration, "");
  }

  return declarations;
}

function collectIdentifierDeclarationsFromGrammarProgram(
  program: GrammarProgramNode,
  document: TextDocument,
  text: string
): IdentifierDeclaration[] {
  const declarations: IdentifierDeclaration[] = [];

  const pushDeclaration = (name: string, start: number, end: number): void => {
    if (!name || start < 0 || end <= start) {
      return;
    }
    declarations.push({
      id: `${document.uri}:${start}`,
      name,
      start,
      end,
      range: offsetsToRange(document, start, end)
    });
  };

  const visitStatement = (statement: GrammarStatementNode): void => {
    if (statement.kind === "variable-declaration") {
      for (const declarator of statement.declarators) {
        pushDeclaration(declarator.name, declarator.nameStart, declarator.nameEnd);
      }
      return;
    }

    if (statement.kind === "block") {
      for (const nested of statement.statements) {
        visitStatement(nested);
      }
      return;
    }

    if (statement.kind !== "statement" && statement.body) {
      visitStatement(statement.body);
    }
  };

  const visitDeclaration = (declaration: GrammarDeclarationNode): void => {
    if (declaration.kind === "function") {
      pushDeclaration(declaration.name, declaration.nameStart, declaration.nameEnd);
      for (const parameter of declaration.parameters) {
        pushDeclaration(parameter.name, parameter.nameStart, parameter.nameEnd);
      }
      if (declaration.body) {
        for (const statement of declaration.body.statements) {
          visitStatement(statement);
        }
      }
      return;
    }

    if (declaration.kind === "callable-declaration") {
      pushDeclaration(declaration.name, declaration.nameStart, declaration.nameEnd);
      for (const parameter of declaration.parameters) {
        pushDeclaration(parameter.name, parameter.nameStart, parameter.nameEnd);
      }
      return;
    }

    if (declaration.kind === "namespace") {
      pushDeclaration(declaration.name, declaration.nameStart, declaration.nameEnd);
      for (const child of declaration.body) {
        visitDeclaration(child);
      }
      return;
    }

    if (declaration.kind === "type") {
      pushDeclaration(declaration.name, declaration.nameStart, declaration.nameEnd);
      for (const enumLabel of collectEnumLabelDeclarationsFromTypeDeclaration(
        declaration,
        text
      )) {
        pushDeclaration(enumLabel.name, enumLabel.start, enumLabel.end);
      }
      for (const child of declaration.body) {
        visitDeclaration(child);
      }
      return;
    }

    if (declaration.kind === "using") {
      return;
    }

    visitStatement(declaration);
  };

  for (const declaration of program.declarations) {
    visitDeclaration(declaration);
  }

  return dedupeIdentifierDeclarations(declarations.sort((a, b) => a.start - b.start));
}

function collectGlobalVariableDeclarationsFromGrammarProgram(
  program: GrammarProgramNode,
  document: TextDocument,
  text: string
): VariableDeclaration[] {
  const declarations: VariableDeclaration[] = [];
  const scopeStart = 0;
  const scopeEnd = text.length;

  const pushVariableDeclaration = (
    statement: GrammarStatementNode,
    namespacePath: string
  ): void => {
    const pushResolvedDeclaration = (
      rawTypeText: string,
      declaratorName: string,
      declaratorStart: number,
      declaratorEnd: number
    ): void => {
      const rawType = rawTypeText.trim();
      const normalizedType = normalizeTypeText(rawType).trim();
      if (!rawType || !normalizedType) {
        return;
      }
      if (
        !declaratorName ||
        declaratorStart < 0 ||
        declaratorEnd <= declaratorStart
      ) {
        return;
      }

      declarations.push({
        id: `${document.uri}:${declaratorStart}`,
        name: namespacePath
          ? `${namespacePath}::${declaratorName}`
          : declaratorName,
        type: rawType,
        start: declaratorStart,
        end: declaratorEnd,
        range: offsetsToRange(document, declaratorStart, declaratorEnd),
        scopeStart,
        scopeEnd,
        isParameter: false
      });
    };

    if (statement.kind === "variable-declaration") {
      for (const declarator of statement.declarators) {
        pushResolvedDeclaration(
          statement.typeText,
          declarator.name,
          declarator.nameStart,
          declarator.nameEnd
        );
      }
      return;
    }

    if (statement.kind !== "statement") {
      return;
    }

    const recovered =
      recoverVariableDeclaratorsFromStatementText(statement, text);
    for (const declarator of recovered) {
      pushResolvedDeclaration(
        declarator.typeText,
        declarator.name,
        declarator.start,
        declarator.end
      );
    }
  };

  const visitDeclaration = (
    declaration: GrammarDeclarationNode,
    namespacePath: string,
    insideType: boolean
  ): void => {
    if (declaration.kind === "namespace") {
      const childNamespace = namespacePath
        ? `${namespacePath}::${declaration.name}`
        : declaration.name;
      for (const child of declaration.body) {
        visitDeclaration(child, childNamespace, insideType);
      }
      return;
    }

    if (declaration.kind === "type") {
      for (const child of declaration.body) {
        visitDeclaration(child, namespacePath, true);
      }
      return;
    }

    if (
      declaration.kind === "function" ||
      declaration.kind === "callable-declaration" ||
      declaration.kind === "using"
    ) {
      return;
    }

    if (insideType) {
      return;
    }

    pushVariableDeclaration(declaration, namespacePath);
  };

  for (const declaration of program.declarations) {
    visitDeclaration(declaration, "", false);
  }

  return declarations.sort((a, b) => a.start - b.start);
}

function recoverVariableDeclaratorsFromStatementText(
  statement: Extract<GrammarStatementNode, { kind: "statement" }>,
  text: string
): Array<{ typeText: string; name: string; start: number; end: number }> {
  const statementText = text.slice(statement.start, statement.end);
  if (!statementText) {
    return [];
  }

  let cursor = 0;
  while (cursor < statementText.length) {
    const remaining = statementText.slice(cursor);
    const attributeMatch = /^\s*\[[^\]\r\n]*\]\s*/.exec(remaining);
    if (attributeMatch) {
      cursor += attributeMatch[0].length;
      continue;
    }

    const lineCommentMatch = /^\s*\/\/[^\r\n]*(?:\r?\n|$)/.exec(remaining);
    if (lineCommentMatch) {
      cursor += lineCommentMatch[0].length;
      continue;
    }

    const blockCommentMatch = /^\s*\/\*[\s\S]*?\*\//.exec(remaining);
    if (blockCommentMatch) {
      cursor += blockCommentMatch[0].length;
      continue;
    }

    break;
  }

  const declarationText = statementText.slice(cursor).trim();
  if (!declarationText) {
    return [];
  }

  const withoutSemicolon = declarationText.endsWith(";")
    ? declarationText.slice(0, -1).trimEnd()
    : declarationText.trimEnd();
  if (!withoutSemicolon) {
    return [];
  }

  const typeAndDeclarators =
    /^((?:const\s+)?[A-Za-z_][A-Za-z0-9_:<>@&]*)\s+([\s\S]+)$/.exec(
      withoutSemicolon
    );
  if (!typeAndDeclarators) {
    return [];
  }

  const typeText = typeAndDeclarators[1].trim();
  const declaratorsText = typeAndDeclarators[2];
  if (!typeText || !declaratorsText || !isPlausibleDeclarationTypeText(typeText)) {
    return [];
  }

  const declaratorsTextStartInStatement = statementText.indexOf(
    declaratorsText,
    cursor
  );
  if (declaratorsTextStartInStatement < 0) {
    return [];
  }

  const declaratorsStart = statement.start + declaratorsTextStartInStatement;
  const segments = splitCommaSeparatedWithOffsets(
    declaratorsText,
    declaratorsStart
  );
  const recovered: Array<{ typeText: string; name: string; start: number; end: number }> = [];

  for (const segment of segments) {
    const nameMatch = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(segment.text);
    if (!nameMatch) {
      continue;
    }

    const name = nameMatch[1];
    const nameIndex = segment.text.indexOf(name);
    if (nameIndex < 0) {
      continue;
    }

    const afterName = segment.text.slice(nameIndex + name.length).trimStart();
    if (afterName.startsWith("(")) {
      continue;
    }

    const nameStart = segment.start + nameIndex;
    recovered.push({
      typeText,
      name,
      start: nameStart,
      end: nameStart + name.length
    });
  }

  return recovered;
}

function collectEnumLabelDeclarationsFromTypeDeclaration(
  declaration: GrammarTypeDeclarationNode,
  text: string
): Array<{ name: string; start: number; end: number }> {
  if (declaration.typeKind !== "enum") {
    return [];
  }

  const labels: Array<{ name: string; start: number; end: number }> = [];
  for (const child of declaration.body) {
    if (child.kind !== "statement") {
      continue;
    }

    const statementText = text.slice(child.start, child.end);
    const segments = splitCommaSeparatedWithOffsets(statementText, child.start);
    for (const segment of segments) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(segment.text);
      if (!match) {
        continue;
      }

      const labelName = match[1];
      const labelStartInSegment = segment.text.indexOf(labelName);
      if (labelStartInSegment < 0) {
        continue;
      }

      const labelStart = segment.start + labelStartInSegment;
      labels.push({
        name: labelName,
        start: labelStart,
        end: labelStart + labelName.length
      });
    }
  }

  return labels;
}

function dedupeIdentifierDeclarations(
  declarations: IdentifierDeclaration[]
): IdentifierDeclaration[] {
  const deduped: IdentifierDeclaration[] = [];
  const seen = new Set<number>();
  for (const declaration of declarations) {
    if (seen.has(declaration.start)) {
      continue;
    }
    seen.add(declaration.start);
    deduped.push(declaration);
  }
  return deduped;
}

function parseTypeDeclarationsFromGrammarProgram(
  program: GrammarProgramNode,
  parsedTypes: ParsedTypeNode[],
  document: TextDocument
): TypeDeclaration[] {
  const declarations: TypeDeclaration[] = [];

  const visitDeclarations = (
    nodes: GrammarDeclarationNode[],
    namespacePath: string
  ): void => {
    for (const node of nodes) {
      if (node.kind === "namespace") {
        const childNamespace = namespacePath
          ? `${namespacePath}::${node.name}`
          : node.name;
        visitDeclarations(node.body, childNamespace);
        continue;
      }

      if (node.kind !== "type") {
        continue;
      }

      const fullName = namespacePath
        ? `${namespacePath}::${node.name}`
        : node.name;
      declarations.push({
        id: `${document.uri}:${node.nameStart}`,
        name: node.name,
        fullName,
        kind: node.typeKind,
        start: node.start,
        end: node.end,
        range: offsetsToRange(document, node.start, node.end),
        nameRange: offsetsToRange(document, node.nameStart, node.nameEnd)
      });

      visitDeclarations(node.body, fullName);
    }
  };

  visitDeclarations(program.declarations, "");
  if (declarations.length === 0) {
    return parsedTypes.map((typeDeclaration) => ({
      id: `${document.uri}:${typeDeclaration.nameStart}`,
      name: typeDeclaration.name,
      fullName: typeDeclaration.fullName,
      kind: typeDeclaration.kind,
      start: typeDeclaration.start,
      end: typeDeclaration.end,
      range: offsetsToRange(document, typeDeclaration.start, typeDeclaration.end),
      nameRange: offsetsToRange(document, typeDeclaration.nameStart, typeDeclaration.nameEnd)
    }));
  }

  const seenStarts = new Set(declarations.map((declaration) => declaration.start));
  for (const parsedType of parsedTypes) {
    if (seenStarts.has(parsedType.start)) {
      continue;
    }

    declarations.push({
      id: `${document.uri}:${parsedType.nameStart}`,
      name: parsedType.name,
      fullName: parsedType.fullName,
      kind: parsedType.kind,
      start: parsedType.start,
      end: parsedType.end,
      range: offsetsToRange(document, parsedType.start, parsedType.end),
      nameRange: offsetsToRange(document, parsedType.nameStart, parsedType.nameEnd)
    });
  }

  return declarations.sort((a, b) => a.start - b.start);
}

function parseCallableDeclarations(
  parsedCallables: ParsedCallableDeclarationNode[],
  document: TextDocument
): CallableDeclaration[] {
  const declarations: CallableDeclaration[] = [];
  for (const declaration of parsedCallables) {
    if (!declaration.name || isLanguageKeyword(declaration.name)) {
      continue;
    }

    declarations.push({
      name: declaration.name,
      start: declaration.start,
      end: declaration.end,
      range: offsetsToRange(document, declaration.start, declaration.end)
    });
  }

  return dedupeCallableDeclarations(declarations.sort((a, b) => a.start - b.start));
}

function dedupeCallableDeclarations(
  declarations: CallableDeclaration[]
): CallableDeclaration[] {
  const deduped: CallableDeclaration[] = [];
  const seenStarts = new Set<number>();

  for (const declaration of declarations) {
    if (seenStarts.has(declaration.start)) {
      continue;
    }

    seenStarts.add(declaration.start);
    deduped.push(declaration);
  }

  return deduped;
}

function parseParameters(
  document: TextDocument,
  argsText: string,
  argsStartOffset: number,
  scopeStart: number,
  scopeEnd: number
): VariableDeclaration[] {
  const declarations: VariableDeclaration[] = [];
  const segments = splitCommaSeparatedWithOffsets(argsText, argsStartOffset);

  for (const segment of segments) {
    const original = segment.text;
    const withoutDefault = original.split("=")[0].trim();
    if (!withoutDefault || withoutDefault === "void") {
      continue;
    }

    const nameMatch = /([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(withoutDefault);
    if (!nameMatch) {
      continue;
    }

    const declarationName = nameMatch[1];
    const nameIndexInWithoutDefault = withoutDefault.lastIndexOf(declarationName);
    if (nameIndexInWithoutDefault < 0) {
      continue;
    }

    const declarationTypeRaw = withoutDefault.slice(0, nameIndexInWithoutDefault).trim();
    const declarationType = normalizeTypeText(declarationTypeRaw);
    if (!declarationType) {
      continue;
    }

    const trimmedStartInOriginal = original.indexOf(withoutDefault);
    if (trimmedStartInOriginal < 0) {
      continue;
    }

    const nameStart = segment.start + trimmedStartInOriginal + nameIndexInWithoutDefault;
    const nameEnd = nameStart + declarationName.length;
    declarations.push({
      id: `${document.uri}:${nameStart}`,
      name: declarationName,
      type: declarationTypeRaw,
      start: nameStart,
      end: nameEnd,
      range: offsetsToRange(document, nameStart, nameEnd),
      scopeStart,
      scopeEnd,
      isParameter: true
    });
  }

  return declarations;
}

function parseLocalDeclarations(
  document: TextDocument,
  bodyText: string,
  bodyStartOffset: number,
  scopeEnd: number,
  blockRanges: BlockRange[]
): VariableDeclaration[] {
  const declarations: VariableDeclaration[] = [];
  let match: RegExpExecArray | null;

  while ((match = localDeclarationPattern.exec(bodyText)) !== null) {
    const fullMatch = match[0];
    const rawType = match[1].trim();
    const declarationName = match[2];
    if (!declarationName || !isPlausibleDeclarationTypeText(rawType)) {
      continue;
    }

    const nameStartInFull = fullMatch.lastIndexOf(declarationName);
    if (nameStartInFull < 0) {
      continue;
    }
    const nameStart = bodyStartOffset + match.index + nameStartInFull;
    const nameEnd = nameStart + declarationName.length;
    const blockScope =
      findInnermostBlockRange(blockRanges, nameStart) ?? {
        start: bodyStartOffset,
        end: scopeEnd
      };

    declarations.push({
      id: `${document.uri}:${nameStart}`,
      name: declarationName,
      type: rawType,
      start: nameStart,
      end: nameEnd,
      range: offsetsToRange(document, nameStart, nameEnd),
      scopeStart: blockScope.start,
      scopeEnd: blockScope.end,
      isParameter: false
    });
  }

  return declarations;
}

function buildBlockRanges(
  text: string,
  openBraceOffset: number,
  bodyEnd: number
): BlockRange[] {
  const ranges: BlockRange[] = [];
  const stack: number[] = [];

  for (let i = openBraceOffset; i <= bodyEnd; i += 1) {
    const ch = text[i];
    if (ch === "{") {
      stack.push(i);
      continue;
    }

    if (ch !== "}" || stack.length === 0) {
      continue;
    }

    const openOffset = stack.pop();
    if (openOffset === undefined) {
      continue;
    }

    ranges.push({
      start: openOffset + 1,
      end: i
    });
  }

  if (ranges.length === 0) {
    return [
      {
        start: openBraceOffset + 1,
        end: bodyEnd
      }
    ];
  }

  return ranges.sort(
    (a, b) => a.end - a.start - (b.end - b.start)
  );
}

function findInnermostBlockRange(
  ranges: BlockRange[],
  offset: number
): BlockRange | undefined {
  for (const range of ranges) {
    if (range.start <= offset && offset <= range.end) {
      return range;
    }
  }

  return undefined;
}

function collectIdentifierOccurrences(
  tokens: ParserToken[],
  functions: FunctionDeclaration[],
  declarationOffsets: Set<number>,
  document: TextDocument
): IdentifierOccurrence[] {
  const occurrences: IdentifierOccurrence[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.kind !== "identifier") {
      continue;
    }

    const name = token.text;
    const start = token.start;
    const end = token.end;
    const qualifier = getIdentifierQualifierFromTokens(tokens, i);
    const next = findNextSignificantToken(tokens, i + 1);
    const isCall = !!next && next.kind === "symbol" && next.text === "(";
    const functionIndex = findFunctionIndexAtOffset(functions, start);

    occurrences.push({
      name,
      start,
      end,
      range: offsetsToRange(document, start, end),
      qualifier,
      isCall,
      isDeclaration: declarationOffsets.has(start),
      functionIndex
    });
  }

  return occurrences.sort((a, b) => a.start - b.start);
}

function buildDocumentSymbols(
  functions: FunctionDeclaration[]
): DocumentSymbol[] {
  return functions.map((fn) =>
    DocumentSymbol.create(
      fn.name,
      `${fn.returnType}(${fn.argsText})`,
      SymbolKind.Function,
      fn.range,
      fn.nameRange
    )
  );
}

function findNextSignificantToken(
  tokens: ParserToken[],
  startIndex: number
): ParserToken | undefined {
  for (let i = startIndex; i < tokens.length; i += 1) {
    return tokens[i];
  }
  return undefined;
}

function findPreviousSignificantToken(
  tokens: ParserToken[],
  startIndex: number
): ParserToken | undefined {
  for (let i = startIndex; i >= 0; i -= 1) {
    return tokens[i];
  }
  return undefined;
}

function getIdentifierQualifierFromTokens(
  tokens: ParserToken[],
  identifierTokenIndex: number
): IdentifierQualifier {
  const previousToken = findPreviousSignificantToken(tokens, identifierTokenIndex - 1);
  if (!previousToken || previousToken.kind !== "symbol") {
    return "none";
  }

  if (previousToken.text === ".") {
    return "dot";
  }
  if (previousToken.text === "::") {
    return "namespace";
  }

  return "none";
}

function splitCommaSeparatedWithOffsets(
  text: string,
  startOffset: number
): Array<{ text: string; start: number }> {
  const segments: Array<{ text: string; start: number }> = [];
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
      segments.push({
        text: text.slice(segmentStart, i),
        start: startOffset + segmentStart
      });
      segmentStart = i + 1;
    }
  }

  if (segmentStart <= text.length) {
    segments.push({
      text: text.slice(segmentStart),
      start: startOffset + segmentStart
    });
  }

  return segments;
}

function findMatchingDelimiterOffset(
  text: string,
  openOffset: number,
  maxOffset: number,
  openChar: "(" | "[" | "{",
  closeChar: ")" | "]" | "}"
): number {
  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  const hardLimit = Math.min(maxOffset, text.length - 1);
  for (let i = openOffset; i <= hardLimit; i += 1) {
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

    if (ch === openChar) {
      depth += 1;
      continue;
    }
    if (ch === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function findTopLevelHeaderDelimiterIndex(text: string, delimiter: ";" | ","): number {
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
      ch === delimiter &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0
    ) {
      return i;
    }
  }

  return -1;
}

function findMatchingBrace(text: string, openBraceOffset: number): number {
  let depth = 0;
  for (let i = openBraceOffset; i < text.length; i += 1) {
    const ch = text[i];
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

function findFunctionIndexAtOffset(
  functions: FunctionDeclaration[],
  offset: number
): number | undefined {
  let left = 0;
  let right = functions.length - 1;

  while (left <= right) {
    const mid = (left + right) >> 1;
    const fn = functions[mid];
    if (offset < fn.bodyStart) {
      right = mid - 1;
      continue;
    }
    if (offset > fn.bodyEnd) {
      left = mid + 1;
      continue;
    }

    return mid;
  }

  return undefined;
}

function getIdentifierQualifier(
  text: string,
  identifierStart: number
): IdentifierQualifier {
  const previousIndex = findPreviousNonWhitespaceIndex(text, identifierStart - 1);
  if (previousIndex < 0) {
    return "none";
  }

  if (text[previousIndex] === ".") {
    return "dot";
  }

  if (text[previousIndex] !== ":") {
    return "none";
  }

  const secondPreviousIndex = findPreviousNonWhitespaceIndex(text, previousIndex - 1);
  if (secondPreviousIndex >= 0 && text[secondPreviousIndex] === ":") {
    return "namespace";
  }

  return "none";
}

function findPreviousNonWhitespaceIndex(text: string, index: number): number {
  for (let i = index; i >= 0; i -= 1) {
    if (!/\s/.test(text[i])) {
      return i;
    }
  }
  return -1;
}

function findNextNonWhitespaceIndex(text: string, index: number): number {
  for (let i = index; i < text.length; i += 1) {
    if (!/\s/.test(text[i])) {
      return i;
    }
  }
  return -1;
}

function offsetsToRange(
  document: TextDocument,
  startOffset: number,
  endOffset: number
): Range {
  return {
    start: document.positionAt(startOffset),
    end: document.positionAt(endOffset)
  };
}

export function maskCommentsAndStrings(text: string): string {
  const chars = [...text];
  let inLineComment = false;
  let inBlockComment = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const next = i + 1 < chars.length ? chars[i + 1] : "";

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
      } else {
        chars[i] = " ";
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        chars[i] = " ";
        chars[i + 1] = " ";
        inBlockComment = false;
        i += 1;
      } else if (ch !== "\n" && ch !== "\r") {
        chars[i] = " ";
      }
      continue;
    }

    if (inSingleQuote) {
      if (escapeNext) {
        if (ch !== "\n" && ch !== "\r") {
          chars[i] = " ";
        }
        escapeNext = false;
        continue;
      }
      if (ch === "\\") {
        chars[i] = " ";
        escapeNext = true;
        continue;
      }
      if (ch === "'") {
        chars[i] = " ";
        inSingleQuote = false;
        continue;
      }
      if (ch !== "\n" && ch !== "\r") {
        chars[i] = " ";
      }
      continue;
    }

    if (inDoubleQuote) {
      if (escapeNext) {
        if (ch !== "\n" && ch !== "\r") {
          chars[i] = " ";
        }
        escapeNext = false;
        continue;
      }
      if (ch === "\\") {
        chars[i] = " ";
        escapeNext = true;
        continue;
      }
      if (ch === "\"") {
        chars[i] = " ";
        inDoubleQuote = false;
        continue;
      }
      if (ch !== "\n" && ch !== "\r") {
        chars[i] = " ";
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      chars[i] = " ";
      chars[i + 1] = " ";
      inLineComment = true;
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      chars[i] = " ";
      chars[i + 1] = " ";
      inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === "'") {
      chars[i] = " ";
      inSingleQuote = true;
      continue;
    }

    if (ch === "\"") {
      chars[i] = " ";
      inDoubleQuote = true;
      continue;
    }
  }

  return chars.join("");
}
