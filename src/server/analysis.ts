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
  type GrammarStatementNode
} from "./grammarPipeline";
import type { TypeResolutionContext } from "./types";

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
  "return",
  "break",
  "continue",
  "else",
  "catch"
]);

interface BlockRange {
  start: number;
  end: number;
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
  const typeDeclarations = parseTypeDeclarations(parsedStructure.typeDeclarations, document);
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
  workspaceFunctionReturnTypes?: Map<string, string>
): TypeResolutionContext {
  const offset = document.offsetAt({ line: lineNumber, character });
  const localVariableTypes = new Map<string, string>();
  const localFunctionReturnTypes =
    workspaceFunctionReturnTypes ?? collectFunctionReturnTypes(allAnalyses);

  const functionIndex = findFunctionIndexAtOffset(analysis.functions, offset);
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

    localVariableTypes.set(declaration.name, declaration.type);
  }

  return { localVariableTypes, localFunctionReturnTypes };
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
  grammarFunctions: GrammarFunctionDeclarationNode[],
  document: TextDocument
): FunctionDeclaration[] {
  const functions: FunctionDeclaration[] = [];
  const grammarFunctionByBodyRange = new Map<string, GrammarFunctionDeclarationNode>();
  for (const grammarFunction of grammarFunctions) {
    if (
      grammarFunction.openBrace === undefined ||
      grammarFunction.closeBrace === undefined
    ) {
      continue;
    }

    const key = `${grammarFunction.openBrace}:${grammarFunction.closeBrace}`;
    if (!grammarFunctionByBodyRange.has(key)) {
      grammarFunctionByBodyRange.set(key, grammarFunction);
    }
  }

  for (const node of nodes) {
    const argsText = maskedText.slice(node.openParen + 1, node.closeParen);
    const grammarFunction = grammarFunctionByBodyRange.get(
      `${node.openBrace}:${node.closeBrace}`
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
    const type = normalizeTypeText(parameter.typeText);
    if (!type || !parameter.name) {
      continue;
    }

    declarations.push({
      id: `${document.uri}:${parameter.nameStart}`,
      name: parameter.name,
      type,
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
      const type = normalizeTypeText(statement.typeText);
      if (!type) {
        return;
      }

      for (const declarator of statement.declarators) {
        if (!declarator.name || isLanguageKeyword(declarator.name)) {
          continue;
        }
        declarations.push({
          id: `${document.uri}:${declarator.nameStart}`,
          name: declarator.name,
          type,
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
): GrammarFunctionDeclarationNode[] {
  const declarations: GrammarFunctionDeclarationNode[] = [];

  const visitDeclaration = (declaration: GrammarDeclarationNode): void => {
    if (declaration.kind === "function") {
      declarations.push(declaration);
      return;
    }

    if (declaration.kind === "namespace" || declaration.kind === "type") {
      for (const child of declaration.body) {
        visitDeclaration(child);
      }
    }
  };

  for (const declaration of program.declarations) {
    visitDeclaration(declaration);
  }

  return declarations;
}

function parseTypeDeclarations(
  parsedTypes: ParsedTypeNode[],
  document: TextDocument
): TypeDeclaration[] {
  return parsedTypes.map((typeDeclaration) => ({
    id: `${document.uri}:${typeDeclaration.start}`,
    name: typeDeclaration.name,
    fullName: typeDeclaration.fullName,
    kind: typeDeclaration.kind,
    start: typeDeclaration.start,
    end: typeDeclaration.end,
    range: offsetsToRange(document, typeDeclaration.start, typeDeclaration.end),
    nameRange: offsetsToRange(document, typeDeclaration.start, typeDeclaration.end)
  }));
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

    const declarationType = normalizeTypeText(
      withoutDefault.slice(0, nameIndexInWithoutDefault)
    );
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
      type: declarationType,
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
    const rawType = normalizeTypeText(match[1]);
    const declarationName = match[2];
    if (!rawType || !declarationName) {
      continue;
    }
    if (invalidLocalTypeKeywords.has(rawType)) {
      continue;
    }
    if (isLanguageKeyword(declarationName)) {
      continue;
    }

    const coreMatch = /([A-Za-z_][A-Za-z0-9_:<>@&]*)\s+([A-Za-z_][A-Za-z0-9_]*)/.exec(
      fullMatch
    );
    if (!coreMatch) {
      continue;
    }

    const coreStartInFull = coreMatch.index;
    const nameStartInCore = coreMatch[0].lastIndexOf(coreMatch[2]);
    const absoluteCoreStart = bodyStartOffset + match.index + coreStartInFull;
    const nameStart = absoluteCoreStart + nameStartInCore;
    const nameEnd = nameStart + declarationName.length;
    const blockScope =
      findInnermostBlockRange(blockRanges, absoluteCoreStart) ?? {
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
