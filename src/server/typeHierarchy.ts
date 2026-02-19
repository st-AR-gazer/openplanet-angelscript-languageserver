import {
  Range,
  SymbolKind,
  type TypeHierarchyItem
} from "vscode-languageserver/node";
import type { TextDocument } from "vscode-languageserver-textdocument";
import {
  type DocumentAnalysis,
  getOccurrenceAtOffset
} from "./analysis";
import type { CompletionIndex } from "./types";

interface WorkspaceTypeEntry {
  analysis: DocumentAnalysis;
  declaration: DocumentAnalysis["typeDeclarations"][number];
  rawParents: string[];
}

interface TypeHierarchyItemData {
  typeFullName: string;
}

export function prepareTypeHierarchyAtPosition(
  document: TextDocument,
  analysis: DocumentAnalysis,
  allAnalyses: DocumentAnalysis[],
  completionIndex: CompletionIndex,
  lineNumber: number,
  character: number
): TypeHierarchyItem[] {
  const workspaceMaps = buildWorkspaceTypeMaps(allAnalyses);
  const offset = document.offsetAt({ line: lineNumber, character });
  const occurrence =
    getOccurrenceAtOffset(analysis, offset) ??
    (offset > 0 ? getOccurrenceAtOffset(analysis, offset - 1) : undefined);

  let fullName: string | undefined;
  let entry: WorkspaceTypeEntry | undefined;

  const declarationAtOffset = analysis.typeDeclarations.find(
    (typeDeclaration) => offset >= typeDeclaration.start && offset <= typeDeclaration.end
  );
  if (declarationAtOffset) {
    fullName = declarationAtOffset.fullName;
    entry = workspaceMaps.byFullName.get(fullName);
  }

  if (!fullName) {
    const candidate =
      occurrence?.name ??
      getIdentifierAtPosition(document, lineNumber, character);
    if (!candidate) {
      return [];
    }

    entry = resolveWorkspaceTypeEntryByCandidate(candidate, workspaceMaps);
    if (entry) {
      fullName = entry.declaration.fullName;
    } else {
      fullName = resolveKnownTypeFullName(candidate, completionIndex);
    }
  }

  if (!fullName) {
    return [];
  }

  if (!entry) {
    entry = workspaceMaps.byFullName.get(fullName);
  }

  return [
    entry
      ? createWorkspaceTypeHierarchyItem(entry)
      : createFallbackTypeHierarchyItem(fullName, document.uri)
  ];
}

export function getTypeHierarchySupertypes(
  item: TypeHierarchyItem,
  allAnalyses: DocumentAnalysis[],
  completionIndex: CompletionIndex
): TypeHierarchyItem[] {
  const fullName = getTypeFullNameFromItem(item);
  if (!fullName) {
    return [];
  }

  const workspaceMaps = buildWorkspaceTypeMaps(allAnalyses);
  const workspaceEntry = workspaceMaps.byFullName.get(fullName);
  const parentFullNames = new Set<string>();

  if (workspaceEntry) {
    for (const rawParent of workspaceEntry.rawParents) {
      const resolved = resolveParentFullName(rawParent, workspaceMaps, completionIndex);
      if (resolved) {
        parentFullNames.add(resolved);
      }
    }
  }

  const knownParent =
    completionIndex.typeInfoByFullName.get(fullName)?.parentShortName;
  if (knownParent) {
    const resolved = resolveParentFullName(knownParent, workspaceMaps, completionIndex);
    if (resolved) {
      parentFullNames.add(resolved);
    }
  }

  return [...parentFullNames].map((parentFullName) => {
    const entry = workspaceMaps.byFullName.get(parentFullName);
    return entry
      ? createWorkspaceTypeHierarchyItem(entry)
      : createFallbackTypeHierarchyItem(parentFullName, item.uri);
  });
}

export function getTypeHierarchySubtypes(
  item: TypeHierarchyItem,
  allAnalyses: DocumentAnalysis[],
  completionIndex: CompletionIndex
): TypeHierarchyItem[] {
  const fullName = getTypeFullNameFromItem(item);
  if (!fullName) {
    return [];
  }

  const targetShortName = getShortTypeName(fullName);
  const workspaceMaps = buildWorkspaceTypeMaps(allAnalyses);
  const subtypesByFullName = new Map<string, WorkspaceTypeEntry | undefined>();

  for (const entry of workspaceMaps.byFullName.values()) {
    for (const rawParent of entry.rawParents) {
      const resolved = resolveParentFullName(rawParent, workspaceMaps, completionIndex);
      if (!resolved) {
        continue;
      }
      if (resolved === fullName || getShortTypeName(resolved) === targetShortName) {
        subtypesByFullName.set(entry.declaration.fullName, entry);
      }
    }
  }

  for (const typeInfo of completionIndex.typeInfoByFullName.values()) {
    if (!typeInfo.parentShortName) {
      continue;
    }
    if (
      typeInfo.parentShortName === targetShortName ||
      typeInfo.parentShortName === fullName
    ) {
      if (!subtypesByFullName.has(typeInfo.fullName)) {
        subtypesByFullName.set(typeInfo.fullName, workspaceMaps.byFullName.get(typeInfo.fullName));
      }
    }
  }

  const items: TypeHierarchyItem[] = [];
  for (const [subtypeFullName, entry] of subtypesByFullName) {
    items.push(
      entry
        ? createWorkspaceTypeHierarchyItem(entry)
        : createFallbackTypeHierarchyItem(subtypeFullName, item.uri)
    );
  }

  items.sort((left, right) => left.name.localeCompare(right.name));
  return items;
}

function buildWorkspaceTypeMaps(
  analyses: DocumentAnalysis[]
): {
  byFullName: Map<string, WorkspaceTypeEntry>;
  byShortName: Map<string, WorkspaceTypeEntry[]>;
} {
  const byFullName = new Map<string, WorkspaceTypeEntry>();
  const byShortName = new Map<string, WorkspaceTypeEntry[]>();

  for (const analysis of analyses) {
    for (const declaration of analysis.typeDeclarations) {
      const entry: WorkspaceTypeEntry = {
        analysis,
        declaration,
        rawParents: extractRawParentsForType(analysis.text, declaration.name, declaration.start)
      };
      byFullName.set(declaration.fullName, entry);

      const bucket = byShortName.get(declaration.name) ?? [];
      bucket.push(entry);
      byShortName.set(declaration.name, bucket);
    }
  }

  return { byFullName, byShortName };
}

function extractRawParentsForType(
  text: string,
  typeName: string,
  startOffset: number
): string[] {
  const snippetStart = Math.max(0, startOffset - 160);
  const snippetEnd = Math.min(text.length, startOffset + 320);
  const snippet = text.slice(snippetStart, snippetEnd);
  const escapedTypeName = escapeRegex(typeName);

  const pattern = new RegExp(
    String.raw`\b(?:class|interface)\s+${escapedTypeName}\s*(?::\s*([^\{\r\n]+))?`,
    "m"
  );
  const match = pattern.exec(snippet);
  const raw = match?.[1]?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((segment) => segment.trim())
    .map((segment) =>
      segment
        .replace(/\b(public|private|protected)\b/g, "")
        .trim()
    )
    .map((segment) => segment.replace(/\s+/g, " "))
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const token = /([A-Za-z_][A-Za-z0-9_:]*)/.exec(segment);
      return token?.[1] ?? "";
    })
    .filter((segment) => segment.length > 0);
}

function createWorkspaceTypeHierarchyItem(entry: WorkspaceTypeEntry): TypeHierarchyItem {
  const fullName = entry.declaration.fullName;
  const shortName = entry.declaration.name;

  return {
    name: shortName,
    detail: fullName === shortName ? undefined : fullName,
    kind: mapDeclarationKindToSymbolKind(entry.declaration.kind),
    uri: entry.analysis.uri,
    range: entry.declaration.range,
    selectionRange: entry.declaration.nameRange,
    data: {
      typeFullName: fullName
    } satisfies TypeHierarchyItemData
  };
}

function createFallbackTypeHierarchyItem(
  fullName: string,
  fallbackUri: string
): TypeHierarchyItem {
  const shortName = getShortTypeName(fullName);
  const fallbackRange = Range.create(0, 0, 0, Math.max(shortName.length, 1));

  return {
    name: shortName,
    detail: fullName === shortName ? undefined : fullName,
    kind: SymbolKind.Class,
    uri: fallbackUri,
    range: fallbackRange,
    selectionRange: fallbackRange,
    data: {
      typeFullName: fullName
    } satisfies TypeHierarchyItemData
  };
}

function resolveWorkspaceTypeEntryByCandidate(
  candidate: string,
  workspaceMaps: {
    byFullName: Map<string, WorkspaceTypeEntry>;
    byShortName: Map<string, WorkspaceTypeEntry[]>;
  }
): WorkspaceTypeEntry | undefined {
  const direct = workspaceMaps.byFullName.get(candidate);
  if (direct) {
    return direct;
  }

  const byShort = workspaceMaps.byShortName.get(candidate);
  if (!byShort || byShort.length === 0) {
    return undefined;
  }

  return byShort[0];
}

function resolveKnownTypeFullName(
  candidate: string,
  completionIndex: CompletionIndex
): string | undefined {
  if (completionIndex.typeInfoByFullName.has(candidate)) {
    return candidate;
  }

  const byShortName = completionIndex.typeFullNamesByShortName.get(candidate);
  if (byShortName && byShortName.length > 0) {
    return byShortName[0];
  }

  return undefined;
}

function resolveParentFullName(
  rawParent: string,
  workspaceMaps: {
    byFullName: Map<string, WorkspaceTypeEntry>;
    byShortName: Map<string, WorkspaceTypeEntry[]>;
  },
  completionIndex: CompletionIndex
): string | undefined {
  if (workspaceMaps.byFullName.has(rawParent)) {
    return rawParent;
  }

  const workspaceShort = workspaceMaps.byShortName.get(rawParent);
  if (workspaceShort && workspaceShort.length > 0) {
    return workspaceShort[0].declaration.fullName;
  }

  if (completionIndex.typeInfoByFullName.has(rawParent)) {
    return rawParent;
  }

  const completionShort = completionIndex.typeFullNamesByShortName.get(rawParent);
  if (completionShort && completionShort.length > 0) {
    return completionShort[0];
  }

  return rawParent || undefined;
}

function getTypeFullNameFromItem(item: TypeHierarchyItem): string | undefined {
  const data = item.data as TypeHierarchyItemData | undefined;
  if (data?.typeFullName) {
    return data.typeFullName;
  }

  if (item.detail && item.detail.length > 0) {
    return item.detail;
  }

  return item.name;
}

function getShortTypeName(fullName: string): string {
  const segments = fullName.split("::").filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return fullName;
  }
  return segments[segments.length - 1];
}

function mapDeclarationKindToSymbolKind(
  kind: "class" | "interface" | "enum"
): SymbolKind {
  switch (kind) {
    case "class":
      return SymbolKind.Class;
    case "interface":
      return SymbolKind.Interface;
    case "enum":
      return SymbolKind.Enum;
  }
}

function getIdentifierAtPosition(
  document: TextDocument,
  lineNumber: number,
  character: number
): string | undefined {
  const lineText = document.getText({
    start: { line: lineNumber, character: 0 },
    end: { line: lineNumber + 1, character: 0 }
  });
  if (!lineText || lineText.length === 0) {
    return undefined;
  }

  const clamped = Math.max(0, Math.min(character, lineText.length - 1));
  let start = clamped;
  let end = clamped;

  while (start > 0 && /[A-Za-z0-9_]/.test(lineText[start - 1])) {
    start -= 1;
  }
  while (end < lineText.length && /[A-Za-z0-9_]/.test(lineText[end])) {
    end += 1;
  }

  if (start >= end) {
    return undefined;
  }

  const value = lineText.slice(start, end);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    return undefined;
  }

  return value;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
