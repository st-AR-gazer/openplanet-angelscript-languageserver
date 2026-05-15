import {
  CompletionItem,
  CompletionItemKind
} from "vscode-languageserver/node";
import {
  createSemanticTypeInfo,
  type SemanticSymbolSource,
  type SemanticTypeKind
} from "openplanet-angelscript-core";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type {
  CompletionIndex,
  TypeInfo,
  TypeMemberInfo,
  TypeResolutionContext
} from "./types";
import { getDefaultCompletionSortText } from "./completions";
import { readString, toObjectArray, toRecord } from "./util";

const indexedContainerTypeNames = new Set<string>([
  "array",
  "mwsarray",
  "mwstridedarray",
  "mwfastarray",
  "mwfastbuffer",
  "mwnodpool",
  "mwrefbuffer"
]);

export function getDotCompletionContext(
  document: TextDocument,
  lineNumber: number,
  character: number
): { receiverText: string; memberPrefix: string } | undefined {
  const linePrefix = document.getText({
    start: { line: lineNumber, character: 0 },
    end: { line: lineNumber, character }
  });

  const dotIndex = findLastDotOutsideParens(linePrefix);
  if (dotIndex < 0) {
    return undefined;
  }

  const receiverText = extractReceiverExpression(linePrefix.slice(0, dotIndex));
  const memberPrefix = linePrefix.slice(dotIndex + 1);
  if (!receiverText) {
    return undefined;
  }

  if (!/^[A-Za-z0-9_]*$/.test(memberPrefix)) {
    return undefined;
  }

  return { receiverText, memberPrefix };
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

  const unmatchedOpenParen = findLastUnmatchedOpenParen(text);
  if (unmatchedOpenParen >= 0) {
    cutIndex = Math.max(cutIndex, unmatchedOpenParen);
  }

  text = text.slice(cutIndex + 1).trim();
  text = text.replace(/^(?:return|yield)\b\s*/, "").trim();

  return text.length > 0 ? text : undefined;
}

export function findLastDotOutsideParens(text: string): number {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;
  let lastDot = -1;

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

    if (ch === "." && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      lastDot = i;
    }
  }

  return lastDot;
}

function findLastUnmatchedOpenParen(text: string): number {
  let parenDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = text.length - 1; i >= 0; i -= 1) {
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

    if (ch === ")") {
      parenDepth += 1;
      continue;
    }

    if (ch !== "(") {
      continue;
    }

    if (parenDepth === 0) {
      return i;
    }

    parenDepth = Math.max(0, parenDepth - 1);
  }

  return -1;
}

function isControlKeywordBefore(text: string, index: number): boolean {
  const before = text.slice(0, index).trimEnd();
  return /\b(?:if|while|for|switch|catch)$/.test(before);
}

export function collectMemberCompletionItems(
  index: CompletionIndex,
  receiverTypeFullName: string,
  memberPrefix: string
): CompletionItem[] {
  const allItems = getResolvedMemberCompletionItems(index, receiverTypeFullName);
  if (memberPrefix.length === 0) {
    return allItems;
  }

  const normalizedPrefix = memberPrefix.toLowerCase();
  return allItems.filter((item) => item.label.toLowerCase().startsWith(normalizedPrefix));
}

export function tryResolveExpressionTypeFullName(
  index: CompletionIndex,
  expressionText: string,
  context?: TypeResolutionContext
): string | undefined {
  const resolvedType = tryResolveExpressionType(index, expressionText, context);
  if (!resolvedType) {
    return undefined;
  }

  return tryResolveTypeFullNameFromTypeString(
    index,
    resolvedType.typeText,
    resolvedType.preferredNamespace
  );
}

interface ResolvedExpressionType {
  typeText: string;
  preferredNamespace?: string;
}

function tryResolveExpressionType(
  index: CompletionIndex,
  expressionText: string,
  context?: TypeResolutionContext
): ResolvedExpressionType | undefined {
  const trimmedExpression = stripOuterParentheses(expressionText.trim());
  if (!trimmedExpression) {
    return undefined;
  }

  if (trimmedExpression !== expressionText.trim()) {
    return tryResolveExpressionType(index, trimmedExpression, context);
  }

  const segments = splitByDotsOutsideParens(trimmedExpression);
  if (segments.length === 0) {
    return undefined;
  }

  let currentType = tryResolveBaseExpressionType(
    index,
    segments[0],
    context
  );
  if (!currentType) {
    return undefined;
  }

  for (let i = 1; i < segments.length; i += 1) {
    const nextType = tryResolveMemberAccessType(index, currentType, segments[i]);
    if (!nextType) {
      return undefined;
    }

    currentType = nextType;
  }

  return currentType;
}

export function findResolvedMember(
  index: CompletionIndex,
  typeFullName: string,
  memberName: string
): TypeMemberInfo | undefined {
  const direct = findMemberByName(getResolvedMembers(index, typeFullName), memberName);
  if (direct) {
    return direct;
  }

  const shortName =
    index.typeInfoByFullName.get(typeFullName)?.shortName ??
    (typeFullName.split("::").pop() ?? typeFullName);
  const typeVariants = index.typeFullNamesByShortName.get(shortName) ?? [];
  for (const variant of typeVariants) {
    if (variant === typeFullName) {
      continue;
    }
    const variantMember = findMemberByName(
      getResolvedMembers(index, variant),
      memberName
    );
    if (variantMember) {
      return variantMember;
    }
  }

  return undefined;
}

function findMemberByName(
  members: TypeMemberInfo[],
  memberName: string
): TypeMemberInfo | undefined {
  for (const member of members) {
    if (member.name === memberName) {
      return member;
    }
  }
  return undefined;
}

export function getResolvedMembersForType(
  index: CompletionIndex,
  typeFullName: string
): TypeMemberInfo[] {
  return getResolvedMembers(index, typeFullName);
}

export function registerGameTypeInfo(
  index: CompletionIndex,
  namespaceName: string,
  typeName: string,
  typeRecord: Record<string, unknown>,
  source: SemanticSymbolSource = "openplanet-game-json"
): void {
  const fullName = `${namespaceName}::${typeName}`;

  index.gameTypeFullNames.add(fullName);

  const parentShortName = readString(typeRecord.p);
  const members: TypeMemberInfo[] = [];

  for (const memberRecord of toObjectArray(typeRecord.m)) {
    const memberName = readString(memberRecord.n);
    if (!memberName) {
      continue;
    }

    const memberType = memberRecord.t;
    if (typeof memberType === "string") {
      members.push({
        name: memberName,
        kind: "property",
        type: memberType
      });
      continue;
    }

    members.push({
      name: memberName,
      kind: "method",
      returnType: readString(memberRecord.r),
      args: readString(memberRecord.a)
    });
  }

  registerSemanticTypeInfo(index, {
    fullName,
    shortName: typeName,
    namespace: namespaceName,
    kind: "class",
    source,
    parentShortName,
    members
  });
}

export function registerCoreClassTypeInfo(
  index: CompletionIndex,
  typeFullName: string,
  classRecord: Record<string, unknown>,
  source: SemanticSymbolSource = "openplanet-core-json"
): void {
  const splitIndex = typeFullName.lastIndexOf("::");
  const namespaceName = splitIndex >= 0 ? typeFullName.slice(0, splitIndex) : "";
  const shortName = splitIndex >= 0 ? typeFullName.slice(splitIndex + 2) : typeFullName;

  const members: TypeMemberInfo[] = [];
  const accessorPropertyTypes = new Map<string, string>();
  const explicitPropertyNames = new Set<string>();

  for (const propRecord of toObjectArray(classRecord.props)) {
    const propName = readString(propRecord.name);
    if (!propName) {
      continue;
    }

    const typeDecl = readString(propRecord.typedecl);
    members.push({
      name: propName,
      kind: "property",
      type: typeDecl ?? "var"
    });
    explicitPropertyNames.add(propName);
  }

  for (const methodRecord of toObjectArray(classRecord.methods)) {
    const methodName = readString(methodRecord.name);
    if (!methodName) {
      continue;
    }

    const returnType = readString(methodRecord.returntypedecl);
    const argsText = formatCoreArgs(methodRecord.args);

    members.push({
      name: methodName,
      kind: "method",
      returnType: returnType ?? "void",
      args: argsText
    });

    const accessorProperty = tryBuildCoreAccessorProperty(methodRecord);
    if (!accessorProperty) {
      continue;
    }

    if (accessorProperty.kind === "getter") {
      accessorPropertyTypes.set(
        accessorProperty.propertyName,
        accessorProperty.type
      );
      continue;
    }

    if (!accessorPropertyTypes.has(accessorProperty.propertyName)) {
      accessorPropertyTypes.set(
        accessorProperty.propertyName,
        accessorProperty.type
      );
    }
  }

  for (const behaviorRecord of toObjectArray(classRecord.behaviors)) {
    const funcRecord = toRecord(behaviorRecord.func);
    const constructorName = getCoreBehaviorConstructorName(funcRecord, shortName);
    if (!constructorName) {
      continue;
    }

    members.push({
      name: constructorName,
      kind: "method",
      returnType: readString(funcRecord.returntypedecl) ?? typeFullName,
      args: formatCoreArgs(funcRecord.args)
    });
  }

  for (const [propertyName, propertyType] of accessorPropertyTypes) {
    if (explicitPropertyNames.has(propertyName)) {
      continue;
    }

    members.push({
      name: propertyName,
      kind: "property",
      type: propertyType
    });
  }

  registerSemanticTypeInfo(index, {
    fullName: typeFullName,
    shortName,
    namespace: namespaceName,
    kind: "class",
    source,
    members
  });
}

function getCoreBehaviorConstructorName(
  funcRecord: Record<string, unknown>,
  shortName: string
): string | undefined {
  const decl = readString(funcRecord.decl);
  if (decl) {
    const openParen = decl.indexOf("(");
    const header = openParen >= 0 ? decl.slice(0, openParen).trim() : decl.trim();
    const nameMatch = /([A-Za-z_][A-Za-z0-9_:]*)\s*$/.exec(header);
    const declName = nameMatch?.[1];
    const declLeafName = declName?.split("::").pop();
    if (declLeafName === shortName) {
      return shortName;
    }
  }

  const funcName = readString(funcRecord.name);
  const funcLeafName = funcName?.split("::").pop();
  return funcLeafName === shortName ? shortName : undefined;
}

export function registerNamedTypeInfo(
  index: CompletionIndex,
  typeFullName: string,
  kind?: SemanticTypeKind,
  source: SemanticSymbolSource = "unknown",
  enumMembers: string[] = [],
  parentShortName?: string
): void {
  const splitIndex = typeFullName.lastIndexOf("::");
  const namespaceName = splitIndex >= 0 ? typeFullName.slice(0, splitIndex) : "";
  const shortName = splitIndex >= 0 ? typeFullName.slice(splitIndex + 2) : typeFullName;

  registerSemanticTypeInfo(index, {
    fullName: typeFullName,
    shortName,
    namespace: namespaceName,
    kind,
    source,
    enumMembers,
    parentShortName,
    members: []
  });
}

export function registerSemanticTypeInfo(
  index: CompletionIndex,
  typeInfo: TypeInfo
): void {
  registerTypeShortName(index, typeInfo.shortName, typeInfo.fullName);
  const leafName = typeInfo.fullName.split("::").pop() ?? typeInfo.shortName;
  registerTypeShortName(index, leafName, typeInfo.fullName);

  index.semanticTypes.register(createSemanticTypeInfo({
    fullName: typeInfo.fullName,
    shortName: typeInfo.shortName,
    namespace: typeInfo.namespace,
    kind: typeInfo.kind ?? "unknown",
    source: typeInfo.source ?? "unknown",
    members: typeInfo.members,
    enumMembers: typeInfo.enumMembers ?? [],
    parentShortName: typeInfo.parentShortName
  }));

  const existing = index.typeInfoByFullName.get(typeInfo.fullName);
  if (!existing) {
    index.typeInfoByFullName.set(typeInfo.fullName, {
      ...typeInfo,
      members: [...typeInfo.members],
      enumMembers: [...(typeInfo.enumMembers ?? [])]
    });
    return;
  }

  index.typeInfoByFullName.set(typeInfo.fullName, {
    ...existing,
    kind: existing.kind ?? typeInfo.kind,
    source: existing.source ?? typeInfo.source,
    parentShortName: existing.parentShortName ?? typeInfo.parentShortName,
    members: mergeTypeMembers(existing.members, typeInfo.members),
    enumMembers: dedupeStrings([
      ...(existing.enumMembers ?? []),
      ...(typeInfo.enumMembers ?? [])
    ])
  });
}

function formatCoreArgs(value: unknown): string {
  const parts: string[] = [];
  for (const argRecord of toObjectArray(value)) {
    const typeDecl = readString(argRecord.typedecl);
    if (!typeDecl) {
      continue;
    }

    const argName = readString(argRecord.name);
    const defaultValue = readString(argRecord.default);
    if (argName) {
      parts.push(
        defaultValue ? `${typeDecl} ${argName} = ${defaultValue}` : `${typeDecl} ${argName}`
      );
      continue;
    }

    parts.push(defaultValue ? `${typeDecl} = ${defaultValue}` : typeDecl);
  }

  return parts.join(", ");
}

function tryBuildCoreAccessorProperty(
  methodRecord: Record<string, unknown>
):
  | {
      kind: "getter" | "setter";
      propertyName: string;
      type: string;
    }
  | undefined {
  const methodName = readString(methodRecord.name);
  if (!methodName) {
    return undefined;
  }

  if (methodName.startsWith("get_")) {
    const propertyName = methodName.slice(4);
    if (!isValidIdentifier(propertyName)) {
      return undefined;
    }

    const args = toObjectArray(methodRecord.args);
    if (args.length > 0) {
      return undefined;
    }

    const returnType = readString(methodRecord.returntypedecl)?.trim();
    if (!returnType || returnType === "void") {
      return undefined;
    }

    return {
      kind: "getter",
      propertyName,
      type: returnType
    };
  }

  if (methodName.startsWith("set_")) {
    const propertyName = methodName.slice(4);
    if (!isValidIdentifier(propertyName)) {
      return undefined;
    }

    const args = toObjectArray(methodRecord.args);
    if (args.length !== 1) {
      return undefined;
    }

    const setterArgType = readString(args[0]?.typedecl)?.trim();
    if (!setterArgType) {
      return undefined;
    }

    return {
      kind: "setter",
      propertyName,
      type: setterArgType
    };
  }

  return undefined;
}

function isValidIdentifier(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function registerTypeShortName(
  index: CompletionIndex,
  shortName: string,
  fullName: string
): void {
  const existing = index.typeFullNamesByShortName.get(shortName);
  if (!existing) {
    index.typeFullNamesByShortName.set(shortName, [fullName]);
    return;
  }

  if (!existing.includes(fullName)) {
    existing.push(fullName);
  }
}

function mergeTypeMembers(
  base: TypeMemberInfo[],
  incoming: TypeMemberInfo[]
): TypeMemberInfo[] {
  const merged: TypeMemberInfo[] = [...base];
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

function dedupeStrings(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }
  return output;
}

function getResolvedMemberCompletionItems(
  index: CompletionIndex,
  typeFullName: string
): CompletionItem[] {
  const cached = index.resolvedMemberCompletionsCache.get(typeFullName);
  if (cached) {
    return cached;
  }

  const members = getResolvedMembers(index, typeFullName);
  const items = members
    .map((member) => memberToCompletionItem(member))
    .sort(compareCompletionItemsForDisplay);

  index.resolvedMemberCompletionsCache.set(typeFullName, items);
  return items;
}

function memberToCompletionItem(member: TypeMemberInfo): CompletionItem {
  if (member.kind === "property") {
    const typeDecl = member.type ?? "var";
    return {
      label: member.name,
      kind: CompletionItemKind.Field,
      detail: typeDecl,
      labelDetails: { description: typeDecl },
      sortText: getDefaultCompletionSortText({
        label: member.name,
        kind: CompletionItemKind.Field
      })
    };
  }

  const returnType = member.returnType ?? "void";
  const args = member.args?.trim() ?? "";
  const signature = formatMethodSignature(member);
  return {
    label: member.name,
    kind: CompletionItemKind.Method,
    detail: signature,
    labelDetails: {
      detail: `(${args})`,
      description: returnType
    },
    sortText: getDefaultCompletionSortText({
      label: member.name,
      kind: CompletionItemKind.Method
    })
  };
}

function compareCompletionItemsForDisplay(
  left: CompletionItem,
  right: CompletionItem
): number {
  const leftKey = left.sortText ?? left.label;
  const rightKey = right.sortText ?? right.label;
  const sortResult = leftKey.localeCompare(rightKey);
  if (sortResult !== 0) {
    return sortResult;
  }

  return left.label.localeCompare(right.label);
}

function formatMethodSignature(member: TypeMemberInfo): string {
  const returnType = member.returnType ?? "void";
  const args = member.args?.trim() ?? "";
  return args.length > 0 ? `${returnType} (${args})` : `${returnType} ()`;
}

function getResolvedMembers(
  index: CompletionIndex,
  typeFullName: string
): TypeMemberInfo[] {
  const cached = index.resolvedMembersCache.get(typeFullName);
  if (cached) {
    return cached;
  }

  const resolved = resolveMembersRecursive(index, typeFullName, new Set<string>());
  index.resolvedMembersCache.set(typeFullName, resolved);
  return resolved;
}

function resolveMembersRecursive(
  index: CompletionIndex,
  typeFullName: string,
  visited: Set<string>
): TypeMemberInfo[] {
  if (visited.has(typeFullName)) {
    return [];
  }

  visited.add(typeFullName);

  const typeInfo = index.typeInfoByFullName.get(typeFullName);
  if (!typeInfo) {
    return [];
  }

  const members: TypeMemberInfo[] = [...typeInfo.members];
  const seenNames = new Set<string>(members.map((member) => member.name));
  const accessorPropertyTypes = collectAccessorPropertyTypes(members);
  for (const [propertyName, propertyType] of accessorPropertyTypes) {
    if (seenNames.has(propertyName)) {
      continue;
    }
    seenNames.add(propertyName);
    members.push({
      kind: "property",
      name: propertyName,
      type: propertyType
    });
  }

  if (typeInfo.parentShortName) {
    const parentFullName = tryResolveTypeFullNameFromTypeString(
      index,
      typeInfo.parentShortName,
      typeInfo.namespace
    );

    if (parentFullName && parentFullName !== typeFullName) {
      const parentMembers = resolveMembersRecursive(index, parentFullName, visited);
      for (const parentMember of parentMembers) {
        if (seenNames.has(parentMember.name)) {
          continue;
        }

        seenNames.add(parentMember.name);
        members.push(parentMember);
      }
    }
  }

  return members;
}

function collectAccessorPropertyTypes(
  members: TypeMemberInfo[]
): Map<string, string> {
  const propertyTypes = new Map<string, string>();

  for (const member of members) {
    if (member.kind !== "method") {
      continue;
    }

    if (
      member.name.startsWith("get_") &&
      member.name.length > 4 &&
      (!member.args || member.args.trim().length === 0) &&
      member.returnType &&
      member.returnType !== "void"
    ) {
      const propertyName = member.name.slice(4);
      if (isValidIdentifier(propertyName)) {
        propertyTypes.set(propertyName, member.returnType);
      }
      continue;
    }

    if (
      member.name.startsWith("set_") &&
      member.name.length > 4 &&
      member.args &&
      member.args.trim().length > 0
    ) {
      const propertyName = member.name.slice(4);
      if (!isValidIdentifier(propertyName) || propertyTypes.has(propertyName)) {
        continue;
      }
      const firstArgType = extractFirstParameterType(member.args);
      if (!firstArgType) {
        continue;
      }
      propertyTypes.set(propertyName, firstArgType);
    }
  }

  return propertyTypes;
}

function extractFirstParameterType(argsText: string): string | undefined {
  const first = argsText.split(",")[0]?.trim();
  if (!first) {
    return undefined;
  }

  const withoutDefault = first.split("=")[0]?.trim() ?? first;
  if (!withoutDefault) {
    return undefined;
  }

  const typeAndName =
    /^(.*\S)\s+[A-Za-z_][A-Za-z0-9_]*$/.exec(withoutDefault)?.[1] ??
    withoutDefault;
  const normalized = typeAndName.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function splitByDotsOutsideParens(text: string): string[] {
  const parts: string[] = [];
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;
  let start = 0;

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

    if (ch === "." && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      const part = text.slice(start, i).trim();
      if (part.length > 0) {
        parts.push(part);
      }
      start = i + 1;
    }
  }

  const last = text.slice(start).trim();
  if (last.length > 0) {
    parts.push(last);
  }

  return parts;
}

function tryResolveBaseExpressionType(
  index: CompletionIndex,
  part: string,
  context?: TypeResolutionContext
): ResolvedExpressionType | undefined {
  const trimmed = stripOuterParentheses(part.trim());
  if (!trimmed) {
    return undefined;
  }

  const castMatch =
    /^cast\s*<\s*([^>]+?)\s*>\s*\(([\s\S]*)\)\s*([\s\S]*)$/.exec(trimmed);
  if (castMatch) {
    return applyTrailingIndexes(index, {
      typeText: castMatch[1].trim()
    }, castMatch[3] ?? "");
  }

  const headMatch = /^([A-Za-z_][A-Za-z0-9_:]*)/.exec(trimmed);
  if (!headMatch) {
    return undefined;
  }

  const head = headMatch[1];
  let cursor = head.length;
  cursor = skipWhitespace(trimmed, cursor);

  let resolved: ResolvedExpressionType | undefined;
  if (trimmed[cursor] === "(") {
    const closeParen = findMatchingDelimiter(trimmed, cursor, "(", ")");
    if (closeParen < 0) {
      return undefined;
    }
    cursor = closeParen + 1;

    const localReturnType = context?.localFunctionReturnTypes.get(head);
    const returnType =
      localReturnType ?? tryResolveCoreFunctionReturnType(index, head);
    if (!returnType) {
      if (head === "GetApp") {
        resolved = {
          typeText: "CGameCtnApp@"
        };
      } else {
        return undefined;
      }
    } else {
      resolved = {
        typeText: returnType
      };
    }
  } else {
    const localType = context?.localVariableTypes.get(head);
    if (!localType) {
      return undefined;
    }

    resolved = {
      typeText: localType
    };
  }

  if (!resolved) {
    return undefined;
  }

  const preferredNamespace = getTypeNamespace(index, resolved.typeText);
  return applyTrailingIndexes(index, {
    ...resolved,
    preferredNamespace
  }, trimmed.slice(cursor));
}

function tryResolveCoreFunctionReturnType(
  index: CompletionIndex,
  callableName: string
): string | undefined {
  const directReturnType = index.coreFunctionReturnTypes.get(callableName);
  if (directReturnType) {
    return directReturnType;
  }

  const qualifiedSignatures =
    index.coreFunctionSignaturesByQualifiedName.get(callableName);
  if (qualifiedSignatures) {
    for (const signature of qualifiedSignatures) {
      const returnType = parseReturnTypeFromCallableSignature(signature);
      if (returnType) {
        return returnType;
      }
    }
  }

  const unqualifiedName = callableName.split("::").pop() ?? callableName;
  if (unqualifiedName !== callableName) {
    const unqualifiedReturnType = index.coreFunctionReturnTypes.get(unqualifiedName);
    if (unqualifiedReturnType) {
      return unqualifiedReturnType;
    }
  }

  for (const signature of index.coreFunctionSignatures.get(unqualifiedName) ?? []) {
    const returnType = parseReturnTypeFromCallableSignature(signature);
    if (returnType) {
      return returnType;
    }
  }

  return undefined;
}

function parseReturnTypeFromCallableSignature(signature: string): string | undefined {
  const openParen = signature.indexOf("(");
  if (openParen < 0) {
    return undefined;
  }

  const header = signature.slice(0, openParen).trim();
  const nameMatch = /([A-Za-z_][A-Za-z0-9_:]*)\s*$/.exec(header);
  if (!nameMatch) {
    return undefined;
  }

  const returnType = header.slice(0, nameMatch.index).trim();
  return returnType.length > 0 ? returnType : undefined;
}

function tryResolveMemberAccessType(
  index: CompletionIndex,
  receiverType: ResolvedExpressionType,
  segment: string
): ResolvedExpressionType | undefined {
  const trimmed = segment.trim();
  if (!trimmed) {
    return undefined;
  }

  const memberMatch = /^([A-Za-z_][A-Za-z0-9_]*)/.exec(trimmed);
  if (!memberMatch) {
    return undefined;
  }

  const receiverTypeFullName = tryResolveTypeFullNameFromTypeString(
    index,
    receiverType.typeText,
    receiverType.preferredNamespace
  );
  if (!receiverTypeFullName) {
    return undefined;
  }

  const memberName = memberMatch[1];
  let cursor = memberName.length;
  cursor = skipWhitespace(trimmed, cursor);

  let isCall = false;
  if (trimmed[cursor] === "(") {
    const closeParen = findMatchingDelimiter(trimmed, cursor, "(", ")");
    if (closeParen < 0) {
      return undefined;
    }
    isCall = true;
    cursor = closeParen + 1;
  }

  const member = findResolvedMember(index, receiverTypeFullName, memberName);
  if (!member) {
    return undefined;
  }

  const nextTypeText =
    isCall && member.kind === "method"
      ? member.returnType
      : !isCall && member.kind === "property"
        ? member.type
        : undefined;
  if (!nextTypeText) {
    return undefined;
  }

  return applyTrailingIndexes(index, {
    typeText: nextTypeText,
    preferredNamespace: index.typeInfoByFullName.get(receiverTypeFullName)?.namespace
  }, trimmed.slice(cursor));
}

function applyTrailingIndexes(
  index: CompletionIndex,
  resolvedType: ResolvedExpressionType,
  trailingText: string
): ResolvedExpressionType | undefined {
  let cursor = 0;
  let current = resolvedType;
  while (true) {
    cursor = skipWhitespace(trailingText, cursor);
    if (cursor >= trailingText.length) {
      return current;
    }

    if (trailingText[cursor] !== "[") {
      return undefined;
    }

    const closeBracket = findMatchingDelimiter(trailingText, cursor, "[", "]");
    if (closeBracket < 0) {
      return undefined;
    }

    const indexedType = tryResolveIndexedExpressionType(index, current);
    if (!indexedType) {
      return undefined;
    }

    current = indexedType;
    cursor = closeBracket + 1;
  }
}

function tryResolveIndexedExpressionType(
  index: CompletionIndex,
  resolvedType: ResolvedExpressionType
): ResolvedExpressionType | undefined {
  const genericElementType = tryExtractIndexedContainerElementType(resolvedType.typeText);
  if (genericElementType) {
    return {
      typeText: genericElementType,
      preferredNamespace: resolvedType.preferredNamespace
    };
  }

  const receiverTypeFullName = tryResolveTypeFullNameFromTypeString(
    index,
    resolvedType.typeText,
    resolvedType.preferredNamespace
  );
  if (!receiverTypeFullName) {
    return undefined;
  }

  const candidates = getResolvedMembersForType(index, receiverTypeFullName)
    .filter(
      (member) =>
        member.kind === "method" &&
        (member.name === "opIndex" || member.name === "opIndexConst") &&
        typeof member.returnType === "string" &&
        member.returnType.trim().length > 0
    )
    .map((member) => member.returnType?.trim() ?? "")
    .filter((memberType): memberType is string => memberType.length > 0);
  const uniqueCandidates = [...new Set(candidates)];
  if (uniqueCandidates.length !== 1) {
    return undefined;
  }

  return {
    typeText: uniqueCandidates[0],
    preferredNamespace: index.typeInfoByFullName.get(receiverTypeFullName)?.namespace
  };
}

function tryExtractIndexedContainerElementType(typeText: string): string | undefined {
  const normalized = normalizeTypeLookupText(typeText);
  const genericStart = normalized.indexOf("<");
  if (genericStart < 0) {
    return undefined;
  }

  const genericEnd = findMatchingTypeGenericClose(normalized, genericStart);
  if (genericEnd < 0) {
    return undefined;
  }

  const baseName = normalized.slice(0, genericStart).trim();
  const shortBaseName = (baseName.split("::").pop() ?? baseName).toLowerCase();
  if (!indexedContainerTypeNames.has(shortBaseName)) {
    return undefined;
  }

  const genericBody = normalized.slice(genericStart + 1, genericEnd).trim();
  if (!genericBody) {
    return undefined;
  }

  const genericArgs = splitTopLevelByComma(genericBody);
  const firstArg = genericArgs[0]?.trim();
  return firstArg && firstArg.length > 0 ? firstArg : undefined;
}

function normalizeTypeLookupText(typeText: string): string {
  let normalized = typeText.trim();
  while (
    /^(const|shared|private|protected|final|override|external)\b/.test(normalized)
  ) {
    normalized = normalized
      .replace(/^(const|shared|private|protected|final|override|external)\s+/, "")
      .trim();
  }

  normalized = normalized
    .replace(/\b(inout|in|out)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  normalized = normalizeArrayBracketShorthand(normalized);
  return normalized.replace(/[@&]+$/g, "").trim();
}

function splitTopLevelByComma(text: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let angleDepth = 0;
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

    if (ch === "<") {
      angleDepth += 1;
      continue;
    }

    if (ch === ">") {
      angleDepth = Math.max(0, angleDepth - 1);
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
      ch === "," &&
      angleDepth === 0 &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      parts.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }

  const lastPart = text.slice(start).trim();
  if (lastPart.length > 0) {
    parts.push(lastPart);
  }

  return parts;
}

function stripOuterParentheses(text: string): string {
  let current = text.trim();
  while (current.startsWith("(") && current.endsWith(")")) {
    const closeParen = findMatchingDelimiter(current, 0, "(", ")");
    if (closeParen !== current.length - 1) {
      break;
    }
    current = current.slice(1, -1).trim();
  }
  return current;
}

function skipWhitespace(text: string, index: number): number {
  let cursor = index;
  while (cursor < text.length && /\s/.test(text[cursor])) {
    cursor += 1;
  }
  return cursor;
}

function findMatchingDelimiter(
  text: string,
  startIndex: number,
  openChar: "(" | "[" | "{",
  closeChar: ")" | "]" | "}"
): number {
  if (text[startIndex] !== openChar) {
    return -1;
  }

  const stack: string[] = [closeChar];
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = startIndex + 1; i < text.length; i += 1) {
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

    if (ch === "(") {
      stack.push(")");
      continue;
    }

    if (ch === "[") {
      stack.push("]");
      continue;
    }

    if (ch === "{") {
      stack.push("}");
      continue;
    }

    if (stack.length > 0 && ch === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) {
        return i;
      }
    }
  }

  return -1;
}

function findMatchingTypeGenericClose(text: string, startIndex: number): number {
  if (text[startIndex] !== "<") {
    return -1;
  }

  let depth = 1;
  for (let i = startIndex + 1; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "<") {
      depth += 1;
      continue;
    }

    if (ch === ">") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function getTypeNamespace(
  index: CompletionIndex,
  typeText: string,
  preferredNamespace?: string
): string | undefined {
  const typeFullName = tryResolveTypeFullNameFromTypeString(
    index,
    typeText,
    preferredNamespace
  );
  return typeFullName
    ? index.typeInfoByFullName.get(typeFullName)?.namespace
    : preferredNamespace;
}

export function tryResolveTypeFullNameFromTypeString(
  index: CompletionIndex,
  typeString: string,
  preferredNamespace?: string
): string | undefined {
  let normalized = typeString.trim();
  if (!normalized) {
    return undefined;
  }

  while (
    /^(const|shared|private|protected|final|override|external)\b/.test(normalized)
  ) {
    normalized = normalized
      .replace(/^(const|shared|private|protected|final|override|external)\s+/, "")
      .trim();
  }
  normalized = normalized
    .replace(/\b(inout|in|out)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  normalized = normalizeArrayBracketShorthand(normalized);

  const genericIndex = normalized.indexOf("<");
  if (genericIndex >= 0) {
    normalized = normalized.slice(0, genericIndex).trim();
  }

  normalized = normalized.replace(/[@&]+$/g, "").trim();

  const shortName = normalized.split("::").pop() ?? normalized;
  const candidates = index.typeFullNamesByShortName.get(shortName);
  const directType = index.typeInfoByFullName.get(normalized);
  if (normalized.includes("::")) {
    return directType ? normalized : undefined;
  }

  if (directType && (!candidates || candidates.length === 0)) {
    return normalized;
  }

  if (!candidates || candidates.length === 0) {
    return undefined;
  }

  if (preferredNamespace) {
    const preferred = candidates.find((candidate) =>
      candidate.startsWith(`${preferredNamespace}::`)
    );
    if (preferred) {
      return preferred;
    }
  }

  if (directType) {
    const richerCandidate = candidates.find((candidate) => {
      if (candidate === normalized) {
        return false;
      }
      const candidateInfo = index.typeInfoByFullName.get(candidate);
      if (!candidateInfo || candidateInfo.namespace.length === 0) {
        return false;
      }
      return candidateInfo.members.length > directType.members.length;
    });
    if (richerCandidate) {
      return richerCandidate;
    }

    return normalized;
  }

  return candidates[0];
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
