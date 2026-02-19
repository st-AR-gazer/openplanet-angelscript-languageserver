import { isLanguageKeyword, normalizeTypeText } from "./language";

export type GrammarTokenKind =
  | "identifier"
  | "keyword"
  | "number"
  | "string"
  | "symbol"
  | "eof";

export interface GrammarToken {
  kind: GrammarTokenKind;
  text: string;
  start: number;
  end: number;
}

export interface GrammarParseError {
  code: "unparsable-statement";
  message: string;
  start: number;
  end: number;
}

export interface GrammarProgramNode {
  kind: "program";
  declarations: GrammarDeclarationNode[];
  start: number;
  end: number;
}

export type GrammarDeclarationNode =
  | GrammarNamespaceDeclarationNode
  | GrammarTypeDeclarationNode
  | GrammarFunctionDeclarationNode
  | GrammarStatementNode;

export interface GrammarNamespaceDeclarationNode {
  kind: "namespace";
  name: string;
  body: GrammarDeclarationNode[];
  start: number;
  end: number;
}

export type GrammarTypeKind = "class" | "interface" | "enum";

export interface GrammarTypeDeclarationNode {
  kind: "type";
  typeKind: GrammarTypeKind;
  name: string;
  body: GrammarDeclarationNode[];
  start: number;
  end: number;
}

export interface GrammarFunctionDeclarationNode {
  kind: "function";
  name: string;
  nameStart: number;
  nameEnd: number;
  openParen: number;
  closeParen: number;
  returnTypeText: string;
  parameters: GrammarFunctionParameterNode[];
  start: number;
  end: number;
  openBrace?: number;
  closeBrace?: number;
  body?: GrammarBlockStatementNode;
}

export type GrammarStatementNode =
  | GrammarBlockStatementNode
  | GrammarControlStatementNode
  | GrammarVariableDeclarationStatementNode
  | GrammarSimpleStatementNode;

export interface GrammarFunctionParameterNode {
  name: string;
  typeText: string;
  optional: boolean;
  start: number;
  end: number;
  nameStart: number;
  nameEnd: number;
}

export interface GrammarVariableDeclaratorNode {
  name: string;
  nameStart: number;
  nameEnd: number;
  start: number;
  end: number;
}

export interface GrammarVariableDeclarationStatementNode {
  kind: "variable-declaration";
  typeText: string;
  declarators: GrammarVariableDeclaratorNode[];
  start: number;
  end: number;
}

export interface GrammarBlockStatementNode {
  kind: "block";
  statements: GrammarStatementNode[];
  start: number;
  end: number;
}

export interface GrammarControlStatementNode {
  kind:
    | "if"
    | "else"
    | "for"
    | "foreach"
    | "while"
    | "do"
    | "switch"
    | "try"
    | "catch"
    | "case"
    | "default";
  start: number;
  end: number;
  body?: GrammarStatementNode;
}

export interface GrammarSimpleStatementNode {
  kind: "statement";
  start: number;
  end: number;
}

export interface GrammarParseResult {
  tokens: GrammarToken[];
  program: GrammarProgramNode;
  errors: GrammarParseError[];
}

const declarationModifierKeywords = new Set<string>([
  "const",
  "shared",
  "private",
  "protected",
  "final",
  "override",
  "external",
  "explicit",
  "abstract",
  "mixin",
  "auto",
  "property"
]);

const controlKeywords = new Set<string>([
  "if",
  "for",
  "foreach",
  "while",
  "switch",
  "catch"
]);

const twoCharSymbols = new Set<string>([
  "::",
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "&=",
  "|=",
  "^=",
  "<<",
  ">>",
  "->"
]);

const keywords = new Set<string>([
  "if",
  "else",
  "for",
  "foreach",
  "while",
  "do",
  "switch",
  "case",
  "default",
  "break",
  "continue",
  "return",
  "class",
  "interface",
  "enum",
  "namespace",
  "funcdef",
  "typedef",
  "using",
  "import",
  "from",
  "in",
  "out",
  "inout",
  "is",
  "not",
  "and",
  "or",
  "xor",
  "cast",
  "mixin",
  "try",
  "catch",
  "throw",
  "const",
  "private",
  "protected",
  "shared",
  "override",
  "external",
  "final",
  "explicit",
  "abstract",
  "delete",
  "this",
  "super",
  "property",
  "get",
  "set",
  "function",
  "true",
  "false",
  "null",
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
  "auto"
]);

const invalidFunctionNameKeywords = new Set<string>([
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
  "catch",
  "throw"
]);

const invalidTypePrefixKeywords = new Set<string>([
  "if",
  "else",
  "for",
  "foreach",
  "while",
  "switch",
  "case",
  "default",
  "return",
  "break",
  "continue",
  "throw",
  "try",
  "catch",
  "delete",
  "new"
]);

const typeOnlyKeywords = new Set<string>([
  "const",
  "auto",
  "in",
  "out",
  "inout",
  "shared",
  "private",
  "protected",
  "final",
  "explicit",
  "abstract",
  "mixin"
]);

export function parseGrammarPipeline(text: string): GrammarParseResult {
  const tokens = tokenizeGrammarText(text);
  const parser = new GrammarParser(tokens, text);
  const program = parser.parseProgram();
  return {
    tokens,
    program,
    errors: parser.errors
  };
}

class GrammarParser {
  public readonly errors: GrammarParseError[] = [];
  private index = 0;

  public constructor(
    private readonly tokens: GrammarToken[],
    private readonly sourceText: string
  ) {}

  public parseProgram(): GrammarProgramNode {
    const declarations: GrammarDeclarationNode[] = [];
    const start = this.current().start;

    while (!this.isAtEnd()) {
      const declaration = this.parseDeclaration(false);
      if (declaration) {
        declarations.push(declaration);
        continue;
      }

      const before = this.index;
      this.synchronizeToDeclarationBoundary();
      if (this.index === before) {
        this.index += 1;
      }
    }

    const end = this.current().end;
    return {
      kind: "program",
      declarations,
      start,
      end
    };
  }

  private parseDeclaration(inTypeBody: boolean): GrammarDeclarationNode | undefined {
    const token = this.current();
    if (token.kind === "keyword" && token.text === "namespace") {
      return this.parseNamespaceDeclaration();
    }

    if (
      token.kind === "keyword" &&
      (token.text === "class" || token.text === "interface" || token.text === "enum")
    ) {
      return this.parseTypeDeclaration();
    }

    const functionHeader = this.peekFunctionHeader();
    if (functionHeader) {
      return this.parseFunctionDeclaration(functionHeader);
    }

    if (inTypeBody) {
      return this.parseSimpleStatement(false);
    }

    return this.parseSimpleStatement(true);
  }

  private parseNamespaceDeclaration(): GrammarNamespaceDeclarationNode {
    const startToken = this.current();
    this.advance();
    const nameToken = this.current();
    const name =
      nameToken.kind === "identifier" || nameToken.kind === "keyword"
        ? nameToken.text
        : "<anonymous>";

    if (nameToken.kind === "identifier" || nameToken.kind === "keyword") {
      this.advance();
    } else {
      this.reportError(
        'Expected namespace identifier after "namespace".',
        startToken.start,
        startToken.end
      );
    }

    if (!this.matchSymbol("{")) {
      this.reportError(
        'Expected "{" to open namespace body.',
        nameToken.start,
        nameToken.end
      );
      return {
        kind: "namespace",
        name,
        body: [],
        start: startToken.start,
        end: nameToken.end
      };
    }

    const declarations: GrammarDeclarationNode[] = [];
    while (!this.isAtEnd() && !this.checkSymbol("}")) {
      const declaration = this.parseDeclaration(false);
      if (declaration) {
        declarations.push(declaration);
        continue;
      }

      const before = this.index;
      this.synchronizeToDeclarationBoundary();
      if (before === this.index) {
        this.index += 1;
      }
    }

    const endToken = this.expectSymbol("}", 'Expected "}" to close namespace body.');
    return {
      kind: "namespace",
      name,
      body: declarations,
      start: startToken.start,
      end: endToken.end
    };
  }

  private parseTypeDeclaration(): GrammarTypeDeclarationNode {
    const keyword = this.current();
    const typeKind = keyword.text as GrammarTypeKind;
    this.advance();

    const nameToken = this.current();
    const name =
      nameToken.kind === "identifier" || nameToken.kind === "keyword"
        ? nameToken.text
        : "<anonymous>";
    if (nameToken.kind === "identifier" || nameToken.kind === "keyword") {
      this.advance();
    } else {
      this.reportError(
        `Expected ${typeKind} name after "${typeKind}".`,
        keyword.start,
        keyword.end
      );
    }

    while (
      !this.isAtEnd() &&
      !this.checkSymbol("{") &&
      !this.checkSymbol(";") &&
      !this.checkSymbol("}")
    ) {
      this.advance();
    }

    if (this.matchSymbol(";")) {
      return {
        kind: "type",
        typeKind,
        name,
        body: [],
        start: keyword.start,
        end: this.previous().end
      };
    }

    if (!this.matchSymbol("{")) {
      this.reportError(
        `Expected "{" to open ${typeKind} body.`,
        nameToken.start,
        nameToken.end
      );
      return {
        kind: "type",
        typeKind,
        name,
        body: [],
        start: keyword.start,
        end: nameToken.end
      };
    }

    const body: GrammarDeclarationNode[] = [];
    while (!this.isAtEnd() && !this.checkSymbol("}")) {
      const declaration = this.parseDeclaration(true);
      if (declaration) {
        body.push(declaration);
        continue;
      }

      const before = this.index;
      this.synchronizeToDeclarationBoundary();
      if (before === this.index) {
        this.index += 1;
      }
    }

    const endToken = this.expectSymbol("}", `Expected "}" to close ${typeKind} body.`);
    this.matchSymbol(";");

    return {
      kind: "type",
      typeKind,
      name,
      body,
      start: keyword.start,
      end: endToken.end
    };
  }

  private parseFunctionDeclaration(header: FunctionHeaderInfo): GrammarFunctionDeclarationNode {
    const startToken = this.current();
    this.index = header.afterCloseParenIndex;

    while (
      this.current().kind === "keyword" &&
      declarationModifierKeywords.has(this.current().text)
    ) {
      this.advance();
    }

    if (this.matchSymbol("{")) {
      const openBraceToken = this.previous();
      const body = this.parseBlockStatement(openBraceToken);
      return {
        kind: "function",
        name: header.name,
        nameStart: header.nameStart,
        nameEnd: header.nameEnd,
        openParen: header.openParen,
        closeParen: header.closeParen,
        returnTypeText: header.returnTypeText,
        parameters: header.parameters,
        start: startToken.start,
        end: body.end,
        openBrace: openBraceToken.start,
        closeBrace: body.end - 1,
        body
      };
    }

    while (
      !this.isAtEnd() &&
      !this.checkSymbol(";") &&
      !this.checkSymbol("{") &&
      !this.checkSymbol("}")
    ) {
      this.advance();
    }

    if (this.matchSymbol("{")) {
      const openBraceToken = this.previous();
      const body = this.parseBlockStatement(openBraceToken);
      return {
        kind: "function",
        name: header.name,
        nameStart: header.nameStart,
        nameEnd: header.nameEnd,
        openParen: header.openParen,
        closeParen: header.closeParen,
        returnTypeText: header.returnTypeText,
        parameters: header.parameters,
        start: startToken.start,
        end: body.end,
        openBrace: openBraceToken.start,
        closeBrace: body.end - 1,
        body
      };
    }

    const terminator = this.expectSymbol(
      ";",
      `Expected function declaration terminator for "${header.name}".`
    );
    return {
      kind: "function",
      name: header.name,
      nameStart: header.nameStart,
      nameEnd: header.nameEnd,
      openParen: header.openParen,
      closeParen: header.closeParen,
      returnTypeText: header.returnTypeText,
      parameters: header.parameters,
      start: startToken.start,
      end: terminator.end
    };
  }

  private parseBlockStatement(openBraceToken: GrammarToken): GrammarBlockStatementNode {
    const statements: GrammarStatementNode[] = [];
    while (!this.isAtEnd() && !this.checkSymbol("}")) {
      const statement = this.parseStatement();
      if (statement) {
        statements.push(statement);
        continue;
      }

      const before = this.index;
      this.synchronizeToStatementBoundary();
      if (before === this.index) {
        this.index += 1;
      }
    }

    const closeBraceToken = this.expectSymbol("}", 'Expected "}" to close block.');
    return {
      kind: "block",
      statements,
      start: openBraceToken.start,
      end: closeBraceToken.end
    };
  }

  private parseStatement(): GrammarStatementNode | undefined {
    if (this.matchSymbol("{")) {
      return this.parseBlockStatement(this.previous());
    }

    const token = this.current();
    if (token.kind === "keyword") {
      switch (token.text) {
        case "if":
        case "foreach":
        case "for":
        case "while":
        case "switch":
        case "catch":
          return this.parseControlWithCondition(token.text);
        case "else":
          return this.parseElseControl();
        case "do":
          return this.parseDoWhileControl();
        case "try":
          this.advance();
          return this.parseControlBody("try", token);
        case "case":
          return this.parseCaseStatement();
        case "default":
          return this.parseDefaultStatement();
        case "return":
        case "break":
        case "continue":
        case "throw":
          {
          const startIndex = this.index;
          this.advance();
          return this.parseSimpleStatementTail(token, startIndex, true);
          }
        default:
          break;
      }
    }

    return this.parseSimpleStatement(true);
  }

  private parseControlWithCondition(kind: GrammarControlStatementNode["kind"]): GrammarControlStatementNode {
    const keyword = this.current();
    this.advance();
    this.parseParenthesizedClause(`Expected "(" after "${kind}".`);
    return this.parseControlBody(kind, keyword);
  }

  private parseElseControl(): GrammarControlStatementNode {
    const keyword = this.current();
    this.advance();

    let body: GrammarStatementNode | undefined;
    if (this.current().kind === "keyword" && this.current().text === "if") {
      body = this.parseControlWithCondition("if");
    } else {
      body = this.parseStatement();
    }

    return {
      kind: "else",
      start: keyword.start,
      end: body?.end ?? keyword.end,
      body
    };
  }

  private parseDoWhileControl(): GrammarControlStatementNode {
    const doToken = this.current();
    this.advance();
    const body = this.parseStatement();

    if (!(this.current().kind === "keyword" && this.current().text === "while")) {
      this.reportError('Expected "while" after "do" statement body.', doToken.start, doToken.end);
      return {
        kind: "do",
        start: doToken.start,
        end: body?.end ?? this.previous().end,
        body
      };
    }

    this.advance();
    this.parseParenthesizedClause('Expected "(" after "while" in do-while statement.');
    const endToken = this.expectSymbol(";", 'Expected ";" after do-while statement.');
    return {
      kind: "do",
      start: doToken.start,
      end: endToken.end,
      body
    };
  }

  private parseCaseStatement(): GrammarControlStatementNode {
    const token = this.current();
    this.advance();
    while (!this.isAtEnd() && !this.checkSymbol(":") && !this.checkSymbol("}")) {
      this.advance();
    }
    const colon = this.expectSymbol(":", 'Expected ":" after "case" label.');
    return {
      kind: "case",
      start: token.start,
      end: colon.end
    };
  }

  private parseDefaultStatement(): GrammarControlStatementNode {
    const token = this.current();
    this.advance();
    const colon = this.expectSymbol(":", 'Expected ":" after "default" label.');
    return {
      kind: "default",
      start: token.start,
      end: colon.end
    };
  }

  private parseControlBody(
    kind: GrammarControlStatementNode["kind"],
    keywordToken: GrammarToken
  ): GrammarControlStatementNode {
    const body = this.parseStatement();
    return {
      kind,
      start: keywordToken.start,
      end: body?.end ?? keywordToken.end,
      body
    };
  }

  private parseSimpleStatement(expectTerminator: boolean): GrammarStatementNode {
    const startIndex = this.index;
    const startToken = this.current();
    this.advance();
    return this.parseSimpleStatementTail(startToken, startIndex, expectTerminator);
  }

  private parseSimpleStatementTail(
    startToken: GrammarToken,
    startIndex: number,
    expectTerminator: boolean
  ): GrammarStatementNode {
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;

    while (!this.isAtEnd()) {
      const token = this.current();
      if (
        token.kind === "symbol" &&
        token.text === ";" &&
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0
      ) {
        const variableDeclaration = this.tryParseVariableDeclarationStatement(
          startIndex,
          this.index
        );
        this.advance();
        if (variableDeclaration) {
          return {
            ...variableDeclaration,
            end: token.end
          };
        }
        return {
          kind: "statement",
          start: startToken.start,
          end: token.end
        };
      }

      if (
        token.kind === "symbol" &&
        token.text === "}" &&
        braceDepth === 0
      ) {
        if (expectTerminator && parenDepth === 0 && bracketDepth === 0) {
          const insertionOffset = this.previous().end;
          this.reportError(
            'Expected ";" to terminate statement.',
            insertionOffset,
            insertionOffset
          );
        }
        return {
          kind: "statement",
          start: startToken.start,
          end: Math.max(startToken.end, token.start)
        };
      }

      if (token.kind === "symbol") {
        if (token.text === "(") {
          parenDepth += 1;
        } else if (token.text === ")") {
          parenDepth = Math.max(0, parenDepth - 1);
        } else if (token.text === "[") {
          bracketDepth += 1;
        } else if (token.text === "]") {
          bracketDepth = Math.max(0, bracketDepth - 1);
        } else if (token.text === "{") {
          braceDepth += 1;
        } else if (token.text === "}") {
          braceDepth = Math.max(0, braceDepth - 1);
        }
      }

      this.advance();
    }

    if (expectTerminator) {
      const insertionOffset = this.previous().end;
      this.reportError(
        'Expected ";" to terminate statement.',
        insertionOffset,
        insertionOffset
      );
    }
    return {
      kind: "statement",
      start: startToken.start,
      end: this.previous().end
    };
  }

  private tryParseVariableDeclarationStatement(
    startIndex: number,
    endExclusive: number
  ): GrammarVariableDeclarationStatementNode | undefined {
    if (endExclusive <= startIndex) {
      return undefined;
    }

    const segments = this.splitTopLevelByComma(startIndex, endExclusive);
    if (segments.length === 0) {
      return undefined;
    }

    const firstSegment = segments[0];
    const firstDeclarator = this.parseFirstVariableDeclarator(firstSegment.start, firstSegment.end);
    if (!firstDeclarator) {
      return undefined;
    }

    const declarators: GrammarVariableDeclaratorNode[] = [firstDeclarator.declarator];
    for (let i = 1; i < segments.length; i += 1) {
      const segment = segments[i];
      const declarator = this.parseAdditionalVariableDeclarator(segment.start, segment.end);
      if (!declarator) {
        return undefined;
      }
      declarators.push(declarator);
    }

    const typeText = this.sourceText
      .slice(firstDeclarator.typeStart, firstDeclarator.typeEnd)
      .trim();
    if (!typeText) {
      return undefined;
    }

    return {
      kind: "variable-declaration",
      typeText,
      declarators,
      start: this.tokens[startIndex].start,
      end: this.tokens[endExclusive - 1].end
    };
  }

  private parseFirstVariableDeclarator(
    startIndex: number,
    endExclusive: number
  ):
    | {
        declarator: GrammarVariableDeclaratorNode;
        typeStart: number;
        typeEnd: number;
      }
    | undefined {
    const nameTokenIndex = this.findDeclaratorNameTokenIndex(startIndex, endExclusive);
    if (nameTokenIndex < 0) {
      return undefined;
    }

    const nameToken = this.tokens[nameTokenIndex];
    if (!nameToken || nameToken.kind !== "identifier") {
      return undefined;
    }
    if (isLanguageKeyword(nameToken.text)) {
      return undefined;
    }

    const typeTokenIndices: number[] = [];
    for (let i = startIndex; i < nameTokenIndex; i += 1) {
      const token = this.tokens[i];
      if (!token) {
        continue;
      }
      typeTokenIndices.push(i);
    }
    if (!this.isLikelyTypeTokenRange(typeTokenIndices)) {
      return undefined;
    }

    const firstTypeToken = this.tokens[typeTokenIndices[0]];
    const lastTypeToken = this.tokens[typeTokenIndices[typeTokenIndices.length - 1]];
    if (!firstTypeToken || !lastTypeToken) {
      return undefined;
    }

    return {
      declarator: {
        name: nameToken.text,
        nameStart: nameToken.start,
        nameEnd: nameToken.end,
        start: nameToken.start,
        end: this.tokens[endExclusive - 1].end
      },
      typeStart: firstTypeToken.start,
      typeEnd: lastTypeToken.end
    };
  }

  private parseAdditionalVariableDeclarator(
    startIndex: number,
    endExclusive: number
  ): GrammarVariableDeclaratorNode | undefined {
    const nameTokenIndex = this.findDeclaratorNameTokenIndex(startIndex, endExclusive);
    if (nameTokenIndex < 0) {
      return undefined;
    }

    const token = this.tokens[nameTokenIndex];
    if (!token || token.kind !== "identifier" || isLanguageKeyword(token.text)) {
      return undefined;
    }

    return {
      name: token.text,
      nameStart: token.start,
      nameEnd: token.end,
      start: token.start,
      end: this.tokens[endExclusive - 1].end
    };
  }

  private findDeclaratorNameTokenIndex(startIndex: number, endExclusive: number): number {
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    let angleDepth = 0;

    for (let i = endExclusive - 1; i >= startIndex; i -= 1) {
      const token = this.tokens[i];
      if (!token) {
        continue;
      }

      if (token.kind === "symbol") {
        if (token.text === ")") {
          parenDepth += 1;
          continue;
        }
        if (token.text === "(") {
          parenDepth = Math.max(0, parenDepth - 1);
          continue;
        }
        if (token.text === "]") {
          bracketDepth += 1;
          continue;
        }
        if (token.text === "[") {
          bracketDepth = Math.max(0, bracketDepth - 1);
          continue;
        }
        if (token.text === ">") {
          angleDepth += 1;
          continue;
        }
        if (token.text === "<") {
          angleDepth = Math.max(0, angleDepth - 1);
          continue;
        }
        if (token.text === "}") {
          braceDepth += 1;
          continue;
        }
        if (token.text === "{") {
          braceDepth = Math.max(0, braceDepth - 1);
          continue;
        }
      }

      if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0 || angleDepth !== 0) {
        continue;
      }

      if (token.kind === "identifier") {
        return i;
      }
    }

    return -1;
  }

  private isLikelyTypeTokenRange(indices: number[]): boolean {
    if (indices.length === 0) {
      return false;
    }

    const firstToken = this.tokens[indices[0]];
    if (!firstToken) {
      return false;
    }
    if (
      firstToken.kind === "keyword" &&
      invalidTypePrefixKeywords.has(firstToken.text)
    ) {
      return false;
    }

    for (const index of indices) {
      const token = this.tokens[index];
      if (!token) {
        continue;
      }

      if (token.kind === "identifier") {
        continue;
      }
      if (token.kind === "keyword") {
        if (invalidTypePrefixKeywords.has(token.text)) {
          return false;
        }
        continue;
      }
      if (token.kind === "symbol") {
        if (
          token.text === "::" ||
          token.text === "<" ||
          token.text === ">" ||
          token.text === "[" ||
          token.text === "]" ||
          token.text === "&" ||
          token.text === "@" ||
          token.text === ","
        ) {
          continue;
        }
        return false;
      }

      return false;
    }

    return true;
  }

  private splitTopLevelByComma(
    startIndex: number,
    endExclusive: number
  ): Array<{ start: number; end: number }> {
    const segments: Array<{ start: number; end: number }> = [];
    let segmentStart = startIndex;
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    let angleDepth = 0;

    for (let i = startIndex; i < endExclusive; i += 1) {
      const token = this.tokens[i];
      if (!token || token.kind !== "symbol") {
        continue;
      }

      if (token.text === "(") {
        parenDepth += 1;
        continue;
      }
      if (token.text === ")") {
        parenDepth = Math.max(0, parenDepth - 1);
        continue;
      }
      if (token.text === "[") {
        bracketDepth += 1;
        continue;
      }
      if (token.text === "]") {
        bracketDepth = Math.max(0, bracketDepth - 1);
        continue;
      }
      if (token.text === "{") {
        braceDepth += 1;
        continue;
      }
      if (token.text === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        continue;
      }
      if (token.text === "<") {
        angleDepth += 1;
        continue;
      }
      if (token.text === ">") {
        angleDepth = Math.max(0, angleDepth - 1);
        continue;
      }

      if (
        token.text === "," &&
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0 &&
        angleDepth === 0
      ) {
        segments.push({ start: segmentStart, end: i });
        segmentStart = i + 1;
      }
    }

    if (segmentStart < endExclusive) {
      segments.push({ start: segmentStart, end: endExclusive });
    }

    return segments
      .map((segment) => ({
        start: this.skipLeadingTriviaTokenIndex(segment.start, segment.end),
        end: this.skipTrailingTriviaTokenIndex(segment.start, segment.end)
      }))
      .filter((segment) => segment.start < segment.end);
  }

  private skipLeadingTriviaTokenIndex(start: number, endExclusive: number): number {
    let index = start;
    while (index < endExclusive) {
      const token = this.tokens[index];
      if (!token || token.kind === "eof") {
        index += 1;
        continue;
      }
      break;
    }
    return index;
  }

  private skipTrailingTriviaTokenIndex(start: number, endExclusive: number): number {
    let index = endExclusive;
    while (index > start) {
      const token = this.tokens[index - 1];
      if (!token || token.kind === "eof") {
        index -= 1;
        continue;
      }
      break;
    }
    return index;
  }

  private parseParenthesizedClause(errorMessage: string): void {
    if (!this.matchSymbol("(")) {
      this.reportError(
        errorMessage,
        this.current().start,
        this.current().end
      );
      return;
    }

    let depth = 1;
    while (!this.isAtEnd() && depth > 0) {
      const token = this.current();
      if (token.kind === "symbol" && token.text === "(") {
        depth += 1;
      } else if (token.kind === "symbol" && token.text === ")") {
        depth -= 1;
        if (depth === 0) {
          this.advance();
          return;
        }
      }

      this.advance();
    }

    this.reportError(
      'Expected ")" to close parenthesized clause.',
      this.previous().start,
      this.previous().end
    );
  }

  private peekFunctionHeader(): FunctionHeaderInfo | undefined {
    const startIndex = this.index;
    let i = startIndex;

    while (i < this.tokens.length && this.tokens[i]?.kind === "symbol" && this.tokens[i]?.text === "[") {
      const close = this.findMatchingSymbolIndex(i, "[", "]");
      if (close < 0) {
        return undefined;
      }
      i = close + 1;
    }

    while (
      i < this.tokens.length &&
      this.tokens[i]?.kind === "keyword" &&
      declarationModifierKeywords.has(this.tokens[i].text)
    ) {
      i += 1;
    }

    let openParenIndex = -1;
    for (let cursor = i; cursor < this.tokens.length; cursor += 1) {
      const token = this.tokens[cursor];
      if (!token) {
        break;
      }
      if (token.kind === "symbol" && token.text === "(") {
        openParenIndex = cursor;
        break;
      }
      if (
        token.kind === "symbol" &&
        (token.text === ";" || token.text === "{" || token.text === "}")
      ) {
        return undefined;
      }
    }

    if (openParenIndex < 0) {
      return undefined;
    }

    let destructorTokenIndex = -1;
    let nameTokenIndex = openParenIndex - 1;
    if (this.tokens[nameTokenIndex]?.kind === "symbol" && this.tokens[nameTokenIndex]?.text === "~") {
      destructorTokenIndex = nameTokenIndex;
      nameTokenIndex -= 1;
    }

    const nameToken = this.tokens[nameTokenIndex];
    if (!nameToken || nameToken.kind !== "identifier") {
      return undefined;
    }

    if (invalidFunctionNameKeywords.has(nameToken.text)) {
      return undefined;
    }

    const previousNameToken = this.tokens[nameTokenIndex - 1];
    if (
      previousNameToken?.kind === "symbol" &&
      (previousNameToken.text === "." || previousNameToken.text === "::")
    ) {
      return undefined;
    }

    const closeParenIndex = this.findMatchingSymbolIndex(openParenIndex, "(", ")");
    if (closeParenIndex < 0) {
      this.reportError(
        `Expected ")" to close function declaration "${nameToken.text}".`,
        this.tokens[openParenIndex].start,
        this.tokens[openParenIndex].end
      );
      return undefined;
    }

    const parameters = this.parseFunctionParameters(openParenIndex + 1, closeParenIndex);

    let returnTypeText = "";
    if (nameTokenIndex > i) {
      const returnTypeEndTokenIndex =
        destructorTokenIndex >= 0 ? destructorTokenIndex - 1 : nameTokenIndex - 1;
      if (returnTypeEndTokenIndex >= i) {
        returnTypeText = normalizeTypeText(
          this.sourceText
            .slice(this.tokens[i].start, this.tokens[returnTypeEndTokenIndex].end)
            .trim()
        );
      }
    }

    const functionName = destructorTokenIndex >= 0 ? `~${nameToken.text}` : nameToken.text;

    return {
      name: functionName,
      nameStart: destructorTokenIndex >= 0 ? this.tokens[destructorTokenIndex].start : nameToken.start,
      nameEnd: nameToken.end,
      openParen: this.tokens[openParenIndex].start,
      closeParen: this.tokens[closeParenIndex].start,
      returnTypeText,
      parameters,
      afterCloseParenIndex: closeParenIndex + 1
    };
  }

  private parseFunctionParameters(
    startIndex: number,
    endExclusive: number
  ): GrammarFunctionParameterNode[] {
    const segments = this.splitTopLevelByComma(startIndex, endExclusive);
    if (segments.length === 0) {
      return [];
    }

    if (
      segments.length === 1 &&
      this.sourceText
        .slice(this.tokens[segments[0].start].start, this.tokens[segments[0].end - 1].end)
        .trim() === "void"
    ) {
      return [];
    }

    const parameters: GrammarFunctionParameterNode[] = [];
    for (const segment of segments) {
      const nameTokenIndex = this.findDeclaratorNameTokenIndex(segment.start, segment.end);
      if (nameTokenIndex < 0) {
        continue;
      }

      const nameToken = this.tokens[nameTokenIndex];
      if (!nameToken || nameToken.kind !== "identifier" || isLanguageKeyword(nameToken.text)) {
        continue;
      }

      const typeStartToken = this.tokens[segment.start];
      const typeEndToken = this.tokens[nameTokenIndex - 1];
      const typeText =
        typeStartToken && typeEndToken
          ? normalizeTypeText(
              this.sourceText.slice(typeStartToken.start, typeEndToken.end)
            )
          : "";
      if (!typeText || typeText === "void") {
        continue;
      }

      const optional = this.hasTopLevelEqualsToken(segment.start, segment.end);
      const segmentStart = this.tokens[segment.start].start;
      const segmentEnd = this.tokens[segment.end - 1].end;
      parameters.push({
        name: nameToken.text,
        typeText,
        optional,
        start: segmentStart,
        end: segmentEnd,
        nameStart: nameToken.start,
        nameEnd: nameToken.end
      });
    }

    return parameters;
  }

  private hasTopLevelEqualsToken(startIndex: number, endExclusive: number): boolean {
    let parenDepth = 0;
    let bracketDepth = 0;
    let braceDepth = 0;
    let angleDepth = 0;
    for (let i = startIndex; i < endExclusive; i += 1) {
      const token = this.tokens[i];
      if (!token || token.kind !== "symbol") {
        continue;
      }

      if (token.text === "(") {
        parenDepth += 1;
        continue;
      }
      if (token.text === ")") {
        parenDepth = Math.max(0, parenDepth - 1);
        continue;
      }
      if (token.text === "[") {
        bracketDepth += 1;
        continue;
      }
      if (token.text === "]") {
        bracketDepth = Math.max(0, bracketDepth - 1);
        continue;
      }
      if (token.text === "{") {
        braceDepth += 1;
        continue;
      }
      if (token.text === "}") {
        braceDepth = Math.max(0, braceDepth - 1);
        continue;
      }
      if (token.text === "<") {
        angleDepth += 1;
        continue;
      }
      if (token.text === ">") {
        angleDepth = Math.max(0, angleDepth - 1);
        continue;
      }

      if (
        token.text === "=" &&
        parenDepth === 0 &&
        bracketDepth === 0 &&
        braceDepth === 0 &&
        angleDepth === 0
      ) {
        return true;
      }
    }

    return false;
  }

  private synchronizeToStatementBoundary(): void {
    while (!this.isAtEnd()) {
      if (this.current().kind === "symbol" && this.current().text === ";") {
        this.advance();
        return;
      }
      if (this.current().kind === "symbol" && this.current().text === "}") {
        return;
      }
      this.advance();
    }
  }

  private synchronizeToDeclarationBoundary(): void {
    while (!this.isAtEnd()) {
      const token = this.current();
      if (token.kind === "symbol" && (token.text === ";" || token.text === "}")) {
        if (token.text === ";") {
          this.advance();
        }
        return;
      }
      if (
        token.kind === "keyword" &&
        (token.text === "namespace" ||
          token.text === "class" ||
          token.text === "interface" ||
          token.text === "enum")
      ) {
        return;
      }

      this.advance();
    }
  }

  private expectSymbol(text: string, message: string): GrammarToken {
    if (this.matchSymbol(text)) {
      return this.previous();
    }

    const token = this.current();
    this.reportError(message, token.start, token.end);
    return token;
  }

  private matchSymbol(text: string): boolean {
    if (!this.checkSymbol(text)) {
      return false;
    }
    this.advance();
    return true;
  }

  private checkSymbol(text: string): boolean {
    const token = this.current();
    return token.kind === "symbol" && token.text === text;
  }

  private reportError(message: string, start: number, end: number): void {
    if (end < start) {
      end = start;
    }

    const previous = this.errors[this.errors.length - 1];
    if (
      previous &&
      previous.start === start &&
      previous.end === end &&
      previous.message === message
    ) {
      return;
    }

    this.errors.push({
      code: "unparsable-statement",
      message,
      start,
      end
    });
  }

  private findMatchingSymbolIndex(
    openIndex: number,
    openSymbol: string,
    closeSymbol: string
  ): number {
    let depth = 0;
    for (let i = openIndex; i < this.tokens.length; i += 1) {
      const token = this.tokens[i];
      if (!token || token.kind !== "symbol") {
        continue;
      }
      if (token.text === openSymbol) {
        depth += 1;
      } else if (token.text === closeSymbol) {
        depth -= 1;
        if (depth === 0) {
          return i;
        }
      }
    }
    return -1;
  }

  private current(): GrammarToken {
    const index = Math.min(this.index, this.tokens.length - 1);
    return this.tokens[index];
  }

  private previous(): GrammarToken {
    const index = Math.max(0, this.index - 1);
    return this.tokens[index];
  }

  private advance(): GrammarToken {
    if (!this.isAtEnd()) {
      this.index += 1;
    }
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current().kind === "eof";
  }
}

interface FunctionHeaderInfo {
  name: string;
  nameStart: number;
  nameEnd: number;
  openParen: number;
  closeParen: number;
  returnTypeText: string;
  parameters: GrammarFunctionParameterNode[];
  afterCloseParenIndex: number;
}

export function tokenizeGrammarText(text: string): GrammarToken[] {
  const tokens: GrammarToken[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";

    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }

    if (ch === "#") {
      i += 1;
      while (i < text.length && text[i] !== "\n" && text[i] !== "\r") {
        i += 1;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      i += 2;
      while (i < text.length && text[i] !== "\n") {
        i += 1;
      }
      continue;
    }

    if (ch === "/" && next === "*") {
      i += 2;
      while (i + 1 < text.length) {
        if (text[i] === "*" && text[i + 1] === "/") {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (ch === "'" || ch === "\"") {
      const quote = ch;
      const start = i;
      i += 1;
      let escaped = false;
      while (i < text.length) {
        const c = text[i];
        if (escaped) {
          escaped = false;
          i += 1;
          continue;
        }
        if (c === "\\") {
          escaped = true;
          i += 1;
          continue;
        }
        if (c === quote) {
          i += 1;
          break;
        }
        if (c === "\n" || c === "\r") {
          break;
        }
        i += 1;
      }

      tokens.push({
        kind: "string",
        text: text.slice(start, i),
        start,
        end: i
      });
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      i += 1;
      while (i < text.length && /[A-Za-z0-9_]/.test(text[i])) {
        i += 1;
      }

      const tokenText = text.slice(start, i);
      tokens.push({
        kind: keywords.has(tokenText) ? "keyword" : "identifier",
        text: tokenText,
        start,
        end: i
      });
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const start = i;
      i += 1;
      while (
        i < text.length &&
        /[0-9A-Fa-fxX._]/.test(text[i])
      ) {
        i += 1;
      }
      tokens.push({
        kind: "number",
        text: text.slice(start, i),
        start,
        end: i
      });
      continue;
    }

    const pair = ch + next;
    if (twoCharSymbols.has(pair)) {
      tokens.push({
        kind: "symbol",
        text: pair,
        start: i,
        end: i + 2
      });
      i += 2;
      continue;
    }

    if ("(){}[];:,.=<>@&+-*/!?%|^~".includes(ch)) {
      tokens.push({
        kind: "symbol",
        text: ch,
        start: i,
        end: i + 1
      });
    }

    i += 1;
  }

  tokens.push({
    kind: "eof",
    text: "",
    start: text.length,
    end: text.length
  });

  return tokens;
}
