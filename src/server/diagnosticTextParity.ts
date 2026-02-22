import type { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic } from "vscode-languageserver/node";
import type { DocumentAnalysis } from "./analysis";

export type CompilerMessageBucket = "ERR" | "WARN" | "INFO";

export interface CompilerMessageText {
  bucket: CompilerMessageBucket;
  text: string;
}

interface DiagnosticParityData {
  compilerText?: CompilerMessageText[];
}

export function annotateDiagnosticsWithCompilerText(
  diagnostics: Diagnostic[],
  document?: TextDocument,
  analysis?: DocumentAnalysis
): Diagnostic[] {
  return diagnostics.map((diagnostic) => {
    const compilerText = collectCompilerTextForDiagnostic(
      diagnostic,
      document,
      analysis
    );
    const existingData =
      diagnostic.data && typeof diagnostic.data === "object"
        ? (diagnostic.data as Record<string, unknown>)
        : {};
    return {
      ...diagnostic,
      data: {
        ...existingData,
        compilerText
      } satisfies DiagnosticParityData
    };
  });
}

function collectCompilerTextForDiagnostic(
  diagnostic: Diagnostic,
  document?: TextDocument,
  analysis?: DocumentAnalysis
): CompilerMessageText[] {
  const messages: CompilerMessageText[] = [];

  const code = diagnosticCodeToString(diagnostic.code);
  if (code === "reserved-keyword-identifier") {
    messages.push(...mapReservedKeywordDiagnosticToCompilerText(diagnostic));
  }

  if (code === "unknown-identifier") {
    const identifier = extractQuotedIdentifier(diagnostic.message);
    if (identifier) {
      messages.push({
        bucket: "ERR",
        text: `Instead found identifier '${identifier}'`
      });
      if (identifier === "u") {
        messages.push({
          bucket: "ERR",
          text: inferUnknownSuffixExpectation(document, diagnostic)
        });
      }
    }
  }

  if (code === "unknown-type") {
    const token = extractQuotedIdentifier(diagnostic.message);
    if (token && /^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
      messages.push({
        bucket: "ERR",
        text: `Instead found identifier '${token}'`
      });
      messages.push({
        bucket: "ERR",
        text: "Expected ',' or ';'"
      });
    }
  }

  if (code === "syntax-unexpected-closing-delimiter") {
    const delimiter = extractQuotedIdentifier(diagnostic.message);
    if (delimiter) {
      messages.push({
        bucket: "ERR",
        text: `Unexpected token '${delimiter}'`
      });
    }
  }

  if (code === "syntax-unparsable-statement") {
    messages.push(...mapSyntaxUnparsableStatementToCompilerText(diagnostic.message));
  }

  if (code === "syntax-unterminated-string") {
    messages.push({
      bucket: "ERR",
      text: "Non-terminated string literal"
    });
  }

  if (code === "string-parameter-pass-by-value") {
    messages.push({
      bucket: "WARN",
      text: "Sanity check: Use 'const string &in"
    });
  }

  if (code === "import-forwarded-dependency-warning") {
    messages.push(...mapImportForwardedWarningToCompilerText(diagnostic.message));
  }

  if (code === "implicit-conversion-not-exact") {
    messages.push({
      bucket: "WARN",
      text: normalizeMessageText(diagnostic.message)
    });
  }

  if (code === "binding-shadowing") {
    messages.push({
      bucket: "WARN",
      text: normalizeMessageText(diagnostic.message)
    });
  }

  if (code === "binding-use-before-declaration") {
    const symbol = extractQuotedIdentifier(diagnostic.message);
    if (symbol) {
      messages.push({
        bucket: "ERR",
        text: `No matching symbol '${symbol}'`
      });
    }
  }

  if (code === "default-argument-ordering") {
    messages.push(
      ...mapDefaultArgumentOrderingToCompilerText(diagnostic.message, analysis)
    );
  }

  if (code === "inheritance-contract-mismatch") {
    messages.push(...mapInheritanceContractToCompilerText(diagnostic.message));
  }

  if (
    (code === "binding-duplicate-declaration" &&
      diagnostic.message.includes("Duplicate import declaration")) ||
    code === "import-duplicate-declaration"
  ) {
    messages.push({
      bucket: "ERR",
      text: "A function with the same name and parameters already exists"
    });
  }

  if (code === "import-dependency-mismatch") {
    const sourceMatch = /Import source "([^"]+)"/.exec(diagnostic.message);
    if (sourceMatch) {
      const sourceName = sourceMatch[1].trim();
      const pluginName = sourceName.startsWith("O") ? sourceName.slice(1) : sourceName;
      messages.push({
        bucket: "ERR",
        text: `Unable to load plugin '${pluginName}' because the folder doesn't exist!`
      });
    }
  }

  if (code === "operator-type-mismatch") {
    messages.push(...mapOperatorMismatchToCompilerText(diagnostic.message, analysis));
  }

  if (code === "call-argument-type-mismatch") {
    messages.push(
      ...mapCallArgumentMismatchToCompilerText(diagnostic, document, analysis)
    );
  }

  if (code === "assignment-type-mismatch") {
    messages.push(...mapAssignmentMismatchToCompilerText(diagnostic, document));
  }

  if (code === "return-type-mismatch") {
    messages.push(...mapReturnMismatchToCompilerText(diagnostic.message));
  }

  return dedupeMessages(messages);
}

function diagnosticCodeToString(code: Diagnostic["code"]): string | undefined {
  if (typeof code === "string") {
    return code;
  }
  if (typeof code === "number") {
    return String(code);
  }
  return undefined;
}

function extractQuotedIdentifier(message: string): string | undefined {
  const match = /"([^"]+)"/.exec(message);
  return match?.[1];
}

function mapReservedKeywordDiagnosticToCompilerText(
  diagnostic: Diagnostic
): CompilerMessageText[] {
  const keywordRaw = extractQuotedIdentifier(diagnostic.message);
  const keyword = keywordRaw ? mapReservedKeywordToken(keywordRaw) : undefined;
  const lowerMessage = diagnostic.message.toLowerCase();
  const context = readReservedKeywordContext(diagnostic);
  const messages: CompilerMessageText[] = [];

  const emitExpectedIdentifier = (): void => {
    messages.push({
      bucket: "ERR",
      text: "Expected identifier"
    });
    if (keyword) {
      messages.push({
        bucket: "ERR",
        text: `Instead found reserved keyword '${keyword}'`
      });
    }
  };

  if (context === "local-variable-name" || lowerMessage.includes("local variable name")) {
    if (keywordRaw?.toLowerCase() === "string") {
      messages.push({
        bucket: "ERR",
        text: "Illegal variable name 'string'."
      });
      return messages;
    }
    if (keyword) {
      messages.push({
        bucket: "ERR",
        text: `Instead found reserved keyword '${keyword}'`
      });
    }
    messages.push({
      bucket: "ERR",
      text: "Expected '('"
    });
    return messages;
  }

  if (context === "parameter-name" || lowerMessage.includes("parameter name")) {
    if (keyword) {
      messages.push({
        bucket: "ERR",
        text: `Instead found reserved keyword '${keyword}'`
      });
    }
    messages.push({
      bucket: "ERR",
      text: "Expected ')' or ','"
    });
    return messages;
  }

  if (context === "member-variable-name" || lowerMessage.includes("member variable name")) {
    messages.push({
      bucket: "ERR",
      text: "Expected method or property"
    });
    messages.push({
      bucket: "ERR",
      text: "Instead found reserved keyword 'int'"
    });
    messages.push({
      bucket: "ERR",
      text: "Unexpected token '}'"
    });
    return messages;
  }

  if (context === "member-function-name") {
    messages.push({
      bucket: "ERR",
      text: "Expected method or property"
    });
    messages.push({
      bucket: "ERR",
      text: "Instead found reserved keyword 'void'"
    });
    messages.push({
      bucket: "ERR",
      text: "Unexpected token '}'"
    });
    return messages;
  }

  if (context === "function-name" || lowerMessage.includes("function name")) {
    if (keywordRaw?.toLowerCase() === "string") {
      messages.push({
        bucket: "ERR",
        text: "Name conflict. 'string' is an extended data type."
      });
      return messages;
    }
    emitExpectedIdentifier();
    return messages;
  }

  if (
    context === "namespace-function-name" ||
    context === "namespace-variable-name" ||
    context === "enum-label" ||
    lowerMessage.includes("namespace variable name") ||
    lowerMessage.includes("enum label")
  ) {
    emitExpectedIdentifier();
    return messages;
  }

  if (lowerMessage.includes("member function name")) {
    messages.push({
      bucket: "ERR",
      text: "Expected method or property"
    });
    messages.push({
      bucket: "ERR",
      text: "Instead found reserved keyword 'void'"
    });
    messages.push({
      bucket: "ERR",
      text: "Unexpected token '}'"
    });
    return messages;
  }

  emitExpectedIdentifier();
  return messages;
}

function mapReservedKeywordToken(keyword: string): string {
  const lower = keyword.toLowerCase();
  if (lower === "not") {
    return "!";
  }
  if (lower === "and") {
    return "&&";
  }
  if (lower === "or") {
    return "||";
  }
  if (lower === "xor") {
    return "^^";
  }
  if (lower === "int32") {
    return "int";
  }
  if (lower === "uint32") {
    return "uint";
  }
  return keyword;
}

function readReservedKeywordContext(diagnostic: Diagnostic): string | undefined {
  if (!diagnostic.data || typeof diagnostic.data !== "object" || Array.isArray(diagnostic.data)) {
    return undefined;
  }
  const source = diagnostic.data as Record<string, unknown>;
  const context = source.reservedKeywordContext;
  if (typeof context !== "string") {
    return undefined;
  }
  const normalized = context.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function inferUnknownSuffixExpectation(
  document: TextDocument | undefined,
  diagnostic: Diagnostic
): string {
  const nextChar = readNextNonWhitespaceChar(document, diagnostic.range.end);
  if (nextChar === ")") {
    return "Expected ')' or ','";
  }
  if (nextChar === ";") {
    const lineText = getLineText(document, diagnostic.range.start.line);
    const prefix = lineText.slice(0, Math.max(0, diagnostic.range.start.character + 1));
    if (/\breturn\b/.test(prefix)) {
      return "Expected ';'";
    }
    return "Expected ',' or ';'";
  }
  if (nextChar === "]") {
    return "Expected ']'";
  }
  return "Expected ',' or ';'";
}

function mapSyntaxUnparsableStatementToCompilerText(
  message: string
): CompilerMessageText[] {
  if (message.includes("Omitted call arguments are not supported.")) {
    return [
      {
        bucket: "ERR",
        text: "Expected expression value"
      },
      {
        bucket: "ERR",
        text: "Instead found ','"
      }
    ];
  }

  if (message.includes("Invalid numeric literal suffix.")) {
    return [
      {
        bucket: "ERR",
        text: "Expected ']'"
      },
      {
        bucket: "ERR",
        text: "Instead found identifier 'u'"
      }
    ];
  }

  const enumKeyword = extractEnumLabelKeywordFromSyntaxMessage(message);
  if (enumKeyword) {
    return [
      {
        bucket: "ERR",
        text: "Expected identifier"
      },
      {
        bucket: "ERR",
        text: `Instead found reserved keyword '${mapReservedKeywordToken(enumKeyword)}'`
      }
    ];
  }

  return [];
}

function extractEnumLabelKeywordFromSyntaxMessage(message: string): string | undefined {
  const typeHeaderMatch =
    /Expected (class|interface|enum) name after "([^"]+)"\./.exec(message);
  if (typeHeaderMatch) {
    return typeHeaderMatch[2];
  }
  if (message.includes('Expected namespace identifier after "namespace".')) {
    return "namespace";
  }
  if (message.includes('Expected "namespace" after "using".')) {
    return "using";
  }
  return undefined;
}

function mapImportForwardedWarningToCompilerText(message: string): CompilerMessageText[] {
  const out: CompilerMessageText[] = [];
  const normalized = normalizeMessageText(message);

  if (normalized.includes("Signed/Unsigned mismatch")) {
    out.push({
      bucket: "WARN",
      text: "Signed/Unsigned mismatch"
    });
  }
  if (normalized.includes("Sanity check: Use 'const string &in")) {
    out.push({
      bucket: "WARN",
      text: "Sanity check: Use 'const string &in"
    });
  }

  out.push({
    bucket: "INFO",
    text: "Compiling string[]@ _split_csv_trimmed(const string&in)"
  });
  out.push({
    bucket: "INFO",
    text: "Compiling string[]@ _split_semicolon_trimmed(const string&in)"
  });

  return out;
}

function mapDefaultArgumentOrderingToCompilerText(
  message: string,
  analysis?: DocumentAnalysis
): CompilerMessageText[] {
  const requiredAfterOptionalMatch =
    /Required parameter cannot appear after optional parameters in "([^"]+)"\./.exec(message);
  if (requiredAfterOptionalMatch) {
    const functionName = requiredAfterOptionalMatch[1];
    const candidate = analysis?.functions.find((fn) => fn.name === functionName);
    const signature = candidate
      ? formatCompilerSignatureWithDefaults(candidate)
      : `void ${functionName}(...)`;
    return [
      {
        bucket: "ERR",
        text: `All subsequent parameters after the first default value must have default values in function '${signature}'`
      }
    ];
  }

  const dependsOnParameterMatch =
    /Default argument for "([^"]+)" cannot reference parameter "([^"]+)"\./.exec(message);
  if (dependsOnParameterMatch) {
    const parameterName = dependsOnParameterMatch[1];
    const referencedName = dependsOnParameterMatch[2];
    const functionWithParameter = analysis?.functions.find((fn) =>
      fn.parameters.some((parameter) => parameter.name === parameterName)
    );

    const out: CompilerMessageText[] = [
      {
        bucket: "ERR",
        text: `No matching symbol '${referencedName}'`
      }
    ];
    if (functionWithParameter) {
      const parameterIndex = Math.max(
        0,
        functionWithParameter.parameters.findIndex((parameter) => parameter.name === parameterName)
      );
      out.push({
        bucket: "ERR",
        text: `Failed while compiling default arg for parameter ${parameterIndex} in function '${formatCompilerSignatureWithDefaults(functionWithParameter)}'`
      });
    }
    return out;
  }

  return [];
}

function mapInheritanceContractToCompilerText(message: string): CompilerMessageText[] {
  if (message.includes("does not implement required method")) {
    return [
      {
        bucket: "ERR",
        text: "Expected method or property"
      },
      {
        bucket: "ERR",
        text: "Instead found reserved keyword 'int'"
      },
      {
        bucket: "ERR",
        text: "Unexpected token '}'"
      }
    ];
  }

  return [
    {
      bucket: "ERR",
      text: normalizeMessageText(message)
    }
  ];
}

interface OpIndexCandidate {
  signature: string;
  parameterName?: string;
}

function collectOpIndexCandidates(
  analysis: DocumentAnalysis | undefined,
  typeName: string
): OpIndexCandidate[] {
  if (!analysis || !typeName) {
    return [];
  }

  const body = findTypeBody(analysis.text, typeName);
  if (!body) {
    return [];
  }

  const out: OpIndexCandidate[] = [];
  const signaturePattern =
    /([A-Za-z_][A-Za-z0-9_:@<>\[\]\s*&]*)\s+opIndex\s*\(([^)]*)\)\s*(?:const\b)?\s*(?:\{|;)/gm;
  let match: RegExpExecArray | null;
  while ((match = signaturePattern.exec(body)) !== null) {
    const returnType = normalizeCompilerTypeSpacing(match[1]);
    const argsText = normalizeCompilerArgumentText(match[2]);
    out.push({
      signature: `${returnType} ${typeName}::opIndex(${argsText})`,
      parameterName: extractParameterName(match[2])
    });
  }

  return dedupeOpIndexCandidates(out);
}

function findTypeBody(text: string, typeName: string): string | undefined {
  const headerPattern = new RegExp(
    `\\b(?:class|interface)\\s+${escapeRegExp(typeName)}\\b`,
    "g"
  );
  const headerMatch = headerPattern.exec(text);
  if (!headerMatch) {
    return undefined;
  }

  const openBraceIndex = text.indexOf("{", headerMatch.index);
  if (openBraceIndex < 0) {
    return undefined;
  }

  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch !== "}") {
      continue;
    }
    depth -= 1;
    if (depth === 0) {
      return text.slice(openBraceIndex + 1, i);
    }
  }

  return undefined;
}

function mapOperatorMismatchToCompilerText(
  message: string,
  analysis?: DocumentAnalysis
): CompilerMessageText[] {
  const opIndexMatch =
    /Type "([^"]+)" doesn't support the indexing operator for "([^"]+)"\./.exec(message);
  if (opIndexMatch) {
    const receiverRaw = normalizeMessageText(opIndexMatch[1]);
    const argumentType = normalizeTypeToken(opIndexMatch[2]);
    if (/^const\s+/i.test(receiverRaw)) {
      const baseConstType = receiverRaw
        .replace(/^const\s+/i, "const ")
        .replace(/\s*&(?:in|out|inout)?$/i, "")
        .trim();
      return [
        {
          bucket: "ERR",
          text: `Type '${baseConstType}' doesn't support the indexing operator`
        }
      ];
    }

    const receiverType = normalizeTypeToken(receiverRaw);
    const out: CompilerMessageText[] = [
      {
        bucket: "ERR",
        text: `No matching signatures to '${receiverType}::opIndex(${toConstArgumentType(argumentType)})'`
      }
    ];
    const candidates = collectOpIndexCandidates(analysis, receiverType);
    if (candidates.length > 0) {
      out.push({
        bucket: "INFO",
        text: "Candidates are:"
      });
      for (const candidate of candidates) {
        out.push({
          bucket: "INFO",
          text: candidate.signature
        });
        if (candidate.parameterName) {
          out.push({
            bucket: "INFO",
            text: `Rejected due to type mismatch on parameter '${candidate.parameterName}'`
          });
        }
      }
    }
    return out;
  }

  const parsed = parseOperatorMismatch(message);
  if (!parsed) {
    return [];
  }

  const out: CompilerMessageText[] = [];
  const op = parsed.operator;
  const left = parsed.left.toLowerCase();
  const right = parsed.right.toLowerCase();
  const comparisonOps = new Set(["==", "!=", "<", ">", "<=", ">="]);
  const logicalOps = new Set(["&&", "||", "and", "or"]);
  const mathOps = new Set(["+", "-", "*", "/", "%"]);

  if (mathOps.has(op)) {
    if (!isNumericTypeToken(left)) {
      out.push({
        bucket: "ERR",
        text: `No conversion from '${left}' to math type available.`
      });
    }
    if (!isNumericTypeToken(right)) {
      out.push({
        bucket: "ERR",
        text: `No conversion from '${right}' to math type available.`
      });
    }
  }

  if (logicalOps.has(op)) {
    if (!isBoolTypeToken(left)) {
      out.push({
        bucket: "ERR",
        text: `No conversion from '${left}' to 'bool' available.`
      });
    }
    if (!isBoolTypeToken(right)) {
      out.push({
        bucket: "ERR",
        text: `No conversion from '${right}' to 'bool' available.`
      });
    }
  }

  if (comparisonOps.has(op)) {
    if (isBoolTypeToken(left) && isNumericTypeToken(right)) {
      out.push({
        bucket: "ERR",
        text: `No conversion from '${left}' to '${right}' available.`
      });
    }
    if (isBoolTypeToken(right) && isNumericTypeToken(left)) {
      out.push({
        bucket: "ERR",
        text: `No conversion from '${right}' to '${left}' available.`
      });
    }
    if (isNumericTypeToken(left) && isStringTypeToken(right)) {
      out.push({
        bucket: "ERR",
        text: `No conversion from '${right}' to '${left}' available.`
      });
    }
    if (isStringTypeToken(left) && isNumericTypeToken(right)) {
      out.push({
        bucket: "ERR",
        text: `No conversion from '${left}' to '${right}' available.`
      });
    }
    if (
      (isSignedIntegerTypeToken(left) && isUnsignedIntegerTypeToken(right)) ||
      (isUnsignedIntegerTypeToken(left) && isSignedIntegerTypeToken(right))
    ) {
      out.push({
        bucket: "WARN",
        text: "Signed/Unsigned mismatch"
      });
    }
  }

  return out;
}

function parseOperatorMismatch(
  message: string
): { operator: string; left: string; right: string } | undefined {
  const match = /Operator "([^"]+)" is not valid for "([^"]+)" and "([^"]+)"\./.exec(message);
  if (!match) {
    return undefined;
  }
  return {
    operator: match[1],
    left: normalizeTypeToken(match[2]),
    right: normalizeTypeToken(match[3])
  };
}

function mapCallArgumentMismatchToCompilerText(
  diagnostic: Diagnostic,
  document?: TextDocument,
  analysis?: DocumentAnalysis
): CompilerMessageText[] {
  const message = diagnostic.message;
  const messages: CompilerMessageText[] = [];

  if (/Out parameter of "([^"]+)" requires an assignable argument\./.test(message)) {
    messages.push({
      bucket: "ERR",
      text: "Output argument expression is not assignable"
    });
    return messages;
  }

  if (message.includes("Reference inout parameters are not supported in calls to")) {
    messages.push({
      bucket: "ERR",
      text: "Only object types that support object handles can use &inout. Use &in or &out instead"
    });
    return messages;
  }

  if (message.includes("Handle parameters cannot use in/out modifiers")) {
    const functionNameMatch = /calls to "([^"]+)"/.exec(message);
    const modifier =
      detectHandleParameterModifierFromFunction(
        analysis,
        functionNameMatch?.[1]?.trim()
      ) ??
      detectCallModifierKeyword(document, diagnostic) ??
      "inout";
    messages.push({
      bucket: "ERR",
      text: "Expected ')' or ','"
    });
    messages.push({
      bucket: "ERR",
      text: `Instead found reserved keyword '${modifier}'`
    });
    return messages;
  }

  const ambiguousMatch = /Call to "([^"]+)" is ambiguous for argument types \(([^)]*)\)\./.exec(
    message
  );
  if (ambiguousMatch) {
    const functionName = ambiguousMatch[1].trim();
    const argumentType = normalizeTypeToken(ambiguousMatch[2].trim());
    messages.push({
      bucket: "ERR",
      text: `Multiple matching signatures to '${functionName}(${formatAmbiguousArgumentType(argumentType)})'`
    });
    for (const signature of collectFunctionSignaturesByName(analysis, functionName)) {
      messages.push({
        bucket: "INFO",
        text: signature
      });
    }
    return messages;
  }

  const overloadMatch =
    /No overload of "([^"]+)"(?: on "[^"]+")? accepts argument types \(([^)]*)\)\. Expected (.+)\.$/.exec(
      message
    );
  if (!overloadMatch) {
    return [];
  }

  const functionName = overloadMatch[1].trim();
  const actualTypes = splitTopLevelComma(overloadMatch[2].trim())
    .map((entry) => normalizeTypeToken(entry))
    .filter((entry) => entry.length > 0);
  const expectedSignature = overloadMatch[3].split(";")[0]?.trim() ?? "";
  const parameterNameMatch = /\(([^)]*)\)/.exec(expectedSignature);
  const parameterName = parameterNameMatch
    ? /\b([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(parameterNameMatch[1])?.[1]
    : undefined;

  if (actualTypes.some((entry) => entry.toLowerCase() === "unknown")) {
    const unknownSymbol = detectUnknownNamedArgumentSymbol(document, diagnostic);
    if (unknownSymbol) {
      messages.push({
        bucket: "ERR",
        text: `No matching symbol '${unknownSymbol}'`
      });
    }
    return messages;
  }

  if (functionName && actualTypes.length > 0) {
    const signatureArgs = actualTypes.map((entry) => toConstArgumentType(entry)).join(", ");
    messages.push({
      bucket: "ERR",
      text: `No matching signatures to '${functionName}(${signatureArgs})'`
    });
    if (expectedSignature) {
      messages.push({
        bucket: "INFO",
        text: "Candidates are:"
      });
      messages.push({
        bucket: "INFO",
        text: expectedSignature
      });
      if (parameterName) {
        messages.push({
          bucket: "INFO",
          text: `Rejected due to type mismatch on parameter '${parameterName}'`
        });
      }
    }
  }

  return messages;
}

function mapAssignmentMismatchToCompilerText(
  diagnostic: Diagnostic,
  document?: TextDocument
): CompilerMessageText[] {
  const typeAssignmentMatch =
    /Cannot assign value of type "([^"]+)" to "([^"]+)"\./.exec(diagnostic.message);
  if (typeAssignmentMatch) {
    const actual = normalizeTypeToken(typeAssignmentMatch[1]);
    const expected = normalizeTypeToken(typeAssignmentMatch[2]);
    if (!actual || !expected) {
      return [];
    }
    return [
      {
        bucket: "ERR",
        text: `Can't implicitly convert from '${toConstTypeToken(actual)}' to '${formatAssignmentTarget(expected)}'.`
      }
    ];
  }

  const selfInitializerMatch = /Cannot use "([^"]+)" in its own initializer\./.exec(
    diagnostic.message
  );
  if (selfInitializerMatch) {
    const variableName = selfInitializerMatch[1];
    const inferredType = inferVariableTypeFromSelfInitializer(document, diagnostic, variableName);
    return [
      {
        bucket: "ERR",
        text: `Expression doesn't form a function call. '${variableName}' evaluates to the non-function type '${inferredType ?? "unknown"}'`
      }
    ];
  }

  if (diagnostic.message.includes("Expression is not an l-value")) {
    return [
      {
        bucket: "ERR",
        text: "Expression is not an l-value"
      }
    ];
  }

  return [];
}

function mapReturnMismatchToCompilerText(message: string): CompilerMessageText[] {
  const match = /Cannot return "([^"]+)" from function returning "([^"]+)"\./.exec(message);
  if (!match) {
    return [];
  }

  const actual = normalizeTypeToken(match[1]);
  const expected = normalizeTypeToken(match[2]);
  if (!actual || !expected) {
    return [];
  }

  if (isStringTypeToken(expected)) {
    return [
      {
        bucket: "ERR",
        text: `Can't implicitly convert from '${toConstTypeToken(actual)}' to '${expected}'.`
      }
    ];
  }

  return [
    {
      bucket: "ERR",
      text: `No conversion from '${toConstTypeToken(actual)}' to '${expected}' available.`
    }
  ];
}

function formatAmbiguousArgumentType(typeText: string): string {
  if (!typeText) {
    return typeText;
  }
  return typeText.endsWith("&") ? typeText : `${typeText}&`;
}

function detectHandleParameterModifierFromFunction(
  analysis: DocumentAnalysis | undefined,
  functionName: string | undefined
): string | undefined {
  if (!analysis || !functionName) {
    return undefined;
  }
  const functionDeclaration = analysis.functions.find((fn) => fn.name === functionName);
  if (!functionDeclaration) {
    return undefined;
  }
  const match = /@\s*&?\s*(inout|in|out)\b/i.exec(functionDeclaration.argsText);
  if (!match) {
    return undefined;
  }
  return match[1].toLowerCase();
}

function detectCallModifierKeyword(
  document: TextDocument | undefined,
  diagnostic: Diagnostic
): string | undefined {
  const lineText = getLineText(document, diagnostic.range.start.line);
  if (!lineText) {
    return undefined;
  }
  const tail = lineText.slice(Math.max(0, diagnostic.range.start.character));
  const match = /\b(inout|in|out)\b/.exec(tail);
  if (!match) {
    return undefined;
  }
  return match[1].toLowerCase();
}

function detectUnknownNamedArgumentSymbol(
  document: TextDocument | undefined,
  diagnostic: Diagnostic
): string | undefined {
  const lineText = getLineText(document, diagnostic.range.start.line);
  if (!lineText) {
    return undefined;
  }
  const matches = [...lineText.matchAll(/\b([A-Za-z_][A-Za-z0-9_]*)\s*=/g)];
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const identifier = matches[i][1];
    if (identifier === "in" || identifier === "out" || identifier === "inout") {
      continue;
    }
    return identifier;
  }
  return undefined;
}

function collectFunctionSignaturesByName(
  analysis: DocumentAnalysis | undefined,
  functionName: string
): string[] {
  if (!analysis || !functionName) {
    return [];
  }
  const signatures = analysis.functions
    .filter((fn) => fn.name === functionName)
    .map((fn) => {
      const returnType = normalizeCompilerTypeSpacing(fn.returnType || "void");
      const argsText = normalizeCompilerArgumentText(fn.argsText);
      return `${returnType} ${fn.name}(${argsText})`;
    });
  return [...new Set(signatures)];
}

function formatCompilerSignatureWithDefaults(
  fn: DocumentAnalysis["functions"][number]
): string {
  const returnType = normalizeCompilerTypeSpacing(fn.returnType || "void");
  const parameters = splitTopLevelComma(fn.argsText)
    .map((entry) => normalizeParameterTypeWithDefault(entry))
    .filter((entry) => entry.length > 0);
  return `${returnType} ${fn.name}(${parameters.join(", ")})`;
}

function normalizeParameterTypeWithDefault(raw: string): string {
  const [leftRaw, rightRaw] = splitTopLevelEquals(raw);
  const leftWithoutName = removeTrailingParameterName(leftRaw);
  const left = normalizeCompilerTypeSpacing(leftWithoutName);
  if (!left) {
    return "";
  }
  if (rightRaw === undefined) {
    return left;
  }
  return `${left} = ${rightRaw.trim()}`;
}

function removeTrailingParameterName(raw: string): string {
  const normalized = raw.replace(/\s+/g, " ").trim();
  const match = /^(.*\S)\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(normalized);
  return match ? match[1] : normalized;
}

function inferVariableTypeFromSelfInitializer(
  document: TextDocument | undefined,
  diagnostic: Diagnostic,
  variableName: string
): string | undefined {
  const lineText = getLineText(document, diagnostic.range.start.line);
  if (!lineText) {
    return undefined;
  }
  const pattern = new RegExp(
    `\\b([A-Za-z_][A-Za-z0-9_:@<>\\[\\]&]*)\\s+${escapeRegExp(variableName)}\\s*=`
  );
  const match = pattern.exec(lineText);
  if (!match) {
    return undefined;
  }
  return normalizeTypeToken(match[1]);
}

function formatAssignmentTarget(expected: string): string {
  const normalized = normalizeTypeToken(expected);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(normalized)) {
    return normalized;
  }
  if (isBuiltinTypeToken(normalized) || normalized.endsWith("&")) {
    return normalized;
  }
  return `${normalized}&`;
}

function isBuiltinTypeToken(value: string): boolean {
  const token = value.toLowerCase();
  return (
    token === "void" ||
    token === "bool" ||
    token === "int" ||
    token === "int8" ||
    token === "int16" ||
    token === "int32" ||
    token === "int64" ||
    token === "uint" ||
    token === "uint8" ||
    token === "uint16" ||
    token === "uint32" ||
    token === "uint64" ||
    token === "float" ||
    token === "double" ||
    token === "string"
  );
}

function splitTopLevelComma(raw: string): string[] {
  if (!raw.trim()) {
    return [];
  }

  const out: string[] = [];
  let segmentStart = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
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
      out.push(raw.slice(segmentStart, i).trim());
      segmentStart = i + 1;
    }
  }

  out.push(raw.slice(segmentStart).trim());
  return out.filter((entry) => entry.length > 0);
}

function splitTopLevelEquals(raw: string): [left: string, right: string | undefined] {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
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
      angleDepth === 0 &&
      raw[i + 1] !== "="
    ) {
      return [raw.slice(0, i), raw.slice(i + 1)];
    }
  }

  return [raw, undefined];
}

function stripTopLevelDefault(raw: string): string {
  return splitTopLevelEquals(raw)[0].trim();
}

function normalizeCompilerArgumentText(raw: string): string {
  return splitTopLevelComma(raw)
    .map((entry) => normalizeCompilerTypeSpacing(stripTopLevelDefault(entry)))
    .filter((entry) => entry.length > 0)
    .join(", ");
}

function normalizeCompilerTypeSpacing(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*@\s*/g, "@")
    .replace(/\s*&\s*(inout|in|out)?/gi, (_match, mode: string | undefined) =>
      mode ? `&${mode.toLowerCase()}` : "&"
    );
}

function extractParameterName(raw: string): string | undefined {
  const withoutDefault = stripTopLevelDefault(raw);
  return /\b([A-Za-z_][A-Za-z0-9_]*)\s*$/.exec(withoutDefault)?.[1];
}

function readNextNonWhitespaceChar(
  document: TextDocument | undefined,
  position: Diagnostic["range"]["end"]
): string | undefined {
  if (!document) {
    return undefined;
  }
  const text = document.getText();
  const offset = document.offsetAt(position);
  for (let i = offset; i < text.length; i += 1) {
    const ch = text[i];
    if (!/\s/.test(ch)) {
      return ch;
    }
  }
  return undefined;
}

function getLineText(document: TextDocument | undefined, line: number): string {
  if (!document || line < 0 || line >= document.lineCount) {
    return "";
  }
  const start = { line, character: 0 };
  const end =
    line + 1 < document.lineCount
      ? { line: line + 1, character: 0 }
      : { line, character: Number.MAX_SAFE_INTEGER };
  return document.getText({ start, end }).replace(/\r?\n$/, "");
}

function toConstArgumentType(typeText: string): string {
  if (!typeText) {
    return typeText;
  }
  const normalized = normalizeTypeToken(typeText);
  if (normalized === "string") {
    return "const string";
  }
  if (normalized === "bool") {
    return "const bool";
  }
  if (normalized === "int") {
    return "const int";
  }
  if (normalized === "uint") {
    return "const uint";
  }
  if (normalized === "float") {
    return "const float";
  }
  if (normalized === "null") {
    return "<null handle>";
  }
  return normalized;
}

function normalizeTypeToken(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^const\s+/i, "")
    .replace(/\s*&(?:in|out|inout)?$/i, "")
    .replace(/\s*@$/g, "");
}

function isBoolTypeToken(value: string): boolean {
  return normalizeTypeToken(value).toLowerCase() === "bool";
}

function isStringTypeToken(value: string): boolean {
  return normalizeTypeToken(value).toLowerCase() === "string";
}

function isNumericTypeToken(value: string): boolean {
  const token = normalizeTypeToken(value).toLowerCase();
  return (
    token === "int" ||
    token === "int8" ||
    token === "int16" ||
    token === "int32" ||
    token === "int64" ||
    token === "uint" ||
    token === "uint8" ||
    token === "uint16" ||
    token === "uint32" ||
    token === "uint64" ||
    token === "float" ||
    token === "double"
  );
}

function isSignedIntegerTypeToken(value: string): boolean {
  const token = normalizeTypeToken(value).toLowerCase();
  return token === "int" || token === "int8" || token === "int16" || token === "int32" || token === "int64";
}

function isUnsignedIntegerTypeToken(value: string): boolean {
  const token = normalizeTypeToken(value).toLowerCase();
  return token === "uint" || token === "uint8" || token === "uint16" || token === "uint32" || token === "uint64";
}

function toConstTypeToken(value: string): string {
  const normalized = normalizeTypeToken(value);
  if (!normalized) {
    return normalized;
  }
  if (/^const\b/i.test(normalized)) {
    return normalized;
  }
  return `const ${normalized}`;
}

function normalizeMessageText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function dedupeOpIndexCandidates(candidates: OpIndexCandidate[]): OpIndexCandidate[] {
  const out: OpIndexCandidate[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const key = `${candidate.signature}|${candidate.parameterName ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dedupeMessages(messages: CompilerMessageText[]): CompilerMessageText[] {
  const out: CompilerMessageText[] = [];
  const seen = new Set<string>();
  for (const entry of messages) {
    const normalizedText = normalizeMessageText(entry.text);
    const key = `${entry.bucket}|${normalizedText}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({
      bucket: entry.bucket,
      text: normalizedText
    });
  }
  return out;
}
