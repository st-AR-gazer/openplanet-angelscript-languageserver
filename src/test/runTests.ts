import * as assert from "assert";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import {
  CompletionItemKind,
  DiagnosticSeverity,
  DocumentHighlightKind,
  SymbolKind
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import { analyzeDocument, getTypeResolutionContextAtPosition } from "../server/analysis";
import {
  addSymbol,
  collectCompletionItems,
  createCompletionIndex,
  registerNamespacePath,
  resolveCompletionItemDetails
} from "../server/completions";
import {
  buildQuickFixCodeActions,
  getSemanticDiagnostics,
  getSyntaxDiagnostics
} from "../server/diagnostics";
import { getHoverAtPosition } from "../server/hover";
import { getInlayHints } from "../server/inlayHints";
import { getIncludeDiagnostics } from "../server/includes";
import { getImportDiagnostics } from "../server/imports";
import { getInlineValuesForRange } from "../server/inlineValues";
import { getCodeLensesForDocument } from "../server/codeLenses";
import { getDocumentColors, getColorPresentations } from "../server/colors";
import {
  collectMemberCompletionItems,
  registerCoreClassTypeInfo,
  tryResolveExpressionTypeFullName
} from "../server/members";
import {
  evaluateAssignmentOperatorCompatibility,
  inferExpressionTypeFromText
} from "../server/compilerPipeline";
import {
  getDocumentHighlightsAtPosition,
  getImplementationAtPosition,
  getReferencesAtPosition,
  getRenameWorkspaceEditAtPosition,
  getSignatureHelpAtPosition,
  getTypeDefinitionAtPosition,
  getWorkspaceSymbols
} from "../server/navigation";
import {
  buildSemanticTokenDelta,
  buildDocumentSemanticTokens,
  semanticTokenTypes
} from "../server/semanticTokens";
import { createDefaultSettings } from "../server/settings";
import { buildCompletionIndex } from "../server/symbols";
import {
  getTypeHierarchySubtypes,
  getTypeHierarchySupertypes,
  prepareTypeHierarchyAtPosition
} from "../server/typeHierarchy";
import { buildWorkspaceAnalysisIndex } from "../server/workspaceIndex";
import {
  parseGrammarPipeline,
  type GrammarCallableDeclarationNode
} from "../server/grammarPipeline";
import { seedTestSymbols } from "./seedTestSymbols";

async function main(): Promise<void> {
  const index = createCompletionIndex();
  seedTestSymbols(index);

  testSyntaxUnclosedDelimiterDiagnostic();
  testUnterminatedStringDiagnostic();
  testUnparsableStatementDiagnostic();
  testValidElseDoesNotProduceParserDiagnostic();
  testValidForeachDoesNotProduceParserDiagnostic();
  testUnclosedParenDoesNotCascadeToMissingBlockCloseDiagnostic();
  testVariableDeclarationParsingMultiDeclarator();
  testFunctionParameterDefaultInitializerListParsing();
  testEnumCompletionCommitsWithNamespaceChain();
  testEnumMembersOnlyShownInsideEnumScope();
  testFunctionCompletionShowsReturnTypeWithoutDuplicateName();
  testFunctionCompletionResolveShowsSignatureName();
  testGrammarCallableDeclarations();
  testGrammarCallableNestedTemplateParameterParsing();
  testIncludeDirectiveDoesNotPolluteFunctionReturnType(index);
  testTypeResolution(index);
  testGlobalDeclarationTypeInference(index);
  testCoreAccessorPropertiesFromCoreMethods(index);
  testBindingDuplicateDeclarationDiagnostic(index);
  testBindingUseBeforeDeclarationDiagnostic(index);
  testBindingNestedShadowingDoesNotDuplicate(index);
  testBindingConstDeclarationWithCastInitializerDoesNotDuplicate(index);
  testCaseMismatchDiagnostic(index);
  testUnknownMemberDiagnostic(index);
  testUnknownIdentifierDiagnostic(index);
  testGlobalAutoDeclarationNotUnknownIdentifier(index);
  testUnknownNamespaceQualifierPrefixDiagnostic(index);
  testLogicalOrDoesNotMarkIdentifierAsCallable(index);
  testCrossFileGlobalIdentifierResolution(index);
  testCrossFileAttributedGlobalIdentifierResolution(index);
  testCrossFileAttributedGlobalIdentifierResolutionWithLeadingComments(index);
  testCrossFileNamespacedGlobalArgumentTypeInference(index);
  testNamespaceScopedGlobalShortNameArgumentTypeInference(index);
  testUsingKnownNamespaceDoesNotProduceUnknownIdentifier(index);
  testNamespacedExpressionDoesNotProduceUnknownType(index);
  testNamespacedEnumTypeAndValueRecognized(index);
  testUnknownTypeDiagnostic(index);
  testArityMismatchDiagnostic(index);
  testCallArgumentTypeMismatchDiagnostic(index);
  testCallArgumentConstHandleMismatchDiagnostic(index);
  testCallArgumentTypeInferenceIgnoresInlineComments(index);
  testNamespacedEnumFlagValueAcceptedForIntArgument(index);
  testConditionalInitializerDoesNotEmitBinaryMismatch(index);
  testOverloadResolutionPrefersExactMatch(index);
  testTemplateSignatureInference(index);
  testOperatorExpressionTypingInCall(index);
  testAssignmentTypeMismatchDiagnostic(index);
  testJsonValueIndexAssignmentIsLValue(index);
  testOperatorTypeMismatchDiagnostic(index);
  testOperatorMethodAssignmentCompatibility(index);
  testImplicitOperatorConversionCompatibility(index);
  testIndexedOperatorTypeInference(index);
  testMemberCallTypeMismatchDiagnostic(index);
  testReturnTypeMismatchDiagnostic(index);
  testInvalidMemberCallDiagnostic(index);
  testIntrinsicCastCallIgnored(index);
  testTypeConstructorCallIgnored(index);
  testAttributeIdentifierIgnored(index);
  testBooleanKeywordOperatorsIgnored(index);
  testImportCallableDeclarationIgnored(index);
  testFuncdefCallableDeclarationIgnored(index);
  testNamespacedCallablesNotSuggestedAsGlobal(index);
  testScopeAwareRename(index);
  testGlobalVariableReferences(index);
  testBlockScopedShadowRename(index);
  testHoverLocalVariableAndWorkspaceFunctionDocs(index);
  testHoverOnMemberInReturnExpression(index);
  testHoverTypeDocsLinks(index);
  testHoverNamespaceEnumAndEnumMemberDocsLinks(index);
  testHoverQualifiedCallableDocsLink(index);
  testHoverTypedVariableDocsLink(index);
  testSignatureHelp(index);
  testQualifiedSignatureHelp(index);
  testSignatureHelpSelectsOverload(index);
  testInlayHints(index);
  testInlayHintsGlobalAutoStartnewType(index);
  testCompletionShortcuts(index);
  testInlineValueCategoryToggles();
  testDocumentHighlights();
  testWorkspaceSymbols();
  testTypeDefinitionWorkspaceType(index);
  testImplementationProvider();
  testCodeLenses();
  testSemanticTokens(index);
  testSemanticTokensMinimalModePreservesSyntaxPrimary(index);
  testSemanticTokenDelta();
  testTypeHierarchy(index);
  testColorProvider();
  testConstructorAndDestructorParsing();
  testDocumentSymbols();
  await testImportValidationFolderOnlyWarning();
  await testImportValidationFolderAndOpNoSourceWarning();
  await testImportValidationOpOnlyNoSourceWarning();
  await testImportValidationMissingFunction();
  await testImportValidationMissingFunctionQuickFix();
  await testImportValidationSignatureMismatchQuickFix();
  await testWorkspaceAnalysisIndexSkipsOpenDocuments();
  await testWorkspaceAnalysisIndexLoadsInfoTomlDependencies();
  await testCompletionIndexGameProfileSelection();
  await testCompletionIndexGameProfilePathOverrides();
  await testCompletionIndexSynthesizesNamespaceAccessorProperties();
  await testMissingIncludeDiagnosticSeverity();

  console.log("All tests passed.");
}

function testTypeResolution(index: ReturnType<typeof createCompletionIndex>): void {
  const source = [
    "void Main() {",
    "  CGameCtnApp@ app = GetApp();",
    "  app.CurrentPlayground.Analyzer.Id.Name();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///type-resolution.as",
    "openplanet-angelscript",
    1,
    source
  );

  const analysis = analyzeDocument(document);
  const context = getTypeResolutionContextAtPosition(
    document,
    analysis,
    2,
    7,
    [analysis]
  );
  const resolvedType = tryResolveExpressionTypeFullName(
    index,
    "app.CurrentPlayground.Analyzer.Id",
    context
  );

  assert.strictEqual(
    resolvedType,
    "MwId",
    "Expected local variable type resolution across chained members."
  );
}

function testGlobalDeclarationTypeInference(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "Meta");
  registerNamespacePath(index, "Crypto");

  index.typeInfoByFullName.set("Meta::Plugin", {
    fullName: "Meta::Plugin",
    shortName: "Plugin",
    namespace: "Meta",
    members: [
      {
        name: "Name",
        kind: "property",
        type: "string"
      },
      {
        name: "ID",
        kind: "property",
        type: "string"
      }
    ]
  });
  const pluginTypeCandidates = index.typeFullNamesByShortName.get("Plugin") ?? [];
  if (!pluginTypeCandidates.includes("Meta::Plugin")) {
    pluginTypeCandidates.push("Meta::Plugin");
    index.typeFullNamesByShortName.set("Plugin", pluginTypeCandidates);
  }

  index.coreFunctionSignaturesByQualifiedName.set("Crypto::MD5", [
    "string Crypto::MD5(const string &in str)"
  ]);

  const source = [
    "Meta::Plugin@ pluginMeta = Meta::ExecutingPlugin();",
    "const string pluginNameHash = Crypto::MD5(pluginMeta.Name);",
    "void Main() {}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///global-type-resolution.as",
    "openplanet-angelscript",
    1,
    source
  );

  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 1
    ),
    "Expected global declaration member access to keep argument typing for Crypto::MD5(pluginMeta.Name)."
  );
}

function testCoreAccessorPropertiesFromCoreMethods(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "Meta");
  registerNamespacePath(index, "Crypto");

  registerCoreClassTypeInfo(index, "Meta::PluginAccessor", {
    methods: [
      {
        name: "get_Name",
        returntypedecl: "string",
        args: []
      },
      {
        name: "set_Name",
        returntypedecl: "void",
        args: [{ typedecl: "string", name: "value" }]
      }
    ]
  });

  index.coreFunctionSignaturesByQualifiedName.set("Crypto::MD5", [
    "string Crypto::MD5(const string &in str)"
  ]);

  const source = [
    "Meta::PluginAccessor@ pluginMeta;",
    "const string pluginNameHash = Crypto::MD5(pluginMeta.Name);",
    "void Main() {}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///core-accessor-property-resolution.as",
    "openplanet-angelscript",
    1,
    source
  );

  const analysis = analyzeDocument(document);
  const typeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    1,
    0,
    [analysis]
  );
  const resolvedType = tryResolveExpressionTypeFullName(
    index,
    "pluginMeta",
    typeContext
  );
  assert.strictEqual(
    resolvedType,
    "Meta::PluginAccessor",
    "Expected global pluginMeta variable to resolve to Meta::PluginAccessor."
  );
  if (!resolvedType) {
    return;
  }
  const memberLabels = collectMemberCompletionItems(
    index,
    resolvedType,
    ""
  ).map((item) => item.label);
  assert.ok(
    memberLabels.includes("Name"),
    "Expected get_/set_ accessors to surface `Name` in member completion."
  );

  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 1
    ),
    "Expected get_/set_ accessors from core-class metadata to surface as property members for typing."
  );
}

function testCompletionShortcuts(index: ReturnType<typeof createCompletionIndex>): void {
  const withoutShortcuts = collectCompletionItems(index, undefined, {
    math: false,
    ui: false,
    mathX: false,
    ux: false,
    mat: false,
    quat: false,
    string: false
  });
  assert.ok(
    !withoutShortcuts.some((item) => item.label === "Rotate"),
    "Expected mat4::Rotate to be absent when completion shortcuts are disabled."
  );

  const withMatShortcut = collectCompletionItems(index, undefined, {
    math: false,
    ui: false,
    mathX: false,
    ux: false,
    mat: true,
    quat: false,
    string: false
  });
  const rotate = withMatShortcut.find((item) => item.label === "Rotate");
  assert.ok(
    rotate,
    "Expected mat4::Rotate to be surfaced when mat shortcut completion is enabled."
  );
  assert.ok(
    rotate?.detail?.includes("shortcut"),
    "Expected shortcut completion entries to include shortcut context in detail."
  );
}

function testInlineValueCategoryToggles(): void {
  const source = [
    "class Sample {",
    "  int value;",
    "  void Tick(int amount) {",
    "    int local = amount;",
    "    this.value = local;",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///inline-values-toggles.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const fullRange = {
    start: { line: 0, character: 0 },
    end: document.positionAt(source.length)
  };

  const allEnabled = getInlineValuesForRange(document, analysis, fullRange, {
    enable: true,
    showInlineValueForLocalVariables: true,
    showInlineValueForParameters: true,
    showInlineValueForMemberAssignment: true,
    showInlineValueForFunctionThisObject: true
  });
  const variableLookups = allEnabled.filter(
    (value) => value.kind === "variableLookup"
  );
  const expressions = allEnabled.filter(
    (value) => value.kind === "evaluatableExpression"
  );

  assert.ok(
    variableLookups.some((value) => value.variableName === "amount"),
    "Expected parameter inline value when parameter category is enabled."
  );
  assert.ok(
    variableLookups.some((value) => value.variableName === "local"),
    "Expected local inline value when local category is enabled."
  );
  assert.ok(
    expressions.some((value) => value.expression === "this.value"),
    "Expected member-assignment inline expression when member-assignment category is enabled."
  );
  assert.ok(
    expressions.some((value) => value.expression === "this"),
    "Expected function this-object inline expression when function-this category is enabled."
  );

  const allDisabled = getInlineValuesForRange(document, analysis, fullRange, {
    enable: false,
    showInlineValueForLocalVariables: true,
    showInlineValueForParameters: true,
    showInlineValueForMemberAssignment: true,
    showInlineValueForFunctionThisObject: true
  });
  assert.strictEqual(
    allDisabled.length,
    0,
    "Expected no inline values when inline value feature is globally disabled."
  );

  const memberThisDisabled = getInlineValuesForRange(document, analysis, fullRange, {
    enable: true,
    showInlineValueForLocalVariables: true,
    showInlineValueForParameters: true,
    showInlineValueForMemberAssignment: false,
    showInlineValueForFunctionThisObject: false
  });
  assert.ok(
    !memberThisDisabled.some(
      (value) =>
        value.kind === "evaluatableExpression" &&
        (value.expression === "this" || value.expression === "this.value")
    ),
    "Expected no this/member assignment expressions when those categories are disabled."
  );
}

function testCaseMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["void Main() {", "  GetaPp();", "}"].join("\n");
  const document = TextDocument.create(
    "file:///case-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === "case-mismatch-symbol"),
    "Expected case mismatch diagnostic for GetaPp."
  );
  const caseMismatchDiagnostic = diagnostics.find(
    (diagnostic) => diagnostic.code === "case-mismatch-symbol"
  );
  assert.strictEqual(
    caseMismatchDiagnostic?.severity,
    DiagnosticSeverity.Error,
    "Expected case mismatch diagnostics to be severity Error."
  );

  const quickFixes = buildQuickFixCodeActions(document.uri, diagnostics);
  assert.ok(
    quickFixes.some((action) => action.title.includes("GetApp")),
    "Expected quick fix suggesting GetApp."
  );
}

function testUnknownMemberDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  CGameCtnApp@ app = GetApp();",
    "  app.Curre;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///unknown-member.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  const memberDiagnostic = diagnostics.find(
    (diagnostic) => diagnostic.code === "unknown-member"
  );
  assert.ok(memberDiagnostic, "Expected unknown-member diagnostic for app.Curre.");
  assert.strictEqual(
    memberDiagnostic?.severity,
    DiagnosticSeverity.Error,
    "Expected unknown member diagnostics to be severity Error."
  );
  assert.ok(
    memberDiagnostic?.message.includes("CurrentPlayground"),
    "Expected unknown-member suggestion to include CurrentPlayground."
  );

  const quickFixes = buildQuickFixCodeActions(document.uri, diagnostics);
  assert.ok(
    quickFixes.some((action) => action.title.includes("CurrentPlayground")),
    "Expected quick fix suggesting CurrentPlayground."
  );
}

function testUnknownIdentifierDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["void Main() {", "  value = 1;", "}"].join("\n");
  const document = TextDocument.create(
    "file:///unknown-identifier.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === "unknown-identifier"),
    "Expected unknown identifier diagnostic for value."
  );
}

function testGlobalAutoDeclarationNotUnknownIdentifier(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.coreGlobalFunctionNames.add("startnew");
  index.coreFunctionReturnTypes.set("startnew", "awaitable@");
  index.coreFunctionSignatures.set("startnew", [
    "awaitable@ startnew(CoroutineFunc@ func)"
  ]);

  const source = [
    "void Initialise() {}",
    "auto logging_initializer = startnew(Initialise);",
    "void Main() {",
    "  auto copy = logging_initializer;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///global-auto-declaration.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    analysis.globalDeclarations.some(
      (declaration) => declaration.name === "logging_initializer"
    ),
    "Expected auto global declaration to be collected."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" &&
        diagnostic.message.includes("\"logging_initializer\"")
    ),
    "Expected auto global declaration logging_initializer to avoid unknown-identifier diagnostics."
  );
}

function testUnknownNamespaceQualifierPrefixDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  ScoresTableFilter::S_Enable = true;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///unknown-namespace-prefix.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" &&
        diagnostic.message.includes("\"ScoresTableFilter\"")
    ),
    "Expected unknown identifier diagnostic for unknown namespace qualifier prefix."
  );
}

function testLogicalOrDoesNotMarkIdentifierAsCallable(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "bool S_Enabled = true;",
    "bool S_HideWithGame = false;",
    "void Main() {",
    "  if (!S_Enabled || (S_HideWithGame && !UI::IsGameUIVisible())) {",
    "    return;",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///logical-or-not-call.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-symbol" &&
        diagnostic.message.includes("\"S_Enabled\"")
    ),
    "Expected logical-OR usage to keep S_Enabled as identifier (not callable)."
  );
}

function testCrossFileGlobalIdentifierResolution(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const globalsDocument = TextDocument.create(
    "file:///globals.as",
    "openplanet-angelscript",
    1,
    "bool S_ShowUiNavDev = true;\n"
  );
  const mainDocument = TextDocument.create(
    "file:///main.as",
    "openplanet-angelscript",
    1,
    ["void Main() {", "  S_ShowUiNavDev = false;", "}"].join("\n")
  );

  const globalsAnalysis = analyzeDocument(globalsDocument);
  const mainAnalysis = analyzeDocument(mainDocument);
  const diagnostics = getSemanticDiagnostics(
    mainDocument,
    mainAnalysis,
    [mainAnalysis, globalsAnalysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" &&
        diagnostic.message.includes("S_ShowUiNavDev")
    ),
    "Expected globals declared in sibling files to avoid unknown identifier diagnostics."
  );
}

function testCrossFileAttributedGlobalIdentifierResolution(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "UI");
  index.coreFunctionSignaturesByQualifiedName.set("UI::Checkbox", [
    "bool UI::Checkbox(const string&in label, bool value)"
  ]);

  const settingsDocument = TextDocument.create(
    "file:///settings-attributed.as",
    "openplanet-angelscript",
    1,
    [
      '[Setting hidden name="Enabled"]',
      "bool S_Enabled = true;",
      "",
      '[Setting hidden name="Show UiNav Dev"]',
      "bool S_ShowUiNavDev = false;"
    ].join("\n")
  );
  const namespacedDocument = TextDocument.create(
    "file:///scores-table-filter-attributed.as",
    "openplanet-angelscript",
    1,
    [
      "namespace ScoresTableFilter {",
      '  [Setting hidden name="Enable filter field"]',
      "  bool S_Enable = true;",
      "}"
    ].join("\n")
  );
  const mainDocument = TextDocument.create(
    "file:///main-attributed.as",
    "openplanet-angelscript",
    1,
    [
      "void Main() {",
      "  S_ShowUiNavDev = false;",
      "  S_Enabled = UI::Checkbox(\"Enabled\", S_Enabled);",
      "  ScoresTableFilter::S_Enable = UI::Checkbox(\"Enable filter layer\", ScoresTableFilter::S_Enable);",
      "}"
    ].join("\n")
  );

  const settingsAnalysis = analyzeDocument(settingsDocument);
  const namespacedAnalysis = analyzeDocument(namespacedDocument);
  const mainAnalysis = analyzeDocument(mainDocument);
  const diagnostics = getSemanticDiagnostics(
    mainDocument,
    mainAnalysis,
    [mainAnalysis, settingsAnalysis, namespacedAnalysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 50
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" &&
        (diagnostic.message.includes("S_Enabled") ||
          diagnostic.message.includes("S_ShowUiNavDev") ||
          diagnostic.message.includes("S_Enable"))
    ),
    "Expected attributed globals from sibling files to resolve in symbol diagnostics."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        (diagnostic.range.start.line === 2 || diagnostic.range.start.line === 3)
    ),
    "Expected attributed bool globals to keep call argument typing for UI::Checkbox."
  );
}

function testCrossFileAttributedGlobalIdentifierResolutionWithLeadingComments(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const settingsDocument = TextDocument.create(
    "file:///settings-attributed-comments.as",
    "openplanet-angelscript",
    1,
    [
      '  [Setting hidden name="Player name selector (relative to frame-player-N)"]',
      "  // NOTE: In recent builds, there is often an unnamed wrapper frame between `#playername-name` and",
      "  // `#cmgame-player-name_frame-align`. The `*` matches that wrapper when present.",
      '  string S_PlayerNameSelector = "#playername-name/*/#cmgame-player-name_frame-align/#cmgame-player-name_label-name";'
    ].join("\n")
  );
  const mainDocument = TextDocument.create(
    "file:///main-attributed-comments.as",
    "openplanet-angelscript",
    1,
    ["void Main() {", "  string selector = S_PlayerNameSelector;", "}"].join(
      "\n"
    )
  );

  const settingsAnalysis = analyzeDocument(settingsDocument);
  const mainAnalysis = analyzeDocument(mainDocument);
  const diagnostics = getSemanticDiagnostics(
    mainDocument,
    mainAnalysis,
    [mainAnalysis, settingsAnalysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" &&
        diagnostic.message.includes("S_PlayerNameSelector")
    ),
    "Expected attributed globals with leading comments and selector-like string literals to resolve across files."
  );
}

function testCrossFileNamespacedGlobalArgumentTypeInference(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "UI");
  index.coreFunctionSignaturesByQualifiedName.set("UI::Checkbox", [
    "bool UI::Checkbox(const string&in label, bool value)"
  ]);

  const globalsDocument = TextDocument.create(
    "file:///scores-table-filter.as",
    "openplanet-angelscript",
    1,
    ["namespace ScoresTableFilter {", "  bool S_Enable = true;", "}"].join("\n")
  );
  const mainDocument = TextDocument.create(
    "file:///scores-main.as",
    "openplanet-angelscript",
    1,
    [
      "void Main() {",
      "  ScoresTableFilter::S_Enable = UI::Checkbox(\"Enable filter layer\", ScoresTableFilter::S_Enable);",
      "}"
    ].join("\n")
  );

  const globalsAnalysis = analyzeDocument(globalsDocument);
  const mainAnalysis = analyzeDocument(mainDocument);
  const diagnostics = getSemanticDiagnostics(
    mainDocument,
    mainAnalysis,
    [mainAnalysis, globalsAnalysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 1
    ),
    "Expected namespace-qualified global bool to satisfy UI::Checkbox second argument typing."
  );
}

function testNamespaceScopedGlobalShortNameArgumentTypeInference(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "UI");
  index.coreFunctionSignaturesByQualifiedName.set("UI::Checkbox", [
    "bool UI::Checkbox(const string&in label, bool value)"
  ]);

  const document = TextDocument.create(
    "file:///namespaced-short-global-checkbox.as",
    "openplanet-angelscript",
    1,
    [
      "namespace logging {",
      '  [Setting hidden name="Show Debug logs"] bool DEV_S_sDebug = false;',
      "  void RT_LOGs() {",
      '    DEV_S_sDebug = UI::Checkbox("Show Debug logs", DEV_S_sDebug);',
      "  }",
      "}"
    ].join("\n")
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" &&
        diagnostic.message.includes("DEV_S_sDebug")
    ),
    "Expected namespace-scoped globals to resolve by short name inside the same namespace."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 3
    ),
    "Expected namespace-scoped short-name bool global to satisfy UI::Checkbox argument typing."
  );
}

function testUsingKnownNamespaceDoesNotProduceUnknownIdentifier(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["using namespace UI;", "", "void Main() {", "  Text(\"ok\");", "}"].join(
    "\n"
  );
  const document = TextDocument.create(
    "file:///known-using-namespace.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" && diagnostic.range.start.line === 0
    ),
    "Expected known namespace in using directive to avoid unknown identifier diagnostics."
  );
}

function testNamespacedExpressionDoesNotProduceUnknownType(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  UI::AllowDoubleClick::break;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///namespaced-expression-not-declaration.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-type" &&
        diagnostic.message.includes("UI::")
    ),
    "Expected namespace chains to avoid bogus unknown-type diagnostics from declaration recovery."
  );
}

function testNamespacedEnumTypeAndValueRecognized(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "UI::InputBlocking");
  index.typeInfoByFullName.set("UI::InputBlocking", {
    fullName: "UI::InputBlocking",
    shortName: "InputBlocking",
    namespace: "UI",
    members: []
  });
  const inputBlockingTypes = index.typeFullNamesByShortName.get("InputBlocking") ?? [];
  if (!inputBlockingTypes.includes("UI::InputBlocking")) {
    inputBlockingTypes.push("UI::InputBlocking");
    index.typeFullNamesByShortName.set("InputBlocking", inputBlockingTypes);
  }
  addSymbol(index, "UI::InputBlocking", {
    label: "None",
    kind: CompletionItemKind.EnumMember,
    detail: "Enum value (InputBlocking)"
  });

  const source = [
    "void Main() {",
    "  UI::InputBlocking flags = UI::InputBlocking::None;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///namespaced-enum-known.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 30
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-type" &&
        diagnostic.message.includes("UI::InputBlocking")
    ),
    "Expected known namespaced enum type to avoid unknown-type diagnostics."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" &&
        diagnostic.message.includes("\"None\"")
    ),
    "Expected known namespaced enum member to avoid unknown-identifier diagnostics."
  );
}

function testUnknownTypeDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["void Main() {", "  UnknownType value;", "}"].join("\n");
  const document = TextDocument.create(
    "file:///unknown-type.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === "unknown-type"),
    "Expected unknown type diagnostic for UnknownType."
  );
}

function testArityMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["void Main() {", "  GetApp(1);", "}"].join("\n");
  const document = TextDocument.create(
    "file:///arity-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  const arityDiagnostic = diagnostics.find(
    (diagnostic) => diagnostic.code === "arity-mismatch"
  );
  assert.ok(arityDiagnostic, "Expected arity mismatch diagnostic for GetApp(1).");
  assert.strictEqual(
    arityDiagnostic?.severity,
    DiagnosticSeverity.Error,
    "Expected arity mismatch diagnostics to be severity Error."
  );
}

function testCallArgumentTypeMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "int Add(int value) {",
    "  return value;",
    "}",
    "",
    "void Main() {",
    "  Add(\"bad\");",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///call-argument-type-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  const mismatch = diagnostics.find(
    (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
  );
  assert.ok(
    mismatch,
    "Expected call-argument-type-mismatch diagnostic for Add(\"bad\")."
  );
}

function testCallArgumentConstHandleMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void TakeMutable(Game::CGamePlayground@ value) {}",
    "",
    "void Main() {",
    "  const Game::CGamePlayground@ value = null;",
    "  TakeMutable(value);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///call-argument-const-handle-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 4
    ),
    "Expected call-argument-type-mismatch when passing const handle to mutable handle parameter."
  );
}

function testCallArgumentTypeInferenceIgnoresInlineComments(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "IO");
  index.coreFunctionSignaturesByQualifiedName.set("IO::IndexFolder", [
    "string[]@ IO::IndexFolder(const string&in path, bool recursive)"
  ]);

  const source = [
    "void Main() {",
    '  string absFolder = "";',
    "  IO::IndexFolder(absFolder, /*recursive=*/false);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///call-argument-comments.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 30
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 2
    ),
    "Expected inline comments in call arguments to be ignored for overload typing."
  );
}

function testNamespacedEnumFlagValueAcceptedForIntArgument(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "UI");
  registerNamespacePath(index, "UI::WindowFlags");

  index.typeInfoByFullName.set("UI::WindowFlags", {
    fullName: "UI::WindowFlags",
    shortName: "WindowFlags",
    namespace: "UI",
    members: []
  });
  const windowFlagsCandidates = index.typeFullNamesByShortName.get("WindowFlags") ?? [];
  if (!windowFlagsCandidates.includes("UI::WindowFlags")) {
    windowFlagsCandidates.push("UI::WindowFlags");
    index.typeFullNamesByShortName.set("WindowFlags", windowFlagsCandidates);
  }

  addSymbol(index, "UI", {
    label: "WindowFlags",
    kind: CompletionItemKind.Enum,
    detail: "Openplanet enum"
  });
  addSymbol(index, "UI::WindowFlags", {
    label: "None",
    kind: CompletionItemKind.EnumMember,
    detail: "Enum value (WindowFlags)"
  });
  index.coreFunctionSignaturesByQualifiedName.set("UI::Begin", [
    "bool UI::Begin(const string&in title, bool&out open, int flags = UI::GetDefaultWindowFlags())"
  ]);

  const source = [
    "bool S_Enabled = true;",
    "void Main() {",
    "  if (UI::Begin(\"demo\", S_Enabled, UI::WindowFlags::None)) {",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///enum-flag-int-argument.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 2
    ),
    "Expected UI::WindowFlags::None to satisfy int flags argument in UI::Begin."
  );
}

function testConditionalInitializerDoesNotEmitBinaryMismatch(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  int line = 1;",
    '  string lineInfo = line >= 0 ? "ok" : "";',
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///conditional-initializer-binary-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "operator-type-mismatch" &&
        diagnostic.range.start.line === 2
    ),
    "Expected ternary initializer condition (line >= 0 ? ...) to avoid false operator-type-mismatch diagnostics."
  );
}

function testOverloadResolutionPrefersExactMatch(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "string Resolve(int value) {",
    "  return \"s\";",
    "}",
    "int Resolve(float value) {",
    "  return 1;",
    "}",
    "",
    "void Main() {",
    "  int bad = Resolve(1);",
    "  int ok = Resolve(1.0f);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///overload-resolution-exact-match.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 60
    }
  );

  const mismatches = diagnostics.filter(
    (diagnostic) => diagnostic.code === "assignment-type-mismatch"
  );
  assert.ok(
    mismatches.length >= 1,
    "Expected assignment-type-mismatch when int call selects string overload."
  );
}

function testTemplateSignatureInference(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.coreGlobalFunctionNames.add("SelectValue");
  index.coreFunctionSignatures.set("SelectValue", [
    "T SelectValue(T a, T b)"
  ]);

  const source = [
    "void Main() {",
    "  int good = SelectValue(1, 2);",
    "  int bad = SelectValue(\"a\", \"b\");",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///template-signature-inference.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 60
    }
  );

  const mismatches = diagnostics.filter(
    (diagnostic) => diagnostic.code === "assignment-type-mismatch"
  );
  assert.ok(
    mismatches.length >= 1,
    "Expected assignment-type-mismatch when template call infers string result."
  );
}

function testOperatorExpressionTypingInCall(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "int TakeInt(int value) {",
    "  return value;",
    "}",
    "",
    "void Main() {",
    "  TakeInt(1 + 2 * 3);",
    "  TakeInt(1 + \"x\");",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///operator-expression-typing-in-call.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 60
    }
  );

  const mismatch = diagnostics.find(
    (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
  );
  assert.ok(
    mismatch,
    "Expected call-argument-type-mismatch for TakeInt(1 + \"x\")."
  );
}

function testAssignmentTypeMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["void Main() {", "  int value = \"bad\";", "}"].join("\n");
  const document = TextDocument.create(
    "file:///assignment-type-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  const mismatch = diagnostics.find(
    (diagnostic) => diagnostic.code === "assignment-type-mismatch"
  );
  assert.ok(
    mismatch,
    "Expected assignment-type-mismatch diagnostic for int value = \"bad\"."
  );
}

function testJsonValueIndexAssignmentIsLValue(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.typeInfoByFullName.set("Json::Value", {
    fullName: "Json::Value",
    shortName: "Value",
    namespace: "Json",
    members: [
      {
        name: "opIndex",
        kind: "method",
        returnType: "Json::Value",
        args: "const string &in key"
      }
    ]
  });
  index.typeFullNamesByShortName.set("Value", ["Json::Value"]);

  const source = [
    "void Main() {",
    "  Json::Value j;",
    '  j[\"name\"] = \"Demo\";',
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///json-value-index-lvalue.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "assignment-type-mismatch" &&
        diagnostic.message.includes("Expression is not an l-value")
    ),
    "Expected Json::Value index assignment to be treated as an l-value."
  );
}

function testOperatorTypeMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  string value = \"ok\";",
    "  value -= 1;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///operator-type-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  const mismatch = diagnostics.find(
    (diagnostic) => diagnostic.code === "operator-type-mismatch"
  );
  assert.ok(
    mismatch,
    "Expected operator-type-mismatch diagnostic for string -= int."
  );
}

function testOperatorMethodAssignmentCompatibility(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.typeInfoByFullName.set("Math::Accum", {
    fullName: "Math::Accum",
    shortName: "Accum",
    namespace: "Math",
    members: [
      {
        name: "opAddAssign",
        kind: "method",
        returnType: "Math::Accum@",
        args: "int value"
      }
    ]
  });
  index.typeFullNamesByShortName.set("Accum", ["Math::Accum"]);

  const compatibility = evaluateAssignmentOperatorCompatibility(
    index,
    "+=",
    "Accum@",
    "int"
  );
  assert.strictEqual(
    compatibility,
    "compatible",
    "Expected operator overload opAddAssign to make '+=' assignment compatible."
  );
}

function testImplicitOperatorConversionCompatibility(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.typeInfoByFullName.set("Math::Meters", {
    fullName: "Math::Meters",
    shortName: "Meters",
    namespace: "Math",
    members: [
      {
        name: "opImplConv",
        kind: "method",
        returnType: "float",
        args: ""
      }
    ]
  });
  index.typeFullNamesByShortName.set("Meters", ["Math::Meters"]);

  const compatibility = evaluateAssignmentOperatorCompatibility(
    index,
    "=",
    "float",
    "Meters"
  );
  assert.strictEqual(
    compatibility,
    "compatible",
    "Expected implicit conversion operator opImplConv to satisfy assignment compatibility."
  );
}

function testIndexedOperatorTypeInference(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.typeInfoByFullName.set("Math::Grid", {
    fullName: "Math::Grid",
    shortName: "Grid",
    namespace: "Math",
    members: [
      {
        name: "opIndex",
        kind: "method",
        returnType: "float",
        args: "int index"
      }
    ]
  });
  index.typeFullNamesByShortName.set("Grid", ["Math::Grid"]);

  const context = {
    localVariableTypes: new Map<string, string>([
      ["grid", "Grid"],
      ["arr", "array<int>"]
    ]),
    localFunctionReturnTypes: new Map<string, string>(),
    functionSources: {
      workspaceFunctionSignaturesByName: new Map(),
      coreFunctionSignaturesByName: new Map(),
      qualifiedFunctionSignaturesByName: new Map()
    }
  };

  const indexedType = inferExpressionTypeFromText(index, "grid[0]", context);
  assert.strictEqual(
    indexedType,
    "float",
    "Expected opIndex(int) overload to infer the element type for index access."
  );

  const genericIndexedType = inferExpressionTypeFromText(index, "arr[1]", context);
  assert.strictEqual(
    genericIndexedType,
    "int",
    "Expected array<T> index access to infer template element type."
  );
}

function testMemberCallTypeMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.typeInfoByFullName.set("Math::MemberOps", {
    fullName: "Math::MemberOps",
    shortName: "MemberOps",
    namespace: "Math",
    members: [
      {
        name: "Scale",
        kind: "method",
        returnType: "void",
        args: "float value"
      }
    ]
  });
  index.typeFullNamesByShortName.set("MemberOps", ["Math::MemberOps"]);

  const source = [
    "void Main() {",
    "  MemberOps ops;",
    "  ops.Scale(\"bad\");",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///member-call-type-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  const mismatch = diagnostics.find(
    (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
  );
  assert.ok(
    mismatch,
    "Expected member calls with incompatible argument types to emit call-argument-type-mismatch."
  );
}

function testReturnTypeMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "int NotOk() {",
    "  return \"bad\";",
    "}",
    "",
    "void AlsoNotOk() {",
    "  return 1;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///return-type-mismatch.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );

  const mismatches = diagnostics.filter(
    (diagnostic) => diagnostic.code === "return-type-mismatch"
  );
  assert.ok(
    mismatches.length >= 2,
    "Expected return-type-mismatch diagnostics for non-void/void return violations."
  );
}

function testInvalidMemberCallDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  CGameCtnApp@ app = GetApp();",
    "  app.CurrentPlayground();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///invalid-member-call.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === "invalid-member-call"),
    "Expected invalid member call diagnostic when calling CurrentPlayground as a method."
  );
}

function testIntrinsicCastCallIgnored(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["void Main() {", "  int x = 1;", "  float y = float(x);", "}"].join(
    "\n"
  );
  const document = TextDocument.create(
    "file:///intrinsic-cast.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.message.includes("\"float\"")),
    "Expected float(x) cast-style call to avoid unknown symbol diagnostics."
  );
}

function testTypeConstructorCallIgnored(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "class DemoObject {",
    "  DemoObject() {}",
    "}",
    "void Main() {",
    "  DemoObject obj = DemoObject();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///constructor-call.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  index.typeInfoByFullName.set("DemoObject", {
    fullName: "DemoObject",
    shortName: "DemoObject",
    namespace: "",
    members: []
  });
  index.typeFullNamesByShortName.set("DemoObject", ["DemoObject"]);

  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some((diagnostic) =>
      diagnostic.message.includes("\"DemoObject\"")
    ),
    "Expected constructor-style type call to avoid unknown symbol diagnostics."
  );
}

function testAttributeIdentifierIgnored(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["[MyCustomAttribute(flag=true)]", "void Main() {}"].join("\n");
  const document = TextDocument.create(
    "file:///attribute-identifier.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some((diagnostic) =>
      diagnostic.message.includes("MyCustomAttribute")
    ),
    "Expected attribute identifiers to avoid unknown symbol diagnostics."
  );
}

function testBooleanKeywordOperatorsIgnored(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  bool a = true;",
    "  bool b = false;",
    "  bool c = (a and not b) or (a xor b);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///keyword-operators.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  const suspicious = diagnostics.filter((diagnostic) =>
    /"and"|"or"|"xor"|"not"/.test(diagnostic.message)
  );
  assert.strictEqual(
    suspicious.length,
    0,
    "Expected AngelScript boolean operator keywords to avoid unknown symbol diagnostics."
  );
}

function testImportCallableDeclarationIgnored(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "import void RemoteTick() from \"SyntaxDemo\";",
    "void Main() {",
    "  RemoteTick();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///import-callable-declaration.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some((diagnostic) =>
      diagnostic.message.includes("RemoteTick")
    ),
    "Expected imported callable declaration to avoid unknown symbol diagnostics."
  );
}

function testFuncdefCallableDeclarationIgnored(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "funcdef void DemoFunc(ref@);",
    "void Target(ref@ value) {}",
    "void Main() {",
    "  DemoFunc(Target);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///funcdef-callable-declaration.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.message.includes("DemoFunc")),
    "Expected funcdef declaration to avoid unknown symbol diagnostics."
  );
}

function testNamespacedCallablesNotSuggestedAsGlobal(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.coreFunctionSignatures.set("Rand", ["float Math::Rand(float min, float max)"]);
  index.coreFunctionSignaturesByQualifiedName.set("Math::Rand", [
    "float Math::Rand(float min, float max)"
  ]);

  const source = ["void Main() {", "  RemoteTick();", "}"].join("\n");
  const document = TextDocument.create(
    "file:///global-suggestion-scope.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  const diagnostic = diagnostics.find(
    (item) => item.code === "unknown-symbol" && item.message.includes("RemoteTick")
  );
  assert.ok(diagnostic, "Expected unknown symbol diagnostic for RemoteTick.");
  assert.ok(
    !diagnostic?.message.includes("Rand"),
    "Expected namespaced Math::Rand to not be suggested for global unknown symbols."
  );
}

function testScopeAwareRename(index: ReturnType<typeof createCompletionIndex>): void {
  const source = [
    "void A() {",
    "  int foo = 1;",
    "  foo = foo + 1;",
    "}",
    "",
    "void B() {",
    "  int foo = 2;",
    "  foo = foo + 1;",
    "}"
  ].join("\n");

  const document = TextDocument.create(
    "file:///rename-scope.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const edit = getRenameWorkspaceEditAtPosition(
    document,
    analysis,
    [analysis],
    2,
    3,
    "bar"
  );
  assert.ok(edit, "Expected rename edit for local variable foo.");

  const edits = edit?.changes?.[document.uri] ?? [];
  assert.strictEqual(
    edits.length,
    3,
    "Expected only declaration and references in function A to be renamed."
  );
  assert.ok(
    edits.every((textEdit) => textEdit.range.start.line <= 2),
    "Expected no edits inside function B."
  );
}

function testGlobalVariableReferences(
  _index: ReturnType<typeof createCompletionIndex>
): void {
  const globalsDocument = TextDocument.create(
    "file:///global-references-settings.as",
    "openplanet-angelscript",
    1,
    "bool S_Enabled = true;\n"
  );
  const mainDocument = TextDocument.create(
    "file:///global-references-main.as",
    "openplanet-angelscript",
    1,
    ["void Main() {", "  S_Enabled = false;", "  if (S_Enabled) {}", "}"].join(
      "\n"
    )
  );

  const globalsAnalysis = analyzeDocument(globalsDocument);
  const mainAnalysis = analyzeDocument(mainDocument);
  const references = getReferencesAtPosition(
    mainDocument,
    mainAnalysis,
    [mainAnalysis, globalsAnalysis],
    1,
    4,
    true
  );

  assert.strictEqual(
    references.length,
    3,
    "Expected global variable references to include declaration + two usages."
  );
  assert.ok(
    references.some(
      (location) =>
        location.uri === globalsDocument.uri && location.range.start.line === 0
    ),
    "Expected global variable declaration to be included in show references."
  );
  assert.ok(
    references.filter((location) => location.uri === mainDocument.uri).length === 2,
    "Expected both reads/writes in the current document to be included for global variable references."
  );
}

function testHoverLocalVariableAndWorkspaceFunctionDocs(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  MwId fromFunc = GetPlaygroundId();",
    "}",
    "",
    "// Comment explaining this function",
    "// very comment yesyes",
    "MwId GetPlaygroundId() {",
    "  CGameCtnApp@ app = GetApp();",
    "  return app.CurrentPlayground.Analyzer.Id;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///hover-local-and-func.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const variableHover = getHoverAtPosition(
    document,
    1,
    10,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 1, 10, [analysis]),
    analysis,
    [analysis]
  );
  assert.strictEqual(
    variableHover,
    null,
    "Expected no hover for plain local variable tokens."
  );

  const functionHover = getHoverAtPosition(
    document,
    1,
    24,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 1, 24, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(functionHover, "Expected workspace function hover for GetPlaygroundId.");
  const functionHoverText = hoverToText(functionHover);
  assert.ok(
    functionHoverText.includes("MwId GetPlaygroundId()"),
    "Expected function hover to include workspace function signature."
  );
  assert.ok(
    functionHoverText.includes("Documentation:"),
    "Expected function hover to include a documentation section."
  );
  assert.ok(
    functionHoverText.includes("L5: Comment explaining this function"),
    "Expected function hover docs to keep line-numbered comment lines."
  );
  assert.ok(
    functionHoverText.includes("L6: very comment yesyes"),
    "Expected function hover docs to preserve each comment line."
  );
}

function testBlockScopedShadowRename(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  int x = 0;",
    "  {",
    "    int x = 1;",
    "    x = x + 1;",
    "  }",
    "  x = x + 2;",
    "}"
  ].join("\n");

  const document = TextDocument.create(
    "file:///rename-shadow-block.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const innerEdit = getRenameWorkspaceEditAtPosition(
    document,
    analysis,
    [analysis],
    4,
    4,
    "innerX"
  );
  const innerEdits = innerEdit?.changes?.[document.uri] ?? [];
  assert.strictEqual(
    innerEdits.length,
    3,
    "Expected inner block rename to touch declaration + uses in that block only."
  );
  assert.ok(
    innerEdits.every((textEdit) => textEdit.range.start.line >= 3 && textEdit.range.start.line <= 4),
    "Expected inner block rename edits to stay inside the nested block."
  );

  const outerEdit = getRenameWorkspaceEditAtPosition(
    document,
    analysis,
    [analysis],
    6,
    2,
    "outerX"
  );
  const outerEdits = outerEdit?.changes?.[document.uri] ?? [];
  assert.strictEqual(
    outerEdits.length,
    3,
    "Expected outer rename to touch declaration + uses outside the nested shadow block."
  );
  assert.ok(
    outerEdits.every((textEdit) => textEdit.range.start.line !== 3 && textEdit.range.start.line !== 4),
    "Expected outer rename edits to exclude the nested block shadow variable."
  );
}

function testHoverOnMemberInReturnExpression(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "MwId GetPlaygroundId() {",
    "  CGameCtnApp@ app = GetApp();",
    "  return app.CurrentPlayground.Analyzer.Id;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///hover-return-member.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const hover = getHoverAtPosition(
    document,
    2,
    18,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 2, 18, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(
    hover,
    "Expected member hover in return expression chain for CurrentPlayground."
  );
  const hoverText = hoverToText(hover);
  assert.ok(
    hoverText.includes("CurrentPlayground"),
    "Expected return-expression member hover to include member signature."
  );
  assert.ok(
    hoverText.includes("https://next.openplanet.dev/Game/CGamePlayground"),
    "Expected CurrentPlayground member type to link to game docs."
  );
  assert.ok(
    hoverText.includes("https://next.openplanet.dev/Game/CGameCtnApp"),
    "Expected receiver type line to link to game docs."
  );
}

function testHoverTypeDocsLinks(index: ReturnType<typeof createCompletionIndex>): void {
  const source = [
    "void Main() {",
    "  MwId fromFunc = GetPlaygroundId();",
    "  int count = 0;",
    "  mat4 transform;",
    "  vec3 direction;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///hover-type-doc-links.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const mwIdHover = getHoverAtPosition(
    document,
    1,
    2,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 1, 2, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(mwIdHover, "Expected hover on MwId type.");
  const mwIdHoverText = hoverToText(mwIdHover);
  assert.ok(
    mwIdHoverText.includes("https://openplanet.dev/docs/api/global/MwId"),
    "Expected MwId hover to include Openplanet global docs link."
  );

  const mat4Hover = getHoverAtPosition(
    document,
    3,
    3,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 3, 3, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(mat4Hover, "Expected hover on mat4 type.");
  const mat4HoverText = hoverToText(mat4Hover);
  assert.ok(
    mat4HoverText.includes("https://openplanet.dev/docs/api/global/mat4"),
    "Expected mat4 hover to include Openplanet global docs link."
  );
  assert.ok(
    mat4HoverText.includes("https://openplanet.dev/docs/api/mat4"),
    "Expected mat4 hover to include Openplanet namespace docs link."
  );

  const vec3Hover = getHoverAtPosition(
    document,
    4,
    3,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 4, 3, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(vec3Hover, "Expected hover on vec3 type.");
  const vec3HoverText = hoverToText(vec3Hover);
  assert.ok(
    vec3HoverText.includes("https://openplanet.dev/docs/api/global/vec3"),
    "Expected vec3 hover to include Openplanet global docs link."
  );
  assert.ok(
    !vec3HoverText.includes("https://openplanet.dev/docs/api/vec3"),
    "Expected vec3 hover to not include Openplanet namespace docs link."
  );

  const intHover = getHoverAtPosition(
    document,
    2,
    3,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 2, 3, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(intHover, "Expected hover on int type.");
  const intHoverText = hoverToText(intHover);
  assert.ok(
    !intHoverText.includes("https://openplanet.dev/docs/api/global/int"),
    "Expected int hover to omit invalid Openplanet global docs link."
  );
}

function testHoverNamespaceEnumAndEnumMemberDocsLinks(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "UI");
  registerNamespacePath(index, "UI::WindowFlags");

  index.typeInfoByFullName.set("UI::WindowFlags", {
    fullName: "UI::WindowFlags",
    shortName: "WindowFlags",
    namespace: "UI",
    members: []
  });
  const windowFlagsCandidates = index.typeFullNamesByShortName.get("WindowFlags") ?? [];
  if (!windowFlagsCandidates.includes("UI::WindowFlags")) {
    windowFlagsCandidates.push("UI::WindowFlags");
    index.typeFullNamesByShortName.set("WindowFlags", windowFlagsCandidates);
  }

  addSymbol(index, "UI", {
    label: "WindowFlags",
    kind: CompletionItemKind.Enum,
    detail: "Openplanet enum"
  });
  addSymbol(index, "UI::WindowFlags", {
    label: "None",
    kind: CompletionItemKind.EnumMember,
    detail: "Enum value (WindowFlags)"
  });

  const source = [
    "void Main() {",
    "  auto flags = UI::WindowFlags::None;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///hover-namespace-enum-links.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const uiHover = getHoverAtPosition(
    document,
    1,
    15,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 1, 15, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(uiHover, "Expected namespace hover for UI in namespace chain.");
  const uiHoverText = hoverToText(uiHover);
  assert.ok(
    uiHoverText.includes("https://openplanet.dev/docs/api/UI"),
    "Expected namespace hover to include Openplanet namespace docs link."
  );

  const enumHover = getHoverAtPosition(
    document,
    1,
    20,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 1, 20, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(enumHover, "Expected enum type hover for UI::WindowFlags.");
  const enumHoverText = hoverToText(enumHover);
  assert.ok(
    enumHoverText.includes("https://openplanet.dev/docs/api/UI/WindowFlags"),
    "Expected enum type hover to include Openplanet enum docs link."
  );

  const enumValueHover = getHoverAtPosition(
    document,
    1,
    33,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 1, 33, [analysis]),
    analysis,
    [analysis]
  );
  assert.ok(enumValueHover, "Expected enum member hover for UI::WindowFlags::None.");
  const enumValueHoverText = hoverToText(enumValueHover);
  assert.ok(
    enumValueHoverText.includes("https://openplanet.dev/docs/api/UI/WindowFlags"),
    "Expected enum member hover to include parent enum docs link."
  );
  assert.ok(
    enumValueHoverText.includes("UI%3A%3AWindowFlags%3A%3ANone"),
    "Expected enum member hover to include text-fragment jump URL for UI::WindowFlags::None."
  );
}

function testHoverQualifiedCallableDocsLink(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "Meta");
  index.coreFunctionSignaturesByQualifiedName.set("Meta::ExecutingPlugin", [
    "Meta::Plugin@ Meta::ExecutingPlugin()"
  ]);

  const source = [
    "void Main() {",
    "  Meta::ExecutingPlugin();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///hover-qualified-callable-doc-link.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const hover = getHoverAtPosition(
    document,
    1,
    12,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 1, 12, [analysis]),
    analysis,
    [analysis]
  );

  assert.ok(hover, "Expected hover for qualified callable Meta::ExecutingPlugin().");
  const hoverText = hoverToText(hover);
  assert.ok(
    hoverText.includes("https://openplanet.dev/docs/api/Meta/ExecutingPlugin"),
    "Expected qualified callable hover to include docs link to the specific Openplanet function page."
  );
}

function testHoverTypedVariableDocsLink(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "Meta");
  index.typeInfoByFullName.set("Meta::Plugin", {
    fullName: "Meta::Plugin",
    shortName: "Plugin",
    namespace: "Meta",
    members: []
  });
  const pluginTypes = index.typeFullNamesByShortName.get("Plugin") ?? [];
  if (!pluginTypes.includes("Meta::Plugin")) {
    pluginTypes.push("Meta::Plugin");
    index.typeFullNamesByShortName.set("Plugin", pluginTypes);
  }

  const source = [
    "Meta::Plugin@ pluginMeta;",
    "void Main() {",
    "  pluginMeta;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///hover-typed-variable-doc-link.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const hover = getHoverAtPosition(
    document,
    2,
    4,
    index,
    getTypeResolutionContextAtPosition(document, analysis, 2, 4, [analysis]),
    analysis,
    [analysis]
  );

  assert.ok(hover, "Expected hover for typed variable pluginMeta.");
  const hoverText = hoverToText(hover);
  assert.ok(
    hoverText.includes("Meta::Plugin@ pluginMeta"),
    "Expected typed variable hover to include the variable declaration signature."
  );
  assert.ok(
    hoverText.includes("https://openplanet.dev/docs/api/Meta/Plugin"),
    "Expected typed variable hover to include Openplanet docs link for its resolved type."
  );
}

function testSignatureHelp(index: ReturnType<typeof createCompletionIndex>): void {
  const source = ["void Main() {", "  GetApp(", "}"].join("\n");
  const document = TextDocument.create(
    "file:///signature-help.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const signatureHelp = getSignatureHelpAtPosition(
    document,
    [analysis],
    index,
    1,
    9
  );

  assert.ok(signatureHelp, "Expected signature help for GetApp.");
  assert.ok(
    signatureHelp?.signatures.some((signature) => signature.label.includes("GetApp")),
    "Expected GetApp signature in signature help response."
  );
}

function testQualifiedSignatureHelp(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["void Main() {", "  UI::Text(", "}"].join("\n");
  const document = TextDocument.create(
    "file:///signature-help-qualified.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const signatureHelp = getSignatureHelpAtPosition(
    document,
    [analysis],
    index,
    1,
    11
  );

  assert.ok(signatureHelp, "Expected signature help for UI::Text.");
  assert.ok(
    signatureHelp?.signatures.every((signature) => signature.label.includes("UI::Text")),
    "Expected qualified call to only use qualified UI::Text signatures."
  );
}

function testSignatureHelpSelectsOverload(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = ["void Main() {", "  UI::Text(\"a\",", "}"].join("\n");
  const document = TextDocument.create(
    "file:///signature-help-overload-selection.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const signatureHelp = getSignatureHelpAtPosition(
    document,
    [analysis],
    index,
    1,
    15
  );

  assert.ok(signatureHelp, "Expected signature help for overloaded UI::Text.");
  assert.strictEqual(
    signatureHelp?.activeSignature,
    1,
    "Expected activeSignature to select the second overload at argument index 1."
  );
}

function testInlayHints(index: ReturnType<typeof createCompletionIndex>): void {
  const source = ["void Main() {", "  UI::Text(\"abc\", vec2(100, 20));", "}"].join("\n");
  const document = TextDocument.create(
    "file:///inlay-hints.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const hints = getInlayHints(
    document,
    analysis,
    index,
    {
      start: { line: 0, character: 0 },
      end: { line: 2, character: 0 }
    }
  );

  assert.ok(
    hints.some((hint) => String(hint.label).includes("text:")),
    "Expected inlay hints to include parameter name for first UI::Text argument."
  );
}

function testInlayHintsGlobalAutoStartnewType(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.coreGlobalFunctionNames.add("startnew");
  index.coreFunctionReturnTypes.set("startnew", "awaitable@");
  index.coreFunctionSignatures.set("startnew", [
    "awaitable@ startnew(CoroutineFunc@ func)"
  ]);

  const source = [
    "void Initialise() {}",
    "auto logging_initializer = startnew(Initialise);"
  ].join("\n");
  const document = TextDocument.create(
    "file:///inlay-global-auto-startnew.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const hints = getInlayHints(
    document,
    analysis,
    index,
    {
      start: { line: 0, character: 0 },
      end: { line: 2, character: 0 }
    }
  );

  assert.ok(
    hints.some((hint) => String(hint.label).includes(": awaitable@")),
    "Expected type inlay hint for top-level auto initializer from startnew(...) to resolve as awaitable@."
  );
}

function testDocumentHighlights(): void {
  const source = [
    "void Main() {",
    "  int localValue = 0;",
    "  localValue = localValue + 1;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///document-highlights.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const highlights = getDocumentHighlightsAtPosition(
    document,
    analysis,
    [analysis],
    2,
    3
  );

  assert.strictEqual(
    highlights.length,
    3,
    "Expected declaration and two local references to be highlighted."
  );
  assert.ok(
    highlights.some((highlight) => highlight.kind === DocumentHighlightKind.Write),
    "Expected declaration highlight to use write kind."
  );

}

function testWorkspaceSymbols(): void {
  const documentA = TextDocument.create(
    "file:///workspace-symbol-a.as",
    "openplanet-angelscript",
    1,
    ["class DemoType {}", "void AlphaTick() {}"].join("\n")
  );
  const documentB = TextDocument.create(
    "file:///workspace-symbol-b.as",
    "openplanet-angelscript",
    1,
    ["namespace Features {", "  class DemoWidget {}", "}", "void BetaTick() {}"].join("\n")
  );

  const analyses = [analyzeDocument(documentA), analyzeDocument(documentB)];
  const symbols = getWorkspaceSymbols(analyses, "demo");
  assert.ok(
    symbols.some(
      (symbol) => symbol.name === "DemoType" && symbol.kind === SymbolKind.Class
    ),
    "Expected workspace symbols to include class declarations."
  );
  assert.ok(
    symbols.some(
      (symbol) => symbol.name === "Features::DemoWidget" && symbol.kind === SymbolKind.Class
    ),
    "Expected workspace symbols to include namespaced class declarations."
  );
}

function testTypeDefinitionWorkspaceType(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "class DemoType {}",
    "void Main() {",
    "  DemoType value;",
    "  value = DemoType();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///type-definition-workspace-type.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const typeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    2,
    3,
    [analysis]
  );

  const location = getTypeDefinitionAtPosition(
    document,
    analysis,
    [analysis],
    index,
    2,
    3,
    typeContext
  );
  assert.ok(location, "Expected type definition location for DemoType local variable.");
  assert.strictEqual(
    location?.range.start.line,
    0,
    "Expected type definition to resolve to class declaration line."
  );
}

function testImplementationProvider(): void {
  const documentA = TextDocument.create(
    "file:///impl-a.as",
    "openplanet-angelscript",
    1,
    ["void Tick() {}", "void Main() {", "  Tick();", "}"].join("\n")
  );
  const documentB = TextDocument.create(
    "file:///impl-b.as",
    "openplanet-angelscript",
    1,
    "void Tick() {}\n"
  );

  const analysisA = analyzeDocument(documentA);
  const analysisB = analyzeDocument(documentB);
  const allAnalyses = [analysisA, analysisB];

  const fromCall = getImplementationAtPosition(
    documentA,
    analysisA,
    allAnalyses,
    2,
    4
  );
  assert.ok(fromCall, "Expected implementation results for Tick() call.");
  assert.strictEqual(
    fromCall?.length,
    2,
    "Expected both Tick implementations from call site."
  );

  const fromDeclaration = getImplementationAtPosition(
    documentA,
    analysisA,
    allAnalyses,
    0,
    6
  );
  assert.ok(fromDeclaration, "Expected implementation results for Tick declaration.");
  assert.strictEqual(
    fromDeclaration?.length,
    1,
    "Expected declaration-site implementation lookup to exclude active declaration."
  );
}

function testCodeLenses(): void {
  const document = TextDocument.create(
    "file:///code-lens.as",
    "openplanet-angelscript",
    1,
    [
      "void Tick() {}",
      "void RenderMenu() {}",
      "void Main() {",
      "  Tick();",
      "}"
    ].join("\n")
  );
  const analysis = analyzeDocument(document);
  const codeLenses = getCodeLensesForDocument(document, analysis, [analysis]);

  assert.strictEqual(
    codeLenses.length,
    1,
    "Expected code lenses to skip Openplanet runtime callback functions."
  );
  assert.ok(
    codeLenses.every(
      (lens) => lens.command?.command === "openplanetLanguageServer.showReferences"
    ),
    "Expected code lenses to use the extension show-references bridge command."
  );
  assert.ok(
    codeLenses.some((lens) => lens.command?.title === "1 reference"),
    "Expected called functions to count only call-site usages in code lens count."
  );
}

function testSemanticTokens(index: ReturnType<typeof createCompletionIndex>): void {
  const source = [
    "class DemoType {}",
    "void Main() {",
    "  DemoType demo;",
    "  demo.Name();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///semantic-tokens.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const tokens = buildDocumentSemanticTokens(
    document,
    analysis,
    [analysis],
    index
  );
  const decoded = decodeSemanticTokens(tokens.data);

  const classTypeIndex = semanticTokenTypes.indexOf("class");
  const functionTypeIndex = semanticTokenTypes.indexOf("function");
  const methodTypeIndex = semanticTokenTypes.indexOf("method");
  const variableTypeIndex = semanticTokenTypes.indexOf("variable");

  assert.ok(
    decoded.some((token) => token.tokenType === classTypeIndex),
    "Expected semantic tokens to include class declarations."
  );
  assert.ok(
    decoded.some((token) => token.tokenType === functionTypeIndex),
    "Expected semantic tokens to include function identifiers."
  );
  assert.ok(
    decoded.some((token) => token.tokenType === methodTypeIndex),
    "Expected semantic tokens to include method access identifiers."
  );
  assert.ok(
    decoded.some((token) => token.tokenType === variableTypeIndex),
    "Expected semantic tokens to include variable identifiers."
  );
}

function testSemanticTokensMinimalModePreservesSyntaxPrimary(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "class DemoType {}",
    "void Main() {",
    "  DemoType demo;",
    "  demo.Name();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///semantic-tokens-minimal.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const tokens = buildDocumentSemanticTokens(
    document,
    analysis,
    [analysis],
    index,
    undefined,
    { mode: "minimal" }
  );
  const decoded = decodeSemanticTokens(tokens.data);

  const functionTypeIndex = semanticTokenTypes.indexOf("function");
  const methodTypeIndex = semanticTokenTypes.indexOf("method");
  const classTypeIndex = semanticTokenTypes.indexOf("class");
  const variableTypeIndex = semanticTokenTypes.indexOf("variable");

  assert.ok(
    !decoded.some((token) => token.tokenType === functionTypeIndex),
    "Expected minimal semantic token mode to avoid function-token overrides."
  );
  assert.ok(
    !decoded.some((token) => token.tokenType === methodTypeIndex),
    "Expected minimal semantic token mode to avoid method-token overrides."
  );
  assert.ok(
    !decoded.some((token) => token.tokenType === classTypeIndex),
    "Expected minimal semantic token mode to avoid class-token overrides."
  );
  assert.ok(
    decoded.some((token) => token.tokenType === variableTypeIndex),
    "Expected minimal semantic token mode to still emit variable tokens for scope-aware locals."
  );
}

function testTypeHierarchy(index: ReturnType<typeof createCompletionIndex>): void {
  const source = [
    "class BaseType {}",
    "class ChildType : BaseType {}",
    "void Main() {",
    "  ChildType c;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///type-hierarchy.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const allAnalyses = [analysis];

  const prepared = prepareTypeHierarchyAtPosition(
    document,
    analysis,
    allAnalyses,
    index,
    3,
    4
  );
  assert.ok(prepared.length > 0, "Expected type hierarchy prepare result for ChildType.");

  const supertypes = getTypeHierarchySupertypes(prepared[0], allAnalyses, index);
  assert.ok(
    supertypes.some((item) => item.name === "BaseType"),
    "Expected ChildType to resolve BaseType as supertype."
  );

  const basePrepared = prepareTypeHierarchyAtPosition(
    document,
    analysis,
    allAnalyses,
    index,
    0,
    7
  );
  assert.ok(basePrepared.length > 0, "Expected type hierarchy prepare result for BaseType.");

  const subtypes = getTypeHierarchySubtypes(basePrepared[0], allAnalyses, index);
  assert.ok(
    subtypes.some((item) => item.name === "ChildType"),
    "Expected BaseType to resolve ChildType as subtype."
  );
}

function testColorProvider(): void {
  const source = "vec3 c = vec3(0.25, 0.5, 0.75);\n";
  const document = TextDocument.create(
    "file:///colors.as",
    "openplanet-angelscript",
    1,
    source
  );
  const colorInfos = getDocumentColors(document);
  assert.strictEqual(
    colorInfos.length,
    1,
    "Expected color provider to detect vec3 constructor colors."
  );

  const presentations = getColorPresentations(
    document,
    colorInfos[0].color,
    colorInfos[0].range
  );
  assert.ok(
    presentations.length > 0,
    "Expected color provider to return color presentations."
  );
}

function testConstructorAndDestructorParsing(): void {
  const source = [
    "class DemoObject {",
    "  DemoObject() {}",
    "  ~DemoObject() {}",
    "  void Tick() {}",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///symbols-ctors.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const names = analysis.documentSymbols.map((symbol) => symbol.name);
  assert.ok(names.includes("DemoObject"), "Expected constructor symbol in outline.");
  assert.ok(names.includes("~DemoObject"), "Expected destructor symbol in outline.");
  assert.ok(names.includes("Tick"), "Expected regular method symbol in outline.");
}

function testDocumentSymbols(): void {
  const source = ["void A() { }", "void B() { }"].join("\n");
  const document = TextDocument.create(
    "file:///symbols.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  assert.strictEqual(
    analysis.documentSymbols.length,
    2,
    "Expected function symbols in document outline."
  );
  assert.strictEqual(analysis.documentSymbols[0].name, "A");
  assert.strictEqual(analysis.documentSymbols[1].name, "B");
}

function testGrammarCallableDeclarations(): void {
  const source = [
    "funcdef void DemoFunc(ref@ value);",
    'import MwId RemoteTick(int count, const string &in label = "x") from "SyntaxDemo";'
  ].join("\n");
  const parsed = parseGrammarPipeline(source);
  const callableDeclarations = parsed.program.declarations.filter(
    (declaration): declaration is GrammarCallableDeclarationNode =>
      declaration.kind === "callable-declaration"
  );

  assert.strictEqual(
    parsed.errors.length,
    0,
    "Expected callable declaration grammar parsing to avoid parser errors."
  );
  assert.strictEqual(
    callableDeclarations.length,
    2,
    "Expected parser to capture funcdef and import callable declarations."
  );

  const funcdef = callableDeclarations.find(
    (declaration) => declaration.declarationKind === "funcdef"
  );
  assert.ok(funcdef, "Expected funcdef declaration node.");
  assert.strictEqual(funcdef?.name, "DemoFunc");
  assert.strictEqual(funcdef?.returnTypeText, "void");
  assert.strictEqual(funcdef?.parameters.length, 1);
  assert.strictEqual(funcdef?.parameters[0]?.name, "value");

  const imported = callableDeclarations.find(
    (declaration) => declaration.declarationKind === "import"
  );
  assert.ok(imported, "Expected import declaration node.");
  assert.strictEqual(imported?.name, "RemoteTick");
  assert.strictEqual(imported?.returnTypeText, "MwId");
  assert.strictEqual(imported?.moduleName, "SyntaxDemo");
  assert.strictEqual(imported?.parameters.length, 2);
  assert.ok(
    imported?.parameters[1]?.optional,
    "Expected import declaration parser to track optional parameters."
  );

  assert.strictEqual(
    source.slice(imported?.moduleNameStart ?? 0, imported?.moduleNameEnd ?? 0),
    "SyntaxDemo",
    "Expected import module offsets to point at the unquoted module name text."
  );
}

function testGrammarCallableNestedTemplateParameterParsing(): void {
  const source =
    "funcdef void Accept(array<array<int>>@ values, int count = 0);";
  const parsed = parseGrammarPipeline(source);
  const callable = parsed.program.declarations.find(
    (declaration): declaration is GrammarCallableDeclarationNode =>
      declaration.kind === "callable-declaration"
  );

  assert.ok(callable, "Expected callable declaration in parsed program.");
  assert.strictEqual(
    parsed.errors.length,
    0,
    "Expected nested template callable declaration to parse without errors."
  );
  assert.strictEqual(
    callable?.parameters.length,
    2,
    "Expected nested-template parameter list to split correctly at top-level commas."
  );
  assert.strictEqual(callable?.parameters[0]?.name, "values");
  assert.strictEqual(callable?.parameters[1]?.name, "count");
  assert.ok(callable?.parameters[1]?.optional);
}

function testSyntaxUnclosedDelimiterDiagnostic(): void {
  const source = ["void Main() {", "  GetApp(", "}"].join("\n");
  const document = TextDocument.create(
    "file:///syntax-unclosed-delimiter.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSyntaxDiagnostics(document, analysis);

  const delimiterDiagnostic = diagnostics.find(
    (diagnostic) => diagnostic.code === "syntax-unclosed-delimiter"
  );
  assert.ok(delimiterDiagnostic, "Expected syntax diagnostic for unclosed delimiter.");
  assert.strictEqual(
    delimiterDiagnostic?.severity,
    DiagnosticSeverity.Error,
    "Expected syntax diagnostics to be severity Error."
  );
}

function testUnterminatedStringDiagnostic(): void {
  const source = ["void Main() {", "  string s = \"oops;", "}"].join("\n");
  const document = TextDocument.create(
    "file:///syntax-unterminated-string.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSyntaxDiagnostics(document, analysis);

  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === "syntax-unterminated-string"),
    "Expected syntax diagnostic for unterminated string literal."
  );
}

function testUnparsableStatementDiagnostic(): void {
  const source = ["void Main() {", "  GetApp()", "}"].join("\n");
  const document = TextDocument.create(
    "file:///syntax-unparsable-statement.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSyntaxDiagnostics(document, analysis);

  const parseDiagnostic = diagnostics.find(
    (diagnostic) => diagnostic.code === "syntax-unparsable-statement"
  );
  assert.ok(
    parseDiagnostic,
    "Expected syntax diagnostic for a statement that is missing a semicolon."
  );
  assert.strictEqual(
    parseDiagnostic?.severity,
    DiagnosticSeverity.Error,
    "Expected unparsable statement diagnostics to be severity Error."
  );
  assert.strictEqual(
    parseDiagnostic?.range.start.line,
    1,
    "Expected missing-semicolon diagnostic to anchor to the faulty statement line."
  );
}

function testValidElseDoesNotProduceParserDiagnostic(): void {
  const source = [
    "void Main(bool ok) {",
    "  if (ok) {",
    "    return;",
    "  } else {",
    "    return;",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///syntax-valid-else.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSyntaxDiagnostics(document, analysis);

  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.code === "syntax-unparsable-statement"),
    "Expected valid if/else statement to avoid unparsable statement diagnostics."
  );
}

function testValidForeachDoesNotProduceParserDiagnostic(): void {
  const source = [
    "void Main() {",
    "  array<int> values = {1, 2, 3};",
    "  foreach (int value in values) {",
    "    print(value);",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///syntax-valid-foreach.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSyntaxDiagnostics(document, analysis);

  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.code === "syntax-unparsable-statement"),
    "Expected valid foreach statement to avoid unparsable statement diagnostics."
  );
}

function testUnclosedParenDoesNotCascadeToMissingBlockCloseDiagnostic(): void {
  const source = [
    "void Main() {",
    "  UI::",
    "  retu",
    "  GetApp(",
    "}",
    "",
    "void Secondary() {",
    "  int value = 1;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///syntax-unclosed-paren-no-cascade.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSyntaxDiagnostics(document, analysis);

  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === "syntax-unclosed-delimiter"),
    "Expected primary unclosed-delimiter syntax diagnostic for GetApp(."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "syntax-unparsable-statement" &&
        diagnostic.message.includes('Expected "}" to close block.')
    ),
    "Expected parser recovery to avoid bogus missing-block-close diagnostics after unclosed '('."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "syntax-unparsable-statement" &&
        diagnostic.message.includes('Expected ";" to terminate statement.')
    ),
    "Expected unclosed delimiter statements to avoid broad missing-semicolon parser diagnostics."
  );
}

function testVariableDeclarationParsingMultiDeclarator(): void {
  const source = [
    "void Main() {",
    "  int first = 1, second = 2;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///locals-multi-declarator.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const localNames = analysis.functions[0]?.localDeclarations.map((declaration) => declaration.name) ?? [];

  assert.ok(
    localNames.includes("first"),
    "Expected first declarator to be parsed as a local declaration."
  );
  assert.ok(
    localNames.includes("second"),
    "Expected second declarator in a comma declaration list to be parsed as a local declaration."
  );
}

function testEnumCompletionCommitsWithNamespaceChain(): void {
  const index = createCompletionIndex();
  addSymbol(index, "UI", {
    label: "InputBlocking",
    kind: CompletionItemKind.Enum,
    detail: "Openplanet enum"
  });
  addSymbol(index, "UI", {
    label: "Texture",
    kind: CompletionItemKind.Class,
    detail: "Openplanet class"
  });

  const items = collectCompletionItems(index, "UI");
  const enumItem = items.find(
    (item) =>
      item.kind === CompletionItemKind.Enum && item.label === "InputBlocking"
  );
  assert.ok(enumItem, "Expected enum completion item for InputBlocking.");
  assert.strictEqual(
    enumItem?.insertText,
    "InputBlocking::",
    "Expected enum completion commit to include trailing namespace scope operator."
  );
  assert.strictEqual(
    enumItem?.command?.command,
    "editor.action.triggerSuggest",
    "Expected enum completion commit to retrigger suggestions for enum members."
  );

  const classItem = items.find(
    (item) => item.kind === CompletionItemKind.Class && item.label === "Texture"
  );
  assert.ok(classItem, "Expected class completion item for Texture.");
  assert.notStrictEqual(
    classItem?.insertText,
    "Texture::",
    "Expected non-enum completion commits to keep default insert behavior."
  );
}

function testEnumMembersOnlyShownInsideEnumScope(): void {
  const index = createCompletionIndex();
  addSymbol(index, "UI", {
    label: "SelectableFlags",
    kind: CompletionItemKind.Enum,
    detail: "Openplanet enum"
  });
  addSymbol(index, "UI::SelectableFlags", {
    label: "SpanAllColumns",
    kind: CompletionItemKind.EnumMember,
    detail: "Enum value (SelectableFlags)"
  });

  const parentNamespaceItems = collectCompletionItems(index, "UI");
  assert.ok(
    !parentNamespaceItems.some(
      (item) =>
        item.kind === CompletionItemKind.EnumMember &&
        item.label === "SpanAllColumns"
    ),
    "Expected enum members to be hidden in parent namespace completion lists."
  );

  const enumScopeItems = collectCompletionItems(index, "UI::SelectableFlags");
  assert.ok(
    enumScopeItems.some(
      (item) =>
        item.kind === CompletionItemKind.EnumMember &&
        item.label === "SpanAllColumns"
    ),
    "Expected enum members to appear when completing inside enum scope."
  );
}

function testFunctionCompletionShowsReturnTypeWithoutDuplicateName(): void {
  const index = createCompletionIndex();
  addSymbol(index, "UI", {
    label: "AlignTextToFramePadding",
    kind: CompletionItemKind.Function,
    detail: "void AlignTextToFramePadding()"
  });

  addSymbol(index, "UI", {
    label: "AlignTextToFramePadding",
    kind: CompletionItemKind.Function,
    detail: "void AlignTextToFramePadding(float offset)"
  });

  const items = collectCompletionItems(index, "UI").filter(
    (item) =>
      item.kind === CompletionItemKind.Function &&
      item.label === "AlignTextToFramePadding"
  );
  assert.strictEqual(
    items.length,
    1,
    "Expected function overload completion entries to be merged by name."
  );

  const item = items[0];
  assert.strictEqual(
    item.detail,
    "void (+1 overload)",
    "Expected merged function completion detail to include return type and overload count."
  );
  assert.strictEqual(
    item.labelDetails?.description,
    "void",
    "Expected function completion inline description to display return type."
  );

  const data = item.data as Record<string, unknown> | undefined;
  const overloads = Array.isArray(data?.overloads) ? data?.overloads : [];
  assert.strictEqual(
    overloads.length,
    2,
    "Expected merged function completion to carry all overload signatures."
  );
  assert.strictEqual(
    item.command?.command,
    "editor.action.triggerParameterHints",
    "Expected merged function completion to trigger parameter hints after insert."
  );
}

function testFunctionCompletionResolveShowsSignatureName(): void {
  const index = createCompletionIndex();
  addSymbol(index, "UI", {
    label: "AlignTextToFramePadding",
    kind: CompletionItemKind.Function,
    detail: "void AlignTextToFramePadding()"
  });
  addSymbol(index, "UI", {
    label: "AlignTextToFramePadding",
    kind: CompletionItemKind.Function,
    detail: "void AlignTextToFramePadding(float offset)"
  });

  const compact = collectCompletionItems(index, "UI").find(
    (item) =>
      item.kind === CompletionItemKind.Function &&
      item.label === "AlignTextToFramePadding"
  );
  assert.ok(compact, "Expected compact function completion item.");
  assert.strictEqual(
    compact?.detail,
    "void (+1 overload)",
    "Expected compact completion detail to stay concise."
  );

  const resolved = resolveCompletionItemDetails(compact!);
  assert.ok(
    (resolved.detail ?? "").includes("AlignTextToFramePadding("),
    "Expected resolved completion detail to include full function signature with name."
  );
}

function testFunctionParameterDefaultInitializerListParsing(): void {
  const source = [
    "void Main(array<int>@ values = {1, 2, 3}) {",
    "  int count = values.Length;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///function-parameter-default-initializer-list.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const parameters = analysis.functions[0]?.parameters ?? [];

  assert.strictEqual(
    parameters.length,
    1,
    "Expected parser to keep a single parameter when default value includes brace-list commas."
  );
  assert.strictEqual(
    parameters[0]?.name,
    "values",
    "Expected parser to preserve parameter name for default initializer-list parameter."
  );
}

function testIncludeDirectiveDoesNotPolluteFunctionReturnType(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    '#include "LocalInclude.as"',
    '#include "DoesNotExist_ShowMissingInclude.as"',
    "",
    "void Main() {",
    "  return;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///include-directive-return-type.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  assert.strictEqual(
    analysis.functions[0]?.name,
    "Main",
    "Expected function parsing to still find Main() after preprocessor include lines."
  );
  assert.strictEqual(
    analysis.functions[0]?.returnType,
    "void",
    "Expected include directives to not be folded into function return type text."
  );

  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 40
    }
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-type" &&
        diagnostic.range.start.line === 3 &&
        diagnostic.range.start.character <= 5
    ),
    "Expected Main() declaration to avoid bogus unknown-type diagnostics from include text leakage."
  );
}

function testBindingDuplicateDeclarationDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  int x = 1;",
    "  int x = 2;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///binding-duplicate-local.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === "binding-duplicate-declaration"),
    "Expected duplicate local declarations to emit binding-duplicate-declaration diagnostics."
  );
}

function testBindingUseBeforeDeclarationDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  value = 1;",
    "  int value = 2;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///binding-use-before.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === "binding-use-before-declaration"),
    "Expected use-before-declaration to emit binding-use-before-declaration diagnostics."
  );
}

function testBindingNestedShadowingDoesNotDuplicate(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  int x = 1;",
    "  {",
    "    int x = 2;",
    "    x = 3;",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///binding-shadowing-ok.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.code === "binding-duplicate-declaration"),
    "Expected nested-scope shadowing to avoid duplicate declaration diagnostics."
  );
}

function testBindingConstDeclarationWithCastInitializerDoesNotDuplicate(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "int NthIndexOf(const string &in str, const string &in value, int n) {",
    "  if (n <= 0) return -1;",
    "  const int len = int(str.Length);",
    "  int vlen = int(value.Length);",
    "  if (vlen <= 0 || vlen > len) return -1;",
    "  int found = 0;",
    "  for (int i = 0; i <= len - vlen; ++i) {",
    "    if (str.SubStr(i, vlen) == value) {",
    "      found++;",
    "      if (found == n) return i;",
    "    }",
    "  }",
    "  return -1;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///binding-const-cast-local.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    [analysis],
    index,
    {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      maxSymbolDiagnostics: 20
    }
  );

  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.code === "binding-duplicate-declaration"),
    "Expected const local declarations with cast-style initializers to avoid duplicate declaration diagnostics."
  );
}

function testSemanticTokenDelta(): void {
  const previous = {
    resultId: "1",
    data: [0, 0, 3, 1, 0, 0, 4, 4, 2, 0]
  };
  const unchanged = {
    resultId: "2",
    data: [0, 0, 3, 1, 0, 0, 4, 4, 2, 0]
  };
  const changed = {
    resultId: "3",
    data: [0, 0, 3, 1, 0, 1, 0, 6, 2, 0]
  };

  const noEditDelta = buildSemanticTokenDelta(previous, unchanged);
  assert.strictEqual(
    noEditDelta.edits.length,
    0,
    "Expected empty semantic-token delta when token data is unchanged."
  );
  assert.strictEqual(
    noEditDelta.resultId,
    "2",
    "Expected semantic-token delta to carry latest result id."
  );

  const replacementDelta = buildSemanticTokenDelta(previous, changed);
  assert.strictEqual(
    replacementDelta.edits.length,
    1,
    "Expected semantic-token delta to include one replacement edit when data changes."
  );
  assert.strictEqual(
    replacementDelta.edits[0].start,
    0,
    "Expected semantic-token replacement edit to start at index 0."
  );
  assert.strictEqual(
    replacementDelta.edits[0].deleteCount,
    previous.data.length,
    "Expected semantic-token replacement edit to remove previous token stream."
  );
  assert.deepStrictEqual(
    replacementDelta.edits[0].data,
    changed.data,
    "Expected semantic-token replacement edit to include new token stream."
  );
}

async function testImportValidationFolderOnlyWarning(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-import-folder-"));
  try {
    const pluginFolder = path.join(pluginsRoot, "SyntaxDemo");
    await fs.mkdir(pluginFolder, { recursive: true });
    await fs.writeFile(
      path.join(pluginFolder, "Exports.as"),
      "void RemoteTick() {}\n",
      "utf8"
    );

    const source = 'import void RemoteTick() from "SyntaxDemo";\nvoid Main() { RemoteTick(); }';
    const document = TextDocument.create(
      "file:///import-folder-only.as",
      "openplanet-angelscript",
      1,
      source
    );
    const analysis = analyzeDocument(document);
    const diagnostics = await getImportDiagnostics(
      document,
      analysis,
      [],
      {
        enable: true,
        pluginRoots: [pluginsRoot],
        maxDiagnostics: 20
      },
      ""
    );

    assert.ok(
      diagnostics.some((diagnostic) => diagnostic.code === "import-source-folder-only"),
      "Expected folder-only import source warning when only a folder target exists."
    );
    assert.ok(
      !diagnostics.some((diagnostic) => diagnostic.code === "import-function-not-found"),
      "Expected imported function lookup to find RemoteTick inside folder source."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function testImportValidationFolderAndOpNoSourceWarning(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-import-mixed-"));
  try {
    const pluginFolder = path.join(pluginsRoot, "SyntaxDemo");
    await fs.mkdir(pluginFolder, { recursive: true });
    await fs.writeFile(
      path.join(pluginFolder, "Exports.as"),
      "void RemoteTick() {}\n",
      "utf8"
    );

    await writeStoredOpArchive(path.join(pluginsRoot, "SyntaxDemo.op"), [
      {
        name: "Exports.as",
        content: "void RemoteTick() {}\n"
      }
    ]);

    const source = 'import void RemoteTick() from "SyntaxDemo";\nvoid Main() { RemoteTick(); }';
    const document = TextDocument.create(
      "file:///import-folder-and-op.as",
      "openplanet-angelscript",
      1,
      source
    );
    const analysis = analyzeDocument(document);
    const diagnostics = await getImportDiagnostics(
      document,
      analysis,
      [],
      {
        enable: true,
        pluginRoots: [pluginsRoot],
        maxDiagnostics: 20
      },
      ""
    );

    assert.ok(
      !diagnostics.some((diagnostic) => diagnostic.code === "import-source-folder-only"),
      "Expected no folder-only warning when both folder and .op matches exist."
    );
    assert.ok(
      !diagnostics.some((diagnostic) => diagnostic.code === "import-function-not-found"),
      "Expected imported function lookup to find RemoteTick in mixed source targets."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function testImportValidationOpOnlyNoSourceWarning(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-import-op-only-"));
  try {
    await writeStoredOpArchive(path.join(pluginsRoot, "SyntaxDemo.op"), [
      {
        name: "Exports.as",
        content: "void RemoteTick() {}\n"
      }
    ]);

    const source = 'import void RemoteTick() from "SyntaxDemo";\nvoid Main() { RemoteTick(); }';
    const document = TextDocument.create(
      "file:///import-op-only.as",
      "openplanet-angelscript",
      1,
      source
    );
    const analysis = analyzeDocument(document);
    const diagnostics = await getImportDiagnostics(
      document,
      analysis,
      [],
      {
        enable: true,
        pluginRoots: [pluginsRoot],
        maxDiagnostics: 20
      },
      ""
    );

    assert.ok(
      !diagnostics.some((diagnostic) => diagnostic.code === "import-source-folder-only"),
      "Expected no folder-only warning when only a .op target exists."
    );
    assert.ok(
      !diagnostics.some((diagnostic) => diagnostic.code === "import-function-not-found"),
      "Expected imported function lookup to find RemoteTick inside .op source."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function testImportValidationMissingFunction(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-import-missing-func-"));
  try {
    await writeStoredOpArchive(path.join(pluginsRoot, "SyntaxDemo.op"), [
      {
        name: "Exports.as",
        content: "void OtherFunc() {}\n"
      }
    ]);

    const source = 'import void RemoteTick() from "SyntaxDemo";\nvoid Main() { RemoteTick(); }';
    const document = TextDocument.create(
      "file:///import-missing-function.as",
      "openplanet-angelscript",
      1,
      source
    );
    const analysis = analyzeDocument(document);
    const diagnostics = await getImportDiagnostics(
      document,
      analysis,
      [],
      {
        enable: true,
        pluginRoots: [pluginsRoot],
        maxDiagnostics: 20
      },
      ""
    );

    assert.ok(
      diagnostics.some((diagnostic) => diagnostic.code === "import-function-not-found"),
      "Expected missing imported function diagnostic when no source target provides it."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function testImportValidationMissingFunctionQuickFix(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-import-fix-name-"));
  try {
    await writeStoredOpArchive(path.join(pluginsRoot, "SyntaxDemo.op"), [
      {
        name: "Exports.as",
        content: "void RemoteTick() {}\n"
      }
    ]);

    const source = 'import void RemoteTock() from "SyntaxDemo";\nvoid Main() { RemoteTock(); }';
    const document = TextDocument.create(
      "file:///import-missing-function-quickfix.as",
      "openplanet-angelscript",
      1,
      source
    );
    const analysis = analyzeDocument(document);
    const diagnostics = await getImportDiagnostics(
      document,
      analysis,
      [],
      {
        enable: true,
        pluginRoots: [pluginsRoot],
        maxDiagnostics: 20
      },
      ""
    );

    const missingDiagnostic = diagnostics.find(
      (diagnostic) => diagnostic.code === "import-function-not-found"
    );
    assert.ok(
      missingDiagnostic,
      "Expected missing imported function diagnostic when import callable name is misspelled."
    );
    assert.ok(
      missingDiagnostic?.message.includes("RemoteTick"),
      "Expected import missing-function diagnostic to include closest callable suggestion."
    );

    const quickFixes = buildQuickFixCodeActions(document.uri, diagnostics);
    assert.ok(
      quickFixes.some((action) => action.title.includes("RemoteTick")),
      "Expected import missing-function diagnostic to offer name replacement quick fix."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function testImportValidationSignatureMismatchQuickFix(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-import-fix-signature-")
  );
  try {
    await writeStoredOpArchive(path.join(pluginsRoot, "SyntaxDemo.op"), [
      {
        name: "Exports.as",
        content: "int RemoteTick(int value) { return value; }\n"
      }
    ]);

    const source = 'import void RemoteTick() from "SyntaxDemo";\nvoid Main() { RemoteTick(); }';
    const document = TextDocument.create(
      "file:///import-signature-mismatch-quickfix.as",
      "openplanet-angelscript",
      1,
      source
    );
    const analysis = analyzeDocument(document);
    const diagnostics = await getImportDiagnostics(
      document,
      analysis,
      [],
      {
        enable: true,
        pluginRoots: [pluginsRoot],
        maxDiagnostics: 20
      },
      ""
    );

    const mismatchDiagnostic = diagnostics.find(
      (diagnostic) => diagnostic.code === "import-function-signature-mismatch"
    );
    assert.ok(
      mismatchDiagnostic,
      "Expected import signature mismatch diagnostic when return/parameter types differ."
    );
    assert.strictEqual(
      mismatchDiagnostic?.severity,
      DiagnosticSeverity.Error,
      "Expected import signature mismatch diagnostics to be severity Error."
    );

    const quickFixes = buildQuickFixCodeActions(document.uri, diagnostics);
    const signatureQuickFix = quickFixes.find((action) =>
      action.title.includes("Use signature:")
    );
    assert.ok(
      signatureQuickFix,
      "Expected import signature mismatch diagnostics to offer signature replacement quick fix."
    );
    const edits = signatureQuickFix?.edit?.changes?.[document.uri] ?? [];
    assert.ok(
      edits.some((edit) =>
        edit.newText.includes('import int RemoteTick(int value) from "SyntaxDemo";')
      ),
      "Expected signature quick fix to update the import declaration to an exported callable signature."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function testMissingIncludeDiagnosticSeverity(): Promise<void> {
  const source = '#include "DefinitelyMissing_File.as"\nvoid Main() {}';
  const document = TextDocument.create(
    "file:///missing-include-severity.as",
    "openplanet-angelscript",
    1,
    source
  );
  const diagnostics = await getIncludeDiagnostics(document, [], [], 10);
  const includeDiagnostic = diagnostics.find(
    (diagnostic) => diagnostic.code === "missing-include"
  );

  assert.ok(includeDiagnostic, "Expected missing include diagnostic.");
  assert.strictEqual(
    includeDiagnostic?.severity,
    DiagnosticSeverity.Error,
    "Expected missing include diagnostics to be severity Error."
  );
}

async function testCompletionIndexGameProfileSelection(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-symbol-games-"));
  try {
    await fs.mkdir(path.join(baseUserFolder, "OpenplanetNext"), { recursive: true });
    await fs.mkdir(path.join(baseUserFolder, "OpenplanetTurbo"), { recursive: true });
    await fs.mkdir(path.join(baseUserFolder, "Openplanet4"), { recursive: true });

    await writeCoreJsonWithGlobalFunction(
      path.join(baseUserFolder, "OpenplanetNext", "OpenplanetCore.json"),
      "NextOnlyFunction"
    );
    await writeCoreJsonWithGlobalFunction(
      path.join(baseUserFolder, "OpenplanetTurbo", "OpenplanetCore.json"),
      "TurboOnlyFunction"
    );
    await writeCoreJsonWithGlobalFunction(
      path.join(baseUserFolder, "Openplanet4", "OpenplanetCore.json"),
      "Openplanet4OnlyFunction"
    );

    const nextOnlySettings = createDefaultSettings();
    nextOnlySettings.symbols.baseUserFolderPath = baseUserFolder;
    nextOnlySettings.symbols.enableGameJson = false;
    nextOnlySettings.symbols.enableHeader = false;
    nextOnlySettings.symbols.trackmania2020.enabled = true;
    nextOnlySettings.symbols.turbo.enabled = false;
    nextOnlySettings.symbols.openplanet4.enabled = false;

    const nextOnlyIndex = await buildCompletionIndex(nextOnlySettings, createNoopLogger());
    assert.ok(
      nextOnlyIndex.coreGlobalFunctionNames.has("NextOnlyFunction"),
      "Expected Trackmania 2020 profile to load OpenplanetNext core symbols."
    );
    assert.ok(
      !nextOnlyIndex.coreGlobalFunctionNames.has("TurboOnlyFunction"),
      "Expected disabled Turbo profile to skip OpenplanetTurbo core symbols."
    );
    assert.ok(
      !nextOnlyIndex.coreGlobalFunctionNames.has("Openplanet4OnlyFunction"),
      "Expected disabled Openplanet4 profile to skip Openplanet4 core symbols."
    );

    const allProfilesSettings = createDefaultSettings();
    allProfilesSettings.symbols.baseUserFolderPath = baseUserFolder;
    allProfilesSettings.symbols.enableGameJson = false;
    allProfilesSettings.symbols.enableHeader = false;
    allProfilesSettings.symbols.trackmania2020.enabled = true;
    allProfilesSettings.symbols.turbo.enabled = true;
    allProfilesSettings.symbols.openplanet4.enabled = true;

    const allProfilesIndex = await buildCompletionIndex(allProfilesSettings, createNoopLogger());
    assert.ok(
      allProfilesIndex.coreGlobalFunctionNames.has("NextOnlyFunction"),
      "Expected OpenplanetNext symbols to remain loaded when multiple profiles are enabled."
    );
    assert.ok(
      allProfilesIndex.coreGlobalFunctionNames.has("TurboOnlyFunction"),
      "Expected Turbo profile enablement to load OpenplanetTurbo core symbols."
    );
    assert.ok(
      allProfilesIndex.coreGlobalFunctionNames.has("Openplanet4OnlyFunction"),
      "Expected Openplanet4 profile enablement to load Openplanet4 core symbols."
    );
  } finally {
    await fs.rm(baseUserFolder, { recursive: true, force: true });
  }
}

async function testCompletionIndexGameProfilePathOverrides(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-symbol-overrides-")
  );
  try {
    const customCorePath = path.join(baseUserFolder, "custom-core.json");
    await writeCoreJsonWithGlobalFunction(customCorePath, "TurboOverrideFunction");

    const settings = createDefaultSettings();
    settings.symbols.baseUserFolderPath = baseUserFolder;
    settings.symbols.enableGameJson = false;
    settings.symbols.enableHeader = false;
    settings.symbols.trackmania2020.enabled = false;
    settings.symbols.turbo.enabled = true;
    settings.symbols.openplanet4.enabled = false;
    settings.symbols.turbo.openplanetCoreJsonPath = customCorePath;

    const index = await buildCompletionIndex(settings, createNoopLogger());
    assert.ok(
      index.coreGlobalFunctionNames.has("TurboOverrideFunction"),
      "Expected turbo.openplanetCoreJsonPath override to be used for core symbol loading."
    );
  } finally {
    await fs.rm(baseUserFolder, { recursive: true, force: true });
  }
}

async function testCompletionIndexSynthesizesNamespaceAccessorProperties(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-symbol-accessor-props-")
  );

  try {
    const nextPath = path.join(baseUserFolder, "OpenplanetNext");
    await fs.mkdir(nextPath, { recursive: true });

    const payload = {
      functions: [
        {
          name: "get_Now",
          ns: "Time",
          decl: "uint64 Time::get_Now()",
          desc: "Gets now"
        }
      ],
      props: [],
      funcdefs: [],
      enums: [],
      classes: []
    };
    await fs.writeFile(
      path.join(nextPath, "OpenplanetCore.json"),
      `${JSON.stringify(payload, null, 2)}\n`,
      "utf8"
    );

    const settings = createDefaultSettings();
    settings.symbols.baseUserFolderPath = baseUserFolder;
    settings.symbols.enableGameJson = false;
    settings.symbols.enableHeader = false;
    settings.symbols.trackmania2020.enabled = true;
    settings.symbols.turbo.enabled = false;
    settings.symbols.openplanet4.enabled = false;

    const index = await buildCompletionIndex(settings, createNoopLogger());
    const timeBucket = index.namespaceBuckets.get("Time");
    assert.ok(timeBucket, "Expected Time namespace bucket to be loaded from core symbols.");
    assert.ok(
      timeBucket?.items.some((item) => item.label === "Now"),
      "Expected get_Now accessor to synthesize Time::Now property symbol."
    );

    const document = TextDocument.create(
      "file:///time-now-accessor-property.as",
      "openplanet-angelscript",
      1,
      ["void Main() {", "  int64 earliestMs = Time::Now;", "}"].join("\n")
    );
    const analysis = analyzeDocument(document);
    const diagnostics = getSemanticDiagnostics(
      document,
      analysis,
      [analysis],
      index,
      {
        enableUnknownSymbols: true,
        enableCaseMismatch: true,
        maxSymbolDiagnostics: 20
      }
    );

    assert.ok(
      !diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "unknown-identifier" &&
          diagnostic.message.includes("\"Now\"")
      ),
      "Expected Time::Now to resolve from get_Now accessor metadata."
    );
  } finally {
    await fs.rm(baseUserFolder, { recursive: true, force: true });
  }
}

async function testWorkspaceAnalysisIndexSkipsOpenDocuments(): Promise<void> {
  const workspaceRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-workspace-")
  );

  try {
    const nestedDirectory = path.join(workspaceRoot, "nested");
    const ignoredDirectory = path.join(workspaceRoot, "node_modules");
    await fs.mkdir(nestedDirectory, { recursive: true });
    await fs.mkdir(ignoredDirectory, { recursive: true });

    const openFilePath = path.join(workspaceRoot, "OpenFile.as");
    const nestedFilePath = path.join(nestedDirectory, "NestedFile.as");
    const ignoredFilePath = path.join(ignoredDirectory, "Ignored.as");

    await fs.writeFile(openFilePath, "void OpenTick() {}\n", "utf8");
    await fs.writeFile(nestedFilePath, "void NestedTick() {}\n", "utf8");
    await fs.writeFile(ignoredFilePath, "void IgnoredTick() {}\n", "utf8");

    const openUri = URI.file(openFilePath).toString();
    const nestedUri = URI.file(nestedFilePath).toString();
    const ignoredUri = URI.file(ignoredFilePath).toString();

    const index = await buildWorkspaceAnalysisIndex(
      [workspaceRoot],
      new Set<string>([openUri]),
      {
        info: () => {},
        warn: () => {},
        error: () => {}
      }
    );

    assert.ok(
      !index.has(openUri),
      "Expected workspace index to skip open document URIs."
    );
    assert.ok(
      index.has(nestedUri),
      "Expected workspace index to include nested AngelScript files."
    );
    assert.ok(
      !index.has(ignoredUri),
      "Expected workspace index to skip node_modules files."
    );

    const nestedAnalysis = index.get(nestedUri);
    assert.ok(nestedAnalysis, "Expected nested workspace analysis entry.");
    assert.ok(
      nestedAnalysis?.functions.some((fn) => fn.name === "NestedTick"),
      "Expected workspace analysis to parse function declarations."
    );
  } finally {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  }
}

async function testWorkspaceAnalysisIndexLoadsInfoTomlDependencies(): Promise<void> {
  const workspaceRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-workspace-deps-")
  );
  const pluginsRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-plugin-root-")
  );

  try {
    await fs.writeFile(
      path.join(workspaceRoot, "info.toml"),
      ['[script]', 'dependencies = ["DepPlugin"]'].join("\n"),
      "utf8"
    );

    const dependencyFolder = path.join(pluginsRoot, "DepPlugin");
    await fs.mkdir(dependencyFolder, { recursive: true });
    const dependencyFilePath = path.join(dependencyFolder, "Exports.as");
    await fs.writeFile(dependencyFilePath, "void DepTick() {}\n", "utf8");
    await fs.writeFile(
      path.join(dependencyFolder, "info.toml"),
      ['[script]', 'optional_dependencies = ["UnusedPlugin"]'].join("\n"),
      "utf8"
    );

    const index = await buildWorkspaceAnalysisIndex(
      [workspaceRoot],
      new Set<string>(),
      {
        info: () => {},
        warn: () => {},
        error: () => {}
      },
      {
        dependencies: {
          enableInfoTomlDependencies: true,
          includeOptionalDependencies: true,
          pluginRoots: [pluginsRoot],
          symbolsBaseUserFolderPath: "",
          maxDepth: 2,
          maxFiles: 200
        }
      }
    );

    const dependencyUri = URI.file(dependencyFilePath).toString();
    assert.ok(
      index.has(dependencyUri),
      "Expected workspace analysis index to include .as files from info.toml dependencies."
    );
    const dependencyAnalysis = index.get(dependencyUri);
    assert.ok(dependencyAnalysis, "Expected dependency analysis to be available.");
    assert.ok(
      dependencyAnalysis?.functions.some((fn) => fn.name === "DepTick"),
      "Expected dependency analysis to parse callable declarations from dependency plugin files."
    );
  } finally {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function writeStoredOpArchive(
  filePath: string,
  entries: Array<{ name: string; content: string }>
): Promise<void> {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const fileName = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
    const data = Buffer.from(entry.content, "utf8");

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(0, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, fileName, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(0, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localOffset, 42);

    centralParts.push(centralHeader, fileName);

    localOffset += localHeader.length + fileName.length + data.length;
  }

  const localData = Buffer.concat(localParts);
  const centralData = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralData.length, 12);
  eocd.writeUInt32LE(localData.length, 16);
  eocd.writeUInt16LE(0, 20);

  const archive = Buffer.concat([localData, centralData, eocd]);
  await fs.writeFile(filePath, archive);
}

function decodeSemanticTokens(data: number[]): Array<{
  line: number;
  character: number;
  length: number;
  tokenType: number;
  tokenModifiers: number;
}> {
  const decoded: Array<{
    line: number;
    character: number;
    length: number;
    tokenType: number;
    tokenModifiers: number;
  }> = [];

  let line = 0;
  let character = 0;
  for (let i = 0; i + 4 < data.length; i += 5) {
    const deltaLine = data[i];
    const deltaStart = data[i + 1];
    const length = data[i + 2];
    const tokenType = data[i + 3];
    const tokenModifiers = data[i + 4];

    if (deltaLine > 0) {
      line += deltaLine;
      character = deltaStart;
    } else {
      character += deltaStart;
    }

    decoded.push({
      line,
      character,
      length,
      tokenType,
      tokenModifiers
    });
  }

  return decoded;
}

function createNoopLogger(): {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
} {
  return {
    info: () => {},
    warn: () => {},
    error: () => {}
  };
}

async function writeCoreJsonWithGlobalFunction(
  filePath: string,
  functionName: string
): Promise<void> {
  const payload = {
    functions: [
      {
        name: functionName,
        ns: "",
        decl: `void ${functionName}()`,
        desc: `${functionName} docs`
      }
    ],
    props: [],
    funcdefs: [],
    enums: [],
    classes: []
  };
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function hoverToText(hover: NonNullable<ReturnType<typeof getHoverAtPosition>>): string {
  if (typeof hover.contents === "string") {
    return hover.contents;
  }

  if (Array.isArray(hover.contents)) {
    return hover.contents
      .map((entry) => (typeof entry === "string" ? entry : entry.value))
      .join("\n");
  }

  return hover.contents.value;
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
