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
  "double"
]);

export function isLanguageKeyword(identifier: string): boolean {
  return keywords.has(identifier);
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
