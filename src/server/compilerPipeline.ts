import { CompletionItemKind } from "vscode-languageserver/node";
import { isIntrinsicCallableIdentifier, normalizeTypeText } from "./language";
import {
  findResolvedMember,
  getResolvedMembersForType,
  tryResolveTypeFullNameFromTypeString
} from "./members";
import {
  angelScriptKeywordLikeTokens,
  angelScriptReservedKeywords
} from "./angelScriptTokenTables.generated";
import type { CompletionIndex } from "./types";

export type TypeCompatibility = "compatible" | "incompatible" | "unknown";

export interface ParsedCallableParameter {
  rawText: string;
  typeText: string;
  optional: boolean;
  variadic: boolean;
}

export interface ParsedCallableSignature {
  label: string;
  name: string;
  returnType: string;
  parameters: ParsedCallableParameter[];
  minArgs: number;
  maxArgs: number;
}

export interface ExpressionFunctionSources {
  workspaceFunctionSignaturesByName: Map<string, ParsedCallableSignature[]>;
  coreFunctionSignaturesByName: Map<string, ParsedCallableSignature[]>;
  qualifiedFunctionSignaturesByName: Map<string, ParsedCallableSignature[]>;
}

export interface ExpressionInferenceContext {
  localVariableTypes: Map<string, string>;
  localFunctionReturnTypes: Map<string, string>;
  functionSources: ExpressionFunctionSources;
  memberVariableTypes?: Map<string, string>;
}

export interface OverloadResolutionResult {
  matched: boolean;
  sawIncompatibleType: boolean;
  best?: ParsedCallableSignature;
  resolvedReturnType?: string;
}

interface CandidateScore {
  signature: ParsedCallableSignature;
  compatible: boolean;
  sawIncompatibleType: boolean;
  unknownCount: number;
  totalCost: number;
  variadicUsageCount: number;
  specificityScore: number;
  templateBindings: Map<string, TypeDescriptor>;
}

interface ConversionResult {
  status: TypeCompatibility;
  cost: number;
}

interface TypeDescriptor {
  raw: string;
  normalized: string;
  base: string;
  shortBase: string;
  genericArgs: TypeDescriptor[];
  isConst: boolean;
  isHandle: boolean;
  isReference: boolean;
  isNull: boolean;
  isTemplateParameter: boolean;
  isAny: boolean;
  isPrimitive: boolean;
}

type ExpressionNode =
  | LiteralExpressionNode
  | IdentifierExpressionNode
  | MemberExpressionNode
  | CallExpressionNode
  | UnaryExpressionNode
  | BinaryExpressionNode
  | ConditionalExpressionNode
  | CastExpressionNode
  | IndexExpressionNode;

interface LiteralExpressionNode {
  kind: "literal";
  literalKind:
    | "bool"
    | "null"
    | "int"
    | "float"
    | "double"
    | "string"
    | "char";
}

interface IdentifierExpressionNode {
  kind: "identifier";
  name: string;
  qualifiedName: string;
}

interface MemberExpressionNode {
  kind: "member";
  object: ExpressionNode;
  name: string;
}

interface CallExpressionNode {
  kind: "call";
  callee: ExpressionNode;
  args: ExpressionNode[];
}

interface UnaryExpressionNode {
  kind: "unary";
  operator: string;
  operand: ExpressionNode;
}

interface BinaryExpressionNode {
  kind: "binary";
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
}

interface ConditionalExpressionNode {
  kind: "conditional";
  condition: ExpressionNode;
  whenTrue: ExpressionNode;
  whenFalse: ExpressionNode;
}

interface CastExpressionNode {
  kind: "cast";
  targetType: string;
  expression: ExpressionNode;
}

interface IndexExpressionNode {
  kind: "index";
  object: ExpressionNode;
  index: ExpressionNode;
}

type ExpressionTokenKind = "identifier" | "keyword" | "number" | "string" | "symbol" | "eof";

interface ExpressionToken {
  kind: ExpressionTokenKind;
  text: string;
  start: number;
  end: number;
}

interface BinaryOperatorInfo {
  symbol: string;
  precedence: number;
}

const expressionKeywordOperators = new Set<string>([
  "and",
  "or",
  "xor",
  "not",
  "is",
  "cast"
]);

const expressionLiteralKeywords = new Set<string>(["true", "false", "null"]);

const expressionReservedKeywords = new Set<string>(
  angelScriptReservedKeywords.filter(
    (keyword) =>
      !expressionKeywordOperators.has(keyword) && !expressionLiteralKeywords.has(keyword)
  )
);

const expressionKeywords = new Set<string>([
  ...angelScriptKeywordLikeTokens,
  ...expressionKeywordOperators,
  ...expressionLiteralKeywords,
  "throw"
]);

const binaryOperatorByToken = new Map<string, BinaryOperatorInfo>([
  ["or", { symbol: "or", precedence: 1 }],
  ["||", { symbol: "||", precedence: 1 }],
  ["xor", { symbol: "xor", precedence: 2 }],
  ["|", { symbol: "|", precedence: 2 }],
  ["and", { symbol: "and", precedence: 3 }],
  ["&&", { symbol: "&&", precedence: 3 }],
  ["&", { symbol: "&", precedence: 4 }],
  ["==", { symbol: "==", precedence: 5 }],
  ["!=", { symbol: "!=", precedence: 5 }],
  ["is", { symbol: "is", precedence: 5 }],
  ["<", { symbol: "<", precedence: 6 }],
  [">", { symbol: ">", precedence: 6 }],
  ["<=", { symbol: "<=", precedence: 6 }],
  [">=", { symbol: ">=", precedence: 6 }],
  ["!is", { symbol: "!is", precedence: 6 }],
  ["<<", { symbol: "<<", precedence: 7 }],
  [">>", { symbol: ">>", precedence: 7 }],
  [">>>", { symbol: ">>>", precedence: 7 }],
  ["+", { symbol: "+", precedence: 8 }],
  ["-", { symbol: "-", precedence: 8 }],
  ["*", { symbol: "*", precedence: 9 }],
  ["/", { symbol: "/", precedence: 9 }],
  ["%", { symbol: "%", precedence: 9 }],
  ["^", { symbol: "^", precedence: 9 }],
  ["**", { symbol: "**", precedence: 10 }]
]);

const numericRank = new Map<string, number>([
  ["int8", 1],
  ["uint8", 1],
  ["int16", 2],
  ["uint16", 2],
  ["int", 3],
  ["uint", 3],
  ["int64", 4],
  ["uint64", 4],
  ["float", 5],
  ["double", 6]
]);

const unaryOperatorMethodNames = new Map<string, string[]>([
  ["!", ["opNot"]],
  ["not", ["opNot"]],
  ["~", ["opCom"]],
  ["+", ["opPos"]],
  ["-", ["opNeg"]]
]);

const binaryOperatorMethodNames = new Map<string, string[]>([
  ["+", ["opAdd"]],
  ["-", ["opSub"]],
  ["*", ["opMul"]],
  ["/", ["opDiv"]],
  ["%", ["opMod"]],
  ["&", ["opAnd"]],
  ["|", ["opOr"]],
  ["^", ["opXor"]],
  ["<<", ["opShl"]],
  [">>", ["opShr", "opUShr"]],
  ["==", ["opEquals", "opCmp"]],
  ["!=", ["opEquals", "opCmp"]],
  ["<", ["opCmp"]],
  [">", ["opCmp"]],
  ["<=", ["opCmp"]],
  [">=", ["opCmp"]]
]);

const assignmentOperatorMethodNames = new Map<
  "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=",
  string[]
>([
  ["=", ["opAssign"]],
  ["+=", ["opAddAssign", "opAdd"]],
  ["-=", ["opSubAssign", "opSub"]],
  ["*=", ["opMulAssign", "opMul"]],
  ["/=", ["opDivAssign", "opDiv"]],
  ["%=", ["opModAssign", "opMod"]],
  ["&=", ["opAndAssign", "opAnd"]],
  ["|=", ["opOrAssign", "opOr"]],
  ["^=", ["opXorAssign", "opXor"]],
  ["<<=", ["opShlAssign", "opShl"]],
  [">>=", ["opShrAssign", "opUShrAssign", "opShr", "opUShr"]]
]);

const reverseBinaryOperatorSuffix = "_r";
const activeUserDefinedConversionKeys = new Set<string>();

const indexedContainerTypeNames = new Set<string>([
  "array",
  "mwsarray",
  "mwstridedarray",
  "mwfastarray",
  "mwfastbuffer",
  "mwnodpool",
  "mwrefbuffer"
]);

export function parseCallableSignature(signatureLabel: string): ParsedCallableSignature | undefined {
  const label = signatureLabel.trim();
  const openParen = label.indexOf("(");
  const closeParen = label.lastIndexOf(")");
  if (openParen < 0 || closeParen <= openParen) {
    return undefined;
  }

  const header = label.slice(0, openParen).trim();
  const argsText = label.slice(openParen + 1, closeParen).trim();
  if (!header) {
    return undefined;
  }

  const nameMatch = /([A-Za-z_][A-Za-z0-9_:]*)\s*$/.exec(header);
  if (!nameMatch) {
    return undefined;
  }

  const name = nameMatch[1];
  const rawReturnType = header.slice(0, nameMatch.index).trim();
  const returnType = normalizeTypeText(rawReturnType || "void") || "void";

  if (!argsText || argsText === "void") {
    return {
      label,
      name,
      returnType,
      parameters: [],
      minArgs: 0,
      maxArgs: 0
    };
  }

  const rawParameters = splitTopLevelByComma(argsText);
  const parameters: ParsedCallableParameter[] = [];
  let requiredCount = 0;

  for (const rawParameter of rawParameters) {
    const parsedParameter = parseCallableParameter(rawParameter);
    if (!parsedParameter) {
      continue;
    }

    parameters.push(parsedParameter);
    if (!parsedParameter.optional && !parsedParameter.variadic) {
      requiredCount += 1;
    }
  }

  const variadic = parameters.some((parameter) => parameter.variadic);

  return {
    label,
    name,
    returnType,
    parameters,
    minArgs: requiredCount,
    maxArgs: variadic ? Number.MAX_SAFE_INTEGER : parameters.length
  };
}

export function resolveBestCallableOverload(
  index: CompletionIndex,
  signatures: ParsedCallableSignature[],
  argumentTypes: Array<string | undefined>
): OverloadResolutionResult {
  const arityCandidates = signatures.filter(
    (candidate) =>
      argumentTypes.length >= candidate.minArgs &&
      argumentTypes.length <= candidate.maxArgs
  );
  if (arityCandidates.length === 0) {
    return {
      matched: false,
      sawIncompatibleType: false
    };
  }

  let best: CandidateScore | undefined;
  let sawIncompatibleType = false;

  for (const candidate of arityCandidates) {
    const score = scoreCallableCandidate(index, candidate, argumentTypes);
    if (!score.compatible) {
      if (score.sawIncompatibleType) {
        sawIncompatibleType = true;
      }
      continue;
    }

    if (!best || compareCandidateScores(score, best) < 0) {
      best = score;
    }
  }

  if (best) {
    return {
      matched: true,
      sawIncompatibleType: false,
      best: best.signature,
      resolvedReturnType: applyTemplateBindingsToType(
        best.signature.returnType,
        best.templateBindings
      )
    };
  }

  return {
    matched: false,
    sawIncompatibleType
  };
}

export function inferExpressionTypeFromText(
  index: CompletionIndex,
  expressionText: string,
  context: ExpressionInferenceContext
): string | undefined {
  const trimmed = expressionText.trim();
  if (!trimmed) {
    return undefined;
  }

  const withoutComments = stripCommentsForExpression(trimmed).trim();
  if (!withoutComments) {
    return undefined;
  }

  const normalized = normalizeBangIsOperator(withoutComments);
  const ast = parseExpressionAst(normalized);
  if (!ast) {
    return inferSimpleLiteralType(withoutComments);
  }

  return inferExpressionTypeFromNode(index, ast, context, 0);
}

function stripCommentsForExpression(text: string): string {
  let result = "";
  let inLineComment = false;
  let inBlockComment = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1] ?? "";

    if (inLineComment) {
      if (ch === "\n" || ch === "\r") {
        inLineComment = false;
        result += ch;
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
      result += ch;
      if (escapeNext) {
        escapeNext = false;
      } else if (ch === "\\") {
        escapeNext = true;
      } else if (ch === "'") {
        inSingleQuote = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      result += ch;
      if (escapeNext) {
        escapeNext = false;
      } else if (ch === "\\") {
        escapeNext = true;
      } else if (ch === "\"") {
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      result += " ";
      i += 1;
      continue;
    }

    if (ch === "/" && next === "*") {
      inBlockComment = true;
      result += " ";
      i += 1;
      continue;
    }

    if (ch === "'") {
      inSingleQuote = true;
      result += ch;
      continue;
    }

    if (ch === "\"") {
      inDoubleQuote = true;
      result += ch;
      continue;
    }

    result += ch;
  }

  return result;
}

export function evaluateAssignmentOperatorCompatibility(
  index: CompletionIndex,
  operator: "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "&=" | "|=" | "^=" | "<<=" | ">>=",
  leftType: string,
  rightType: string | undefined
): TypeCompatibility {
  const left = parseTypeDescriptor(leftType, index);
  const right = parseTypeDescriptor(rightType, index);

  if (!left) {
    return "unknown";
  }

  if (left.isAny || right?.isAny) {
    return "unknown";
  }

  if (operator === "=") {
    if (right?.isNull && (left.isHandle || (!left.isPrimitive && !left.isReference))) {
      return "compatible";
    }

    const directConversion = evaluateConversion(
      index,
      left,
      right,
      new Map<string, TypeDescriptor>()
    ).status;
    if (directConversion === "compatible") {
      return "compatible";
    }
    if (directConversion === "unknown") {
      return "unknown";
    }

    const operatorCompatibility = evaluateOperatorMethodCompatibility(
      index,
      left,
      right,
      assignmentOperatorMethodNames.get("=") ?? [],
      rightType
    );
    if (operatorCompatibility !== "unknown") {
      return operatorCompatibility;
    }

    return "incompatible";
  }

  if (operator === "+=") {
    if (isTextStringTypeName(left.normalized) && right) {
      return "compatible";
    }
    if (isNumericTypeName(left.normalized) && right && isNumericTypeName(right.normalized)) {
      return "compatible";
    }
    if (!right) {
      return "unknown";
    }
    const operatorCompatibility = evaluateOperatorMethodCompatibility(
      index,
      left,
      right,
      assignmentOperatorMethodNames.get(operator) ?? [],
      rightType
    );
    return operatorCompatibility === "unknown" ? "incompatible" : operatorCompatibility;
  }

  if (operator === "-=" || operator === "*=" || operator === "/=" || operator === "%=") {
    if (!right) {
      return "unknown";
    }
    if (!isNumericTypeName(left.normalized) || !isNumericTypeName(right.normalized)) {
      const operatorCompatibility = evaluateOperatorMethodCompatibility(
        index,
        left,
        right,
        assignmentOperatorMethodNames.get(operator) ?? [],
        rightType
      );
      return operatorCompatibility === "unknown" ? "incompatible" : operatorCompatibility;
    }
    if (
      operator === "%=" &&
      (!isIntegerTypeName(left.normalized) || !isIntegerTypeName(right.normalized))
    ) {
      const operatorCompatibility = evaluateOperatorMethodCompatibility(
        index,
        left,
        right,
        assignmentOperatorMethodNames.get(operator) ?? [],
        rightType
      );
      return operatorCompatibility === "unknown" ? "incompatible" : operatorCompatibility;
    }
    return "compatible";
  }

  if (
    operator === "&=" ||
    operator === "|=" ||
    operator === "^=" ||
    operator === "<<=" ||
    operator === ">>="
  ) {
    if (!right) {
      return "unknown";
    }
    if (isIntegerTypeName(left.normalized) && isIntegerTypeName(right.normalized)) {
      return "compatible";
    }

    const operatorCompatibility = evaluateOperatorMethodCompatibility(
      index,
      left,
      right,
      assignmentOperatorMethodNames.get(operator) ?? [],
      rightType
    );
    return operatorCompatibility === "unknown" ? "incompatible" : operatorCompatibility;
  }

  return "unknown";
}

function scoreCallableCandidate(
  index: CompletionIndex,
  candidate: ParsedCallableSignature,
  argumentTypes: Array<string | undefined>
): CandidateScore {
  let unknownCount = 0;
  let totalCost = 0;
  let variadicUsageCount = 0;
  let sawIncompatibleType = false;
  let specificityScore = 0;
  const templateBindings = new Map<string, TypeDescriptor>();

  for (let i = 0; i < argumentTypes.length; i += 1) {
    const parameter = getParameterForArgumentIndex(candidate, i);
    if (!parameter) {
      sawIncompatibleType = true;
      return {
        signature: candidate,
        compatible: false,
        sawIncompatibleType,
        unknownCount,
        totalCost,
        variadicUsageCount,
        specificityScore,
        templateBindings: new Map(templateBindings)
      };
    }

    if (parameter.variadic) {
      variadicUsageCount += 1;
    }

    const expected = parseTypeDescriptor(parameter.typeText, index);
    if (!expected) {
      unknownCount += 1;
      continue;
    }
    if (!expected.isAny && !expected.isTemplateParameter) {
      specificityScore += 1;
    }

    const actual = parseTypeDescriptor(argumentTypes[i], index);
    const conversion = evaluateConversion(index, expected, actual, templateBindings);
    if (conversion.status === "incompatible") {
      sawIncompatibleType = true;
      return {
        signature: candidate,
        compatible: false,
        sawIncompatibleType,
        unknownCount,
        totalCost,
        variadicUsageCount,
        specificityScore,
        templateBindings: new Map(templateBindings)
      };
    }
    if (conversion.status === "unknown") {
      unknownCount += 1;
    } else {
      totalCost += conversion.cost;
    }
  }

  return {
    signature: candidate,
    compatible: true,
    sawIncompatibleType: false,
    unknownCount,
    totalCost,
    variadicUsageCount,
    specificityScore,
    templateBindings: new Map(templateBindings)
  };
}

function compareCandidateScores(left: CandidateScore, right: CandidateScore): number {
  if (left.unknownCount !== right.unknownCount) {
    return left.unknownCount - right.unknownCount;
  }
  if (left.totalCost !== right.totalCost) {
    return left.totalCost - right.totalCost;
  }
  if (left.variadicUsageCount !== right.variadicUsageCount) {
    return left.variadicUsageCount - right.variadicUsageCount;
  }
  if (left.specificityScore !== right.specificityScore) {
    return right.specificityScore - left.specificityScore;
  }

  return left.signature.parameters.length - right.signature.parameters.length;
}

function getParameterForArgumentIndex(
  candidate: ParsedCallableSignature,
  argumentIndex: number
): ParsedCallableParameter | undefined {
  if (argumentIndex < candidate.parameters.length) {
    return candidate.parameters[argumentIndex];
  }
  if (candidate.parameters.length === 0) {
    return undefined;
  }

  const last = candidate.parameters[candidate.parameters.length - 1];
  return last.variadic ? last : undefined;
}

function inferExpressionTypeFromNode(
  index: CompletionIndex,
  node: ExpressionNode,
  context: ExpressionInferenceContext,
  depth: number
): string | undefined {
  if (depth > 48) {
    return undefined;
  }

  switch (node.kind) {
    case "literal":
      return inferLiteralNodeType(node);
    case "identifier":
      return inferIdentifierType(index, node, context);
    case "member":
      return inferMemberAccessType(index, node, context, depth + 1);
    case "call":
      return inferCallExpressionType(index, node, context, depth + 1);
    case "unary":
      return inferUnaryExpressionType(index, node, context, depth + 1);
    case "binary":
      return inferBinaryExpressionType(index, node, context, depth + 1);
    case "conditional":
      return inferConditionalExpressionType(index, node, context, depth + 1);
    case "cast":
      return normalizeTypeText(node.targetType) || node.targetType;
    case "index": {
      const objectType = inferExpressionTypeFromNode(index, node.object, context, depth + 1);
      if (!objectType) {
        return undefined;
      }
      const indexType = inferExpressionTypeFromNode(index, node.index, context, depth + 1);
      return inferIndexAccessType(index, objectType, indexType);
    }
    default:
      return undefined;
  }
}

function inferLiteralNodeType(node: LiteralExpressionNode): string | undefined {
  switch (node.literalKind) {
    case "bool":
      return "bool";
    case "null":
      return "null";
    case "int":
      return "int";
    case "float":
      return "float";
    case "double":
      return "double";
    case "string":
      return "string";
    case "char":
      return "int";
    default:
      return undefined;
  }
}

function inferIdentifierType(
  index: CompletionIndex,
  node: IdentifierExpressionNode,
  context: ExpressionInferenceContext
): string | undefined {
  const enumValueType = resolveQualifiedEnumValueType(index, node.qualifiedName);
  if (enumValueType) {
    return enumValueType;
  }

  const qualifiedLocalType = context.localVariableTypes.get(node.qualifiedName);
  if (qualifiedLocalType) {
    return qualifiedLocalType;
  }

  const localType = context.localVariableTypes.get(node.name);
  if (localType) {
    return localType;
  }

  const qualifiedLocalFunctionType =
    context.localFunctionReturnTypes.get(node.qualifiedName);
  if (qualifiedLocalFunctionType) {
    return qualifiedLocalFunctionType;
  }

  const localFunctionType = context.localFunctionReturnTypes.get(node.name);
  if (localFunctionType) {
    return localFunctionType;
  }

  const memberVariableType = context.memberVariableTypes?.get(node.name);
  if (memberVariableType) {
    return memberVariableType;
  }

  const knownType = resolveKnownTypeName(index, node.qualifiedName);
  if (knownType) {
    return knownType;
  }

  return undefined;
}

function resolveQualifiedEnumValueType(
  index: CompletionIndex,
  qualifiedName: string
): string | undefined {
  const splitIndex = qualifiedName.lastIndexOf("::");
  if (splitIndex <= 0 || splitIndex >= qualifiedName.length - 2) {
    return undefined;
  }

  const enumTypeName = qualifiedName.slice(0, splitIndex);
  const enumMemberName = qualifiedName.slice(splitIndex + 2);
  if (!enumTypeName || !enumMemberName) {
    return undefined;
  }

  const resolvedEnumTypeName =
    tryResolveTypeFullNameFromTypeString(index, enumTypeName) ?? enumTypeName;

  if (isEnumTypeName(index, resolvedEnumTypeName)) {
    const bucket = index.namespaceBuckets.get(resolvedEnumTypeName);
    if (!bucket) {
      return undefined;
    }

    for (const item of bucket.items) {
      if (item.label !== enumMemberName) {
        continue;
      }
      if (
        item.kind === CompletionItemKind.EnumMember ||
        (typeof item.detail === "string" && item.detail.startsWith("Enum value"))
      ) {
        return resolvedEnumTypeName;
      }
    }

    return undefined;
  }

  const resolvedEnumTypeInfo = index.typeInfoByFullName.get(resolvedEnumTypeName);
  if (!resolvedEnumTypeInfo) {
    return undefined;
  }

  if (
    resolvedEnumTypeInfo.members.some(
      (member) => member.kind === "property" && member.name === enumMemberName
    )
  ) {
    return resolvedEnumTypeName;
  }

  if (/^[A-Z][A-Za-z0-9_]*$/.test(enumMemberName)) {
    return resolvedEnumTypeName;
  }

  return undefined;
}

function inferMemberAccessType(
  index: CompletionIndex,
  node: MemberExpressionNode,
  context: ExpressionInferenceContext,
  depth: number
): string | undefined {
  const objectType = inferExpressionTypeFromNode(index, node.object, context, depth + 1);
  if (!objectType) {
    return undefined;
  }

  const objectDescriptor = parseTypeDescriptor(objectType, index);
  if (objectDescriptor && node.name === "Length") {
    if (
      objectDescriptor.shortBase === "string" ||
      objectDescriptor.shortBase === "array" ||
      objectDescriptor.shortBase === "dictionary"
    ) {
      return "uint";
    }
  }

  const receiverTypeFullName = resolveTypeFullName(index, objectType);
  if (!receiverTypeFullName) {
    return undefined;
  }

  const member = findResolvedMember(index, receiverTypeFullName, node.name);
  if (!member || member.kind !== "property") {
    return undefined;
  }

  return member.type;
}

function inferCallExpressionType(
  index: CompletionIndex,
  node: CallExpressionNode,
  context: ExpressionInferenceContext,
  depth: number
): string | undefined {
  const argumentTypes = node.args.map((arg) =>
    inferExpressionTypeFromNode(index, arg, context, depth + 1)
  );

  if (node.callee.kind === "identifier") {
    const constructorType = resolveKnownTypeName(index, node.callee.qualifiedName);
    const signatures = collectIdentifierCallSignatures(node.callee, context);
    if (signatures.length > 0) {
      const resolution = resolveBestCallableOverload(index, signatures, argumentTypes);
      if (resolution.matched && resolution.best) {
        const resolvedReturnType =
          resolution.resolvedReturnType ?? resolution.best.returnType;
        const normalizedReturnType = normalizeTypeText(resolvedReturnType).trim();
        if (normalizedReturnType && normalizedReturnType !== "void") {
          return normalizedReturnType;
        }
        if (constructorType) {
          return constructorType;
        }
        return normalizedReturnType || resolvedReturnType;
      }
    }

    if (constructorType) {
      return constructorType;
    }
    return undefined;
  }

  if (node.callee.kind === "member") {
    const memberCallee = node.callee;
    const receiverType = inferExpressionTypeFromNode(
      index,
      memberCallee.object,
      context,
      depth + 1
    );
    if (!receiverType) {
      return undefined;
    }

    const receiverTypeFullName = resolveTypeFullName(index, receiverType);
    if (!receiverTypeFullName) {
      return undefined;
    }

    const methodSignatures = getResolvedMembersForType(index, receiverTypeFullName)
      .filter((member) => member.kind === "method" && member.name === memberCallee.name)
      .map((member) => methodMemberToSignature(member.name, member.returnType, member.args))
      .filter((signature): signature is ParsedCallableSignature => signature !== undefined);

    if (methodSignatures.length === 0) {
      return undefined;
    }

    const resolution = resolveBestCallableOverload(index, methodSignatures, argumentTypes);
    if (resolution.matched && resolution.best) {
      return resolution.resolvedReturnType ?? resolution.best.returnType;
    }
    return undefined;
  }

  return undefined;
}

function inferUnaryExpressionType(
  index: CompletionIndex,
  node: UnaryExpressionNode,
  context: ExpressionInferenceContext,
  depth: number
): string | undefined {
  const operandType = inferExpressionTypeFromNode(index, node.operand, context, depth + 1);
  if (!operandType) {
    return undefined;
  }

  if (node.operator === "!" || node.operator === "not") {
    return "bool";
  }

  if (node.operator === "~") {
    return isIntegerTypeName(operandType) ? normalizeTypeText(operandType) : undefined;
  }

  if (node.operator === "+" || node.operator === "-") {
    return isNumericTypeName(operandType) ? normalizeTypeText(operandType) : undefined;
  }

  const overload = resolveUnaryOperatorOverload(index, node.operator, operandType);
  return overload?.resolvedReturnType;
}

function inferBinaryExpressionType(
  index: CompletionIndex,
  node: BinaryExpressionNode,
  context: ExpressionInferenceContext,
  depth: number
): string | undefined {
  const leftType = inferExpressionTypeFromNode(index, node.left, context, depth + 1);
  const rightType = inferExpressionTypeFromNode(index, node.right, context, depth + 1);

  const operator = node.operator;

  if (
    operator === "&&" ||
    operator === "||" ||
    operator === "and" ||
    operator === "or"
  ) {
    if (isBoolTypeName(leftType) && isBoolTypeName(rightType)) {
      return "bool";
    }
    const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
    return overload?.resolvedReturnType;
  }

  if (operator === "xor") {
    if (isBoolTypeName(leftType) && isBoolTypeName(rightType)) {
      return "bool";
    }
    if (isIntegerTypeName(leftType) && isIntegerTypeName(rightType)) {
      return promoteNumericType(leftType, rightType);
    }
    const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
    return overload?.resolvedReturnType;
  }

  if (operator === "==" || operator === "!=") {
    const compatibilityA = evaluateTypeTextCompatibility(index, leftType, rightType);
    const compatibilityB = evaluateTypeTextCompatibility(index, rightType, leftType);
    if (compatibilityA !== "incompatible" || compatibilityB !== "incompatible") {
      return "bool";
    }

    const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
    return overload?.resolvedReturnType;
  }

  if (
    operator === "<" ||
    operator === ">" ||
    operator === "<=" ||
    operator === ">="
  ) {
    if (isNumericTypeName(leftType) && isNumericTypeName(rightType)) {
      return "bool";
    }
    if (isTextStringTypeName(leftType) && isTextStringTypeName(rightType)) {
      return "bool";
    }
    const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
    return overload?.resolvedReturnType;
  }

  if (operator === "is") {
    return leftType || rightType ? "bool" : undefined;
  }
  if (operator === "!is") {
    return leftType || rightType ? "bool" : undefined;
  }

  if (operator === "+" && (isTextStringTypeName(leftType) || isTextStringTypeName(rightType))) {
    return isWideStringTypeName(leftType) || isWideStringTypeName(rightType)
      ? "wstring"
      : "string";
  }

  if (operator === "+" || operator === "-" || operator === "*" || operator === "/") {
    if (isNumericTypeName(leftType) && isNumericTypeName(rightType)) {
      return promoteNumericType(leftType, rightType);
    }
    const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
    return overload?.resolvedReturnType;
  }

  if (operator === "%") {
    if (isIntegerTypeName(leftType) && isIntegerTypeName(rightType)) {
      return promoteNumericType(leftType, rightType);
    }
    const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
    return overload?.resolvedReturnType;
  }

  if (operator === "&" || operator === "|" || operator === "^") {
    if (isIntegerTypeName(leftType) && isIntegerTypeName(rightType)) {
      return promoteNumericType(leftType, rightType);
    }
    const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
    return overload?.resolvedReturnType;
  }

  if (operator === "<<" || operator === ">>") {
    if (isIntegerTypeName(leftType) && isIntegerTypeName(rightType)) {
      return normalizeTypeText(leftType || "int") || "int";
    }
    const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
    return overload?.resolvedReturnType;
  }

  const overload = resolveBinaryOperatorOverload(index, operator, leftType, rightType);
  return overload?.resolvedReturnType;
}

function inferConditionalExpressionType(
  index: CompletionIndex,
  node: ConditionalExpressionNode,
  context: ExpressionInferenceContext,
  depth: number
): string | undefined {
  const trueType = inferExpressionTypeFromNode(index, node.whenTrue, context, depth + 1);
  const falseType = inferExpressionTypeFromNode(index, node.whenFalse, context, depth + 1);
  if (!trueType) {
    return falseType;
  }
  if (!falseType) {
    return trueType;
  }

  const trueDescriptor = parseTypeDescriptor(trueType, index);
  const falseDescriptor = parseTypeDescriptor(falseType, index);
  if (!trueDescriptor || !falseDescriptor) {
    return undefined;
  }

  if (areDescriptorsEquivalent(index, trueDescriptor, falseDescriptor)) {
    return trueType;
  }

  if (isNumericTypeName(trueType) && isNumericTypeName(falseType)) {
    return promoteNumericType(trueType, falseType);
  }

  const trueFromFalse = evaluateConversion(
    index,
    trueDescriptor,
    falseDescriptor,
    new Map<string, TypeDescriptor>()
  );
  if (trueFromFalse.status === "compatible") {
    return trueType;
  }

  const falseFromTrue = evaluateConversion(
    index,
    falseDescriptor,
    trueDescriptor,
    new Map<string, TypeDescriptor>()
  );
  if (falseFromTrue.status === "compatible") {
    return falseType;
  }

  return undefined;
}

function collectIdentifierCallSignatures(
  node: IdentifierExpressionNode,
  context: ExpressionInferenceContext
): ParsedCallableSignature[] {
  const signatures: ParsedCallableSignature[] = [];
  const seen = new Set<string>();

  const addSignatures = (entries: ParsedCallableSignature[] | undefined): void => {
    if (!entries) {
      return;
    }
    for (const entry of entries) {
      const key = `${entry.returnType}:${entry.label}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      signatures.push(entry);
    }
  };

  if (node.qualifiedName.includes("::")) {
    addSignatures(
      context.functionSources.qualifiedFunctionSignaturesByName.get(node.qualifiedName)
    );
    return signatures;
  }

  addSignatures(context.functionSources.workspaceFunctionSignaturesByName.get(node.name));
  addSignatures(context.functionSources.coreFunctionSignaturesByName.get(node.name));
  return signatures;
}

function methodMemberToSignature(
  name: string,
  returnType: string | undefined,
  args: string | undefined
): ParsedCallableSignature | undefined {
  const normalizedReturnType = normalizeTypeText(returnType || "void") || "void";
  const argsText = (args || "").trim();
  const label = `${normalizedReturnType} ${name}(${argsText})`;
  return parseCallableSignature(label);
}

function collectMethodSignaturesByNames(
  index: CompletionIndex,
  receiverTypeFullName: string,
  methodNames: string[]
): ParsedCallableSignature[] {
  if (methodNames.length === 0) {
    return [];
  }

  const allowed = new Set(methodNames);
  const signatures: ParsedCallableSignature[] = [];
  const seen = new Set<string>();

  for (const member of getResolvedMembersForType(index, receiverTypeFullName)) {
    if (member.kind !== "method" || !allowed.has(member.name)) {
      continue;
    }

    const signature = methodMemberToSignature(member.name, member.returnType, member.args);
    if (!signature) {
      continue;
    }

    const key = `${signature.name}:${signature.label}:${signature.returnType}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    signatures.push(signature);
  }

  return signatures;
}

function resolveUnaryOperatorOverload(
  index: CompletionIndex,
  operator: string,
  operandType: string
): { resolvedReturnType: string; methodName: string } | undefined {
  const receiverTypeFullName = resolveTypeFullName(index, operandType);
  if (!receiverTypeFullName) {
    return undefined;
  }

  const methodNames = unaryOperatorMethodNames.get(operator);
  if (!methodNames || methodNames.length === 0) {
    return undefined;
  }

  const signatures = collectMethodSignaturesByNames(
    index,
    receiverTypeFullName,
    methodNames
  );
  if (signatures.length === 0) {
    return undefined;
  }

  const resolution = resolveBestCallableOverload(index, signatures, []);
  if (!resolution.matched || !resolution.best) {
    return undefined;
  }

  return {
    resolvedReturnType: resolution.resolvedReturnType ?? resolution.best.returnType,
    methodName: resolution.best.name
  };
}

function resolveBinaryOperatorOverload(
  index: CompletionIndex,
  operator: string,
  leftType: string | undefined,
  rightType: string | undefined
): { resolvedReturnType: string; methodName: string } | undefined {
  const methodNames = binaryOperatorMethodNames.get(operator);
  if (!methodNames || methodNames.length === 0) {
    return undefined;
  }

  const tryResolveOnType = (
    receiverType: string | undefined,
    argumentType: string | undefined,
    candidateMethodNames: string[]
  ): { resolvedReturnType: string; methodName: string } | undefined => {
    if (!receiverType) {
      return undefined;
    }

    const receiverTypeFullName = resolveTypeFullName(index, receiverType);
    if (!receiverTypeFullName) {
      return undefined;
    }

    const signatures = collectMethodSignaturesByNames(
      index,
      receiverTypeFullName,
      candidateMethodNames
    );
    if (signatures.length === 0) {
      return undefined;
    }

    const resolution = resolveBestCallableOverload(index, signatures, [argumentType]);
    if (!resolution.matched || !resolution.best) {
      return undefined;
    }

    const comparisonOperator =
      operator === "==" ||
      operator === "!=" ||
      operator === "<" ||
      operator === ">" ||
      operator === "<=" ||
      operator === ">=";

    const methodName = resolution.best.name;
    if (comparisonOperator && (methodName.startsWith("opCmp") || methodName.startsWith("opEquals"))) {
      return {
        resolvedReturnType: "bool",
        methodName
      };
    }

    return {
      resolvedReturnType: resolution.resolvedReturnType ?? resolution.best.returnType,
      methodName
    };
  };

  const direct = tryResolveOnType(leftType, rightType, methodNames);
  if (direct) {
    return direct;
  }

  const reverseMethodNames = methodNames.map(
    (methodName) => `${methodName}${reverseBinaryOperatorSuffix}`
  );
  return tryResolveOnType(rightType, leftType, reverseMethodNames);
}

function inferIndexAccessType(
  index: CompletionIndex,
  objectType: string,
  indexType: string | undefined
): string | undefined {
  if (isTextStringTypeName(objectType)) {
    return "int";
  }

  const objectDescriptor = parseTypeDescriptor(objectType, index);
  if (
    objectDescriptor &&
    objectDescriptor.genericArgs.length > 0 &&
    indexedContainerTypeNames.has(objectDescriptor.shortBase)
  ) {
    const valueType = descriptorToTypeText(objectDescriptor.genericArgs[0]);
    return valueType;
  }

  const receiverTypeFullName = resolveTypeFullName(index, objectType);
  if (!receiverTypeFullName) {
    return undefined;
  }

  const isConstReceiver = /\bconst\b/i.test(objectType);
  const signatures = collectMethodSignaturesByNames(
    index,
    receiverTypeFullName,
    isConstReceiver ? ["opIndexConst"] : ["opIndex", "opIndexConst"]
  );
  if (signatures.length === 0) {
    return undefined;
  }

  const resolution = resolveBestCallableOverload(index, signatures, [indexType]);
  if (!resolution.matched || !resolution.best) {
    return undefined;
  }

  return resolution.resolvedReturnType ?? resolution.best.returnType;
}

function evaluateOperatorMethodCompatibility(
  index: CompletionIndex,
  left: TypeDescriptor,
  right: TypeDescriptor | undefined,
  methodNames: string[],
  rightTypeText: string | undefined
): TypeCompatibility {
  if (methodNames.length === 0) {
    return "unknown";
  }

  const receiverTypeFullName = resolveTypeFullName(index, left.normalized);
  if (!receiverTypeFullName) {
    return "unknown";
  }

  const signatures = collectMethodSignaturesByNames(
    index,
    receiverTypeFullName,
    methodNames
  );
  if (signatures.length === 0) {
    return "unknown";
  }

  if (!right) {
    return "unknown";
  }

  const resolution = resolveBestCallableOverload(index, signatures, [rightTypeText]);
  if (resolution.matched) {
    const methodName = resolution.best?.name ?? "";
    if (methodName === "opAssign" || methodName.endsWith("Assign")) {
      return "compatible";
    }

    const resolvedTypeText = resolution.resolvedReturnType ?? resolution.best?.returnType;
    const resolvedDescriptor = parseTypeDescriptor(resolvedTypeText, index);
    const assignability = evaluateConversion(
      index,
      left,
      resolvedDescriptor,
      new Map<string, TypeDescriptor>()
    );
    if (assignability.status === "compatible") {
      return "compatible";
    }
    return assignability.status;
  }
  return resolution.sawIncompatibleType ? "incompatible" : "unknown";
}

function inferSimpleLiteralType(text: string): string | undefined {
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

  return undefined;
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

  const optional = hasTopLevelEquals(parameterText);
  let typeText = stripTopLevelDefaultValue(parameterText).trim();
  if (!typeText) {
    return undefined;
  }

  typeText = stripTrailingParameterName(typeText);
  const variadic = typeText.includes("...");
  typeText = typeText.replace(/\.\.\./g, "").trim();
  typeText = typeText.replace(/\s+/g, " ");
  if (!typeText) {
    return undefined;
  }

  return {
    rawText: parameterText,
    typeText,
    optional,
    variadic
  };
}

function stripTrailingParameterName(value: string): string {
  const trimmed = value.trim();
  const match = /^(.*\S)\s+([A-Za-z_][A-Za-z0-9_]*)$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }
  return match[1].trimEnd();
}

function evaluateTypeTextCompatibility(
  index: CompletionIndex,
  expectedTypeText: string | undefined,
  actualTypeText: string | undefined
): TypeCompatibility {
  const expected = parseTypeDescriptor(expectedTypeText, index);
  const actual = parseTypeDescriptor(actualTypeText, index);
  if (!expected) {
    return "unknown";
  }
  return evaluateConversion(index, expected, actual, new Map<string, TypeDescriptor>()).status;
}

function evaluateConversion(
  index: CompletionIndex,
  expected: TypeDescriptor,
  actual: TypeDescriptor | undefined,
  templateBindings: Map<string, TypeDescriptor>,
  recursionDepth = 0
): ConversionResult {
  if (expected.isAny) {
    return { status: "compatible", cost: 6 };
  }

  if (!actual) {
    return expected.isPrimitive
      ? { status: "incompatible", cost: 0 }
      : { status: "unknown", cost: 0 };
  }

  if (expected.isTemplateParameter) {
    const existing = templateBindings.get(expected.base);
    if (!existing) {
      templateBindings.set(expected.base, actual);
      return { status: "compatible", cost: 0 };
    }

    return evaluateConversion(index, existing, actual, templateBindings, recursionDepth);
  }

  if (actual.isAny || actual.isTemplateParameter) {
    return { status: "unknown", cost: 0 };
  }

  if (
    actual.isConst &&
    !expected.isConst &&
    (expected.isHandle || expected.isReference)
  ) {
    return { status: "incompatible", cost: 0 };
  }

  if (actual.isNull) {
    if (expected.isHandle) {
      return { status: "compatible", cost: 1 };
    }
    return { status: "incompatible", cost: 0 };
  }

  if (expected.isHandle !== actual.isHandle) {
    if (expected.isHandle && !actual.isHandle) {
      const expectedValueDescriptor: TypeDescriptor = {
        ...expected,
        isHandle: false
      };
      const valueConversion = evaluateConversion(
        index,
        expectedValueDescriptor,
        actual,
        templateBindings,
        recursionDepth + 1
      );
      if (valueConversion.status === "compatible") {
        return { status: "compatible", cost: valueConversion.cost + 1 };
      }
      if (valueConversion.status === "unknown") {
        return valueConversion;
      }
    }
    if (!expected.isHandle && actual.isHandle) {
      const actualValueDescriptor: TypeDescriptor = {
        ...actual,
        isHandle: false
      };
      const valueConversion = evaluateConversion(
        index,
        expected,
        actualValueDescriptor,
        templateBindings,
        recursionDepth + 1
      );
      if (valueConversion.status === "compatible") {
        return { status: "compatible", cost: valueConversion.cost + 1 };
      }
      if (valueConversion.status === "unknown") {
        return valueConversion;
      }
    }

    const userDefinedConversion = tryResolveUserDefinedConversion(
      index,
      expected,
      actual,
      templateBindings,
      recursionDepth
    );
    if (userDefinedConversion) {
      return userDefinedConversion;
    }
    return { status: "incompatible", cost: 0 };
  }

  if (areDescriptorsEquivalent(index, expected, actual)) {
    return { status: "compatible", cost: 0 };
  }

  if (isNumericTypeName(expected.normalized) && isNumericTypeName(actual.normalized)) {
    return {
      status: "compatible",
      cost: numericConversionCost(expected.normalized, actual.normalized)
    };
  }

  if (
    (isIntegerTypeName(expected.normalized) && isEnumTypeDescriptor(index, actual)) ||
    (isEnumTypeDescriptor(index, expected) && isIntegerTypeName(actual.normalized))
  ) {
    return { status: "compatible", cost: 2 };
  }

  if (isBoolTypeName(expected.normalized)) {
    return expected.shortBase === actual.shortBase
      ? { status: "compatible", cost: 0 }
      : { status: "incompatible", cost: 0 };
  }

  if (isTextStringTypeName(expected.normalized)) {
    if (!isTextStringTypeName(actual.normalized)) {
      return { status: "incompatible", cost: 0 };
    }

    return {
      status: "compatible",
      cost: expected.shortBase === actual.shortBase ? 0 : 1
    };
  }

  if (expected.isPrimitive && actual.isPrimitive) {
    return { status: "incompatible", cost: 0 };
  }

  if (
    expected.genericArgs.length > 0 &&
    actual.genericArgs.length > 0 &&
    areBaseTypesEquivalent(index, expected, actual) &&
    expected.genericArgs.length === actual.genericArgs.length
  ) {
    let totalCost = 0;
    for (let i = 0; i < expected.genericArgs.length; i += 1) {
      const conversion = evaluateConversion(
        index,
        expected.genericArgs[i],
        actual.genericArgs[i],
        templateBindings,
        recursionDepth
      );
      if (conversion.status === "incompatible") {
        return conversion;
      }
      if (conversion.status === "unknown") {
        return conversion;
      }
      totalCost += conversion.cost;
    }

    return { status: "compatible", cost: totalCost };
  }

  const expectedFullName = resolveTypeFullName(index, expected.normalized);
  const actualFullName = resolveTypeFullName(index, actual.normalized);
  if (expectedFullName && actualFullName) {
    if (expectedFullName === actualFullName) {
      return { status: "compatible", cost: 0 };
    }

    const inheritanceDistance = getInheritanceDistance(index, actualFullName, expectedFullName);
    if (inheritanceDistance !== undefined) {
      return { status: "compatible", cost: 1 + inheritanceDistance };
    }

    return { status: "incompatible", cost: 0 };
  }

  const userDefinedConversion = tryResolveUserDefinedConversion(
    index,
    expected,
    actual,
    templateBindings,
    recursionDepth
  );
  if (userDefinedConversion) {
    return userDefinedConversion;
  }

  if (expected.isPrimitive !== actual.isPrimitive) {
    return { status: "incompatible", cost: 0 };
  }

  if (expected.shortBase === actual.shortBase) {
    return { status: "compatible", cost: 1 };
  }

  return { status: "unknown", cost: 0 };
}

function isEnumTypeDescriptor(
  index: CompletionIndex,
  descriptor: TypeDescriptor
): boolean {
  const fullName = resolveTypeFullName(index, descriptor.normalized);
  if (!fullName) {
    return false;
  }

  return isEnumTypeName(index, fullName);
}

function isEnumTypeName(index: CompletionIndex, fullName: string): boolean {
  const bucket = index.namespaceBuckets.get(fullName);
  if (!bucket) {
    return false;
  }

  return bucket.items.some(
    (item) =>
      item.kind === CompletionItemKind.EnumMember ||
      (typeof item.detail === "string" && item.detail.startsWith("Enum value"))
  );
}

function tryResolveUserDefinedConversion(
  index: CompletionIndex,
  expected: TypeDescriptor,
  actual: TypeDescriptor,
  templateBindings: Map<string, TypeDescriptor>,
  recursionDepth: number
): ConversionResult | undefined {
  if (recursionDepth >= 2) {
    return undefined;
  }

  const cycleKey = `${descriptorToTypeText(expected)}<=${descriptorToTypeText(actual)}`;
  if (activeUserDefinedConversionKeys.has(cycleKey)) {
    return undefined;
  }
  activeUserDefinedConversionKeys.add(cycleKey);

  try {
    const actualTypeFullName = resolveTypeFullName(index, actual.normalized);
    const expectedTypeFullName = resolveTypeFullName(index, expected.normalized);
    const conversionCandidateTypeText = descriptorToTypeText(actual);
    let best:
      | {
          cost: number;
          bindings: Map<string, TypeDescriptor>;
        }
      | undefined;

    const tryCandidateConversion = (
      candidateDescriptor: TypeDescriptor | undefined,
      baseCost: number
    ): void => {
      if (!candidateDescriptor) {
        return;
      }

      const candidateBindings = new Map(templateBindings);
      const conversion = evaluateConversion(
        index,
        expected,
        candidateDescriptor,
        candidateBindings,
        recursionDepth + 1
      );
      if (conversion.status !== "compatible") {
        return;
      }

      const candidateCost = conversion.cost + baseCost;
      if (!best || candidateCost < best.cost) {
        best = {
          cost: candidateCost,
          bindings: candidateBindings
        };
      }
    };

    if (actualTypeFullName) {
      const implicitConversions = collectMethodSignaturesByNames(
        index,
        actualTypeFullName,
        ["opImplConv", "opConv"]
      );
      for (const conversion of implicitConversions) {
        if (conversion.parameters.length !== 0) {
          continue;
        }
        const descriptor = parseTypeDescriptor(conversion.returnType, index);
        const baseCost = conversion.name === "opImplConv" ? 3 : 5;
        tryCandidateConversion(descriptor, baseCost);
      }
    }

    if (expectedTypeFullName && conversionCandidateTypeText) {
      const expectedTypeInfo = index.typeInfoByFullName.get(expectedTypeFullName);
      const expectedTypeName = expectedTypeInfo?.shortName;
      const constructorMethodNames = expectedTypeName
        ? [expectedTypeName, "opAssign"]
        : ["opAssign"];
      const constructors = collectMethodSignaturesByNames(
        index,
        expectedTypeFullName,
        constructorMethodNames
      );

      for (const constructor of constructors) {
        if (constructor.parameters.length !== 1) {
          continue;
        }
        const resolution = resolveBestCallableOverload(
          index,
          [constructor],
          [conversionCandidateTypeText]
        );
        if (!resolution.matched) {
          continue;
        }

        const candidateBindings = new Map(templateBindings);
        if (!best || 4 < best.cost) {
          best = {
            cost: 4,
            bindings: candidateBindings
          };
        }
      }
    }

    if (!best) {
      return undefined;
    }

    templateBindings.clear();
    for (const [name, descriptor] of best.bindings) {
      templateBindings.set(name, descriptor);
    }

    return {
      status: "compatible",
      cost: best.cost
    };
  } finally {
    activeUserDefinedConversionKeys.delete(cycleKey);
  }
}

function getInheritanceDistance(
  index: CompletionIndex,
  childFullName: string,
  ancestorFullName: string
): number | undefined {
  if (childFullName === ancestorFullName) {
    return 0;
  }

  const visited = new Set<string>();
  let current = childFullName;
  let distance = 0;

  while (!visited.has(current)) {
    visited.add(current);
    const typeInfo = index.typeInfoByFullName.get(current);
    if (!typeInfo?.parentShortName) {
      return undefined;
    }

    const parent = tryResolveTypeFullNameFromTypeString(
      index,
      typeInfo.parentShortName,
      typeInfo.namespace
    );
    if (!parent) {
      return undefined;
    }

    distance += 1;
    if (parent === ancestorFullName) {
      return distance;
    }
    current = parent;
  }

  return undefined;
}

function areDescriptorsEquivalent(
  index: CompletionIndex,
  left: TypeDescriptor,
  right: TypeDescriptor
): boolean {
  if (left.isHandle !== right.isHandle) {
    return false;
  }
  if (left.isReference !== right.isReference) {
    return false;
  }
  if (!areBaseTypesEquivalent(index, left, right)) {
    return false;
  }
  if (left.genericArgs.length !== right.genericArgs.length) {
    return false;
  }
  for (let i = 0; i < left.genericArgs.length; i += 1) {
    if (!areDescriptorsEquivalent(index, left.genericArgs[i], right.genericArgs[i])) {
      return false;
    }
  }

  return true;
}

function areBaseTypesEquivalent(
  index: CompletionIndex,
  left: TypeDescriptor,
  right: TypeDescriptor
): boolean {
  if (left.shortBase === right.shortBase) {
    return true;
  }

  const leftFull = resolveTypeFullName(index, left.normalized);
  const rightFull = resolveTypeFullName(index, right.normalized);
  return !!leftFull && !!rightFull && leftFull === rightFull;
}

function parseTypeDescriptor(
  typeText: string | undefined,
  index?: CompletionIndex
): TypeDescriptor | undefined {
  if (!typeText) {
    return undefined;
  }

  let isConst = /\bconst\b/i.test(typeText);
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
      isConst: false,
      isHandle: false,
      isReference: false,
      isNull: true,
      isTemplateParameter: false,
      isAny: false,
      isPrimitive: false
    };
  }

  normalized = normalized
    .replace(/\b(?:in|out|inout)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  while (normalized.startsWith("const ")) {
    isConst = true;
    normalized = normalized.slice("const ".length).trimStart();
  }
  while (normalized.endsWith(" const")) {
    isConst = true;
    normalized = normalized.slice(0, -(" const".length)).trimEnd();
  }

  let isHandle = false;
  let isReference = false;
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
      .map((part) => parseTypeDescriptor(part, index))
      .filter((value): value is TypeDescriptor => value !== undefined);
  }

  let resolvedBase = base;
  if (
    index &&
    resolvedBase.includes("::") &&
    !tryResolveTypeFullNameFromTypeString(index, resolvedBase)
  ) {
    const prefix = resolvedBase.slice(0, resolvedBase.lastIndexOf("::"));
    if (prefix && tryResolveTypeFullNameFromTypeString(index, prefix)) {
      resolvedBase = prefix;
    }
  }

  const shortBase = (resolvedBase.split("::").pop() ?? resolvedBase).toLowerCase();
  const resolvesToKnownType =
    !!index && !!tryResolveTypeFullNameFromTypeString(index, resolvedBase);
  const isTemplateParameter =
    /^[A-Z][A-Za-z0-9_]*$/.test(resolvedBase) &&
    !resolvedBase.includes("::") &&
    !resolvesToKnownType;
  const isAny = shortBase === "auto" || shortBase === "var" || shortBase === "?";

  return {
    raw: typeText,
    normalized,
    base: resolvedBase,
    shortBase,
    genericArgs,
    isConst,
    isHandle,
    isReference,
    isNull: false,
    isTemplateParameter,
    isAny,
    isPrimitive: isPrimitiveTypeName(normalized)
  };
}

function resolveKnownTypeName(index: CompletionIndex, typeName: string): string | undefined {
  const normalized = normalizeTypeText(typeName).trim();
  if (isPrimitiveTypeName(normalized)) {
    return normalized;
  }

  if (index.typeInfoByFullName.has(normalized)) {
    return normalized;
  }

  const fullNames = index.typeFullNamesByShortName.get(normalized);
  if (!fullNames || fullNames.length === 0) {
    return undefined;
  }

  if (fullNames.length === 1) {
    return fullNames[0];
  }

  return typeName;
}

function resolveTypeFullName(
  index: CompletionIndex,
  typeName: string | undefined
): string | undefined {
  if (!typeName) {
    return undefined;
  }

  const descriptor = parseTypeDescriptor(typeName, index);
  if (!descriptor) {
    return undefined;
  }

  return (
    tryResolveTypeFullNameFromTypeString(index, descriptor.normalized) ??
    tryResolveTypeFullNameFromTypeString(index, descriptor.base)
  );
}

function applyTemplateBindingsToType(
  typeText: string,
  bindings: Map<string, TypeDescriptor>
): string {
  let resolved = normalizeTypeText(typeText).trim();
  if (!resolved || bindings.size === 0) {
    return resolved || typeText;
  }

  for (const [templateName, descriptor] of bindings) {
    const replacement = descriptorToTypeText(descriptor);
    if (!replacement) {
      continue;
    }
    const escapedTemplate = escapeRegExp(templateName);
    resolved = resolved.replace(new RegExp(`\\b${escapedTemplate}\\b`, "g"), replacement);
  }

  return resolved;
}

function descriptorToTypeText(descriptor: TypeDescriptor): string {
  const genericSuffix =
    descriptor.genericArgs.length > 0
      ? `<${descriptor.genericArgs.map((value) => descriptorToTypeText(value)).join(", ")}>`
      : "";

  let result = `${descriptor.base}${genericSuffix}`;
  if (descriptor.isConst) {
    result = `const ${result}`;
  }
  if (descriptor.isHandle) {
    result += "@";
  }
  if (descriptor.isReference) {
    result += "&";
  }
  return result;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function numericConversionCost(expectedType: string, actualType: string): number {
  const expected = canonicalNumericType(expectedType);
  const actual = canonicalNumericType(actualType);
  if (expected === actual) {
    return 0;
  }

  if (
    (expected === "float" || expected === "double") &&
    (actual === "float" || actual === "double")
  ) {
    if (expected === "double" && actual === "float") {
      return 1;
    }
    if (expected === "float" && actual === "double") {
      return 5;
    }
  }

  if ((expected === "float" || expected === "double") && isIntegerTypeName(actual)) {
    return expected === "double" ? 2 : 3;
  }
  if (isIntegerTypeName(expected) && (actual === "float" || actual === "double")) {
    return 6;
  }

  const expectedRank = numericRank.get(expected) ?? 0;
  const actualRank = numericRank.get(actual) ?? 0;
  const expectedSigned = expected.startsWith("int");
  const actualSigned = actual.startsWith("int");
  if (expectedRank >= actualRank && expectedSigned === actualSigned) {
    return 1 + (expectedRank - actualRank);
  }
  if (expectedRank >= actualRank) {
    return 2 + (expectedRank - actualRank);
  }

  return 4 + (actualRank - expectedRank);
}

function canonicalNumericType(typeName: string): string {
  const short = normalizeShortTypeName(typeName);
  if (short === "int32") {
    return "int";
  }
  if (short === "uint32") {
    return "uint";
  }
  return short;
}

function promoteNumericType(
  leftType: string | undefined,
  rightType: string | undefined
): string | undefined {
  if (!leftType || !rightType) {
    return undefined;
  }

  const left = canonicalNumericType(leftType);
  const right = canonicalNumericType(rightType);
  if (!numericRank.has(left) || !numericRank.has(right)) {
    return undefined;
  }

  if (left === "double" || right === "double") {
    return "double";
  }
  if (left === "float" || right === "float") {
    return "float";
  }
  if (left === "uint64" || right === "uint64") {
    return "uint64";
  }
  if (left === "int64" || right === "int64") {
    return "int64";
  }
  if (left.startsWith("uint") || right.startsWith("uint")) {
    return "uint";
  }
  return "int";
}

function isPrimitiveTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }

  return (
    isBoolTypeName(typeName) ||
    isTextStringTypeName(typeName) ||
    isNumericTypeName(typeName)
  );
}

function isBoolTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  return normalizeShortTypeName(typeName) === "bool";
}

function isStringTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  return normalizeShortTypeName(typeName) === "string";
}

function isWideStringTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }
  return normalizeShortTypeName(typeName) === "wstring";
}

function isTextStringTypeName(typeName: string | undefined): boolean {
  return isStringTypeName(typeName) || isWideStringTypeName(typeName);
}

function isNumericTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }

  const short = canonicalNumericType(typeName);
  return numericRank.has(short);
}

function isIntegerTypeName(typeName: string | undefined): boolean {
  if (!typeName) {
    return false;
  }

  const short = canonicalNumericType(typeName);
  return (
    short === "int8" ||
    short === "uint8" ||
    short === "int16" ||
    short === "uint16" ||
    short === "int" ||
    short === "uint" ||
    short === "int64" ||
    short === "uint64"
  );
}

function normalizeShortTypeName(typeName: string): string {
  let normalized = normalizeTypeText(typeName)
    .replace(/\b(?:const|in|out|inout)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  while (normalized.endsWith("&")) {
    normalized = normalized.slice(0, -1).trimEnd();
  }
  return (normalized.split("::").pop() ?? normalized).toLowerCase();
}

function normalizeBangIsOperator(text: string): string {
  if (!text.includes("!is")) {
    return text;
  }
  return text.replace(/(^|[\s)\]])!is(?=[\s([]|$)/g, "$1!=");
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

function findTopLevelChar(text: string, target: string): number {
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

    if (
      ch === target &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      angleDepth === 0
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

function parseExpressionAst(text: string): ExpressionNode | undefined {
  const tokens = tokenizeExpression(text);
  const parser = new ExpressionParser(tokens);
  return parser.parseExpression();
}

function tokenizeExpression(text: string): ExpressionToken[] {
  const tokens: ExpressionToken[] = [];
  const fourCharSymbols = new Set<string>([">>>="]);
  const threeCharSymbols = new Set<string>(["...", ">>>", "<<=", ">>=", "**="]);
  const twoCharSymbols = new Set<string>([
    "::",
    "==",
    "!=",
    "<=",
    ">=",
    "&&",
    "||",
    "**",
    "<<",
    ">>",
    "+=",
    "-=",
    "*=",
    "/=",
    "%=",
    "&=",
    "|=",
    "^=",
    "->"
  ]);

  for (let i = 0; i < text.length; ) {
    const ch = text[i];
    const next = i + 1 < text.length ? text[i + 1] : "";
    const third = i + 2 < text.length ? text[i + 2] : "";
    const fourth = i + 3 < text.length ? text[i + 3] : "";

    if (/\s/.test(ch)) {
      i += 1;
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

    if (/[0-9]/.test(ch)) {
      const start = i;
      i += 1;
      while (i < text.length && /[0-9A-Fa-fxX._]/.test(text[i])) {
        i += 1;
      }
      if (i < text.length && /[eE]/.test(text[i])) {
        i += 1;
        if (i < text.length && (text[i] === "+" || text[i] === "-")) {
          i += 1;
        }
        while (i < text.length && /[0-9]/.test(text[i])) {
          i += 1;
        }
      }
      if (i < text.length && /[fF]/.test(text[i])) {
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

    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      i += 1;
      while (i < text.length && /[A-Za-z0-9_]/.test(text[i])) {
        i += 1;
      }
      const tokenText = text.slice(start, i);
      tokens.push({
        kind: expressionKeywords.has(tokenText) ? "keyword" : "identifier",
        text: tokenText,
        start,
        end: i
      });
      continue;
    }

    const quad = `${ch}${next}${third}${fourth}`;
    if (fourCharSymbols.has(quad)) {
      tokens.push({
        kind: "symbol",
        text: quad,
        start: i,
        end: i + 4
      });
      i += 4;
      continue;
    }

    const triple = `${ch}${next}${third}`;
    if (threeCharSymbols.has(triple)) {
      tokens.push({
        kind: "symbol",
        text: triple,
        start: i,
        end: i + 3
      });
      i += 3;
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

    if ("()[]{}.,?:+-*/%!~&|^<>@".includes(ch)) {
      tokens.push({
        kind: "symbol",
        text: ch,
        start: i,
        end: i + 1
      });
      i += 1;
      continue;
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

class ExpressionParser {
  private index = 0;

  public constructor(private readonly tokens: ExpressionToken[]) {}

  public parseExpression(): ExpressionNode | undefined {
    const expression = this.parseConditional();
    if (!expression || !this.isAtEnd()) {
      return undefined;
    }
    return expression;
  }

  private parseConditional(): ExpressionNode | undefined {
    let condition = this.parseBinary(1);
    if (!condition) {
      return undefined;
    }

    if (!this.matchSymbol("?")) {
      return condition;
    }

    const whenTrue = this.parseConditional();
    if (!whenTrue) {
      return condition;
    }

    if (!this.matchSymbol(":")) {
      return condition;
    }

    const whenFalse = this.parseConditional();
    if (!whenFalse) {
      return condition;
    }

    condition = {
      kind: "conditional",
      condition,
      whenTrue,
      whenFalse
    };
    return condition;
  }

  private parseBinary(minPrecedence: number): ExpressionNode | undefined {
    let left = this.parseUnary();
    if (!left) {
      return undefined;
    }

    while (true) {
      const operatorInfo = this.getBinaryOperatorInfo(this.current());
      if (!operatorInfo || operatorInfo.precedence < minPrecedence) {
        break;
      }

      this.advance();
      const right = this.parseBinary(operatorInfo.precedence + 1);
      if (!right) {
        break;
      }

      left = {
        kind: "binary",
        operator: operatorInfo.symbol,
        left,
        right
      };
    }

    return left;
  }

  private parseUnary(): ExpressionNode | undefined {
    const token = this.current();
    if (
      (token.kind === "symbol" &&
        (token.text === "+" || token.text === "-" || token.text === "!" || token.text === "~")) ||
      (token.kind === "keyword" && token.text === "not")
    ) {
      this.advance();
      const operand = this.parseUnary();
      if (!operand) {
        return undefined;
      }
      return {
        kind: "unary",
        operator: token.text,
        operand
      };
    }

    if (token.kind === "keyword" && token.text === "cast") {
      const castExpression = this.parseCastExpression();
      if (castExpression) {
        return castExpression;
      }
    }

    return this.parsePostfix();
  }

  private parseCastExpression(): CastExpressionNode | undefined {
    const castKeyword = this.current();
    if (!(castKeyword.kind === "keyword" && castKeyword.text === "cast")) {
      return undefined;
    }
    this.advance();

    if (!this.matchSymbol("<")) {
      return undefined;
    }

    const typeTokens: ExpressionToken[] = [];
    let angleDepth = 1;
    while (!this.isAtEnd() && angleDepth > 0) {
      const token = this.current();
      if (token.kind === "symbol" && token.text === "<") {
        angleDepth += 1;
        typeTokens.push(token);
        this.advance();
        continue;
      }
      if (token.kind === "symbol" && token.text === ">") {
        angleDepth -= 1;
        if (angleDepth === 0) {
          this.advance();
          break;
        }
        typeTokens.push(token);
        this.advance();
        continue;
      }

      typeTokens.push(token);
      this.advance();
    }

    const targetType = typeTokens.map((token) => token.text).join("").trim();
    if (!targetType) {
      return undefined;
    }

    if (!this.matchSymbol("(")) {
      return undefined;
    }
    const expression = this.parseConditional();
    if (!expression) {
      return undefined;
    }
    this.matchSymbol(")");

    return {
      kind: "cast",
      targetType,
      expression
    };
  }

  private parsePostfix(): ExpressionNode | undefined {
    let node = this.parsePrimary();
    if (!node) {
      return undefined;
    }

    while (true) {
      if (this.matchSymbol("(")) {
        const args: ExpressionNode[] = [];
        if (!this.checkSymbol(")")) {
          while (true) {
            const argument = this.parseCallArgument();
            if (!argument) {
              break;
            }
            args.push(argument);
            if (!this.matchSymbol(",")) {
              break;
            }
          }
        }
        this.matchSymbol(")");
        node = {
          kind: "call",
          callee: node,
          args
        };
        continue;
      }

      if (this.matchSymbol(".")) {
        const memberToken = this.current();
        if (!this.isIdentifierLike(memberToken)) {
          break;
        }
        this.advance();
        node = {
          kind: "member",
          object: node,
          name: memberToken.text
        };
        continue;
      }

      if (this.matchSymbol("[")) {
        const indexExpression = this.parseConditional();
        if (!indexExpression) {
          break;
        }
        this.matchSymbol("]");
        node = {
          kind: "index",
          object: node,
          index: indexExpression
        };
        continue;
      }

      break;
    }

    return node;
  }

  private parseCallArgument(): ExpressionNode | undefined {
    const checkpoint = this.index;
    const first = this.current();
    const second = this.peek(1);
    if (
      this.isIdentifierLike(first) &&
      second.kind === "symbol" &&
      (second.text === ":" || second.text === "=")
    ) {
      this.advance();
      this.advance();
      const namedValue = this.parseConditional();
      if (namedValue) {
        return namedValue;
      }
      this.index = checkpoint;
    }

    return this.parseConditional();
  }

  private parsePrimary(): ExpressionNode | undefined {
    const token = this.current();
    if (token.kind === "number") {
      this.advance();
      return {
        kind: "literal",
        literalKind: inferLiteralKindFromNumberToken(token.text)
      };
    }

    if (token.kind === "string") {
      this.advance();
      return {
        kind: "literal",
        literalKind: token.text.startsWith("'") ? "char" : "string"
      };
    }

    if (token.kind === "keyword" && token.text === "true") {
      this.advance();
      return { kind: "literal", literalKind: "bool" };
    }
    if (token.kind === "keyword" && token.text === "false") {
      this.advance();
      return { kind: "literal", literalKind: "bool" };
    }
    if (token.kind === "keyword" && token.text === "null") {
      this.advance();
      return { kind: "literal", literalKind: "null" };
    }

    if (this.matchSymbol("(")) {
      const expression = this.parseConditional();
      this.matchSymbol(")");
      return expression;
    }

    if (this.isIdentifierLike(token)) {
      const segments: string[] = [];
      segments.push(token.text);
      this.advance();

      while (this.matchSymbol("::")) {
        const next = this.current();
        if (!this.isIdentifierLike(next)) {
          break;
        }
        segments.push(next.text);
        this.advance();
      }

      const qualifiedName = segments.join("::");
      return {
        kind: "identifier",
        name: segments[segments.length - 1],
        qualifiedName
      };
    }

    return undefined;
  }

  private getBinaryOperatorInfo(token: ExpressionToken): BinaryOperatorInfo | undefined {
    if (token.kind !== "keyword" && token.kind !== "symbol") {
      return undefined;
    }
    return binaryOperatorByToken.get(token.text);
  }

  private isIdentifierLike(token: ExpressionToken): boolean {
    if (token.kind === "identifier") {
      return true;
    }
    if (token.kind !== "keyword") {
      return false;
    }
    if (isIntrinsicCallableIdentifier(token.text)) {
      return true;
    }
    if (expressionKeywordOperators.has(token.text)) {
      return false;
    }
    if (expressionLiteralKeywords.has(token.text)) {
      return false;
    }
    if (expressionReservedKeywords.has(token.text)) {
      return false;
    }
    return true;
  }

  private matchSymbol(symbol: string): boolean {
    if (!this.checkSymbol(symbol)) {
      return false;
    }
    this.advance();
    return true;
  }

  private checkSymbol(symbol: string): boolean {
    const token = this.current();
    return token.kind === "symbol" && token.text === symbol;
  }

  private current(): ExpressionToken {
    return this.tokens[Math.min(this.index, this.tokens.length - 1)];
  }

  private peek(offset: number): ExpressionToken {
    return this.tokens[Math.min(this.index + offset, this.tokens.length - 1)];
  }

  private advance(): void {
    if (!this.isAtEnd()) {
      this.index += 1;
    }
  }

  private isAtEnd(): boolean {
    return this.current().kind === "eof";
  }
}

function inferLiteralKindFromNumberToken(tokenText: string): LiteralExpressionNode["literalKind"] {
  const text = tokenText.trim();
  if (/^[+-]?\d+$/.test(text)) {
    return "int";
  }
  if (/^[+-]?(?:\d+\.\d*|\d*\.\d+)(?:[eE][+-]?\d+)?[fF]?$/.test(text)) {
    return /[fF]$/.test(text) ? "float" : "double";
  }
  if (/^[+-]?\d+(?:[eE][+-]?\d+)[fF]?$/.test(text)) {
    return /[fF]$/.test(text) ? "float" : "double";
  }
  return "int";
}
