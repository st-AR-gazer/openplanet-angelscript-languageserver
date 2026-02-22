import {
  CompletionItem,
  CompletionItemKind
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type {
  CompletionBucket,
  CompletionIndex,
  CompletionShortcutSettings
} from "./types";

const ROOT_NAMESPACE = "<root>";

const languageKeywords = [
  "if",
  "else",
  "for",
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
  "const",
  "private",
  "protected",
  "shared",
  "override",
  "true",
  "false",
  "null"
];

const keywordCompletionItems: CompletionItem[] = languageKeywords.map(
  (keyword) => ({
    label: keyword,
    kind: CompletionItemKind.Keyword
  })
);

export function createCompletionBucket(): CompletionBucket {
  return {
    items: [],
    seen: new Set<string>(),
    functionByLabel: new Map<string, CompletionItem>()
  };
}

export function createCompletionIndex(): CompletionIndex {
  return {
    global: createCompletionBucket(),
    namespaceBuckets: new Map<string, CompletionBucket>(),
    namespaceChildren: new Map<string, Set<string>>(),
    typeInfoByFullName: new Map(),
    typeFullNamesByShortName: new Map(),
    gameTypeFullNames: new Set(),
    resolvedMembersCache: new Map(),
    resolvedMemberCompletionsCache: new Map(),
    coreGlobalFunctionNames: new Set(),
    coreGlobalFuncdefNames: new Set(),
    coreGlobalValueNames: new Set(),
    coreFunctionReturnTypes: new Map(),
    coreFunctionSignatures: new Map(),
    coreFunctionSignaturesByQualifiedName: new Map()
  };
}

export function addSymbol(
  index: CompletionIndex,
  namespaceName: string | undefined,
  item: CompletionItem
): void {
  const normalizedNamespace = normalizeNamespace(namespaceName);
  if (normalizedNamespace) {
    registerNamespacePath(index, normalizedNamespace);
  }

  const normalizedItem = normalizeCompletionItem(item);

  const bucket = normalizedNamespace
    ? getNamespaceBucket(index, normalizedNamespace)
    : index.global;

  if (normalizedItem.kind === CompletionItemKind.Function) {
    const existing = bucket.functionByLabel.get(normalizedItem.label);
    if (existing) {
      mergeFunctionCompletionItems(existing, normalizedItem);
      return;
    }

    initializeFunctionCompletionItem(normalizedItem);
    bucket.functionByLabel.set(normalizedItem.label, normalizedItem);
    bucket.items.push(normalizedItem);
    return;
  }

  const dedupeKey =
    `${normalizedItem.label}|${normalizedItem.kind ?? 0}`;

  if (bucket.seen.has(dedupeKey)) {
    return;
  }

  bucket.seen.add(dedupeKey);
  bucket.items.push(normalizedItem);
}

export function registerNamespacePath(
  index: CompletionIndex,
  namespaceName: string
): void {
  const normalized = normalizeNamespace(namespaceName);
  if (!normalized) {
    return;
  }

  const segments = normalized
    .split("::")
    .filter((segment) => segment.length > 0);
  let parent = ROOT_NAMESPACE;
  let fullNamespace = "";

  for (const segment of segments) {
    const children = getNamespaceChildrenSet(index, parent);
    children.add(segment);

    fullNamespace = fullNamespace ? `${fullNamespace}::${segment}` : segment;

    getNamespaceBucket(index, fullNamespace);
    parent = fullNamespace;
  }
}

export function normalizeNamespace(
  namespaceName: string | undefined
): string | undefined {
  if (!namespaceName) {
    return undefined;
  }

  const trimmed = namespaceName.trim().replace(/^:+/, "").replace(/:+$/, "");
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
}

function getNamespaceBucket(
  index: CompletionIndex,
  namespaceName: string
): CompletionBucket {
  let bucket = index.namespaceBuckets.get(namespaceName);
  if (!bucket) {
    bucket = createCompletionBucket();
    index.namespaceBuckets.set(namespaceName, bucket);
  }

  return bucket;
}

function getNamespaceChildrenSet(
  index: CompletionIndex,
  parentNamespace: string
): Set<string> {
  let set = index.namespaceChildren.get(parentNamespace);
  if (!set) {
    set = new Set<string>();
    index.namespaceChildren.set(parentNamespace, set);
  }

  return set;
}

function normalizeCompletionItem(item: CompletionItem): CompletionItem {
  if (item.kind === CompletionItemKind.Function) {
    return normalizeFunctionCompletionItem(item);
  }

  if (item.kind !== CompletionItemKind.Enum) {
    return item;
  }

  const insertText =
    typeof item.insertText === "string" && item.insertText.length > 0
      ? item.insertText
      : `${item.label}::`;

  const command =
    item.command ??
    {
      title: "Trigger Suggestions",
      command: "editor.action.triggerSuggest"
    };

  return {
    ...item,
    insertText,
    command
  };
}

function normalizeFunctionCompletionItem(item: CompletionItem): CompletionItem {
  const signature = typeof item.detail === "string" ? item.detail.trim() : "";
  const returnType = parseReturnTypeFromFunctionSignature(signature, item.label);

  if (!signature || !returnType) {
    return item;
  }

  const labelDetails = item.labelDetails
    ? {
        ...item.labelDetails,
        description: item.labelDetails.description ?? returnType
      }
    : { description: returnType };

  const dataRecord =
    typeof item.data === "object" && item.data !== null
      ? ({ ...(item.data as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  if (typeof dataRecord.signature !== "string" || dataRecord.signature.length === 0) {
    dataRecord.signature = signature;
  }

  const normalized: CompletionItem = {
    ...item,
    labelDetails,
    data: dataRecord
  };

  if (signature.includes(`${item.label}(`)) {
    normalized.detail = returnType;
  }

  return normalized;
}

function initializeFunctionCompletionItem(item: CompletionItem): void {
  const signatures = collectFunctionSignatures(item);
  if (signatures.length === 0) {
    return;
  }

  setFunctionSignatures(item, signatures);
  applyFunctionOverloadSummary(item, signatures);
}

function mergeFunctionCompletionItems(
  existing: CompletionItem,
  incoming: CompletionItem
): void {
  const signatures = dedupeStrings([
    ...collectFunctionSignatures(existing),
    ...collectFunctionSignatures(incoming)
  ]);
  if (signatures.length === 0) {
    return;
  }

  setFunctionSignatures(existing, signatures);
  applyFunctionOverloadSummary(existing, signatures);
}

function applyFunctionOverloadSummary(
  item: CompletionItem,
  signatures: string[]
): void {
  const returnTypes = dedupeStrings(
    signatures
      .map((signature) =>
        parseReturnTypeFromFunctionSignature(signature, item.label)
      )
      .filter((value): value is string => typeof value === "string")
  );
  const returnType =
    returnTypes.length === 1
      ? returnTypes[0]
      : returnTypes.length > 1
        ? "overloaded"
        : typeof item.detail === "string" && item.detail.length > 0
          ? item.detail
          : "function";
  const overloadSuffix =
    signatures.length > 1
      ? ` (+${signatures.length - 1} overload${signatures.length - 1 === 1 ? "" : "s"})`
      : "";

  item.detail = `${returnType}${overloadSuffix}`;
  item.labelDetails = item.labelDetails
    ? {
        ...item.labelDetails,
        description: returnType
      }
    : { description: returnType };
  item.documentation = {
    kind: "markdown",
    value: [
      `**Overloads (${signatures.length})**`,
      ...signatures.map((signature) => `- \`${signature}\``),
      "",
      "Use parameter hints (left/right arrows) to browse overloads after inserting the call."
    ].join("\n")
  };
  item.command = {
    title: "Trigger Parameter Hints",
    command: "editor.action.triggerParameterHints"
  };
}

function collectFunctionSignatures(item: CompletionItem): string[] {
  const signatures: string[] = [];
  if (typeof item.data === "object" && item.data !== null) {
    const record = item.data as Record<string, unknown>;
    if (Array.isArray(record.overloads)) {
      for (const overload of record.overloads) {
        if (typeof overload === "string" && overload.length > 0) {
          signatures.push(overload);
        }
      }
    }
    if (typeof record.signature === "string" && record.signature.length > 0) {
      signatures.push(record.signature);
    }
  }

  return dedupeStrings(signatures);
}

function setFunctionSignatures(item: CompletionItem, signatures: string[]): void {
  const record =
    typeof item.data === "object" && item.data !== null
      ? ({ ...(item.data as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  record.overloads = signatures;
  if (typeof record.signature !== "string" || record.signature.length === 0) {
    record.signature = signatures[0];
  }
  item.data = record;
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

function parseReturnTypeFromFunctionSignature(
  signature: string,
  functionName: string
): string | undefined {
  const nameIndex = signature.indexOf(functionName);
  if (nameIndex < 0) {
    return undefined;
  }

  const beforeName = signature.slice(0, nameIndex).trim();
  if (!beforeName) {
    return undefined;
  }

  const tokens = beforeName.split(/\s+/).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    return undefined;
  }

  while (tokens.length > 1 && isDeclarationModifier(tokens[0])) {
    tokens.shift();
  }

  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i];
    if (/^[A-Za-z_][A-Za-z0-9_:<>@&]*$/.test(token)) {
      return token;
    }
  }

  return tokens[tokens.length - 1];
}

function isDeclarationModifier(token: string): boolean {
  switch (token) {
    case "const":
    case "shared":
    case "private":
    case "protected":
    case "final":
    case "override":
    case "external":
      return true;
    default:
      return false;
  }
}

export function collectCompletionItems(
  index: CompletionIndex,
  activeNamespace: string | undefined,
  shortcuts?: CompletionShortcutSettings
): CompletionItem[] {
  const items: CompletionItem[] = [];

  if (activeNamespace) {
    items.push(...getNamespaceChildCompletionItems(index, activeNamespace));
    const namespaceBucket = index.namespaceBuckets.get(activeNamespace);
    if (namespaceBucket) {
      items.push(...namespaceBucket.items);
    }
  } else {
    items.push(...getNamespaceChildCompletionItems(index, undefined));
    items.push(...index.global.items);
    items.push(...collectShortcutCompletionItems(index, shortcuts));
  }

  items.push(...keywordCompletionItems);
  return dedupeCompletionItems(items);
}

function getNamespaceChildCompletionItems(
  index: CompletionIndex,
  parentNamespace: string | undefined
): CompletionItem[] {
  const key = parentNamespace ?? ROOT_NAMESPACE;
  const children = index.namespaceChildren.get(key);
  if (!children || children.size === 0) {
    return [];
  }

  return [...children]
    .sort((a, b) => a.localeCompare(b))
    .map((segment) => {
      const fullNamespace = parentNamespace
        ? `${parentNamespace}::${segment}`
        : segment;

      return {
        label: `${segment}::`,
        insertText: `${segment}::`,
        kind: CompletionItemKind.Module,
        detail: `namespace ${fullNamespace}`
      };
    });
}

export function getActiveNamespaceAtPosition(
  document: TextDocument,
  lineNumber: number,
  character: number
): string | undefined {
  const linePrefix = document.getText({
    start: { line: lineNumber, character: 0 },
    end: { line: lineNumber, character }
  });

  const match =
    /([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)::[A-Za-z0-9_]*$/.exec(
      linePrefix
    );
  if (!match) {
    return undefined;
  }

  return normalizeNamespace(match[1]);
}

export function resolveCompletionItemDetails(item: CompletionItem): CompletionItem {
  if (item.kind !== CompletionItemKind.Function) {
    return item;
  }

  const signatures = collectFunctionSignatures(item);
  if (signatures.length === 0) {
    return item;
  }

  const resolved: CompletionItem = {
    ...item
  };
  const primarySignature = signatures[0];
  const overloadSuffix =
    signatures.length > 1
      ? ` (+${signatures.length - 1} overload${signatures.length - 1 === 1 ? "" : "s"})`
      : "";

  resolved.detail = `${primarySignature}${overloadSuffix}`;
  resolved.documentation = {
    kind: "markdown",
    value: [
      `**${resolved.label}**`,
      "",
      `**Overloads (${signatures.length})**`,
      ...signatures.map((signature) => `- \`${signature}\``),
      "",
      "Use left/right arrows in parameter hints to switch overloads."
    ].join("\n")
  };

  return resolved;
}

function collectShortcutCompletionItems(
  index: CompletionIndex,
  shortcuts: CompletionShortcutSettings | undefined
): CompletionItem[] {
  if (!shortcuts) {
    return [];
  }

  const namespaceShortcuts = getEnabledShortcutNamespaces(shortcuts);
  if (namespaceShortcuts.length === 0) {
    return [];
  }

  const shortcutItems: CompletionItem[] = [];
  for (const namespace of namespaceShortcuts) {
    const bucket = index.namespaceBuckets.get(namespace);
    if (!bucket || bucket.items.length === 0) {
      continue;
    }

    for (const item of bucket.items) {
      if (item.kind !== CompletionItemKind.Function) {
        continue;
      }

      shortcutItems.push(withShortcutNamespaceItem(item, namespace));
    }
  }

  return shortcutItems;
}

function getEnabledShortcutNamespaces(
  shortcuts: CompletionShortcutSettings
): string[] {
  const namespaces: string[] = [];
  if (shortcuts.math) {
    namespaces.push("Math");
  }
  if (shortcuts.ui) {
    namespaces.push("UI");
  }
  if (shortcuts.mathX) {
    namespaces.push("MathX");
  }
  if (shortcuts.ux) {
    namespaces.push("UX");
  }
  if (shortcuts.mat) {
    namespaces.push("mat4");
  }
  if (shortcuts.quat) {
    namespaces.push("quat");
  }
  if (shortcuts.string) {
    namespaces.push("string");
  }
  return namespaces;
}

function withShortcutNamespaceItem(
  item: CompletionItem,
  namespace: string
): CompletionItem {
  const descriptionSuffix = `${namespace}:: shortcut`;
  const dataRecord =
    typeof item.data === "object" && item.data !== null
      ? ({ ...(item.data as Record<string, unknown>) } as Record<string, unknown>)
      : {};
  dataRecord.shortcutNamespace = namespace;

  const detail = item.detail
    ? `${item.detail} [${descriptionSuffix}]`
    : descriptionSuffix;
  const labelDetails = item.labelDetails
    ? {
        ...item.labelDetails,
        description: item.labelDetails.description
          ? `${item.labelDetails.description} | ${namespace}::`
          : `${namespace}::`
      }
    : { description: `${namespace}::` };

  return {
    ...item,
    detail,
    labelDetails,
    data: dataRecord
  };
}

function dedupeCompletionItems(items: CompletionItem[]): CompletionItem[] {
  const output: CompletionItem[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const key = [
      item.label,
      item.kind ?? "",
      item.detail ?? "",
      item.labelDetails?.description ?? ""
    ].join("|");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(item);
  }
  return output;
}
