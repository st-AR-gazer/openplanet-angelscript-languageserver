import { isLanguageKeyword, normalizeTypeText } from "./language";

export type ParserTokenKind = "identifier" | "symbol";

export interface ParserToken {
  kind: ParserTokenKind;
  text: string;
  start: number;
  end: number;
}

export interface ParsedFunctionNode {
  name: string;
  nameStart: number;
  nameEnd: number;
  openParen: number;
  closeParen: number;
  openBrace: number;
  closeBrace: number;
  returnType: string;
}

export type ParsedTypeKind = "class" | "interface" | "enum";

export interface ParsedTypeNode {
  kind: ParsedTypeKind;
  name: string;
  fullName: string;
  start: number;
  end: number;
}

export interface ParsedCallableDeclarationNode {
  kind: "funcdef" | "import";
  name: string;
  start: number;
  end: number;
  statementStart: number;
  statementEnd: number;
  openParen: number;
  closeParen: number;
}

export interface ParsedDocumentStructure {
  tokens: ParserToken[];
  functions: ParsedFunctionNode[];
  typeDeclarations: ParsedTypeNode[];
  callableDeclarations: ParsedCallableDeclarationNode[];
}

const functionPrefixModifierTokens = new Set<string>([
  "const",
  "shared",
  "private",
  "protected",
  "final",
  "override",
  "external",
  "explicit",
  "abstract",
  "mixin"
]);

const functionTrailingQualifierTokens = new Set<string>([
  "const",
  "final",
  "override"
]);

const invalidFunctionNames = new Set<string>([
  "if",
  "for",
  "while",
  "do",
  "switch",
  "case",
  "default",
  "return",
  "break",
  "continue",
  "else",
  "catch"
]);

export function parseDocumentStructure(
  maskedText: string
): ParsedDocumentStructure {
  const tokens = tokenizeMaskedText(maskedText);
  const parser = new DocumentStructureParser(maskedText, tokens);
  parser.parse();

  return {
    tokens,
    functions: parser.functions.sort((a, b) => a.openBrace - b.openBrace),
    typeDeclarations: parser.typeDeclarations.sort((a, b) => a.start - b.start),
    callableDeclarations: dedupeCallableDeclarations(parser.callableDeclarations)
  };
}

class DocumentStructureParser {
  public readonly functions: ParsedFunctionNode[] = [];
  public readonly typeDeclarations: ParsedTypeNode[] = [];
  public readonly callableDeclarations: ParsedCallableDeclarationNode[] = [];

  public constructor(
    private readonly text: string,
    private readonly tokens: ParserToken[]
  ) {}

  public parse(): void {
    this.parseScope(0, this.tokens.length, []);
  }

  private parseScope(
    startIndex: number,
    endIndex: number,
    namespaceStack: string[]
  ): number {
    let i = startIndex;

    while (i < endIndex) {
      const token = this.tokens[i];
      if (!token) {
        break;
      }

      const namespaceEnd = this.tryParseNamespace(i, endIndex, namespaceStack);
      if (namespaceEnd !== undefined) {
        i = namespaceEnd;
        continue;
      }

      const typeEnd = this.tryParseTypeDeclaration(i, endIndex, namespaceStack);
      if (typeEnd !== undefined) {
        i = typeEnd;
        continue;
      }

      const funcdefEnd = this.tryParseCallableDeclaration(i, endIndex, "funcdef");
      if (funcdefEnd !== undefined) {
        i = funcdefEnd;
        continue;
      }

      const importEnd = this.tryParseCallableDeclaration(i, endIndex, "import");
      if (importEnd !== undefined) {
        i = importEnd;
        continue;
      }

      const parsedFunction = this.tryParseFunction(i, endIndex);
      if (parsedFunction) {
        this.functions.push(parsedFunction.node);
        i = parsedFunction.nextIndex;
        continue;
      }

      if (token.kind === "symbol" && token.text === "{") {
        const closeIndex = this.findMatchingTokenIndex(i, "{", "}");
        if (closeIndex < 0) {
          return endIndex;
        }
        i = closeIndex + 1;
        continue;
      }

      if (token.kind === "symbol" && token.text === "}") {
        return i + 1;
      }

      i += 1;
    }

    return i;
  }

  private tryParseNamespace(
    tokenIndex: number,
    scopeEndIndex: number,
    namespaceStack: string[]
  ): number | undefined {
    const keyword = this.tokens[tokenIndex];
    if (
      keyword?.kind !== "identifier" ||
      keyword.text !== "namespace"
    ) {
      return undefined;
    }

    const nameToken = this.tokens[tokenIndex + 1];
    const openBraceToken = this.tokens[tokenIndex + 2];
    if (
      nameToken?.kind !== "identifier" ||
      openBraceToken?.kind !== "symbol" ||
      openBraceToken.text !== "{"
    ) {
      return undefined;
    }

    const closeBraceIndex = this.findMatchingTokenIndex(tokenIndex + 2, "{", "}");
    if (closeBraceIndex < 0) {
      return scopeEndIndex;
    }

    this.parseScope(
      tokenIndex + 3,
      closeBraceIndex,
      [...namespaceStack, nameToken.text]
    );

    return closeBraceIndex + 1;
  }

  private tryParseTypeDeclaration(
    tokenIndex: number,
    scopeEndIndex: number,
    namespaceStack: string[]
  ): number | undefined {
    const keyword = this.tokens[tokenIndex];
    if (
      keyword?.kind !== "identifier" ||
      (keyword.text !== "class" &&
        keyword.text !== "interface" &&
        keyword.text !== "enum")
    ) {
      return undefined;
    }

    const nameToken = this.tokens[tokenIndex + 1];
    if (nameToken?.kind !== "identifier" || isLanguageKeyword(nameToken.text)) {
      return undefined;
    }

    const namespacePrefix =
      namespaceStack.length > 0 ? `${namespaceStack.join("::")}::` : "";
    this.typeDeclarations.push({
      kind: keyword.text,
      name: nameToken.text,
      fullName: `${namespacePrefix}${nameToken.text}`,
      start: nameToken.start,
      end: nameToken.end
    });

    const bodyStartIndex = this.findFirstTokenIndex(
      tokenIndex + 2,
      scopeEndIndex,
      ["{", ";"]
    );
    if (bodyStartIndex < 0) {
      return tokenIndex + 2;
    }

    const bodyStart = this.tokens[bodyStartIndex];
    if (bodyStart?.kind !== "symbol") {
      return bodyStartIndex + 1;
    }

    if (bodyStart.text === ";") {
      return bodyStartIndex + 1;
    }

    const bodyEndIndex = this.findMatchingTokenIndex(bodyStartIndex, "{", "}");
    if (bodyEndIndex < 0) {
      return scopeEndIndex;
    }

    if (keyword.text === "class" || keyword.text === "interface") {
      this.parseScope(bodyStartIndex + 1, bodyEndIndex, namespaceStack);
    }

    return bodyEndIndex + 1;
  }

  private tryParseCallableDeclaration(
    tokenIndex: number,
    scopeEndIndex: number,
    keyword: "funcdef" | "import"
  ): number | undefined {
    const startToken = this.tokens[tokenIndex];
    if (startToken?.kind !== "identifier" || startToken.text !== keyword) {
      return undefined;
    }

    const terminatorIndex = this.findFirstTokenIndex(
      tokenIndex + 1,
      scopeEndIndex,
      [";"]
    );
    if (terminatorIndex < 0) {
      return scopeEndIndex;
    }

    const openParenIndex = this.findFirstTokenIndex(
      tokenIndex + 1,
      terminatorIndex,
      ["("]
    );
    if (openParenIndex < 0) {
      return terminatorIndex + 1;
    }

    const closeParenIndex = this.findMatchingTokenIndex(openParenIndex, "(", ")");
    if (closeParenIndex < 0 || closeParenIndex > terminatorIndex) {
      return terminatorIndex + 1;
    }

    const nameTokenIndex = this.findCallableNameTokenIndex(tokenIndex + 1, openParenIndex);
    if (nameTokenIndex >= 0) {
      const nameToken = this.tokens[nameTokenIndex];
      const terminatorToken = this.tokens[terminatorIndex];
      if (
        nameToken &&
        terminatorToken &&
        !isLanguageKeyword(nameToken.text)
      ) {
        this.callableDeclarations.push({
          kind: keyword,
          name: nameToken.text,
          start: nameToken.start,
          end: nameToken.end,
          statementStart: startToken.start,
          statementEnd: terminatorToken.end,
          openParen: this.tokens[openParenIndex].start,
          closeParen: this.tokens[closeParenIndex].start
        });
      }
    }

    return terminatorIndex + 1;
  }

  private tryParseFunction(
    tokenIndex: number,
    scopeEndIndex: number
  ):
    | {
        node: ParsedFunctionNode;
        nextIndex: number;
      }
    | undefined {
    if (!this.isLikelyDeclarationStart(tokenIndex)) {
      return undefined;
    }

    let cursor = tokenIndex;
    cursor = this.skipLeadingAttributes(cursor, scopeEndIndex);

    while (cursor < scopeEndIndex) {
      const token = this.tokens[cursor];
      if (
        token?.kind === "identifier" &&
        functionPrefixModifierTokens.has(token.text)
      ) {
        cursor += 1;
        continue;
      }
      break;
    }

    if (cursor >= scopeEndIndex) {
      return undefined;
    }

    const openParenIndex = this.findFirstTokenIndexBeforeTerminator(
      cursor,
      scopeEndIndex,
      "("
    );
    if (openParenIndex < 0) {
      return undefined;
    }

    const nameTokenInfo = this.getFunctionNameTokenInfo(openParenIndex);
    if (!nameTokenInfo) {
      return undefined;
    }

    const { name, nameStart, nameEnd, nameTokenIndex } = nameTokenInfo;
    const baseFunctionName = name.startsWith("~") ? name.slice(1) : name;
    if (!baseFunctionName || invalidFunctionNames.has(baseFunctionName)) {
      return undefined;
    }

    const previousToken = this.findPreviousToken(nameTokenIndex - 1);
    if (
      previousToken?.kind === "symbol" &&
      (previousToken.text === "." || previousToken.text === "::")
    ) {
      return undefined;
    }

    const closeParenIndex = this.findMatchingTokenIndex(openParenIndex, "(", ")");
    if (closeParenIndex < 0) {
      return undefined;
    }

    let afterCloseParenIndex = closeParenIndex + 1;
    while (afterCloseParenIndex < scopeEndIndex) {
      const token = this.tokens[afterCloseParenIndex];
      if (
        token?.kind === "identifier" &&
        functionTrailingQualifierTokens.has(token.text)
      ) {
        afterCloseParenIndex += 1;
        continue;
      }
      break;
    }

    const openBraceToken = this.tokens[afterCloseParenIndex];
    if (
      !openBraceToken ||
      openBraceToken.kind !== "symbol" ||
      openBraceToken.text !== "{"
    ) {
      return undefined;
    }

    const closeBraceIndex = this.findMatchingTokenIndex(afterCloseParenIndex, "{", "}");
    if (closeBraceIndex < 0) {
      return undefined;
    }

    const declarationStartOffset = this.findDeclarationStartOffset(tokenIndex);
    const rawPrefix = this.text.slice(declarationStartOffset, nameStart).trim();
    const returnTypeRaw = normalizeTypeText(
      stripFunctionModifiers(stripLeadingAttributes(rawPrefix))
    );
    const isCtorOrDtor = returnTypeRaw.length === 0;

    return {
      node: {
        name,
        nameStart,
        nameEnd,
        openParen: this.tokens[openParenIndex].start,
        closeParen: this.tokens[closeParenIndex].start,
        openBrace: openBraceToken.start,
        closeBrace: this.tokens[closeBraceIndex].start,
        returnType: isCtorOrDtor ? "" : returnTypeRaw || "void"
      },
      nextIndex: closeBraceIndex + 1
    };
  }

  private findCallableNameTokenIndex(
    startIndex: number,
    openParenIndex: number
  ): number {
    for (let i = openParenIndex - 1; i >= startIndex; i -= 1) {
      const token = this.tokens[i];
      if (token?.kind === "identifier") {
        return i;
      }
    }

    return -1;
  }

  private getFunctionNameTokenInfo(
    openParenIndex: number
  ):
    | {
        name: string;
        nameStart: number;
        nameEnd: number;
        nameTokenIndex: number;
      }
    | undefined {
    const maybeName = this.tokens[openParenIndex - 1];
    const maybeTilde = this.tokens[openParenIndex - 2];
    if (
      maybeName?.kind === "identifier" &&
      maybeTilde?.kind === "symbol" &&
      maybeTilde.text === "~"
    ) {
      return {
        name: `~${maybeName.text}`,
        nameStart: maybeTilde.start,
        nameEnd: maybeName.end,
        nameTokenIndex: openParenIndex - 2
      };
    }

    const tokenBeforeParen = this.tokens[openParenIndex - 1];
    if (tokenBeforeParen?.kind === "identifier") {
      return {
        name: tokenBeforeParen.text,
        nameStart: tokenBeforeParen.start,
        nameEnd: tokenBeforeParen.end,
        nameTokenIndex: openParenIndex - 1
      };
    }

    return undefined;
  }

  private skipLeadingAttributes(startIndex: number, endIndex: number): number {
    let cursor = startIndex;
    while (cursor < endIndex) {
      const token = this.tokens[cursor];
      if (token?.kind !== "symbol" || token.text !== "[") {
        break;
      }

      const closeIndex = this.findMatchingTokenIndex(cursor, "[", "]");
      if (closeIndex < 0) {
        return cursor;
      }
      cursor = closeIndex + 1;
    }

    return cursor;
  }

  private isLikelyDeclarationStart(tokenIndex: number): boolean {
    const previous = this.findPreviousToken(tokenIndex - 1);
    if (!previous) {
      return true;
    }
    if (previous.kind !== "symbol") {
      return false;
    }

    return (
      previous.text === ";" ||
      previous.text === "{" ||
      previous.text === "}" ||
      previous.text === ":"
    );
  }

  private findDeclarationStartOffset(tokenIndex: number): number {
    for (let i = tokenIndex - 1; i >= 0; i -= 1) {
      const token = this.tokens[i];
      if (token?.kind !== "symbol") {
        continue;
      }
      if (
        token.text === ";" ||
        token.text === "{" ||
        token.text === "}" ||
        token.text === ":"
      ) {
        return token.end;
      }
    }

    return 0;
  }

  private findFirstTokenIndex(
    startIndex: number,
    endIndex: number,
    symbols: string[]
  ): number {
    const symbolSet = new Set(symbols);
    for (let i = startIndex; i < endIndex; i += 1) {
      const token = this.tokens[i];
      if (token?.kind === "symbol" && symbolSet.has(token.text)) {
        return i;
      }
    }

    return -1;
  }

  private findFirstTokenIndexBeforeTerminator(
    startIndex: number,
    endIndex: number,
    symbol: string
  ): number {
    for (let i = startIndex; i < endIndex; i += 1) {
      const token = this.tokens[i];
      if (!token || token.kind !== "symbol") {
        continue;
      }

      if (token.text === symbol) {
        return i;
      }

      if (token.text === ";" || token.text === "{" || token.text === "}") {
        return -1;
      }
    }

    return -1;
  }

  private findPreviousToken(startIndex: number): ParserToken | undefined {
    for (let i = startIndex; i >= 0; i -= 1) {
      const token = this.tokens[i];
      if (token) {
        return token;
      }
    }

    return undefined;
  }

  private findMatchingTokenIndex(
    openIndex: number,
    openSymbol: string,
    closeSymbol: string
  ): number {
    let depth = 0;

    for (let i = openIndex; i < this.tokens.length; i += 1) {
      const token = this.tokens[i];
      if (token?.kind !== "symbol") {
        continue;
      }

      if (token.text === openSymbol) {
        depth += 1;
        continue;
      }

      if (token.text === closeSymbol) {
        depth -= 1;
        if (depth === 0) {
          return i;
        }
      }
    }

    return -1;
  }
}

function stripFunctionModifiers(text: string): string {
  let output = text.trim();
  while (output.length > 0) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\b/.exec(output);
    if (!match) {
      break;
    }

    const token = match[1];
    if (!functionPrefixModifierTokens.has(token)) {
      break;
    }

    output = output.slice(match[0].length).trimStart();
  }

  return output.trim();
}

function stripLeadingAttributes(text: string): string {
  let output = text.trimStart();

  while (output.startsWith("[")) {
    let depth = 0;
    let consumed = -1;

    for (let i = 0; i < output.length; i += 1) {
      const ch = output[i];
      if (ch === "[") {
        depth += 1;
        continue;
      }
      if (ch === "]") {
        depth -= 1;
        if (depth === 0) {
          consumed = i + 1;
          break;
        }
      }
    }

    if (consumed < 0) {
      break;
    }

    output = output.slice(consumed).trimStart();
  }

  return output.trim();
}

function dedupeCallableDeclarations(
  declarations: ParsedCallableDeclarationNode[]
): ParsedCallableDeclarationNode[] {
  const deduped: ParsedCallableDeclarationNode[] = [];
  const seenStarts = new Set<number>();

  for (const declaration of declarations.sort((a, b) => a.start - b.start)) {
    if (seenStarts.has(declaration.start)) {
      continue;
    }

    seenStarts.add(declaration.start);
    deduped.push(declaration);
  }

  return deduped;
}

export function tokenizeMaskedText(maskedText: string): ParserToken[] {
  const tokens: ParserToken[] = [];

  for (let i = 0; i < maskedText.length; ) {
    const ch = maskedText[i];

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < maskedText.length && /[A-Za-z0-9_]/.test(maskedText[j])) {
        j += 1;
      }
      tokens.push({
        kind: "identifier",
        text: maskedText.slice(i, j),
        start: i,
        end: j
      });
      i = j;
      continue;
    }

    if (ch === ":" && maskedText[i + 1] === ":") {
      tokens.push({
        kind: "symbol",
        text: "::",
        start: i,
        end: i + 2
      });
      i += 2;
      continue;
    }

    if ("(){}[],;.=~<>@&|^%:+-*/!?".includes(ch)) {
      tokens.push({
        kind: "symbol",
        text: ch,
        start: i,
        end: i + 1
      });
    }

    i += 1;
  }

  return tokens;
}
