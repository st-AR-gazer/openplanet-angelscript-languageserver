import {
  CompletionItem,
  CompletionItemKind
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type {
  CompletionIndex,
  TypeMemberInfo,
  TypeResolutionContext
} from "./types";
import { readString, toObjectArray } from "./util";

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

  const receiverText = linePrefix.slice(0, dotIndex).trimEnd();
  const memberPrefix = linePrefix.slice(dotIndex + 1);
  if (!receiverText) {
    return undefined;
  }

  if (!/^[A-Za-z0-9_]*$/.test(memberPrefix)) {
    return undefined;
  }

  return { receiverText, memberPrefix };
}

export function findLastDotOutsideParens(text: string): number {
  let depth = 0;
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
      depth += 1;
      continue;
    }

    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (ch === "." && depth === 0) {
      lastDot = i;
    }
  }

  return lastDot;
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
  const segments = splitByDotsOutsideParens(expressionText);
  if (segments.length === 0) {
    return undefined;
  }

  let currentType = tryResolveBaseExpressionTypeFullName(
    index,
    segments[0],
    context
  );
  if (!currentType) {
    return undefined;
  }

  for (let i = 1; i < segments.length; i += 1) {
    const segment = segments[i];
    const access = parseMemberAccessSegment(segment);
    if (!access) {
      return undefined;
    }

    const member = findResolvedMember(index, currentType, access.name);
    if (!member) {
      return undefined;
    }

    const nextTypeString =
      access.isCall && member.kind === "method"
        ? member.returnType
        : !access.isCall && member.kind === "property"
          ? member.type
          : undefined;

    if (!nextTypeString) {
      return undefined;
    }

    const preferredNamespace = index.typeInfoByFullName.get(currentType)?.namespace;
    const nextTypeFullName = tryResolveTypeFullNameFromTypeString(
      index,
      nextTypeString,
      preferredNamespace
    );
    if (!nextTypeFullName) {
      return undefined;
    }

    currentType = nextTypeFullName;
  }

  return currentType;
}

export function findResolvedMember(
  index: CompletionIndex,
  typeFullName: string,
  memberName: string
): TypeMemberInfo | undefined {
  for (const member of getResolvedMembers(index, typeFullName)) {
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
  typeRecord: Record<string, unknown>
): void {
  const fullName = `${namespaceName}::${typeName}`;

  registerTypeShortName(index, typeName, fullName);
  index.gameTypeFullNames.add(fullName);

  if (index.typeInfoByFullName.has(fullName)) {
    return;
  }

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

  index.typeInfoByFullName.set(fullName, {
    fullName,
    shortName: typeName,
    namespace: namespaceName,
    parentShortName,
    members
  });
}

export function registerCoreClassTypeInfo(
  index: CompletionIndex,
  typeFullName: string,
  classRecord: Record<string, unknown>
): void {
  const splitIndex = typeFullName.lastIndexOf("::");
  const namespaceName = splitIndex >= 0 ? typeFullName.slice(0, splitIndex) : "";
  const shortName = splitIndex >= 0 ? typeFullName.slice(splitIndex + 2) : typeFullName;

  registerTypeShortName(index, shortName, typeFullName);

  if (index.typeInfoByFullName.has(typeFullName)) {
    return;
  }

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

  index.typeInfoByFullName.set(typeFullName, {
    fullName: typeFullName,
    shortName,
    namespace: namespaceName,
    members
  });
}

export function registerNamedTypeInfo(
  index: CompletionIndex,
  typeFullName: string
): void {
  const splitIndex = typeFullName.lastIndexOf("::");
  const namespaceName = splitIndex >= 0 ? typeFullName.slice(0, splitIndex) : "";
  const shortName = splitIndex >= 0 ? typeFullName.slice(splitIndex + 2) : typeFullName;

  registerTypeShortName(index, shortName, typeFullName);

  if (index.typeInfoByFullName.has(typeFullName)) {
    return;
  }

  index.typeInfoByFullName.set(typeFullName, {
    fullName: typeFullName,
    shortName,
    namespace: namespaceName,
    members: []
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
    if (argName) {
      parts.push(`${typeDecl} ${argName}`);
      continue;
    }

    parts.push(typeDecl);
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
    .sort((a, b) => a.label.localeCompare(b.label));

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
      labelDetails: { description: typeDecl }
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
    }
  };
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

function splitByDotsOutsideParens(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
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
      depth += 1;
      continue;
    }

    if (ch === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }

    if (ch === "." && depth === 0) {
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

function tryResolveBaseExpressionTypeFullName(
  index: CompletionIndex,
  part: string,
  context?: TypeResolutionContext
): string | undefined {
  const trimmed = part.trim();
  if (!trimmed) {
    return undefined;
  }

  const castMatch =
    /^cast\s*<\s*([^>]+?)\s*>\s*\(([\s\S]*)\)\s*$/.exec(trimmed);
  if (castMatch) {
    return tryResolveTypeFullNameFromTypeString(index, castMatch[1]);
  }

  const callMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*\([\s\S]*\)\s*$/.exec(trimmed);
  if (callMatch) {
    const functionName = callMatch[1];
    const localReturnType = context?.localFunctionReturnTypes.get(functionName);
    const returnType =
      localReturnType ?? index.coreFunctionReturnTypes.get(functionName);
    if (!returnType) {
      if (functionName === "GetApp") {
        return tryResolveTypeFullNameFromTypeString(index, "CGameCtnApp@");
      }

      return undefined;
    }

    return tryResolveTypeFullNameFromTypeString(index, returnType);
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed)) {
    const localType = context?.localVariableTypes.get(trimmed);
    if (!localType) {
      return undefined;
    }

    return tryResolveTypeFullNameFromTypeString(index, localType);
  }

  return undefined;
}

function parseMemberAccessSegment(
  segment: string
): { name: string; isCall: boolean } | undefined {
  const trimmed = segment.trim();
  if (!trimmed) {
    return undefined;
  }

  const callMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*\(/.exec(trimmed);
  if (callMatch) {
    return { name: callMatch[1], isCall: true };
  }

  const propMatch = /^([A-Za-z_][A-Za-z0-9_]*)/.exec(trimmed);
  if (propMatch) {
    return { name: propMatch[1], isCall: false };
  }

  return undefined;
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

  const genericIndex = normalized.indexOf("<");
  if (genericIndex >= 0) {
    normalized = normalized.slice(0, genericIndex).trim();
  }

  normalized = normalized.replace(/[@&]+$/g, "").trim();

  if (index.typeInfoByFullName.has(normalized)) {
    return normalized;
  }

  const shortName = normalized.split("::").pop() ?? normalized;
  const candidates = index.typeFullNamesByShortName.get(shortName);
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

  return candidates[0];
}
