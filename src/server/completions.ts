import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  Range,
  type TextEdit
} from "vscode-languageserver/node";
import {
  SemanticTypeRegistry,
  openplanetBuiltinDefines
} from "openplanet-angelscript-core";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  collectVisibleUsingNamespacePathsAtOffset,
  type DocumentAnalysis,
  type FunctionDeclaration,
  type TypeDeclaration,
  type VariableDeclaration
} from "./analysis";
import type {
  CompletionBucket,
  CompletionIndex,
  CompletionShortcutSettings
} from "./types";
import { buildDocumentPreprocessorModel } from "./preprocessor";

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
    kind: CompletionItemKind.Keyword,
    sortText: getDefaultCompletionSortText({
      label: keyword,
      kind: CompletionItemKind.Keyword
    })
  })
);

interface PreprocessorDirectiveDefinition {
  directive: string;
  description: string;
  insertText: string;
  retriggerSuggest?: boolean;
}

const preprocessorDirectiveDefinitions: readonly PreprocessorDirectiveDefinition[] = [
  {
    directive: "define",
    description: "Define a preprocessor symbol.",
    insertText: "#define $0",
    retriggerSuggest: true
  },
  {
    directive: "undef",
    description: "Undefine a preprocessor symbol.",
    insertText: "#undef $0",
    retriggerSuggest: true
  },
  {
    directive: "if",
    description: "Start a conditional preprocessor branch.",
    insertText: "#if $0",
    retriggerSuggest: true
  },
  {
    directive: "ifdef",
    description: "Start a branch when a symbol is defined.",
    insertText: "#ifdef $0",
    retriggerSuggest: true
  },
  {
    directive: "ifndef",
    description: "Start a branch when a symbol is not defined.",
    insertText: "#ifndef $0",
    retriggerSuggest: true
  },
  {
    directive: "elif",
    description: "Continue a conditional branch with another condition.",
    insertText: "#elif $0",
    retriggerSuggest: true
  },
  {
    directive: "else",
    description: "Fallback branch for a conditional preprocessor block.",
    insertText: "#else"
  },
  {
    directive: "endif",
    description: "Close a conditional preprocessor block.",
    insertText: "#endif"
  },
  {
    directive: "include",
    description: "Include another file through the preprocessor include callback.",
    insertText: "#include \"$0\""
  }
];

interface DirectiveSnippetDefinition {
  label: string;
  prefixes: string[];
  body: string | string[];
  description: string;
}

const directiveSnippetDefinitions: DirectiveSnippetDefinition[] = [
  {
    label: "OP Directive: Generic Disable Next Line",
    prefixes: ["op-disable-next-line", "opdnl", "opnext"],
    body: "// op-disable-next-line ${1:lint|opsyn} ${2:*}",
    description:
      "Suite-level directive template. Target examples: lint, lang, opsyn, form, all, lint|opsyn."
  },
  {
    label: "OP Directive: Generic Disable",
    prefixes: ["op-disable", "opdis"],
    body: "// op-disable ${1:all} ${2:*}",
    description:
      "Suite-level directive template to disable checks/formatting until re-enabled."
  },
  {
    label: "OP Directive: Generic Enable",
    prefixes: ["op-enable", "openable"],
    body: "// op-enable ${1:all} ${2:*}",
    description:
      "Suite-level directive template to re-enable previously disabled targets."
  },
  {
    label: "OP Directive: Generic Disable Block",
    prefixes: ["op-disable-block", "opdb"],
    body: [
      "// op-disable-start ${1:all} ${2:*}",
      "${0}",
      "// op-disable-end ${1:all} ${2:*}"
    ],
    description: "Suite-level block disable template."
  },
  {
    label: "OP Linter: Disable Next Line",
    prefixes: ["oplint-disable-next-line", "oplint-next", "oplint"],
    body: "// oplint-disable-next-line ${1:*}",
    description: "Disable linter rule(s) for the next line."
  },
  {
    label: "OP Linter: Disable File",
    prefixes: ["oplint-disable", "oplint-file"],
    body: "// oplint-disable ${1:*}",
    description: "Disable linter rule(s) for the file scope."
  },
  {
    label: "OP Linter: Enable",
    prefixes: ["oplint-enable"],
    body: "// oplint-enable ${1:*}",
    description: "Re-enable linter rule(s)."
  },
  {
    label: "OP Linter: Disable Block",
    prefixes: ["oplint-disable-block", "oplint-block"],
    body: [
      "// oplint-disable-start ${1:*}",
      "${0}",
      "// oplint-disable-end ${1:*}"
    ],
    description: "Disable linter rule(s) for a block."
  },
  {
    label: "OP Formatter: Disable Next Line",
    prefixes: ["opfmt-disable-next-line", "opfmt-next", "opfmt"],
    body: "// opfmt-disable-next-line",
    description: "Disable formatter for the next line."
  },
  {
    label: "OP Formatter: Disable File",
    prefixes: ["opfmt-disable", "opfmt-file"],
    body: "// opfmt-disable",
    description: "Disable formatter for the file scope."
  },
  {
    label: "OP Formatter: Enable",
    prefixes: ["opfmt-enable"],
    body: "// opfmt-enable",
    description: "Re-enable formatter."
  },
  {
    label: "OP Formatter: Disable Block",
    prefixes: ["opfmt-disable-block", "opfmt-block"],
    body: [
      "// opfmt-disable-start",
      "${0}",
      "// opfmt-disable-end"
    ],
    description: "Disable formatter for a block."
  },
  {
    label: "OP Language Server: Disable Next Line",
    prefixes: ["oplang-disable-next-line", "oplang-next", "oplang"],
    body: "// oplang-disable-next-line ${1:*}",
    description: "Language-server directive template (project convention)."
  },
  {
    label: "OP Language Server: Disable File",
    prefixes: ["oplang-disable", "oplang-file"],
    body: "// oplang-disable ${1:*}",
    description: "Disable language-server diagnostic code(s) for the file."
  },
  {
    label: "OP Language Server: Enable",
    prefixes: ["oplang-enable"],
    body: "// oplang-enable ${1:*}",
    description: "Re-enable previously disabled language-server diagnostic code(s)."
  },
  {
    label: "OP Language Server: Disable Block",
    prefixes: ["oplang-disable-block", "oplang-block"],
    body: [
      "// oplang-disable-start ${1:*}",
      "${0}",
      "// oplang-disable-end ${1:*}"
    ],
    description: "Disable language-server diagnostic code(s) for a block."
  },
  {
    label: "OP Syntax: Disable Next Line",
    prefixes: [
      "opsyn-disable-next-line",
      "opsyn-next",
      "opsyn",
      "opsynt-disable-next-line",
      "opsynt-next",
      "opsynt"
    ],
    body: "// opsyn-disable-next-line ${1:*}",
    description: "Syntax-highlighter directive template (project convention)."
  },
  {
    label: "OP All: Disable Next Line",
    prefixes: ["opall-disable-next-line", "opall-next", "opall"],
    body: [
      "// oplint-disable-next-line ${1:*}",
      "// opfmt-disable-next-line"
    ],
    description: "Disable both linter and formatter on the next line."
  },
  {
    label: "OP All: Disable Block",
    prefixes: ["opall-disable-block", "opall-block"],
    body: [
      "// oplint-disable-start ${1:*}",
      "// opfmt-disable-start",
      "${0}",
      "// opfmt-disable-end",
      "// oplint-disable-end ${1:*}"
    ],
    description: "Disable both linter and formatter over a block."
  }
];

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
    semanticTypes: new SemanticTypeRegistry(),
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
  let normalized: CompletionItem;
  if (item.kind === CompletionItemKind.Function) {
    normalized = normalizeFunctionCompletionItem(item);
  } else if (item.kind === CompletionItemKind.Module) {
    normalized = normalizeNamespaceCompletionItem(item);
  } else if (item.kind === CompletionItemKind.Enum) {
    normalized = normalizeEnumCompletionItem(item);
  } else {
    normalized = item;
  }

  return withDefaultCompletionSortText(normalized);
}

function normalizeNamespaceCompletionItem(item: CompletionItem): CompletionItem {
  const insertText =
    typeof item.insertText === "string" && item.insertText.length > 0
      ? item.insertText
      : item.label.endsWith("::")
        ? item.label
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

function normalizeEnumCompletionItem(item: CompletionItem): CompletionItem {
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

function withDefaultCompletionSortText(item: CompletionItem): CompletionItem {
  if (typeof item.sortText === "string" && item.sortText.length > 0) {
    return item;
  }

  return {
    ...item,
    sortText: getDefaultCompletionSortText(item)
  };
}

export function getDefaultCompletionSortText(
  item: Pick<CompletionItem, "label" | "kind" | "filterText">
): string {
  const label = typeof item.filterText === "string" && item.filterText.length > 0
    ? item.filterText
    : item.label;
  return `${getCompletionKindSortBucket(item.kind)}-${label.toLowerCase()}`;
}

function getCompletionKindSortBucket(kind: CompletionItemKind | undefined): string {
  switch (kind) {
    case CompletionItemKind.Method:
    case CompletionItemKind.Function:
    case CompletionItemKind.Constructor:
      return "00-callable";
    case CompletionItemKind.Module:
      return "01-namespace";
    case CompletionItemKind.Class:
    case CompletionItemKind.Interface:
    case CompletionItemKind.Struct:
    case CompletionItemKind.Enum:
    case CompletionItemKind.TypeParameter:
      return "02-type";
    case CompletionItemKind.Field:
    case CompletionItemKind.Property:
    case CompletionItemKind.Variable:
    case CompletionItemKind.Constant:
    case CompletionItemKind.EnumMember:
    case CompletionItemKind.Value:
      return "03-value";
    case CompletionItemKind.Keyword:
      return "90-keyword";
    default:
      return "50-symbol";
  }
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
  if (
    (!existing.sortText || existing.sortText.length === 0) &&
    incoming.sortText &&
    incoming.sortText.length > 0
  ) {
    existing.sortText = incoming.sortText;
  }
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
  if (!item.sortText || item.sortText.length === 0) {
    item.sortText = getDefaultCompletionSortText(item);
  }
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

export function collectWorkspaceFunctionCompletionItems(
  allAnalyses: readonly DocumentAnalysis[],
  activeNamespace: string | undefined
): CompletionItem[] {
  const namespacePath = normalizeNamespace(activeNamespace) ?? "";
  const itemsByLabel = new Map<string, CompletionItem>();

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.functions) {
      const declarationNamespace = normalizeNamespace(declaration.namespacePath) ?? "";
      if (declarationNamespace !== namespacePath) {
        continue;
      }

      const item = createWorkspaceFunctionCompletionItem(declaration);
      const existing = itemsByLabel.get(item.label);
      if (existing) {
        mergeFunctionCompletionItems(existing, item);
        continue;
      }

      itemsByLabel.set(item.label, item);
    }
  }

  return [...itemsByLabel.values()].sort((left, right) =>
    left.label.localeCompare(right.label)
  );
}

export function collectWorkspaceScopedCompletionItems(
  document: TextDocument,
  analysis: DocumentAnalysis,
  lineNumber: number,
  character: number,
  allAnalyses: readonly DocumentAnalysis[]
): CompletionItem[] {
  const offset = document.offsetAt({ line: lineNumber, character });
  const explicitNamespace = getActiveNamespaceAtPosition(
    document,
    lineNumber,
    character
  );
  const workspaceNamespaceChildren = buildWorkspaceNamespaceChildren(allAnalyses);
  const items: CompletionItem[] = [];

  if (explicitNamespace) {
    items.push(
      ...getWorkspaceNamespaceChildCompletionItems(
        workspaceNamespaceChildren,
        explicitNamespace
      )
    );
    items.push(
      ...collectWorkspaceNamespaceScopedSymbolCompletionItems(
        allAnalyses,
        explicitNamespace
      )
    );
    return dedupeCompletionItems(items);
  }

  items.push(
    ...getWorkspaceNamespaceChildCompletionItems(
      workspaceNamespaceChildren,
      undefined
    )
  );
  items.push(...collectVisibleLocalCompletionItems(analysis, offset));

  for (const namespacePath of collectImplicitNamespaceSearchPaths(analysis, offset)) {
    items.push(
      ...collectWorkspaceNamespaceScopedSymbolCompletionItems(
        allAnalyses,
        namespacePath
      )
    );
  }

  return dedupeCompletionItems(items);
}

function collectWorkspaceNamespaceScopedSymbolCompletionItems(
  allAnalyses: readonly DocumentAnalysis[],
  namespacePath: string
): CompletionItem[] {
  return dedupeCompletionItems([
    ...collectWorkspaceFunctionCompletionItems(
      allAnalyses,
      namespacePath.length > 0 ? namespacePath : undefined
    ),
    ...collectWorkspaceGlobalValueCompletionItems(allAnalyses, namespacePath),
    ...collectWorkspaceTypeCompletionItems(allAnalyses, namespacePath)
  ]);
}

function collectWorkspaceGlobalValueCompletionItems(
  allAnalyses: readonly DocumentAnalysis[],
  namespacePath: string
): CompletionItem[] {
  const normalizedNamespace = normalizeNamespace(namespacePath) ?? "";
  const itemsByKey = new Map<string, CompletionItem>();

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.globalDeclarations) {
      const declarationNamespace = extractNamespacePathFromQualifiedName(
        declaration.name
      );
      if (declarationNamespace !== normalizedNamespace) {
        continue;
      }

      const item = withDefaultCompletionSortText({
        label: extractLeafNameFromQualifiedName(declaration.name),
        kind: CompletionItemKind.Variable,
        detail: declaration.type
          ? `${declaration.type} workspace value`
          : "Workspace value"
      });
      const key = `${item.label}|${item.detail ?? ""}`;
      if (!itemsByKey.has(key)) {
        itemsByKey.set(key, item);
      }
    }
  }

  return [...itemsByKey.values()].sort((left, right) =>
    left.label.localeCompare(right.label)
  );
}

function collectWorkspaceTypeCompletionItems(
  allAnalyses: readonly DocumentAnalysis[],
  namespacePath: string
): CompletionItem[] {
  const normalizedNamespace = normalizeNamespace(namespacePath) ?? "";
  const itemsByKey = new Map<string, CompletionItem>();

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.typeDeclarations) {
      const declarationNamespace = extractNamespacePathFromQualifiedName(
        declaration.fullName
      );
      if (declarationNamespace !== normalizedNamespace) {
        continue;
      }

      const item = withDefaultCompletionSortText({
        label: declaration.name,
        kind: getWorkspaceTypeCompletionKind(declaration),
        detail: `Workspace ${declaration.kind}`
      });
      const key = `${item.label}|${item.kind ?? 0}`;
      if (!itemsByKey.has(key)) {
        itemsByKey.set(key, item);
      }
    }
  }

  return [...itemsByKey.values()].sort((left, right) =>
    left.label.localeCompare(right.label)
  );
}

function getWorkspaceTypeCompletionKind(
  declaration: TypeDeclaration
): CompletionItemKind {
  switch (declaration.kind) {
    case "enum":
      return CompletionItemKind.Enum;
    case "interface":
      return CompletionItemKind.Interface;
    default:
      return CompletionItemKind.Class;
  }
}

function collectVisibleLocalCompletionItems(
  analysis: DocumentAnalysis,
  offset: number
): CompletionItem[] {
  const fn = findFunctionAtOffset(analysis.functions, offset);
  if (!fn) {
    return [];
  }

  const visibleByName = new Map<string, VariableDeclaration>();
  for (const declaration of [...fn.parameters, ...fn.localDeclarations].sort(
    (left, right) => left.start - right.start
  )) {
    if (declaration.start > offset) {
      continue;
    }
    if (offset < declaration.scopeStart || offset > declaration.scopeEnd) {
      continue;
    }

    visibleByName.set(declaration.name, declaration);
  }

  return [...visibleByName.values()]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((declaration) =>
      withDefaultCompletionSortText({
        label: declaration.name,
        kind: CompletionItemKind.Variable,
        detail: declaration.type
          ? `${declaration.type} ${declaration.isParameter ? "parameter" : "local"}`
          : declaration.isParameter
            ? "Parameter"
            : "Local variable"
      })
    );
}

function findFunctionAtOffset(
  functions: readonly FunctionDeclaration[],
  offset: number
): FunctionDeclaration | undefined {
  let best: FunctionDeclaration | undefined;

  for (const fn of functions) {
    if (offset < fn.start || offset > fn.end) {
      continue;
    }

    if (!best || fn.end - fn.start < best.end - best.start) {
      best = fn;
    }
  }

  return best;
}

function collectImplicitNamespaceSearchPaths(
  analysis: DocumentAnalysis,
  offset: number
): string[] {
  const searchPaths: string[] = [];
  const enclosingNamespacePath = findEnclosingNamespacePathAtOffset(
    analysis.grammarProgram.declarations,
    offset,
    ""
  );

  pushNamespacePathAndAncestors(searchPaths, enclosingNamespacePath);

  for (const namespacePath of collectVisibleUsingNamespacePathsAtOffset(
    analysis.grammarProgram.declarations,
    offset
  )) {
    const normalized = normalizeNamespace(namespacePath) ?? "";
    if (normalized.length > 0) {
      addUniqueSearchPath(searchPaths, normalized);
    }
  }

  addUniqueSearchPath(searchPaths, "");
  return searchPaths;
}

function pushNamespacePathAndAncestors(
  searchPaths: string[],
  namespacePath: string
): void {
  const normalized = normalizeNamespace(namespacePath);
  if (!normalized) {
    return;
  }

  const segments = normalized.split("::");
  for (let count = segments.length; count >= 1; count -= 1) {
    addUniqueSearchPath(searchPaths, segments.slice(0, count).join("::"));
  }
}

function addUniqueSearchPath(searchPaths: string[], namespacePath: string): void {
  if (!searchPaths.includes(namespacePath)) {
    searchPaths.push(namespacePath);
  }
}

function findEnclosingNamespacePathAtOffset(
  declarations: DocumentAnalysis["grammarProgram"]["declarations"],
  offset: number,
  namespacePath: string
): string {
  for (const declaration of declarations) {
    if (declaration.kind !== "namespace") {
      continue;
    }
    if (offset < declaration.start || offset > declaration.end) {
      continue;
    }

    const childNamespacePath = namespacePath
      ? `${namespacePath}::${declaration.name}`
      : declaration.name;
    return findEnclosingNamespacePathAtOffset(
      declaration.body,
      offset,
      childNamespacePath
    );
  }

  return namespacePath;
}

function buildWorkspaceNamespaceChildren(
  allAnalyses: readonly DocumentAnalysis[]
): Map<string, Set<string>> {
  const childrenByParent = new Map<string, Set<string>>();

  for (const analysis of allAnalyses) {
    visitWorkspaceNamespaceDeclarations(
      analysis.grammarProgram.declarations,
      "",
      childrenByParent
    );
  }

  return childrenByParent;
}

function visitWorkspaceNamespaceDeclarations(
  declarations: DocumentAnalysis["grammarProgram"]["declarations"],
  namespacePath: string,
  childrenByParent: Map<string, Set<string>>
): void {
  for (const declaration of declarations) {
    if (declaration.kind !== "namespace") {
      continue;
    }

    const parentKey = namespacePath || ROOT_NAMESPACE;
    let children = childrenByParent.get(parentKey);
    if (!children) {
      children = new Set<string>();
      childrenByParent.set(parentKey, children);
    }
    children.add(declaration.name);

    const childNamespacePath = namespacePath
      ? `${namespacePath}::${declaration.name}`
      : declaration.name;
    visitWorkspaceNamespaceDeclarations(
      declaration.body,
      childNamespacePath,
      childrenByParent
    );
  }
}

function getWorkspaceNamespaceChildCompletionItems(
  childrenByParent: Map<string, Set<string>>,
  parentNamespace: string | undefined
): CompletionItem[] {
  const key = parentNamespace ?? ROOT_NAMESPACE;
  const children = childrenByParent.get(key);
  if (!children || children.size === 0) {
    return [];
  }

  return [...children]
    .sort((left, right) => left.localeCompare(right))
    .map((segment) =>
      withDefaultCompletionSortText({
        label: `${segment}::`,
        insertText: `${segment}::`,
        kind: CompletionItemKind.Module,
        command: {
          title: "Trigger Suggestions",
          command: "editor.action.triggerSuggest"
        },
        detail: parentNamespace
          ? `workspace namespace ${parentNamespace}::${segment}`
          : `workspace namespace ${segment}`
      })
    );
}

function extractNamespacePathFromQualifiedName(value: string): string {
  const separatorIndex = value.lastIndexOf("::");
  return separatorIndex >= 0 ? value.slice(0, separatorIndex) : "";
}

function extractLeafNameFromQualifiedName(value: string): string {
  const separatorIndex = value.lastIndexOf("::");
  return separatorIndex >= 0 ? value.slice(separatorIndex + 2) : value;
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

      const item: CompletionItem = {
        label: `${segment}::`,
        insertText: `${segment}::`,
        kind: CompletionItemKind.Module,
        command: {
          title: "Trigger Suggestions",
          command: "editor.action.triggerSuggest"
        },
        detail: `namespace ${fullNamespace}`
      };
      return withDefaultCompletionSortText(item);
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

export function collectPreprocessorCompletionItems(
  document: TextDocument,
  lineNumber: number,
  character: number
): CompletionItem[] {
  const linePrefix = document.getText({
    start: { line: lineNumber, character: 0 },
    end: { line: lineNumber, character }
  });

  const directiveMatch = /^(\s*)#([A-Za-z_]*)$/.exec(linePrefix);
  if (directiveMatch) {
    const typedDirective = (directiveMatch[2] ?? "").toLowerCase();
    const replaceRange = Range.create(
      lineNumber,
      directiveMatch[1].length,
      lineNumber,
      character
    );
    return preprocessorDirectiveDefinitions
      .filter((definition) => definition.directive.startsWith(typedDirective))
      .map((definition, index) =>
        createPreprocessorDirectiveCompletionItem(definition, replaceRange, index)
      );
  }

  const defineContextMatch =
    /^(\s*)#\s*(if|elif|ifdef|ifndef|define|undef)\s+([A-Za-z0-9_]*)$/i.exec(
      linePrefix
    );
  if (!defineContextMatch) {
    return [];
  }

  const directive = defineContextMatch[2].toLowerCase();
  const typedToken = (defineContextMatch[3] ?? "").toUpperCase();
  const replaceRange = Range.create(
    lineNumber,
    character - (defineContextMatch[3] ?? "").length,
    lineNumber,
    character
  );
  const model = buildDocumentPreprocessorModel(document);
  return collectPreprocessorDefineItems(
    directive,
    typedToken,
    replaceRange,
    model.validDefines
  );
}

export function collectDirectiveCommentSnippetItems(
  document: TextDocument,
  lineNumber: number,
  character: number
): CompletionItem[] {
  const linePrefix = document.getText({
    start: { line: lineNumber, character: 0 },
    end: { line: lineNumber, character }
  });
  const match = /^(\s*)\/\/\/([A-Za-z0-9_-]*)$/.exec(linePrefix);
  if (!match) {
    return [];
  }

  const indent = match[1];
  const typedSuffix = (match[2] ?? "").toLowerCase();
  const replaceRange = Range.create(lineNumber, indent.length, lineNumber, character);

  return directiveSnippetDefinitions
    .filter((definition) => matchesDirectiveSnippetFilter(definition, typedSuffix))
    .map((definition, index) =>
      createDirectiveSnippetCompletionItem(definition, replaceRange, indent, index)
    );
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

function createPreprocessorDirectiveCompletionItem(
  definition: PreprocessorDirectiveDefinition,
  replaceRange: Range,
  index: number
): CompletionItem {
  const item: CompletionItem = {
    label: `#${definition.directive}`,
    kind: CompletionItemKind.Keyword,
    detail: "preprocessor directive",
    documentation: {
      kind: "markdown",
      value: definition.description
    },
    insertTextFormat: InsertTextFormat.Snippet,
    sortText: `00-preproc-directive-${String(index).padStart(2, "0")}`,
    filterText: `#${definition.directive}`,
    textEdit: {
      range: replaceRange,
      newText: definition.insertText
    }
  };

  if (definition.retriggerSuggest) {
    item.command = {
      title: "Trigger Suggestions",
      command: "editor.action.triggerSuggest"
    };
  }

  return item;
}

function collectPreprocessorDefineItems(
  directive: string,
  typedToken: string,
  replaceRange: Range,
  validDefines: ReadonlySet<string>
): CompletionItem[] {
  const defineValues = collectPreprocessorDefineNames(validDefines);
  const items: CompletionItem[] = defineValues
    .filter((name) => name.startsWith(typedToken))
    .map((name, index) => ({
      label: name,
      kind: CompletionItemKind.Constant,
      detail: "preprocessor define",
      sortText: `00-preproc-define-${String(index).padStart(4, "0")}`,
      filterText: name,
      textEdit: {
        range: replaceRange,
        newText: name
      }
    }));

  if (directive === "if" || directive === "elif") {
    const conditionalSnippets: CompletionItem[] = [
      {
        label: "defined(...)",
        kind: CompletionItemKind.Snippet,
        detail: "preprocessor condition",
        documentation: {
          kind: "markdown",
          value: "Check whether a preprocessor symbol is defined."
        },
        insertTextFormat: InsertTextFormat.Snippet,
        sortText: "00-preproc-cond-0000",
        filterText: "defined",
        textEdit: {
          range: replaceRange,
          newText: "defined(${1:SYMBOL})"
        }
      },
      {
        label: "COMP_...",
        kind: CompletionItemKind.Snippet,
        detail: "competition profile define",
        documentation: {
          kind: "markdown",
          value: "Competition profile define placeholder."
        },
        insertTextFormat: InsertTextFormat.Snippet,
        sortText: "00-preproc-cond-0001",
        filterText: "COMP_",
        textEdit: {
          range: replaceRange,
          newText: "COMP_${1:PROFILE_ID}"
        }
      }
    ];

    return typedToken.length === 0
      ? [...conditionalSnippets, ...items]
      : [
          ...conditionalSnippets.filter((item) =>
            item.filterText?.toUpperCase().startsWith(typedToken)
          ),
          ...items
        ];
  }

  return items;
}

function collectPreprocessorDefineNames(
  validDefines: ReadonlySet<string>
): string[] {
  const names = new Set<string>(openplanetBuiltinDefines);
  for (const define of validDefines) {
    if (define) {
      names.add(define);
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right));
}

function matchesDirectiveSnippetFilter(
  definition: DirectiveSnippetDefinition,
  typedSuffix: string
): boolean {
  if (!typedSuffix) {
    return true;
  }

  const lowerLabel = definition.label.toLowerCase();
  if (lowerLabel.includes(typedSuffix)) {
    return true;
  }

  return definition.prefixes.some((prefix) => prefix.toLowerCase().includes(typedSuffix));
}

function createDirectiveSnippetCompletionItem(
  definition: DirectiveSnippetDefinition,
  replaceRange: Range,
  indent: string,
  index: number
): CompletionItem {
  const bodyLines = Array.isArray(definition.body)
    ? definition.body
    : [definition.body];
  const snippetText = bodyLines
    .map((line, lineIndex) => (lineIndex === 0 ? line : `${indent}${line}`))
    .join("\n");
  const textEdit: TextEdit = {
    range: replaceRange,
    newText: snippetText
  };

  return {
    label: definition.label,
    kind: CompletionItemKind.Snippet,
    detail: definition.prefixes.join(", "),
    documentation: {
      kind: "markdown",
      value: `${definition.description}\n\nPrefixes: ${definition.prefixes
        .map((prefix) => `\`${prefix}\``)
        .join(", ")}`
    },
    insertTextFormat: InsertTextFormat.Snippet,
    filterText: `///${definition.prefixes[0]}`,
    sortText: `00-directive-${String(index).padStart(2, "0")}`,
    textEdit
  };
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

function createWorkspaceFunctionCompletionItem(
  declaration: FunctionDeclaration
): CompletionItem {
  const signature = formatWorkspaceFunctionSignature(declaration);
  const item = normalizeFunctionCompletionItem({
    label: declaration.name,
    kind: CompletionItemKind.Function,
    detail: signature,
    labelDetails: { description: declaration.returnType || "function" },
    sortText: getDefaultCompletionSortText({
      label: declaration.name,
      kind: CompletionItemKind.Function
    })
  });

  initializeFunctionCompletionItem(item);
  return item;
}

function formatWorkspaceFunctionSignature(
  declaration: FunctionDeclaration
): string {
  const returnType = declaration.returnType.trim();
  const argsText = normalizeFunctionArgsText(declaration.argsText);
  return `${returnType} ${declaration.name}(${argsText})`.trim();
}

function normalizeFunctionArgsText(argsText: string): string {
  return argsText
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ");
}

export function dedupeCompletionItems(items: CompletionItem[]): CompletionItem[] {
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
