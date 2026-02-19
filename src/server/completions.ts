import {
  CompletionItem,
  CompletionItemKind
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import type { CompletionBucket, CompletionIndex } from "./types";

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
    seen: new Set<string>()
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

  const bucket = normalizedNamespace
    ? getNamespaceBucket(index, normalizedNamespace)
    : index.global;
  const dedupeKey =
    item.kind === CompletionItemKind.Function
      ? `${item.label}|${item.kind ?? 0}|${item.detail ?? ""}`
      : `${item.label}|${item.kind ?? 0}`;

  if (bucket.seen.has(dedupeKey)) {
    return;
  }

  bucket.seen.add(dedupeKey);
  bucket.items.push(item);
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

export function collectCompletionItems(
  index: CompletionIndex,
  activeNamespace: string | undefined
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
  }

  items.push(...keywordCompletionItems);
  return items;
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
