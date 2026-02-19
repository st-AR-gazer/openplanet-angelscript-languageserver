import type { Hover } from "vscode-languageserver/node";
import { MarkupKind } from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  DocumentAnalysis,
  FunctionDeclaration,
  getOccurrenceAtOffset
} from "./analysis";
import {
  findLastDotOutsideParens,
  findResolvedMember,
  tryResolveExpressionTypeFullName,
  tryResolveTypeFullNameFromTypeString
} from "./members";
import type { WorkspaceFunctionDeclarationsByName } from "./navigation";
import type { CompletionIndex, TypeResolutionContext } from "./types";

interface CommentLine {
  lineNumber: number;
  text: string;
}

const openplanetDocsBaseUrl = "https://openplanet.dev/docs/api";
const nextOpenplanetDocsBaseUrl = "https://next.openplanet.dev";

const builtinTypeNames = new Set<string>([
  "void",
  "bool",
  "int",
  "int8",
  "int16",
  "int32",
  "int64",
  "uint",
  "uint8",
  "uint16",
  "uint32",
  "uint64",
  "float",
  "double",
  "string",
  "vec2",
  "vec3",
  "vec4",
  "int2",
  "int3",
  "nat2",
  "nat3",
  "mat3",
  "mat4",
  "iso3",
  "iso4",
  "quat",
  "MwId"
]);

const builtinTypeNamesWithGlobalDocs = new Set<string>([
  "string",
  "vec2",
  "vec3",
  "vec4",
  "int2",
  "int3",
  "nat2",
  "nat3",
  "mat3",
  "mat4",
  "iso3",
  "iso4",
  "quat",
  "MwId"
]);

export function getHoverAtPosition(
  document: TextDocument,
  lineNumber: number,
  character: number,
  index: CompletionIndex,
  typeContext?: TypeResolutionContext,
  analysis?: DocumentAnalysis,
  allAnalyses?: DocumentAnalysis[],
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Hover | null {
  const identifier = getIdentifierAtPosition(document, lineNumber, character);
  if (!identifier) {
    return null;
  }

  const analysisToUse = analysis;
  const allAnalysesToUse = allAnalyses ?? (analysisToUse ? [analysisToUse] : []);
  const offset = document.offsetAt({ line: lineNumber, character });
  const occurrence = analysisToUse
    ? getOccurrenceAtOffset(analysisToUse, offset) ??
      (offset > 0 ? getOccurrenceAtOffset(analysisToUse, offset - 1) : undefined)
    : undefined;

  if (occurrence && occurrence.qualifier === "dot") {
    return buildMemberHover(
      document,
      lineNumber,
      identifier.startCharacter,
      occurrence.name,
      index,
      typeContext
    );
  }

  if (analysisToUse && occurrence && occurrence.qualifier === "none") {
    const typeHover = buildTypeHover(occurrence.name, occurrence.isCall, index);
    if (typeHover) {
      return typeHover;
    }

    const callableHover = buildCallableHover(
      document,
      occurrence.name,
      occurrence.qualifier,
      occurrence.isCall,
      lineNumber,
      occurrence.range.start.character,
      index,
      allAnalysesToUse,
      workspaceFunctionDeclarationsByName
    );
    if (callableHover) {
      return callableHover;
    }
  }

  if (analysisToUse && occurrence && occurrence.qualifier === "namespace") {
    const callableHover = buildCallableHover(
      document,
      occurrence.name,
      occurrence.qualifier,
      occurrence.isCall,
      lineNumber,
      occurrence.range.start.character,
      index,
      allAnalysesToUse,
      workspaceFunctionDeclarationsByName
    );
    if (callableHover) {
      return callableHover;
    }
  }

  return buildMemberHover(
    document,
    lineNumber,
    identifier.startCharacter,
    identifier.text,
    index,
    typeContext
  );
}

function buildTypeHover(
  identifierText: string,
  isCall: boolean,
  index: CompletionIndex
): Hover | null {
  if (isCall) {
    return null;
  }

  const resolvedTypeName = resolveTypeName(identifierText, index);
  if (!resolvedTypeName) {
    return null;
  }

  const links = buildTypeDocumentationLinks(resolvedTypeName, index);

  return createMarkdownHover([resolvedTypeName], links.join("\n"));
}

function resolveTypeName(
  identifierText: string,
  index: CompletionIndex
): string | undefined {
  if (index.typeInfoByFullName.has(identifierText)) {
    return identifierText;
  }

  const byShortName = index.typeFullNamesByShortName.get(identifierText);
  if (byShortName && byShortName.length > 0) {
    return byShortName[0];
  }

  if (builtinTypeNames.has(identifierText)) {
    return identifierText;
  }

  return undefined;
}

function buildTypeDocumentationLinks(
  resolvedTypeName: string,
  index: CompletionIndex
): string[] {
  const typeName = resolvedTypeName.split("::").pop() ?? resolvedTypeName;
  const encodedTypeName = encodeURIComponent(typeName);
  const links: string[] = [];
  if (shouldAddOpenplanetGlobalTypeDocsLink(resolvedTypeName, typeName, index)) {
    links.push(
      `Openplanet global docs: [${typeName}](${openplanetDocsBaseUrl}/global/${encodedTypeName})`
    );
  }

  const namespaceBucket = index.namespaceBuckets.get(typeName);
  const hasNamespaceSymbols =
    !!namespaceBucket && namespaceBucket.items.length > 0;
  const hasNamespaceChildren = index.namespaceChildren.has(typeName);
  if (hasNamespaceSymbols || hasNamespaceChildren) {
    links.push(
      `Openplanet namespace docs: [${typeName}](${openplanetDocsBaseUrl}/${encodedTypeName})`
    );
  }

  return links;
}

function shouldAddOpenplanetGlobalTypeDocsLink(
  resolvedTypeName: string,
  shortTypeName: string,
  index: CompletionIndex
): boolean {
  if (index.gameTypeFullNames.has(resolvedTypeName)) {
    return false;
  }

  if (builtinTypeNamesWithGlobalDocs.has(shortTypeName)) {
    return true;
  }

  const candidateFullNames = index.typeFullNamesByShortName.get(shortTypeName) ?? [];
  return candidateFullNames.some(
    (fullName) => !index.gameTypeFullNames.has(fullName)
  );
}

function buildMemberHover(
  document: TextDocument,
  lineNumber: number,
  identifierStartCharacter: number,
  identifierText: string,
  index: CompletionIndex,
  typeContext?: TypeResolutionContext
): Hover | null {
  const lineText = getLineText(document, lineNumber);
  const beforeWord = lineText.slice(0, identifierStartCharacter);
  const dotIndex = findLastDotOutsideParens(beforeWord);
  if (dotIndex < 0) {
    return null;
  }

  if (beforeWord.slice(dotIndex + 1).trim().length !== 0) {
    return null;
  }

  const receiverText = extractReceiverExpression(beforeWord.slice(0, dotIndex));
  if (!receiverText) {
    return null;
  }

  const receiverTypeFullName = tryResolveExpressionTypeFullName(
    index,
    receiverText,
    typeContext
  );
  if (!receiverTypeFullName) {
    return null;
  }

  const member = findResolvedMember(index, receiverTypeFullName, identifierText);
  if (!member) {
    return null;
  }

  const preferredNamespace =
    index.typeInfoByFullName.get(receiverTypeFullName)?.namespace;
  const typeDisplayText =
    member.kind === "property" ? member.type ?? "var" : member.returnType ?? "void";
  const linkedTypeDisplay = buildLinkedTypeDisplay(
    typeDisplayText,
    index,
    preferredNamespace
  );
  const signatureLine =
    member.kind === "property"
      ? `${linkedTypeDisplay} ${member.name}`
      : `${linkedTypeDisplay} ${member.name}(${member.args ?? ""})`;
  const linkedReceiverType = buildLinkedTypeFullNameDisplay(
    receiverTypeFullName,
    index
  );

  return createMarkdownTextHover([signatureLine, `Type: ${linkedReceiverType}`]);
}

function buildCallableHover(
  document: TextDocument,
  callableName: string,
  qualifier: "none" | "dot" | "namespace",
  isCall: boolean,
  lineNumber: number,
  identifierStartCharacter: number,
  index: CompletionIndex,
  allAnalyses: DocumentAnalysis[],
  workspaceFunctionDeclarationsByName?: WorkspaceFunctionDeclarationsByName
): Hover | null {
  if (qualifier === "dot") {
    return null;
  }

  const signatures = new Set<string>();
  const documentationBlocks: string[] = [];

  if (qualifier !== "namespace") {
    for (const declaration of collectFunctionDeclarationsByName(
      allAnalyses,
      callableName,
      workspaceFunctionDeclarationsByName
    )) {
      signatures.add(
        formatFunctionSignatureLabel(
          declaration.declaration.returnType,
          declaration.declaration.name,
          declaration.declaration.argsText
        )
      );

      const docs = extractLeadingLineComments(
        declaration.analysis,
        declaration.declaration
      );
      const documentationBlock = formatCommentDocumentation(docs);
      if (
        documentationBlock &&
        !documentationBlocks.includes(documentationBlock)
      ) {
        documentationBlocks.push(documentationBlock);
      }
    }

    for (const signature of index.coreFunctionSignatures.get(callableName) ?? []) {
      signatures.add(signature.trim());
    }
  } else {
    const qualifiedName = getQualifiedCallableNameAtPosition(
      document,
      lineNumber,
      identifierStartCharacter,
      callableName
    );
    if (qualifiedName) {
      for (const signature of index.coreFunctionSignaturesByQualifiedName.get(
        qualifiedName
      ) ?? []) {
        signatures.add(signature.trim());
      }
    }
  }

  if (signatures.size === 0 && index.coreGlobalFuncdefNames.has(callableName)) {
    signatures.add(`funcdef ${callableName}`);
  }

  if (signatures.size === 0 || !isCall) {
    return null;
  }

  const docs = documentationBlocks.length > 0
    ? documentationBlocks.join("\n\n")
    : undefined;
  return createMarkdownHover([...signatures], docs);
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

function formatFunctionSignatureLabel(
  returnType: string,
  functionName: string,
  argsText: string
): string {
  const normalizedArgs = argsText.trim();
  return `${returnType} ${functionName}(${normalizedArgs})`.trim();
}

function encodeTypePathForDocs(typeFullName: string): string {
  return typeFullName
    .split("::")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildLinkedTypeDisplay(
  typeString: string,
  index: CompletionIndex,
  preferredNamespace?: string
): string {
  const resolvedType = tryResolveTypeFullNameFromTypeString(
    index,
    typeString,
    preferredNamespace
  );
  if (!resolvedType || !index.gameTypeFullNames.has(resolvedType)) {
    return typeString;
  }

  return `[${typeString}](${nextOpenplanetDocsBaseUrl}/${encodeTypePathForDocs(resolvedType)})`;
}

function buildLinkedTypeFullNameDisplay(
  typeFullName: string,
  index: CompletionIndex
): string {
  if (!index.gameTypeFullNames.has(typeFullName)) {
    return `\`${typeFullName}\``;
  }

  return `[${typeFullName}](${nextOpenplanetDocsBaseUrl}/${encodeTypePathForDocs(typeFullName)})`;
}

function createMarkdownHover(
  signatures: string[],
  details?: string
): Hover {
  const lines = [
    "```angelscript",
    ...signatures,
    "```"
  ];
  if (details && details.trim().length > 0) {
    lines.push("", details.trim());
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: lines.join("\n")
    }
  };
}

function createMarkdownTextHover(lines: string[]): Hover {
  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: lines.join("  \n")
    }
  };
}

function extractLeadingLineComments(
  analysis: DocumentAnalysis,
  declaration: FunctionDeclaration
): CommentLine[] | undefined {
  const lines = analysis.text.replace(/\r/g, "").split("\n");
  let lineIndex = declaration.range.start.line - 1;
  const collected: CommentLine[] = [];

  while (lineIndex >= 0) {
    const lineText = lines[lineIndex] ?? "";
    const trimmed = lineText.trim();
    if (/^\/\/\/?/.test(trimmed)) {
      collected.push({
        lineNumber: lineIndex + 1,
        text: trimmed.replace(/^\/\/\/?\s?/, "")
      });
      lineIndex -= 1;
      continue;
    }

    if (trimmed.length === 0 && collected.length === 0) {
      lineIndex -= 1;
      continue;
    }

    break;
  }

  if (collected.length === 0) {
    return undefined;
  }

  collected.reverse();
  return collected;
}

function formatCommentDocumentation(
  commentLines: CommentLine[] | undefined
): string | undefined {
  if (!commentLines || commentLines.length === 0) {
    return undefined;
  }

  const renderedLines = commentLines.map((commentLine) => {
    const text = commentLine.text.trim();
    return `- L${commentLine.lineNumber}: ${text.length > 0 ? text : "(blank)"}`;
  });

  return ["Documentation:", ...renderedLines].join("\n");
}

function getQualifiedCallableNameAtPosition(
  document: TextDocument,
  lineNumber: number,
  identifierStartCharacter: number,
  callableName: string
): string | undefined {
  const lineText = getLineText(document, lineNumber);
  const endCharacter = Math.min(
    lineText.length,
    identifierStartCharacter + callableName.length
  );
  const linePrefix = lineText.slice(0, endCharacter);
  const match =
    /([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)$/.exec(linePrefix);
  if (!match) {
    return undefined;
  }

  const qualifiedName = match[1];
  if (!qualifiedName.endsWith(`::${callableName}`)) {
    return undefined;
  }

  return qualifiedName;
}

function extractReceiverExpression(beforeDot: string): string | undefined {
  let text = beforeDot.trimEnd();
  if (!text) {
    return undefined;
  }

  let depth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;
  let cutIndex = -1;

  for (let i = 0; i < text.length; i += 1) {
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

    if (depth === 0 && (ch === ";" || ch === "=" || ch === ",")) {
      cutIndex = i;
      continue;
    }

    if (depth === 0 && ch === "(" && isControlKeywordBefore(text, i)) {
      cutIndex = i;
      depth += 1;
      continue;
    }

    if (ch === "(") {
      depth += 1;
      continue;
    }

    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
  }

  text = text.slice(cutIndex + 1).trim();
  text = text.replace(/^(?:return|yield)\b\s*/, "").trim();

  return text.length > 0 ? text : undefined;
}

function isControlKeywordBefore(text: string, index: number): boolean {
  const before = text.slice(0, index).trimEnd();
  return /\b(?:if|while|for|switch|catch)$/.test(before);
}

function getLineText(document: TextDocument, lineNumber: number): string {
  const lineStart = { line: lineNumber, character: 0 };
  const lineEnd = { line: lineNumber + 1, character: 0 };
  return document.getText({ start: lineStart, end: lineEnd });
}

function getIdentifierAtPosition(
  document: TextDocument,
  lineNumber: number,
  character: number
): { text: string; startCharacter: number; endCharacter: number } | undefined {
  const lineText = getLineText(document, lineNumber);
  if (!lineText) {
    return undefined;
  }

  const clampedCharacter = Math.min(
    character,
    Math.max(0, lineText.length - 1)
  );
  let start = clampedCharacter;
  let end = clampedCharacter;

  while (start > 0 && /[A-Za-z0-9_]/.test(lineText[start - 1])) {
    start -= 1;
  }

  while (end < lineText.length && /[A-Za-z0-9_]/.test(lineText[end])) {
    end += 1;
  }

  if (start === end) {
    return undefined;
  }

  const text = lineText.slice(start, end);
  if (!/^[A-Za-z_]/.test(text)) {
    return undefined;
  }

  return { text, startCharacter: start, endCharacter: end };
}
