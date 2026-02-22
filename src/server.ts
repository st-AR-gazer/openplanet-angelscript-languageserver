import {
  CodeAction,
  CodeLens,
  ColorInformation,
  ColorPresentation,
  CompletionItem,
  CompletionParams,
  createConnection,
  Declaration,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  DidChangeWatchedFilesNotification,
  DocumentHighlight,
  FileChangeType,
  Hover,
  InlayHint,
  InitializeParams,
  InitializeResult,
  Location,
  ProposedFeatures,
  Range,
  SemanticTokens,
  SemanticTokensDelta,
  SignatureHelp,
  SymbolInformation,
  TypeHierarchyItem,
  TextDocumentSyncKind,
  TextDocuments
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  DocumentAnalysis,
  analyzeDocument,
  collectFunctionReturnTypes,
  getTypeResolutionContextAtPosition
} from "./server/analysis";
import {
  collectCompletionItems,
  createCompletionIndex,
  getActiveNamespaceAtPosition,
  resolveCompletionItemDetails
} from "./server/completions";
import {
  buildQuickFixCodeActions,
  getSemanticDiagnostics,
  getSyntaxDiagnostics
} from "./server/diagnostics";
import { getCodeLensesForDocument } from "./server/codeLenses";
import {
  getColorPresentations,
  getDocumentColors
} from "./server/colors";
import { getHoverAtPosition } from "./server/hover";
import { getInlayHints } from "./server/inlayHints";
import {
  clearIncludeResolutionCache,
  getIncludeAtPosition,
  getIncludeDiagnostics,
  resolveIncludePath
} from "./server/includes";
import {
  clearImportValidationCache,
  getImportDiagnostics
} from "./server/imports";
import {
  getInlineValuesForRange,
  type InlineValuePayload,
  type InlineValuesRequestParams
} from "./server/inlineValues";
import {
  collectMemberCompletionItems,
  getDotCompletionContext,
  tryResolveExpressionTypeFullName
} from "./server/members";
import {
  getDeclarationAtPosition,
  getDocumentHighlightsAtPosition,
  getImplementationAtPosition,
  getPrepareRenameRangeAtPosition,
  getReferencesAtPosition,
  getRenameWorkspaceEditAtPosition,
  getSignatureHelpAtPosition,
  getSymbolDefinitionAtPosition,
  getTypeDefinitionAtPosition,
  getWorkspaceSymbols
} from "./server/navigation";
import type { WorkspaceFunctionDeclarationsByName } from "./server/navigation";
import {
  buildSemanticTokenDelta,
  buildDocumentSemanticTokens,
  type SemanticTokenSnapshot,
  semanticTokenModifiers,
  semanticTokenTypes,
  withSemanticTokenResultId
} from "./server/semanticTokens";
import {
  createDefaultSettings,
  normalizeSettings
} from "./server/settings";
import { buildCompletionIndex } from "./server/symbols";
import {
  getTypeHierarchySubtypes,
  getTypeHierarchySupertypes,
  prepareTypeHierarchyAtPosition
} from "./server/typeHierarchy";
import type {
  CompletionIndex,
  Logger,
  OpenplanetLanguageServerSettings,
  SemanticTokenMode
} from "./server/types";
import { uriToFsPath } from "./server/util";
import {
  buildWorkspaceAnalysisIndex,
  loadWorkspaceDocumentAnalysis
} from "./server/workspaceIndex";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasDidChangeWatchedFilesCapability = false;
let workspaceRoots: string[] = [];
let settings: OpenplanetLanguageServerSettings = createDefaultSettings();
let completionIndex: CompletionIndex = createCompletionIndex();

const analysisCache = new Map<string, DocumentAnalysis>();
let workspaceAnalysisCache = new Map<string, DocumentAnalysis>();
const pendingValidationTimers = new Map<string, ReturnType<typeof setTimeout>>();
const validationGenerationByUri = new Map<string, number>();
const validationDebounceMs = 200;

interface WorkspaceFunctionDeclarationEntry {
  analysis: DocumentAnalysis;
  declaration: DocumentAnalysis["functions"][number];
}

let allOpenDocumentAnalyses: DocumentAnalysis[] = [];
let workspaceFunctionReturnTypes = new Map<string, string>();
let workspaceFunctionDeclarationsByName = new Map<
  string,
  WorkspaceFunctionDeclarationEntry[]
>() satisfies WorkspaceFunctionDeclarationsByName;

let completionIndexBuildPromise: Promise<void> = Promise.resolve();
let completionIndexBuildGeneration = 0;
let completionIndexReadySettingsKey: string | undefined;
let completionIndexBuildingSettingsKey: string | undefined;
let workspaceAnalysisBuildPromise: Promise<void> = Promise.resolve();
let workspaceAnalysisBuildGeneration = 0;
let scopedAnalysisGeneration = 0;
const includeScopeCache = new Map<string, { generation: number; uris: string[] }>();
const semanticTokenSnapshots = new Map<string, SemanticTokenSnapshot>();
let semanticTokenResultCounter = 0;
const publishedDiagnosticsByUri = new Map<string, Diagnostic[]>();

const provideInlineValuesRequest = "openplanet/provideInlineValues";
const provideFileDecorationRequest = "openplanet/provideFileDecoration";

interface FileDecorationPayload {
  badge?: string;
  tooltip?: string;
  color?: string;
  propagate?: boolean;
}

connection.onInitialize((params: InitializeParams): InitializeResult => {
  hasConfigurationCapability = Boolean(
    params.capabilities.workspace?.configuration
  );
  hasDidChangeWatchedFilesCapability = Boolean(
    params.capabilities.workspace?.didChangeWatchedFiles?.dynamicRegistration
  );

  if (Array.isArray(params.workspaceFolders) && params.workspaceFolders.length) {
    workspaceRoots = params.workspaceFolders.map((folder) =>
      uriToFsPath(folder.uri)
    );
  } else if (params.rootUri) {
    workspaceRoots = [uriToFsPath(params.rootUri)];
  } else {
    workspaceRoots = [];
  }

  scheduleCompletionIndexRebuild("initialize-default");
  scheduleWorkspaceAnalysisRebuild("initialize-roots");

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: [":", "."],
        resolveProvider: true
      },
      hoverProvider: true,
      definitionProvider: true,
      declarationProvider: true,
      implementationProvider: true,
      typeDefinitionProvider: true,
      referencesProvider: true,
      documentHighlightProvider: true,
      renameProvider: {
        prepareProvider: true
      },
      signatureHelpProvider: {
        triggerCharacters: ["(", ","],
        retriggerCharacters: [","]
      },
      documentSymbolProvider: true,
      workspaceSymbolProvider: true,
      inlayHintProvider: true,
      codeActionProvider: true,
      codeLensProvider: {
        resolveProvider: false
      },
      semanticTokensProvider: {
        legend: {
          tokenTypes: [...semanticTokenTypes],
          tokenModifiers: [...semanticTokenModifiers]
        },
        full: {
          delta: true
        },
        range: true
      },
      typeHierarchyProvider: true,
      colorProvider: true
    }
  };
});

connection.onInitialized(async () => {
  if (hasConfigurationCapability) {
    void connection.client.register(DidChangeConfigurationNotification.type);
  }
  if (hasDidChangeWatchedFilesCapability) {
    void connection.client.register(DidChangeWatchedFilesNotification.type, {
      watchers: [{ globPattern: "**/*.as" }]
    });
  }

  await refreshSettings();
  scheduleCompletionIndexRebuild("initialized-settings");
  scheduleWorkspaceAnalysisRebuild("initialized-workspace");
  await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);
  await validateAllOpenDocuments();
});

connection.onDidChangeConfiguration(async () => {
  await refreshSettings();
  clearIncludeResolutionCache();
  clearImportValidationCache();
  semanticTokenSnapshots.clear();
  scheduleCompletionIndexRebuild("settings-changed");
  scheduleWorkspaceAnalysisRebuild("settings-changed");
  await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);
  await validateAllOpenDocuments();
});

documents.onDidOpen((event) => {
  workspaceAnalysisCache.delete(event.document.uri);
  getDocumentAnalysis(event.document);
  void scheduleValidation(event.document, 0);
});

documents.onDidChangeContent((change) => {
  void scheduleValidation(change.document, validationDebounceMs);
});

documents.onDidClose((event) => {
  clearPendingValidation(event.document.uri);
  validationGenerationByUri.delete(event.document.uri);
  analysisCache.delete(event.document.uri);
  semanticTokenSnapshots.delete(event.document.uri);
  void refreshWorkspaceAnalysisForUri(event.document.uri, "document-closed");
  publishDiagnostics(event.document.uri, undefined, []);
});

connection.onDidChangeWatchedFiles((event) => {
  void applyWorkspaceFileChanges(event.changes);
});

connection.onCompletion(
  async (params: CompletionParams): Promise<CompletionItem[]> => {
    if (!settings.completion.enable) {
      return [];
    }

    await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

    const document = documents.get(params.textDocument.uri);
    if (document) {
      const allAnalyses = await getScopedAnalysesForDocument(document);
      const scopedReturnTypes = collectFunctionReturnTypes(allAnalyses);
      const analysis = getDocumentAnalysis(document);

      const dotContext = getDotCompletionContext(
        document,
        params.position.line,
        params.position.character
      );

      if (dotContext) {
        const typeContext = getTypeResolutionContextAtPosition(
          document,
          analysis,
          params.position.line,
          params.position.character,
          allAnalyses,
          scopedReturnTypes
        );
        const receiverTypeFullName = tryResolveExpressionTypeFullName(
          completionIndex,
          dotContext.receiverText,
          typeContext
        );
        if (receiverTypeFullName) {
          const memberItems = collectMemberCompletionItems(
            completionIndex,
            receiverTypeFullName,
            dotContext.memberPrefix
          );
          return sliceToMaxItems(memberItems);
        }

        return [];
      }
    }

    const activeNamespace = document
      ? getActiveNamespaceAtPosition(
          document,
          params.position.line,
          params.position.character
        )
      : undefined;

    const items = collectCompletionItems(completionIndex, activeNamespace);
    return sliceToMaxItems(items);
  }
);

connection.onCompletionResolve((item): CompletionItem => {
  return resolveCompletionItemDetails(item);
});

connection.onDefinition(async (params) => {
  await workspaceAnalysisBuildPromise;

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const includeAtCursor = getIncludeAtPosition(
    document,
    params.position.line,
    params.position.character
  );
  if (includeAtCursor) {
    const targetUri = await resolveIncludePath(
      document.uri,
      includeAtCursor.pathText,
      workspaceRoots,
      settings.includePaths
    );
    if (!targetUri) {
      return null;
    }

    return Location.create(targetUri, Range.create(0, 0, 0, 0));
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getSymbolDefinitionAtPosition(
    document,
    analysis,
    allAnalyses,
    params.position.line,
    params.position.character
  );
});

connection.onDeclaration(async (params): Promise<Declaration | null> => {
  await workspaceAnalysisBuildPromise;

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const includeAtCursor = getIncludeAtPosition(
    document,
    params.position.line,
    params.position.character
  );
  if (includeAtCursor) {
    const targetUri = await resolveIncludePath(
      document.uri,
      includeAtCursor.pathText,
      workspaceRoots,
      settings.includePaths
    );
    if (!targetUri) {
      return null;
    }

    return Location.create(targetUri, Range.create(0, 0, 0, 0));
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getDeclarationAtPosition(
    document,
    analysis,
    allAnalyses,
    params.position.line,
    params.position.character
  );
});

connection.onImplementation(async (params): Promise<Location[] | null> => {
  await workspaceAnalysisBuildPromise;

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getImplementationAtPosition(
    document,
    analysis,
    allAnalyses,
    params.position.line,
    params.position.character
  );
});

connection.onTypeDefinition(async (params): Promise<Location | null> => {
  await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  const scopedReturnTypes = collectFunctionReturnTypes(allAnalyses);
  const typeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    params.position.line,
    params.position.character,
    allAnalyses,
    scopedReturnTypes
  );

  return getTypeDefinitionAtPosition(
    document,
    analysis,
    allAnalyses,
    completionIndex,
    params.position.line,
    params.position.character,
    typeContext
  );
});

connection.onHover(async (params): Promise<Hover | null> => {
  await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  const scopedReturnTypes = collectFunctionReturnTypes(allAnalyses);
  const typeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    params.position.line,
    params.position.character,
    allAnalyses,
    scopedReturnTypes
  );

  return getHoverAtPosition(
    document,
    params.position.line,
    params.position.character,
    completionIndex,
    typeContext,
    analysis,
    allAnalyses
  );
});

connection.onDocumentHighlight(async (params): Promise<DocumentHighlight[]> => {
  await workspaceAnalysisBuildPromise;

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getDocumentHighlightsAtPosition(
    document,
    analysis,
    allAnalyses,
    params.position.line,
    params.position.character
  );
});

connection.onSignatureHelp(async (params): Promise<SignatureHelp | null> => {
  await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getSignatureHelpAtPosition(
    document,
    allAnalyses,
    completionIndex,
    params.position.line,
    params.position.character
  );
});

connection.onDocumentSymbol((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const analysis = getDocumentAnalysis(document);
  return analysis.documentSymbols;
});

connection.onReferences(async (params) => {
  await workspaceAnalysisBuildPromise;

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getReferencesAtPosition(
    document,
    analysis,
    allAnalyses,
    params.position.line,
    params.position.character,
    params.context.includeDeclaration
  );
});

connection.onPrepareRename(async (params) => {
  await workspaceAnalysisBuildPromise;

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getPrepareRenameRangeAtPosition(
    document,
    analysis,
    allAnalyses,
    params.position.line,
    params.position.character
  );
});

connection.onRenameRequest(async (params) => {
  await workspaceAnalysisBuildPromise;

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getRenameWorkspaceEditAtPosition(
    document,
    analysis,
    allAnalyses,
    params.position.line,
    params.position.character,
    params.newName
  );
});

connection.onCodeAction((params): CodeAction[] => {
  return buildQuickFixCodeActions(
    params.textDocument.uri,
    params.context.diagnostics
  );
});

connection.onCodeLens(async (params): Promise<CodeLens[]> => {
  await workspaceAnalysisBuildPromise;

  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  return getCodeLensesForDocument(document, analysis, allAnalyses);
});

connection.onWorkspaceSymbol(async (params): Promise<SymbolInformation[]> => {
  await workspaceAnalysisBuildPromise;
  return getWorkspaceSymbols(getAllOpenDocumentAnalyses(), params.query);
});

connection.onRequest(
  provideInlineValuesRequest,
  async (params: InlineValuesRequestParams): Promise<InlineValuePayload[]> => {
    await workspaceAnalysisBuildPromise;

    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }

    const analysis = getDocumentAnalysis(document);
    return getInlineValuesForRange(document, analysis, params.range);
  }
);

connection.onRequest(
  provideFileDecorationRequest,
  (uri: string): FileDecorationPayload | null => {
    const diagnostics = publishedDiagnosticsByUri.get(uri) ?? [];
    if (diagnostics.length === 0) {
      return null;
    }

    let errorCount = 0;
    let warningCount = 0;
    for (const diagnostic of diagnostics) {
      const severity = diagnostic.severity ?? DiagnosticSeverity.Error;
      if (severity === DiagnosticSeverity.Error) {
        errorCount += 1;
      } else if (severity === DiagnosticSeverity.Warning) {
        warningCount += 1;
      }
    }

    if (errorCount > 0) {
      return {
        badge: "!",
        tooltip:
          warningCount > 0
            ? `${errorCount} error(s), ${warningCount} warning(s)`
            : `${errorCount} error(s)`,
        color: "problemsErrorIcon.foreground"
      };
    }

    if (warningCount > 0) {
      return {
        badge: "~",
        tooltip: `${warningCount} warning(s)`,
        color: "problemsWarningIcon.foreground"
      };
    }

    return null;
  }
);

connection.languages.inlayHint.on(
  async (params): Promise<InlayHint[]> => {
    await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return [];
    }

    const analysis = getDocumentAnalysis(document);
    return getInlayHints(
      document,
      analysis,
      completionIndex,
      params.range,
      settings.inlayHints,
      workspaceFunctionDeclarationsByName,
      workspaceFunctionReturnTypes
    );
  }
);

connection.languages.semanticTokens.on(
  async (params): Promise<SemanticTokens> => {
    if (!settings.semanticTokens.enable) {
      return { data: [] };
    }

    await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return { data: [] };
    }

    const snapshot = await buildSemanticTokenSnapshot(
      document,
      settings.semanticTokens.mode
    );
    semanticTokenSnapshots.set(document.uri, snapshot);
    return withSemanticTokenResultId(
      {
        data: snapshot.data
      },
      snapshot.resultId
    );
  }
);

connection.languages.semanticTokens.onDelta(
  async (params): Promise<SemanticTokensDelta | SemanticTokens> => {
    if (!settings.semanticTokens.enable) {
      semanticTokenSnapshots.delete(params.textDocument.uri);
      return { data: [] };
    }

    await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return { data: [] };
    }

    const previousSnapshot = semanticTokenSnapshots.get(document.uri);
    const nextSnapshot = await buildSemanticTokenSnapshot(
      document,
      settings.semanticTokens.mode
    );
    semanticTokenSnapshots.set(document.uri, nextSnapshot);

    if (
      !previousSnapshot ||
      previousSnapshot.resultId !== params.previousResultId
    ) {
      return withSemanticTokenResultId(
        {
          data: nextSnapshot.data
        },
        nextSnapshot.resultId
      );
    }

    return buildSemanticTokenDelta(previousSnapshot, nextSnapshot);
  }
);

connection.languages.semanticTokens.onRange(
  async (params): Promise<SemanticTokens> => {
    if (!settings.semanticTokens.enable) {
      return { data: [] };
    }

    await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return { data: [] };
    }

    const analysis = getDocumentAnalysis(document);
    const allAnalyses = await getScopedAnalysesForDocument(document);
    return buildDocumentSemanticTokens(
      document,
      analysis,
      allAnalyses,
      completionIndex,
      params.range,
      {
        mode: settings.semanticTokens.mode
      }
    );
  }
);

connection.languages.typeHierarchy.onPrepare(
  async (params): Promise<TypeHierarchyItem[] | null> => {
    await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);

    const document = documents.get(params.textDocument.uri);
    if (!document) {
      return null;
    }

    const analysis = getDocumentAnalysis(document);
    const allAnalyses = await getScopedAnalysesForDocument(document);
    return prepareTypeHierarchyAtPosition(
      document,
      analysis,
      allAnalyses,
      completionIndex,
      params.position.line,
      params.position.character
    );
  }
);

connection.languages.typeHierarchy.onSupertypes(
  async (params): Promise<TypeHierarchyItem[] | null> => {
    await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);
    const allAnalyses = getAllOpenDocumentAnalyses();
    return getTypeHierarchySupertypes(params.item, allAnalyses, completionIndex);
  }
);

connection.languages.typeHierarchy.onSubtypes(
  async (params): Promise<TypeHierarchyItem[] | null> => {
    await Promise.all([completionIndexBuildPromise, workspaceAnalysisBuildPromise]);
    const allAnalyses = getAllOpenDocumentAnalyses();
    return getTypeHierarchySubtypes(params.item, allAnalyses, completionIndex);
  }
);

connection.onDocumentColor(async (params): Promise<ColorInformation[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  return getDocumentColors(document);
});

connection.onColorPresentation((params): ColorPresentation[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  return getColorPresentations(document, params.color, params.range);
});

documents.listen(connection);
connection.listen();

async function refreshSettings(): Promise<void> {
  if (!hasConfigurationCapability) {
    settings = createDefaultSettings();
    return;
  }

  const raw = await connection.workspace.getConfiguration(
    "openplanetLanguageServer"
  );
  settings = normalizeSettings(raw);
}

async function buildSemanticTokenSnapshot(
  document: TextDocument,
  mode: SemanticTokenMode
): Promise<SemanticTokenSnapshot> {
  const analysis = getDocumentAnalysis(document);
  const allAnalyses = await getScopedAnalysesForDocument(document);
  const tokens = buildDocumentSemanticTokens(
    document,
    analysis,
    allAnalyses,
    completionIndex,
    undefined,
    {
      mode
    }
  );
  semanticTokenResultCounter += 1;
  return {
    resultId: String(semanticTokenResultCounter),
    data: [...tokens.data]
  };
}

function scheduleCompletionIndexRebuild(reason: string): void {
  const logger = connection.console as unknown as Logger;
  const buildSettings = settings;
  const buildSettingsKey = serializeSettingsKey(buildSettings);
  if (completionIndexReadySettingsKey === buildSettingsKey) {
    return;
  }
  if (completionIndexBuildingSettingsKey === buildSettingsKey) {
    return;
  }

  const buildGeneration = ++completionIndexBuildGeneration;
  completionIndexBuildingSettingsKey = buildSettingsKey;
  const startedAt = Date.now();

  completionIndexBuildPromise = (async () => {
    const index = await buildCompletionIndex(buildSettings, logger);
    const currentSettingsKey = serializeSettingsKey(settings);

    if (buildGeneration !== completionIndexBuildGeneration) {
      return;
    }
    if (currentSettingsKey !== buildSettingsKey) {
      logger.info(
        `[symbols] Discarded stale completion index (${reason}); settings changed during rebuild.`
      );
      return;
    }

    completionIndex = index;
    completionIndexReadySettingsKey = buildSettingsKey;
    logger.info(
      `[symbols] Completion index rebuilt (${reason}) in ${Date.now() - startedAt}ms`
    );
    await validateAllOpenDocuments();
  })()
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(
        `[symbols] Failed to rebuild completion index (${reason}): ${message}`
      );
    })
    .finally(() => {
      if (completionIndexBuildingSettingsKey === buildSettingsKey) {
        completionIndexBuildingSettingsKey = undefined;
      }
    });
}

async function validateAllOpenDocuments(): Promise<void> {
  const allDocuments = documents.all();
  await Promise.all(
    allDocuments.map((document) => {
      const generation = incrementValidationGeneration(document.uri);
      clearPendingValidation(document.uri);
      return validateTextDocument(document, generation);
    })
  );
}

async function scheduleValidation(
  document: TextDocument,
  debounceMs: number
): Promise<void> {
  const uri = document.uri;
  const generation = incrementValidationGeneration(uri);
  clearPendingValidation(uri);

  if (debounceMs <= 0) {
    await validateTextDocument(document, generation);
    return;
  }

  const timer = setTimeout(() => {
    pendingValidationTimers.delete(uri);
    const latest = documents.get(uri);
    if (!latest) {
      return;
    }

    void validateTextDocument(latest, generation);
  }, debounceMs);

  pendingValidationTimers.set(uri, timer);
}

function incrementValidationGeneration(uri: string): number {
  const next = (validationGenerationByUri.get(uri) ?? 0) + 1;
  validationGenerationByUri.set(uri, next);
  return next;
}

function clearPendingValidation(uri: string): void {
  const timer = pendingValidationTimers.get(uri);
  if (!timer) {
    return;
  }

  clearTimeout(timer);
  pendingValidationTimers.delete(uri);
}

function isValidationCancelled(
  uri: string,
  expectedVersion: number,
  expectedGeneration?: number
): boolean {
  const latestDocument = documents.get(uri);
  if (!latestDocument || latestDocument.version !== expectedVersion) {
    return true;
  }

  if (expectedGeneration === undefined) {
    return false;
  }

  return validationGenerationByUri.get(uri) !== expectedGeneration;
}

async function validateTextDocument(
  document: TextDocument,
  expectedGeneration?: number
): Promise<void> {
  const targetUri = document.uri;
  const targetVersion = document.version;
  const diagnostics: Diagnostic[] = [];
  let analysis: DocumentAnalysis | undefined;

  if (isValidationCancelled(targetUri, targetVersion, expectedGeneration)) {
    return;
  }

  if (settings.validateIncludes) {
    const includeDiagnostics = await getIncludeDiagnostics(
      document,
      workspaceRoots,
      settings.includePaths,
      settings.maxIncludeDiagnostics
    );
    diagnostics.push(...includeDiagnostics);
  }

  if (isValidationCancelled(targetUri, targetVersion, expectedGeneration)) {
    return;
  }

  analysis = getDocumentAnalysis(document);
  diagnostics.push(...getSyntaxDiagnostics(document, analysis, settings.parser));

  if (settings.imports.enable) {
    const importDiagnostics = await getImportDiagnostics(
      document,
      analysis,
      workspaceRoots,
      settings.imports,
      settings.symbols.baseUserFolderPath
    );
    diagnostics.push(...importDiagnostics);
  }

  if (isValidationCancelled(targetUri, targetVersion, expectedGeneration)) {
    return;
  }

  if (
    settings.diagnostics.enableUnknownSymbols ||
    settings.diagnostics.enableCaseMismatch
  ) {
    if (!isCompletionIndexReadyForCurrentSettings()) {
      if (isValidationCancelled(targetUri, targetVersion, expectedGeneration)) {
        return;
      }

      publishDiagnostics(targetUri, targetVersion, diagnostics);
      return;
    }

    const semanticAnalysis = analysis ?? getDocumentAnalysis(document);
    const allAnalyses = await getScopedAnalysesForDocument(document);
    const scopedReturnTypes = collectFunctionReturnTypes(allAnalyses);
    diagnostics.push(
      ...getSemanticDiagnostics(
        document,
        semanticAnalysis,
        allAnalyses,
        completionIndex,
        settings.diagnostics,
        scopedReturnTypes
      )
    );
  }

  if (isValidationCancelled(targetUri, targetVersion, expectedGeneration)) {
    return;
  }

  publishDiagnostics(targetUri, targetVersion, diagnostics);
}

function isCompletionIndexReadyForCurrentSettings(): boolean {
  return completionIndexReadySettingsKey === serializeSettingsKey(settings);
}

function serializeSettingsKey(
  value: OpenplanetLanguageServerSettings
): string {
  return JSON.stringify(value);
}

function publishDiagnostics(
  uri: string,
  version: number | undefined,
  diagnostics: Diagnostic[]
): void {
  if (diagnostics.length > 0) {
    publishedDiagnosticsByUri.set(uri, [...diagnostics]);
  } else {
    publishedDiagnosticsByUri.delete(uri);
  }

  connection.sendDiagnostics({
    uri,
    version,
    diagnostics
  });
}

function getDocumentAnalysis(document: TextDocument): DocumentAnalysis {
  const cached = analysisCache.get(document.uri);
  if (cached && cached.version === document.version) {
    return cached;
  }

  const analysis = analyzeDocument(document);
  analysisCache.set(document.uri, analysis);
  rebuildWorkspaceFunctionIndexes();
  return analysis;
}

function getAllOpenDocumentAnalyses(): DocumentAnalysis[] {
  return allOpenDocumentAnalyses;
}

function rebuildWorkspaceFunctionIndexes(): void {
  scopedAnalysisGeneration += 1;
  includeScopeCache.clear();

  const analysesByUri = new Map<string, DocumentAnalysis>();
  for (const [uri, analysis] of workspaceAnalysisCache.entries()) {
    analysesByUri.set(uri, analysis);
  }
  for (const [uri, analysis] of analysisCache.entries()) {
    analysesByUri.set(uri, analysis);
  }

  allOpenDocumentAnalyses = [...analysesByUri.values()];

  const declarationsByName = new Map<string, WorkspaceFunctionDeclarationEntry[]>();
  const returnTypes = new Map<string, string>();

  for (const analysis of allOpenDocumentAnalyses) {
    for (const declaration of analysis.functions) {
      const declarations = declarationsByName.get(declaration.name) ?? [];
      declarations.push({ analysis, declaration });
      declarationsByName.set(declaration.name, declarations);

      if (declaration.returnType && !returnTypes.has(declaration.name)) {
        returnTypes.set(declaration.name, declaration.returnType);
      }
    }
  }

  for (const declarations of declarationsByName.values()) {
    declarations.sort((a, b) => {
      if (a.analysis.uri === b.analysis.uri) {
        return a.declaration.start - b.declaration.start;
      }

      return a.analysis.uri.localeCompare(b.analysis.uri);
    });
  }

  workspaceFunctionDeclarationsByName = declarationsByName;
  workspaceFunctionReturnTypes = returnTypes;
}

function sliceToMaxItems(items: CompletionItem[]): CompletionItem[] {
  if (items.length <= settings.completion.maxItems) {
    return items;
  }

  return items.slice(0, settings.completion.maxItems);
}

async function getScopedAnalysesForDocument(
  document: TextDocument
): Promise<DocumentAnalysis[]> {
  const analysis = getDocumentAnalysis(document);
  return getScopedAnalysesByUri(document.uri, analysis);
}

async function getScopedAnalysesByUri(
  rootUri: string,
  fallbackRootAnalysis?: DocumentAnalysis
): Promise<DocumentAnalysis[]> {
  const cached = includeScopeCache.get(rootUri);
  if (cached && cached.generation === scopedAnalysisGeneration) {
    const cachedAnalyses = cached.uris
      .map((uri) => getAnalysisByUri(uri))
      .filter((analysis): analysis is DocumentAnalysis => analysis !== undefined);
    if (cachedAnalyses.length > 0) {
      return cachedAnalyses;
    }
  }

  const rootAnalysis = fallbackRootAnalysis ?? getAnalysisByUri(rootUri);
  if (!rootAnalysis) {
    return [];
  }

  const visited = new Set<string>();
  const queue = [rootUri];

  while (queue.length > 0) {
    const currentUri = queue.shift();
    if (!currentUri || visited.has(currentUri)) {
      continue;
    }

    visited.add(currentUri);
    const currentAnalysis =
      currentUri === rootUri && fallbackRootAnalysis
        ? fallbackRootAnalysis
        : getAnalysisByUri(currentUri);
    if (!currentAnalysis) {
      continue;
    }

    for (const include of currentAnalysis.includes) {
      const resolvedUri = await resolveIncludePath(
        currentUri,
        include.pathText,
        workspaceRoots,
        settings.includePaths
      );
      if (!resolvedUri || visited.has(resolvedUri)) {
        continue;
      }

      queue.push(resolvedUri);
    }
  }

  if (!visited.has(rootUri)) {
    visited.add(rootUri);
  }

  const scopedUris = [...visited].sort((a, b) => a.localeCompare(b));
  includeScopeCache.set(rootUri, {
    generation: scopedAnalysisGeneration,
    uris: scopedUris
  });

  const scopedAnalyses = scopedUris
    .map((uri) => {
      if (uri === rootUri && fallbackRootAnalysis) {
        return fallbackRootAnalysis;
      }

      return getAnalysisByUri(uri);
    })
    .filter((analysis): analysis is DocumentAnalysis => analysis !== undefined);

  return scopedAnalyses.length > 0 ? scopedAnalyses : [rootAnalysis];
}

function getAnalysisByUri(uri: string): DocumentAnalysis | undefined {
  return analysisCache.get(uri) ?? workspaceAnalysisCache.get(uri);
}

function scheduleWorkspaceAnalysisRebuild(reason: string): void {
  const logger = connection.console as unknown as Logger;
  const buildGeneration = ++workspaceAnalysisBuildGeneration;
  const workspaceRootsSnapshot = [...workspaceRoots];
  const openDocumentUris = new Set(documents.all().map((document) => document.uri));
  const startedAt = Date.now();

  workspaceAnalysisBuildPromise = (async () => {
    const analyses = await buildWorkspaceAnalysisIndex(
      workspaceRootsSnapshot,
      openDocumentUris,
      logger,
      {
        dependencies: {
          enableInfoTomlDependencies:
            settings.dependencies.enableInfoTomlDependencies,
          includeOptionalDependencies:
            settings.dependencies.includeOptionalDependencies,
          pluginRoots: settings.dependencies.pluginRoots,
          symbolsBaseUserFolderPath: settings.symbols.baseUserFolderPath,
          maxDepth: settings.dependencies.maxDepth,
          maxFiles: settings.dependencies.maxFiles
        }
      }
    );
    if (buildGeneration !== workspaceAnalysisBuildGeneration) {
      return;
    }

    workspaceAnalysisCache = analyses;
    rebuildWorkspaceFunctionIndexes();
    logger.info(
      `[workspace-index] Rebuilt (${reason}) in ${Date.now() - startedAt}ms with ${workspaceAnalysisCache.size} files`
    );
    await validateAllOpenDocuments();
  })().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(
      `[workspace-index] Failed to rebuild (${reason}): ${message}`
    );
  });
}

async function applyWorkspaceFileChanges(
  changes: Array<{ uri: string; type: FileChangeType }>
): Promise<void> {
  if (changes.length === 0) {
    return;
  }

  const logger = connection.console as unknown as Logger;
  let changed = false;

  for (const change of changes) {
    if (documents.get(change.uri)) {
      continue;
    }

    if (change.type === FileChangeType.Deleted) {
      changed = workspaceAnalysisCache.delete(change.uri) || changed;
      continue;
    }

    const analysis = await loadWorkspaceDocumentAnalysis(change.uri, logger);
    if (!analysis) {
      changed = workspaceAnalysisCache.delete(change.uri) || changed;
      continue;
    }

    workspaceAnalysisCache.set(change.uri, analysis);
    changed = true;
  }

  if (!changed) {
    return;
  }

  rebuildWorkspaceFunctionIndexes();
  await validateAllOpenDocuments();
}

async function refreshWorkspaceAnalysisForUri(
  uri: string,
  reason: string
): Promise<void> {
  if (documents.get(uri)) {
    return;
  }

  const logger = connection.console as unknown as Logger;
  const analysis = await loadWorkspaceDocumentAnalysis(uri, logger);

  if (documents.get(uri)) {
    return;
  }

  if (analysis) {
    workspaceAnalysisCache.set(uri, analysis);
  } else {
    workspaceAnalysisCache.delete(uri);
  }

  rebuildWorkspaceFunctionIndexes();
  logger.info(`[workspace-index] Refreshed (${reason}) ${uri}`);
  await validateAllOpenDocuments();
}
