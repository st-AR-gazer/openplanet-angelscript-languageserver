import { generatedReservedIdentifiers } from "./reservedIdentifiers.generated";
import {
  angelScriptContextualKeywords,
  angelScriptKeywordLikeTokens,
  angelScriptReservedKeywords
} from "./angelScriptTokenTables.generated";

const reservedKeywords = new Set<string>(angelScriptReservedKeywords);
const contextualKeywords = new Set<string>(angelScriptContextualKeywords);
const keywordLikeTokens = new Set<string>(angelScriptKeywordLikeTokens);

const contextualDisallowedIdentifierKeywords = new Set<string>([
  "and",
  "is",
  "or",
  "xor"
]);

const baseDisallowedIdentifierKeywords = new Set<string>([
  ...reservedKeywords,
  ...generatedReservedIdentifiers,
  ...contextualDisallowedIdentifierKeywords
]);

const disallowedDeclarationIdentifierKeywords = new Set<string>([
  ...baseDisallowedIdentifierKeywords
]);

const disallowedTopLevelFunctionIdentifierKeywords = new Set<string>([
  ...baseDisallowedIdentifierKeywords,
  "string",
  "wstring"
]);

const disallowedLocalIdentifierKeywords = new Set<string>([
  ...baseDisallowedIdentifierKeywords,
  "string",
  "wstring",
]);

const disallowedParameterIdentifierKeywords = new Set<string>([
  ...baseDisallowedIdentifierKeywords
]);

const declarationModifiers = new Set<string>([
  "const",
  "shared",
  "private",
  "protected",
  "final",
  "override",
  "external"
]);

const intrinsicCallableIdentifiers = new Set<string>([
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
  "wstring"
]);

export function isLanguageKeyword(identifier: string): boolean {
  return reservedKeywords.has(identifier);
}

export function isContextualKeyword(identifier: string): boolean {
  return contextualKeywords.has(identifier);
}

export function isKeywordLikeToken(identifier: string): boolean {
  return keywordLikeTokens.has(identifier);
}

export function isDisallowedLocalIdentifierKeyword(identifier: string): boolean {
  return disallowedLocalIdentifierKeywords.has(identifier);
}

export function isDisallowedParameterIdentifierKeyword(identifier: string): boolean {
  return disallowedParameterIdentifierKeywords.has(identifier);
}

export function isDisallowedDeclarationIdentifierKeyword(identifier: string): boolean {
  return disallowedDeclarationIdentifierKeywords.has(identifier);
}

export function isDisallowedTopLevelFunctionIdentifierKeyword(identifier: string): boolean {
  return disallowedTopLevelFunctionIdentifierKeywords.has(identifier);
}

export function isDeclarationModifier(token: string): boolean {
  return declarationModifiers.has(token);
}

export function isIdentifier(text: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text);
}

export function isIntrinsicCallableIdentifier(identifier: string): boolean {
  return intrinsicCallableIdentifiers.has(identifier);
}

export function normalizeTypeText(rawType: string): string {
  let normalized = rawType.trim();
  if (!normalized) {
    return normalized;
  }

  let changed = true;
  while (changed) {
    changed = false;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\b/.exec(normalized);
    if (!match) {
      break;
    }

    const token = match[1];
    if (!isDeclarationModifier(token)) {
      break;
    }

    normalized = normalized.slice(match[0].length).trimStart();
    changed = true;
  }

  return normalized.trim();
}
