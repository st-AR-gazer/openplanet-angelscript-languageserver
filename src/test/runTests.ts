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
import {
  analyzeDocument,
  collectFunctionReturnTypes,
  getTypeResolutionContextAtPosition,
  type DocumentAnalysis,
  type FunctionDeclaration
} from "../server/analysis";
import {
  addSymbol,
  collectDirectiveCommentSnippetItems,
  collectCompletionItems,
  collectPreprocessorCompletionItems,
  collectWorkspaceFunctionCompletionItems,
  createCompletionIndex,
  dedupeCompletionItems,
  getActiveNamespaceAtPosition,
  registerNamespacePath,
  resolveCompletionItemDetails
} from "../server/completions";
import {
  buildQuickFixCodeActions,
  collectWorkspaceTypeCatalog,
  createWorkspaceTypeAwareIndex,
  getSemanticDiagnostics,
  getSyntaxDiagnostics
} from "../server/diagnostics";
import { collectPreprocessorDiagnostics } from "../server/preprocessor";
import { getHoverAtPosition } from "../server/hover";
import { getInlayHints } from "../server/inlayHints";
import { getIncludeDiagnostics } from "../server/includes";
import { getImportDiagnostics } from "../server/imports";
import { getInlineValuesForRange } from "../server/inlineValues";
import { getCodeLensesForDocument } from "../server/codeLenses";
import { getDocumentColors, getColorPresentations } from "../server/colors";
import {
  collectMemberCompletionItems,
  getDotCompletionContext,
  registerCoreClassTypeInfo,
  registerSemanticTypeInfo,
  tryResolveExpressionTypeFullName
} from "../server/members";
import {
  evaluateAssignmentOperatorCompatibility,
  inferExpressionTypeFromText
} from "../server/compilerPipeline";
import {
  getDeclarationAtPosition,
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
import { filterDiagnosticsForIgnoredRegions } from "../server/ignoredRegions";
import { createDefaultSettings } from "../server/settings";
import { buildCompletionIndex } from "../server/symbols";
import {
  getTypeHierarchySubtypes,
  getTypeHierarchySupertypes,
  prepareTypeHierarchyAtPosition
} from "../server/typeHierarchy";
import {
  buildWorkspaceAnalysisIndex,
  collectDependencyAngelScriptUrisForPlugin
} from "../server/workspaceIndex";
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
  testDanglingMemberAccessDiagnostic();
  testFloatLiteralDoesNotProduceDanglingMemberDiagnostic();
  testValidElseDoesNotProduceParserDiagnostic();
  testValidForeachDoesNotProduceParserDiagnostic();
  testUnclosedParenDoesNotCascadeToMissingBlockCloseDiagnostic();
  testUnknownPreprocessorDefinesAreReported();
  await testInfoTomlDefinesSuppressUnknownPreprocessorDiagnostics();
  testVariableDeclarationParsingMultiDeclarator();
  testFunctionParameterDefaultInitializerListParsing();
  testEnumCompletionCommitsWithNamespaceChain();
  testEnumMembersOnlyShownInsideEnumScope();
  testWorkspaceEnumMembersAppearInsideEnumScope(index);
  testFunctionCompletionShowsReturnTypeWithoutDuplicateName();
  testFunctionCompletionResolveShowsSignatureName();
  testWorkspaceGlobalFunctionCompletion(index);
  testCompletionSortsCallablesBeforeValues();
  testMemberCompletionSortsMethodsBeforeFields();
  testPreprocessorDirectiveCompletions();
  testPreprocessorDefineCompletions();
  testDirectiveCommentSnippetCompletions();
  testDirectiveCommentSnippetCompletionsPreserveIndentation();
  testGrammarCallableDeclarations();
  testGrammarCallableNestedTemplateParameterParsing();
  testIncludeDirectiveDoesNotPolluteFunctionReturnType(index);
  testTypeResolution(index);
  testCallResultMemberCompletion(index);
  testAssignedLocalMemberCompletion(index);
  testQualifiedCallResultMemberCompletion(index);
  testWorkspaceQualifiedCallResultMemberCompletion(index);
  testGlobalDeclarationTypeInference(index);
  testCoreAccessorPropertiesFromCoreMethods(index);
  testCoreMethodDefaultArgumentsPreserved();
  testWorkspaceMethodDefaultArgumentsPreserved(index);
  testBindingDuplicateDeclarationDiagnostic(index);
  testBindingUseBeforeDeclarationDiagnostic(index);
  testBindingNestedShadowingDoesNotDuplicate(index);
  testBindingConstDeclarationWithCastInitializerDoesNotDuplicate(index);
  testBindingForInitializerRedeclarationDoesNotDuplicate(index);
  testSwitchCaseLabelsDoNotCreateFakeLocalDeclarations(index);
  testCaseMismatchDiagnostic(index);
  testUnknownMemberDiagnostic(index);
  testUnknownIdentifierDiagnostic(index);
  testHexNumericLiteralsDoNotEmitUnknownIdentifier(index);
  testGlobalAutoDeclarationNotUnknownIdentifier(index);
  testUnknownNamespaceQualifierPrefixDiagnostic(index);
  testLogicalOrDoesNotMarkIdentifierAsCallable(index);
  testCrossFileGlobalIdentifierResolution(index);
  testCrossFileAttributedGlobalIdentifierResolution(index);
  testCrossFileAttributedGlobalIdentifierResolutionWithLeadingComments(index);
  testCrossFileNamespacedGlobalArgumentTypeInference(index);
  testNamespaceScopedGlobalShortNameArgumentTypeInference(index);
  testUsingKnownNamespaceDoesNotProduceUnknownIdentifier(index);
  testUsingNamespaceAllowsQualifiedCoreFunctionByShortName();
  testUsingNamespaceDoesNotLeakAcrossSiblingNamespacesForDiagnostics();
  testNestedNamespaceCanCallParentNamespaceFunctionUnqualified(index);
  testNamespacedExpressionDoesNotProduceUnknownType(index);
  testNamespacedEnumTypeAndValueRecognized(index);
  testUnknownTypeDiagnostic(index);
  testArityMismatchDiagnostic(index);
  testCallArgumentTypeMismatchDiagnostic(index);
  testGenericRefUserdataCallArgumentsAreAccepted(index);
  testPrimitiveConstructorCastsInCallArguments(index);
  testPrimitiveConstructorRejectsIncompatibleArguments(index);
  testWorkspaceEnumPrimitiveConstructorAndIntArgument(index);
  testSemanticRegistryEnumWithoutEnumMemberBucket(index);
  testWStringImplicitStringConversionForCalls(index);
  testOutArrayReferenceArgumentsAreAccepted(index);
  testHandleOutReferenceArgumentsAreAccepted(index);
  testCallArgumentConstHandleMismatchDiagnostic(index);
  testCallArgumentTypeInferenceIgnoresInlineComments(index);
  testNamespacedEnumFlagValueAcceptedForIntArgument(index);
  testConditionalInitializerDoesNotEmitBinaryMismatch(index);
  testNamespacedOverloadDefaultsDoNotCauseAmbiguousUnqualifiedCall(index);
  testOverloadResolutionPrefersExactMatch(index);
  testSiblingNamespaceImportsDoNotCauseAmbiguousUnqualifiedCall(index);
  testDuplicateImportAndImplementationDoNotCauseAmbiguousCall(index);
  testDependencyImportCallableVisibleAcrossPluginRoots(index);
  testEquivalentOutHandleSpacingDoesNotCauseAmbiguousCall(index);
  testUnknownUppercaseConcreteTypesDoNotCauseOverloadAmbiguity(index);
  testTemplateSignatureInference(index);
  testOperatorExpressionTypingInCall(index);
  testAssignmentTypeMismatchDiagnostic(index);
  testJsonValueIndexAssignmentIsLValue(index);
  testJsonValueAddAcceptsPrimitiveFactoryConversion();
  testDictionaryIndexAssignmentIsLValue(index);
  testArrayIndexAssignmentIsLValueComplex(index);
  testOperatorTypeMismatchDiagnostic(index);
  testOperatorMethodAssignmentCompatibility(index);
  testImplicitOperatorConversionCompatibility(index);
  testUserDefinedConversionCycleDoesNotOverflow(index);
  testIndexedOperatorTypeInference(index);
  testIndexedReceiverMemberResolution(index);
  testMemberCallTypeMismatchDiagnostic(index);
  testReturnTypeMismatchDiagnostic(index);
  testInvalidMemberCallDiagnostic(index);
  testIntrinsicCastCallIgnored(index);
  testTypeConstructorCallIgnored(index);
  testAttributeIdentifierIgnored(index);
  testBooleanKeywordOperatorsIgnored(index);
  testImportCallableDeclarationIgnored(index);
  testNamespacedImportDeclarationsAreNotDuplicate(index);
  testFuncdefCallableDeclarationIgnored(index);
  testIgnoredFenceSuppressesDiagnostics(index);
  await testGenericDirectiveSuppressesSpecificImportDiagnostic();
  await testLanguageServerDirectiveSuppressesNextLineOnlyImportDiagnostic();
  testMissingDependencyGuardSuppressesInactiveBranchDiagnostics();
  testKnownDependencyGuardKeepsActiveBranchDiagnostics();
  testNamespacedCallablesNotSuggestedAsGlobal(index);
  testCaseEnumLabelDefinitionResolves();
  testScopeAwareRename(index);
  testGlobalVariableReferences(index);
  testNamespacedFunctionReferences();
  testFunctionReferencesIncludeCallbackValueUsage();
  testUsingNamespaceDoesNotLeakAcrossSiblingNamespacesForNavigation();
  testBlockScopedShadowRename(index);
  testHoverLocalVariableAndWorkspaceFunctionDocs(index);
  testHoverOnMemberInReturnExpression(index);
  testHoverTypeDocsLinks(index);
  testHoverNamespaceEnumAndEnumMemberDocsLinks(index);
  testHoverQualifiedCallableDocsLink(index);
  testHoverTypedVariableDocsLink(index);
  testAutoIndexedMemberCallAndHover(index);
  testSignatureHelp(index);
  testQualifiedSignatureHelp(index);
  testSignatureHelpSelectsOverload(index);
  testWorkspaceGlobalFunctionSignatureHelp(index);
  testInlayHints(index);
  testNamespacedWorkspaceInlayHints(index);
  testInlayHintsGlobalAutoStartnewType(index);
  testCompletionShortcuts(index);
  testInlineValueCategoryToggles();
  testDocumentHighlights();
  testWorkspaceSymbols();
  testTypeDefinitionWorkspaceType(index);
  testImplementationProvider();
  testCodeLenses();
  testCodeLensesSkipsAttributedFunctions();
  testSemanticTokens(index);
  testSemanticTokensMinimalModePreservesSyntaxPrimary(index);
  testSemanticTokenDelta();
  testTypeHierarchy(index);
  testColorProvider();
  testConstructorAndDestructorParsing();
  testDocumentSymbols();
  testNamespaceDocumentSymbols();
  await testImportValidationFolderOnlyWarning();
  await testImportValidationFolderJunctionWarningAndLookup();
  await testImportValidationFolderAndOpNoSourceWarning();
  await testImportValidationOpOnlyNoSourceWarning();
  await testImportValidationMissingFunction();
  await testImportValidationMissingFunctionQuickFix();
  await testImportValidationSignatureMismatchQuickFix();
  await testWorkspaceAnalysisIndexSkipsOpenDocuments();
  await testWorkspaceAnalysisIndexLoadsInfoTomlDependencies();
  await testWorkspaceAnalysisIndexLoadsInfoTomlDependenciesFromJunction();
  await testDependencyScopedTypesSuppressUnknownTypeDiagnostics();
  await testCompletionIndexGameProfileSelection();
  await testCompletionIndexGameProfilePathOverrides();
  await testCompletionIndexSynthesizesNamespaceAccessorProperties();
  await testCompletionIndexStoresQualifiedFunctionReturnTypes();
  await testCompletionIndexSeedsAlwaysAvailableNamespaces();
  await testCompletionIndexPreservesCoreClassDefaultArguments();
  await testCompletionIndexRegistersHeaderEnumsForPrimitiveCasts();
  await testCompletionIndexRegistersHeaderInheritanceForUnqualifiedGameTypes();
  await testCompletionIndexIncludesBuiltinIcons();
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

function testCallResultMemberCompletion(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  GetApp().",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///call-result-member-completion.as",
    "openplanet-angelscript",
    1,
    source
  );

  const analysis = analyzeDocument(document);
  const dotContext = getDotCompletionContext(document, 1, 11);
  assert.ok(dotContext, "Expected dot completion context for GetApp().");

  const context = getTypeResolutionContextAtPosition(
    document,
    analysis,
    1,
    11,
    [analysis]
  );
  const resolvedType = tryResolveExpressionTypeFullName(
    index,
    dotContext!.receiverText,
    context
  );

  assert.strictEqual(
    resolvedType,
    "Game::CGameCtnApp",
    "Expected GetApp() to resolve to the richer game namespace type for member completion."
  );

  const memberLabels = collectMemberCompletionItems(
    index,
    resolvedType!,
    ""
  ).map((item) => item.label);
  assert.ok(
    memberLabels.includes("CurrentPlayground"),
    "Expected GetApp(). completion to include CGameCtnApp members."
  );
}

function testAssignedLocalMemberCompletion(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerSemanticTypeInfo(index, {
    fullName: "string",
    shortName: "string",
    namespace: "",
    kind: "class",
    members: [
      {
        name: "IndexOf",
        kind: "method",
        returnType: "int",
        args: "const string &in value, uint start = 0"
      }
    ]
  });

  const completionLine = "  index = str.";
  const source = [
    "void Main() {",
    "  string str;",
    completionLine,
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///assigned-local-member-completion.as",
    "openplanet-angelscript",
    1,
    source
  );

  const analysis = analyzeDocument(document);
  const dotContext = getDotCompletionContext(document, 2, completionLine.length);
  assert.ok(dotContext, "Expected dot completion context for assigned local receiver.");
  assert.strictEqual(
    dotContext?.receiverText,
    "str",
    "Expected dot completion receiver extraction to ignore assignment prefixes."
  );

  const context = getTypeResolutionContextAtPosition(
    document,
    analysis,
    2,
    completionLine.length,
    [analysis]
  );
  const resolvedType = tryResolveExpressionTypeFullName(
    index,
    dotContext!.receiverText,
    context
  );

  assert.strictEqual(
    resolvedType,
    "string",
    "Expected assigned local receiver completion to resolve the local variable type."
  );

  const memberLabels = collectMemberCompletionItems(
    index,
    resolvedType!,
    ""
  ).map((item) => item.label);
  assert.ok(
    memberLabels.includes("IndexOf"),
    "Expected assigned local receiver completion to include string members."
  );
}

function testQualifiedCallResultMemberCompletion(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "Meta");
  registerSemanticTypeInfo(index, {
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
        name: "Version",
        kind: "property",
        type: "string"
      }
    ]
  });
  index.coreFunctionSignaturesByQualifiedName.set("Meta::ExecutingPlugin", [
    "Meta::Plugin@ Meta::ExecutingPlugin()"
  ]);

  const completionLine = "  Meta::ExecutingPlugin().";
  const source = [
    "void Main() {",
    completionLine,
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///qualified-call-result-member-completion.as",
    "openplanet-angelscript",
    1,
    source
  );

  const analysis = analyzeDocument(document);
  const dotContext = getDotCompletionContext(document, 1, completionLine.length);
  assert.ok(dotContext, "Expected dot completion context for Meta::ExecutingPlugin().");

  const context = getTypeResolutionContextAtPosition(
    document,
    analysis,
    1,
    completionLine.length,
    [analysis]
  );
  const resolvedType = tryResolveExpressionTypeFullName(
    index,
    dotContext!.receiverText,
    context
  );

  assert.strictEqual(
    resolvedType,
    "Meta::Plugin",
    "Expected Meta::ExecutingPlugin() to resolve via qualified core function return type."
  );

  const memberLabels = collectMemberCompletionItems(
    index,
    resolvedType!,
    ""
  ).map((item) => item.label);
  assert.ok(
    memberLabels.includes("Name"),
    "Expected Meta::ExecutingPlugin(). completion to include Meta::Plugin members."
  );
}

function testWorkspaceQualifiedCallResultMemberCompletion(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "Meta");
  registerSemanticTypeInfo(index, {
    fullName: "Meta::Plugin",
    shortName: "Plugin",
    namespace: "Meta",
    members: [
      {
        name: "Name",
        kind: "property",
        type: "string"
      }
    ]
  });

  const completionLine = "  LocalPlugin::Current().";
  const source = [
    "namespace LocalPlugin {",
    "  Meta::Plugin@ Current() {",
    "    return null;",
    "  }",
    "}",
    "void Main() {",
    completionLine,
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///workspace-qualified-call-result-member-completion.as",
    "openplanet-angelscript",
    1,
    source
  );

  const analysis = analyzeDocument(document);
  const dotContext = getDotCompletionContext(document, 6, completionLine.length);
  assert.ok(dotContext, "Expected dot completion context for LocalPlugin::Current().");

  const context = getTypeResolutionContextAtPosition(
    document,
    analysis,
    6,
    completionLine.length,
    [analysis],
    collectFunctionReturnTypes([analysis])
  );
  const resolvedType = tryResolveExpressionTypeFullName(
    index,
    dotContext!.receiverText,
    context
  );

  assert.strictEqual(
    resolvedType,
    "Meta::Plugin",
    "Expected namespaced workspace function calls to resolve by qualified return type."
  );

  const memberLabels = collectMemberCompletionItems(
    index,
    resolvedType!,
    ""
  ).map((item) => item.label);
  assert.ok(
    memberLabels.includes("Name"),
    "Expected LocalPlugin::Current(). completion to include returned type members."
  );
}

function testGlobalDeclarationTypeInference(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "Meta");
  registerNamespacePath(index, "Crypto");

  registerSemanticTypeInfo(index, {
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

function testCoreMethodDefaultArgumentsPreserved(): void {
  const index = createCompletionIndex();
  registerNamespacePath(index, "XML");
  registerCoreClassTypeInfo(index, "XML::Node", {
    methods: [
      {
        name: "Attribute",
        returntypedecl: "string",
        args: [
          { typedecl: "string", name: "name" },
          { typedecl: "string", name: "def", default: "\"\"" }
        ]
      }
    ]
  });

  const memberItems = collectMemberCompletionItems(index, "XML::Node", "Attr");
  const attributeItem = memberItems.find((item) => item.label === "Attribute");
  assert.ok(attributeItem, "Expected XML::Node.Attribute member completion.");
  assert.ok(
    attributeItem?.detail?.includes('def = ""'),
    "Expected core-class member completions to preserve default argument text."
  );

  const source = [
    "void Main() {",
    "  XML::Node node;",
    '  node.Attribute("bronze");',
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///core-method-default-args.as",
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
    !diagnostics.some((diagnostic) => diagnostic.code === "arity-mismatch"),
    "Expected core-class default arguments to allow omitting trailing optional parameters."
  );
}

function testWorkspaceMethodDefaultArgumentsPreserved(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "LoadRecord@ loadRecord;",
    "",
    "class LoadRecord {",
    "  void LoadRecordFromMapUid(const string &in mapUid, const string &in offset, const string &in specialSaveLocation, const string &in accountId = \"\", const string &in mapId = \"\", const string &in seasonId = \"\") {",
    "  }",
    "}",
    "",
    "void Main() {",
    "  loadRecord.LoadRecordFromMapUid(\"map\", \"1\", \"Medal\", \"account\");",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///workspace-method-default-args.as",
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
    !diagnostics.some((diagnostic) => diagnostic.code === "arity-mismatch"),
    "Expected workspace class method default arguments to allow omitting trailing optional parameters."
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

function testDanglingMemberAccessDiagnostic(): void {
  const source = "const uint kApiVersionMajor = Meta::ExecutingPlugin().;";
  const document = TextDocument.create(
    "file:///dangling-member-access.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSyntaxDiagnostics(document, analysis);
  const diagnostic = diagnostics.find(
    (entry) => entry.code === "syntax-unparsable-statement"
  );

  assert.ok(
    diagnostic,
    "Expected dangling member access to produce a syntax diagnostic."
  );
  assert.strictEqual(
    diagnostic?.severity,
    DiagnosticSeverity.Error,
    "Expected dangling member access diagnostics to be severity Error."
  );
  assert.ok(
    diagnostic?.message.includes("Expected member name"),
    "Expected dangling member access diagnostic to explain the missing member name."
  );
}

function testFloatLiteralDoesNotProduceDanglingMemberDiagnostic(): void {
  const source = [
    "void Main() {",
    "  vec2 size = vec2(80.0f, 8.0f);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///float-literal-member-access.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const diagnostics = getSyntaxDiagnostics(document, analysis);

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "syntax-unparsable-statement" &&
        diagnostic.message.includes("Expected member name")
    ),
    "Expected f-suffixed float literals to avoid dangling member access diagnostics."
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

function testHexNumericLiteralsDoNotEmitUnknownIdentifier(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  uint value = 0xFFFF;",
    "  uint r = (value >> 11) & 0x1f;",
    "  uint g = (value >> 5) & 0x3f;",
    "  uint b = (value >> 0) & 0x1f;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///hex-numeric-literals.as",
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
        diagnostic.code === "unknown-identifier" &&
        /x1f|x3f|xffff/i.test(diagnostic.message)
    ),
    "Expected hex numeric literals (0x...) to avoid false unknown-identifier diagnostics."
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

function testUsingNamespaceAllowsQualifiedCoreFunctionByShortName(): void {
  const index = createCompletionIndex();
  registerNamespacePath(index, "Utils");
  index.coreFunctionSignaturesByQualifiedName.set("Utils::OnlyThere", [
    "void Utils::OnlyThere(int value)"
  ]);

  const source = [
    "using namespace Utils;",
    "",
    "void Main() {",
    "  OnlyThere(1);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///using-namespace-core-qualified-short-name.as",
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
        diagnostic.code === "unknown-symbol" && diagnostic.range.start.line === 3
    ),
    "Expected using namespace to make qualified core functions callable by short name."
  );
}

function testUsingNamespaceDoesNotLeakAcrossSiblingNamespacesForDiagnostics(): void {
  const index = createCompletionIndex();
  registerNamespacePath(index, "Utils");
  const declarationDocument = TextDocument.create(
    "file:///using-namespace-utils-declaration.as",
    "openplanet-angelscript",
    1,
    [
      "namespace Utils {",
      "  void OnlyThere(int value) {}",
      "}"
    ].join("\n")
  );
  const usageDocument = TextDocument.create(
    "file:///using-namespace-scope-diagnostics.as",
    "openplanet-angelscript",
    1,
    [
      "namespace A {",
      "  using namespace Utils;",
      "  void Ok() {",
      "    OnlyThere(1);",
      "  }",
      "}",
      "namespace B {",
      "  void Bad() {",
      "    OnlyThere(1);",
      "  }",
      "}"
    ].join("\n")
  );

  const declarationAnalysis = analyzeDocument(declarationDocument);
  const usageAnalysis = analyzeDocument(usageDocument);
  const diagnostics = getSemanticDiagnostics(
    usageDocument,
    usageAnalysis,
    [declarationAnalysis, usageAnalysis],
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
        diagnostic.code === "unknown-symbol" && diagnostic.range.start.line === 3
    ),
    "Expected sibling namespace A to see its own using namespace directive."
  );
  assert.ok(
    diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-symbol" && diagnostic.range.start.line === 8
    ),
    "Expected using namespace inside namespace A not to leak into sibling namespace B."
  );
}

function testNestedNamespaceCanCallParentNamespaceFunctionUnqualified(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "namespace UiNav {",
    "  int _ChildAt(int idx) {",
    "    return idx;",
    "  }",
    "}",
    "namespace UiNav { namespace ML {",
    "  int UseChildAt() {",
    "    return _ChildAt(1);",
    "  }",
    "} }"
  ].join("\n");
  const document = TextDocument.create(
    "file:///nested-namespace-parent-function-visibility.as",
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
      enableSemanticBinding: true,
      maxSymbolDiagnostics: 30
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-symbol" &&
        diagnostic.message.includes('"_ChildAt"')
    ),
    "Expected nested namespaces to resolve unqualified parent-namespace functions."
  );

  const definition = getDeclarationAtPosition(
    document,
    analysis,
    [analysis],
    7,
    14
  );
  assert.ok(
    definition,
    "Expected go-to-definition for nested namespace unqualified parent function call."
  );
  assert.strictEqual(
    definition?.range.start.line,
    1,
    "Expected nested namespace unqualified call to resolve to the parent namespace declaration."
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
  registerSemanticTypeInfo(index, {
    fullName: "UI::InputBlocking",
    shortName: "InputBlocking",
    namespace: "UI",
    kind: "enum",
    source: "generated",
    enumMembers: ["None"],
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

function testGenericRefUserdataCallArgumentsAreAccepted(
  index: ReturnType<typeof createCompletionIndex>
): void {
  index.coreGlobalFunctionNames.add("startnew");
  index.coreFunctionReturnTypes.set("startnew", "awaitable@");
  index.coreFunctionSignatures.set("startnew", [
    "awaitable@ startnew(CoroutineFuncUserdata@ func, ref userdata)",
    "awaitable@ startnew(CoroutineFuncUserdataString@ func, const string&in userdata)"
  ]);
  index.coreGlobalFuncdefNames.add("CoroutineFuncUserdata");
  index.coreGlobalFuncdefNames.add("CoroutineFuncUserdataString");

  const source = [
    "CoroutineFuncUserdata@ cb = null;",
    "MwId@ userdata;",
    "void Main() {",
    "  startnew(cb, userdata);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///generic-ref-userdata-call-args.as",
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
      (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
    ),
    "Expected Openplanet generic ref userdata overloads to accept object-handle arguments like MwId@."
  );
}

function testPrimitiveConstructorCastsInCallArguments(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "class MemoryBuffer {",
    "  void Write(uint8 i) {}",
    "  void Write(uint16 i) {}",
    "  void Write(uint i) {}",
    "}",
    "void Main() {",
    "  MemoryBuffer target;",
    "  target.Write(uint(0));",
    "  target.Write(uint16(0));",
    "  target.Write(uint8(0));",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///primitive-constructor-casts-call-args.as",
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

  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.code === "call-argument-type-mismatch"),
    "Expected primitive constructor-cast arguments like uint(0) to resolve to concrete numeric types in overload matching."
  );
}

function testPrimitiveConstructorRejectsIncompatibleArguments(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  string test;",
    "  uint(test);",
    "  uint(1.25f);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///primitive-constructor-incompatible-argument.as",
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

  assert.ok(
    diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 2
    ),
    "Expected uint(stringValue) to be reported as an invalid primitive constructor conversion."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 3
    ),
    "Expected uint(floatValue) to remain a valid explicit numeric conversion."
  );
}

function testWorkspaceEnumPrimitiveConstructorAndIntArgument(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "namespace LoadedRecords {",
    "  enum SourceKind { Replay }",
    "}",
    "void TakeInt(int value) {}",
    "void Main() {",
    "  int castValue = int(LoadedRecords::SourceKind::Replay);",
    "  TakeInt(LoadedRecords::SourceKind::Replay);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///workspace-enum-primitive-constructor.as",
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

  assert.ok(
    !diagnostics.some(
      (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
    ),
    "Expected workspace enum values to convert explicitly via int(...) and satisfy int arguments."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-identifier" ||
        diagnostic.code === "unknown-symbol"
    ),
    "Expected workspace enum members to stay known while checking primitive conversions."
  );
}

function testSemanticRegistryEnumWithoutEnumMemberBucket(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "External");
  registerSemanticTypeInfo(index, {
    fullName: "External::MedalKind",
    shortName: "MedalKind",
    namespace: "External",
    kind: "enum",
    source: "generated",
    enumMembers: ["Champion"],
    members: []
  });

  const source = [
    "void TakeInt(int value) {}",
    "void Main() {",
    "  int castValue = int(External::MedalKind::Champion);",
    "  TakeInt(External::MedalKind::Champion);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///semantic-registry-enum-no-bucket.as",
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

  assert.ok(
    !diagnostics.some(
      (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
    ),
    "Expected semantic enum registry entries to work without enum-member completion buckets."
  );
}

function testWStringImplicitStringConversionForCalls(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "class DemoEntry {",
    "  void SetText(wstring NewText, bool SendSubmitEvent) {}",
    "}",
    "",
    "bool UpdateEntry(const string &in text) {",
    "  DemoEntry ml;",
    "  ml.SetText(text, true);",
    "  return true;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///wstring-implicit-string-conversion-call.as",
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

  assert.ok(
    !diagnostics.some(
      (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
    ),
    "Expected passing string text to wstring parameter to be treated as implicitly compatible."
  );
  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.code === "unknown-type"),
    "Expected wstring to be recognized as a builtin primitive type."
  );
}

function testOutArrayReferenceArgumentsAreAccepted(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void _ParsePathEx(const string &in spec,",
    "                  array<int> &out parts,",
    "                  array<bool> &out wildcards,",
    "                  array<array<int>> &out hints) {}",
    "",
    "void Main(const string &in spec) {",
    "  array<int> idx;",
    "  array<bool> wc;",
    "  array<array<int>> h;",
    "  _ParsePathEx(spec, idx, wc, h);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///out-array-reference-arguments.as",
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
      maxSymbolDiagnostics: 80
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 9
    ),
    "Expected array locals to satisfy array<T> &out parameters without false call-argument-type-mismatch diagnostics."
  );
}

function testHandleOutReferenceArgumentsAreAccepted(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "class CScene2d {}",
    "bool _GetScene2d(uint overlay, CScene2d@ &out scene) {",
    "  return true;",
    "}",
    "",
    "CScene2d@ ResolveScene() {",
    "  CScene2d@ scene;",
    "  if (!_GetScene2d(16, scene)) return null;",
    "  return scene;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///handle-out-reference-arguments.as",
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
      maxSymbolDiagnostics: 80
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.range.start.line === 7
    ),
    "Expected handle out-reference arguments (CScene2d@ &out) to be accepted without false call-argument-type-mismatch diagnostics."
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

  registerSemanticTypeInfo(index, {
    fullName: "UI::WindowFlags",
    shortName: "WindowFlags",
    namespace: "UI",
    kind: "enum",
    source: "generated",
    enumMembers: ["None"],
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

function testSiblingNamespaceImportsDoNotCauseAmbiguousUnqualifiedCall(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "namespace UiNav {",
    "  namespace CT {",
    "    import string ResolveSelector(const string &in selector) from \"UiNav\";",
    "  }",
    "}",
    "namespace UiNav {",
    "  namespace ML {",
    "    import int ResolveSelector(const string &in selector) from \"UiNav\";",
    "    void Main() {",
    "      int value = ResolveSelector(\".root\");",
    "    }",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///sibling-namespace-import-overloads.as",
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
        diagnostic.message.includes("ResolveSelector")
    ),
    "Expected unqualified calls to ignore same-name imports from sibling namespaces."
  );
}

function testDuplicateImportAndImplementationDoNotCauseAmbiguousCall(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const importSource = [
    "namespace UiNav {",
    "  namespace ML {",
    "    import CGameManialinkControl@ ResolveSelector(",
    "      const string &in selector,",
    "      CGameManialinkControl@ start",
    "    ) from \"UiNav\";",
    "  }",
    "}"
  ].join("\n");
  const implementationSource = [
    "namespace UiNav {",
    "  namespace ML {",
    "    CGameManialinkControl@ ResolveSelector(const string &in selector, CGameManialinkControl@ start) {",
    "      return start;",
    "    }",
    "    void Main(CGameManialinkControl@ root) {",
    "      string selector;",
    "      CGameManialinkControl@ dst = null;",
    "      @dst = ResolveSelector(selector, root);",
    "    }",
    "  }",
    "}"
  ].join("\n");
  const importDocument = TextDocument.create(
    "file:///uinav-imports.as",
    "openplanet-angelscript",
    1,
    importSource
  );
  const implementationDocument = TextDocument.create(
    "file:///uinav-ml.as",
    "openplanet-angelscript",
    1,
    implementationSource
  );
  const importAnalysis = analyzeDocument(importDocument);
  const implementationAnalysis = analyzeDocument(implementationDocument);
  const diagnostics = getSemanticDiagnostics(
    implementationDocument,
    implementationAnalysis,
    [importAnalysis, implementationAnalysis],
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
        diagnostic.message.includes("ResolveSelector")
    ),
    "Expected matching import and implementation declarations to collapse before overload ambiguity checks."
  );
}

function testDependencyImportCallableVisibleAcrossPluginRoots(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const importSource = [
    "namespace UiNav {",
    "  import string CleanUiFormatting(const string &in s) from \"UiNav\";",
    "}",
  ].join("\n");
  const consumerSource = [
    "namespace UiNav {",
    "  string NormalizeForCompare(const string &in s) {",
    "    string r = CleanUiFormatting(s);",
    "    return r;",
    "  }",
    "}",
  ].join("\n");
  const importDocument = TextDocument.create(
    URI.file("/tmp/DepPlugin/src/api/imports.as").toString(),
    "openplanet-angelscript",
    1,
    importSource
  );
  const consumerDocument = TextDocument.create(
    URI.file("/tmp/ConsumerPlugin/src/local/base.as").toString(),
    "openplanet-angelscript",
    1,
    consumerSource
  );
  const importAnalysis = analyzeDocument(importDocument);
  const consumerAnalysis = analyzeDocument(consumerDocument);
  const diagnostics = getSemanticDiagnostics(
    consumerDocument,
    consumerAnalysis,
    [consumerAnalysis, importAnalysis],
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
        diagnostic.message.includes("CleanUiFormatting")
    ),
    "Expected dependency import callables in the active namespace to be visible across plugin roots."
  );
}

function testEquivalentOutHandleSpacingDoesNotCauseAmbiguousCall(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "namespace UI {",
    "  class Texture {",
    "  }",
    "}",
    "namespace UiNavKit {",
    "  namespace Debug {",
    "    bool _MlBrowserTryLoadTextureFromBuffer(const string &in filePath, UI::Texture@ &out texture) {",
    "      return true;",
    "    }",
    "    bool _MlBrowserTryLoadTextureFromBuffer(const string &in filePath, UI::Texture@&out texture) {",
    "      return true;",
    "    }",
    "    void Main() {",
    "      UI::Texture@ texFromBuf = null;",
    "      if (_MlBrowserTryLoadTextureFromBuffer(\"x\", texFromBuf) && texFromBuf !is null) {",
    "      }",
    "    }",
    "  }",
    "}",
  ].join("\n");
  const document = TextDocument.create(
    "file:///equivalent-out-handle-spacing.as",
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
      maxSymbolDiagnostics: 80
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.message.includes("_MlBrowserTryLoadTextureFromBuffer")
    ),
    "Expected semantically identical @ &out and @&out signatures to dedupe before overload checks."
  );
}

function testUnknownUppercaseConcreteTypesDoNotCauseOverloadAmbiguity(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "CControlBase@ ResolveSelector(const string &in selector, CControlBase@ start) {",
    "  return null;",
    "}",
    "CGameManialinkControl@ ResolveSelector(const string &in selector, CGameManialinkControl@ start) {",
    "  return null;",
    "}",
    "int ResolveSelector(const BuilderDocument@ doc, const string &in selector, int startIx = -1) {",
    "  return 0;",
    "}",
    "void Main(CGameManialinkControl@ root) {",
    "  CGameManialinkControl@ dst = null;",
    "  string selector;",
    "  @dst = ResolveSelector(selector, root);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///unknown-uppercase-concrete-overload.as",
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
      maxSymbolDiagnostics: 80
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "call-argument-type-mismatch" &&
        diagnostic.message.includes("ResolveSelector")
    ),
    "Expected unknown concrete API-style type names to avoid template-like overload ambiguity."
  );
}

function testNamespacedOverloadDefaultsDoNotCauseAmbiguousUnqualifiedCall(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "namespace A {",
    '  void _DiagStep(const string &in step, const string &in fn = "A", bool force = false) {}',
    "}",
    "namespace B {",
    '  void _DiagStep(const string &in step, const string &in fn = "B", bool force = false) {}',
    "}",
    "",
    "namespace A {",
    "  void Main() {",
    '    _DiagStep("x", "Main");',
    '    _DiagStep("x", "Main", true);',
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///namespaced-overload-defaults-unqualified-call.as",
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

  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.code === "call-argument-type-mismatch"),
    "Expected unqualified calls inside namespace A to resolve A::_DiagStep without ambiguity from B::_DiagStep."
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
  registerSemanticTypeInfo(index, {
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

function testJsonValueAddAcceptsPrimitiveFactoryConversion(): void {
  const index = createCompletionIndex();
  registerNamespacePath(index, "Json");
  registerCoreClassTypeInfo(index, "Json::Value", {
    behaviors: [
      {
        func: {
          decl: "Json::Value@ Value(const ?&in)",
          returntypedecl: "Json::Value@",
          args: [
            {
              typedecl: "?"
            }
          ]
        }
      }
    ],
    methods: [
      {
        name: "Add",
        returntypedecl: "void",
        args: [
          {
            typedecl: "Json::Value@"
          }
        ]
      }
    ]
  });

  const source = [
    "void Main() {",
    "  Json::Value cls;",
    "  array<string> classes;",
    "  cls.Add(classes[0]);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///json-value-add-primitive-factory-conversion.as",
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
        diagnostic.message.includes('"Add"')
    ),
    "Expected Json::Value.Add(Json::Value@) to accept primitives through the Json::Value factory behavior."
  );
}

function testDictionaryIndexAssignmentIsLValue(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  dictionary g_Tags;",
    "  string lhs = \"name\";",
    "  string rhs = \"Demo\";",
    "  g_Tags[lhs] = rhs;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///dictionary-index-lvalue.as",
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
    "Expected dictionary index assignment to be treated as an l-value."
  );
}

function testArrayIndexAssignmentIsLValueComplex(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  uint width = 4;",
    "  uint height = 4;",
    "  uint iz = 0;",
    "  uint imageIndex = 0;",
    "  uint decompressedBlockIndex = 0;",
    "  array<uint8> pixelData(64);",
    "  array<uint8> decompressedBlock(64);",
    "  pixelData[imageIndex + 0] = decompressedBlock[decompressedBlockIndex++];",
    "  pixelData[imageIndex + 1] = decompressedBlock[decompressedBlockIndex++];",
    "  pixelData[imageIndex + 2] = decompressedBlock[decompressedBlockIndex++];",
    "  pixelData[imageIndex + 3] = decompressedBlock[decompressedBlockIndex++];",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///array-index-lvalue-complex.as",
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

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "assignment-type-mismatch" &&
        diagnostic.message.includes("Expression is not an l-value")
    ),
    "Expected array<uint8> indexed assignments with complex index/rhs expressions to be treated as l-values."
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
  registerSemanticTypeInfo(index, {
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
  registerSemanticTypeInfo(index, {
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

function testUserDefinedConversionCycleDoesNotOverflow(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerSemanticTypeInfo(index, {
    fullName: "Math::SelfAssign",
    shortName: "SelfAssign",
    namespace: "Math",
    members: [
      {
        name: "opAssign",
        kind: "method",
        returnType: "Math::SelfAssign&",
        args: "const Math::SelfAssign &in other"
      }
    ]
  });
  index.typeFullNamesByShortName.set("SelfAssign", ["Math::SelfAssign"]);

  registerSemanticTypeInfo(index, {
    fullName: "Math::OtherType",
    shortName: "OtherType",
    namespace: "Math",
    members: []
  });
  index.typeFullNamesByShortName.set("OtherType", ["Math::OtherType"]);

  const compatibility = evaluateAssignmentOperatorCompatibility(
    index,
    "=",
    "SelfAssign",
    "OtherType"
  );

  assert.notStrictEqual(
    compatibility,
    "compatible",
    "Expected unrelated SelfAssign <- OtherType assignment to avoid false compatibility while not recursing indefinitely."
  );
}

function testIndexedOperatorTypeInference(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerSemanticTypeInfo(index, {
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

function testIndexedReceiverMemberResolution(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const lines = [
    "class Node {",
    "  int parentIx;",
    "}",
    "class Selector {",
    "  uint current;",
    "}",
    "class Doc {",
    "  array<Node@> nodes;",
    "}",
    "void Main() {",
    "  Doc doc;",
    "  Selector selector;",
    "  int root = doc.nodes[selector.current].parentIx;",
    "}"
  ];
  const source = lines.join("\n");
  const document = TextDocument.create(
    "file:///indexed-receiver-member-resolution.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const allAnalyses = [analysis];
  const workspaceTypeCatalog = collectWorkspaceTypeCatalog(allAnalyses);
  const effectiveIndex = createWorkspaceTypeAwareIndex(
    index,
    workspaceTypeCatalog.byFullName
  );
  const scopedReturnTypes = collectFunctionReturnTypes(allAnalyses);

  const expressionTypeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    12,
    lines[12].indexOf("parentIx"),
    allAnalyses,
    scopedReturnTypes,
    effectiveIndex
  );
  const resolvedType = tryResolveExpressionTypeFullName(
    effectiveIndex,
    "doc.nodes[selector.current]",
    expressionTypeContext
  );
  assert.strictEqual(
    resolvedType,
    "Node",
    "Expected indexed member receivers to keep element typing through bracket expressions."
  );

  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    allAnalyses,
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
        diagnostic.code === "unknown-member" &&
        diagnostic.range.start.line === 12
    ),
    "Expected direct indexed receiver member access to avoid false unknown-member diagnostics."
  );

  const parentIxCharacter = lines[12].indexOf("parentIx") + 2;
  const hoverTypeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    12,
    parentIxCharacter,
    allAnalyses,
    scopedReturnTypes,
    effectiveIndex
  );
  const hover = getHoverAtPosition(
    document,
    12,
    parentIxCharacter,
    effectiveIndex,
    hoverTypeContext,
    analysis,
    allAnalyses
  );
  assert.ok(hover, "Expected hover details for indexed receiver member access.");
  assert.ok(
    hoverToText(hover).includes("int parentIx"),
    "Expected hover on indexed receiver member to include the resolved property signature."
  );
}

function testMemberCallTypeMismatchDiagnostic(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerSemanticTypeInfo(index, {
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

  registerSemanticTypeInfo(index, {
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

function testNamespacedImportDeclarationsAreNotDuplicate(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "namespace UiNav {",
    "  import bool ValidateRef(NodeRef@ r) from \"UiNav\";",
    "}",
    "namespace UiNav { namespace CT {",
    "  import bool ValidateRef(NodeRef@ r) from \"UiNav\";",
    "} }",
    "namespace UiNav { namespace ML {",
    "  import bool ValidateRef(NodeRef@ r) from \"UiNav\";",
    "} }"
  ].join("\n");
  const document = TextDocument.create(
    "file:///namespaced-imports-not-duplicate.as",
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
      enableSemanticBinding: true,
      maxSymbolDiagnostics: 30
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) => diagnostic.code === "import-duplicate-declaration"
    ),
    "Expected identical import signatures in different namespaces to not be treated as duplicate declarations."
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

function testIgnoredFenceSuppressesDiagnostics(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  ///<",
    '  Add("bad");',
    "  ///>",
    "}",
    "",
    "int Add(int value) {",
    "  return value;",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///ignored-fence-diagnostics.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const rawDiagnostics = getSemanticDiagnostics(
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
  const filteredDiagnostics = filterDiagnosticsForIgnoredRegions(
    document,
    rawDiagnostics
  );

  assert.ok(
    rawDiagnostics.some(
      (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
    ),
    "Expected baseline diagnostics to include the bad call before ignored-region filtering."
  );
  assert.ok(
    !filteredDiagnostics.some(
      (diagnostic) => diagnostic.code === "call-argument-type-mismatch"
    ),
    "Expected diagnostics inside ///< ///> fence to be suppressed."
  );
}

async function testGenericDirectiveSuppressesSpecificImportDiagnostic(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-ignore-import-file-"));
  try {
    const pluginFolder = path.join(pluginsRoot, "UiNav");
    await fs.mkdir(pluginFolder, { recursive: true });
    await fs.writeFile(
      path.join(pluginFolder, "Exports.as"),
      "void RemoteTick() {}\n",
      "utf8"
    );

    const source = [
      "// op-disable all import-source-folder-only",
      'import void RemoteTick() from "UiNav";',
      "void Main() { RemoteTick(); }"
    ].join("\n");
    const document = TextDocument.create(
      "file:///ignored-import-folder-only-file.as",
      "openplanet-angelscript",
      1,
      source
    );
    const analysis = analyzeDocument(document);
    const rawDiagnostics = await getImportDiagnostics(
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
    const filteredDiagnostics = filterDiagnosticsForIgnoredRegions(
      document,
      rawDiagnostics
    );

    assert.ok(
      rawDiagnostics.some(
        (diagnostic) => diagnostic.code === "import-source-folder-only"
      ),
      "Expected baseline import diagnostics to include folder-only warning before directive filtering."
    );
    assert.ok(
      !filteredDiagnostics.some(
        (diagnostic) => diagnostic.code === "import-source-folder-only"
      ),
      "Expected // op-disable all import-source-folder-only to suppress that warning for the file."
    );
    assert.ok(
      !filteredDiagnostics.some(
        (diagnostic) => diagnostic.code === "import-function-not-found"
      ),
      "Expected directive filtering to leave unrelated successful import lookup unchanged."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function testLanguageServerDirectiveSuppressesNextLineOnlyImportDiagnostic(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-ignore-import-next-"));
  try {
    const pluginFolder = path.join(pluginsRoot, "UiNav");
    await fs.mkdir(pluginFolder, { recursive: true });
    await fs.writeFile(
      path.join(pluginFolder, "Exports.as"),
      "void RemoteTick() {}\n",
      "utf8"
    );

    const source = [
      "// oplang-disable-next-line import-source-folder-only",
      'import void RemoteTick() from "UiNav";',
      'import void RemoteTick() from "UiNav";',
      "void Main() { RemoteTick(); }"
    ].join("\n");
    const document = TextDocument.create(
      "file:///ignored-import-folder-only-next-line.as",
      "openplanet-angelscript",
      1,
      source
    );
    const analysis = analyzeDocument(document);
    const rawDiagnostics = await getImportDiagnostics(
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
    const filteredDiagnostics = filterDiagnosticsForIgnoredRegions(
      document,
      rawDiagnostics
    );

    assert.equal(
      rawDiagnostics.filter(
        (diagnostic) => diagnostic.code === "import-source-folder-only"
      ).length,
      2,
      "Expected both imports to produce the folder-only warning before filtering."
    );
    assert.equal(
      filteredDiagnostics.filter(
        (diagnostic) => diagnostic.code === "import-source-folder-only"
      ).length,
      1,
      "Expected oplang-disable-next-line to suppress only the following import warning."
    );
    assert.ok(
      filteredDiagnostics.some(
        (diagnostic) =>
          diagnostic.code === "import-source-folder-only" &&
          diagnostic.range.start.line === 2
      ),
      "Expected the second import warning to remain after next-line filtering."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

function testMissingDependencyGuardSuppressesInactiveBranchDiagnostics(): void {
  const index = createCompletionIndex();
  seedTestSymbols(index);
  const source = [
    "void Main() {",
    "#if DEPENDENCY_CHAMPIONMEDALS",
    "  ChampionMedals::GetCMTime();",
    "  MissingOnlyWhenChampionMedalsExists();",
    "#endif",
    "  MissingRequiredSymbol();",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///missing-dependency-guard.as",
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
        diagnostic.range.start.line === 2 || diagnostic.range.start.line === 3
    ),
    "Expected missing optional dependency guard to suppress diagnostics in the inactive #if branch."
  );
  assert.ok(
    diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "unknown-symbol" &&
        diagnostic.range.start.line === 5
    ),
    "Expected unguarded missing symbols to remain visible for required dependency-style usage."
  );
}

function testKnownDependencyGuardKeepsActiveBranchDiagnostics(): void {
  const index = createCompletionIndex();
  seedTestSymbols(index);
  registerNamespacePath(index, "ChampionMedals");
  const source = [
    "void Main() {",
    "#if DEPENDENCY_CHAMPIONMEDALS",
    "  MissingEvenWhenChampionMedalsExists();",
    "#else",
    "  MissingOnlyWhenChampionMedalsDoesNotExist();",
    "#endif",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///known-dependency-guard.as",
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
        diagnostic.code === "unknown-symbol" &&
        diagnostic.range.start.line === 2
    ),
    "Expected known dependency guards to keep diagnostics in the active #if branch."
  );
  assert.ok(
    !diagnostics.some((diagnostic) => diagnostic.range.start.line === 4),
    "Expected known dependency guards to suppress diagnostics in the inactive #else branch."
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

function testCaseEnumLabelDefinitionResolves(): void {
  const source = [
    "enum TextureFormat {",
    "  BC6,",
    "  BC7",
    "}",
    "",
    "void Decode(TextureFormat fmt) {",
    "  switch (fmt) {",
    "    case BC6:",
    "      return;",
    "    case BC7:",
    "      return;",
    "    default:",
    "      return;",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///case-enum-label-definition.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const definition = getDeclarationAtPosition(
    document,
    analysis,
    [analysis],
    7,
    10
  );
  assert.ok(definition, "Expected go-to-definition target for case enum label BC6.");
  assert.strictEqual(
    definition?.uri,
    document.uri,
    "Expected case enum label definition to resolve in the current document."
  );
  assert.strictEqual(
    definition?.range.start.line,
    1,
    "Expected case enum label BC6 to resolve to enum declaration line."
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

function testNamespacedFunctionReferences(): void {
  const declarationDocument = TextDocument.create(
    "file:///namespaced-function-declaration.as",
    "openplanet-angelscript",
    1,
    [
      "namespace UiNav {",
      "namespace Trace {",
      "  void Ev() {}",
      "}",
      "}"
    ].join("\n")
  );
  const usageDocument = TextDocument.create(
    "file:///namespaced-function-usage.as",
    "openplanet-angelscript",
    1,
    ["void Main() {", "  UiNav::Trace::Ev();", "}"].join("\n")
  );

  const declarationAnalysis = analyzeDocument(declarationDocument);
  const usageAnalysis = analyzeDocument(usageDocument);
  const allAnalyses = [declarationAnalysis, usageAnalysis];

  const referencesWithDeclaration = getReferencesAtPosition(
    declarationDocument,
    declarationAnalysis,
    allAnalyses,
    2,
    7,
    true
  );
  assert.strictEqual(
    referencesWithDeclaration.length,
    2,
    "Expected namespaced function references to include declaration and qualified call."
  );
  assert.ok(
    referencesWithDeclaration.some(
      (location) =>
        location.uri === usageDocument.uri && location.range.start.line === 1
    ),
    "Expected namespaced function references to include qualified call outside the namespace."
  );

  const referencesWithoutDeclaration = getReferencesAtPosition(
    declarationDocument,
    declarationAnalysis,
    allAnalyses,
    2,
    7,
    false
  );
  assert.strictEqual(
    referencesWithoutDeclaration.length,
    1,
    "Expected code-lens reference count for namespaced function to include qualified call sites."
  );

  const definition = getDeclarationAtPosition(
    usageDocument,
    usageAnalysis,
    allAnalyses,
    1,
    16
  );
  assert.ok(
    definition,
    "Expected go-to-definition on qualified namespaced call to resolve to declaration."
  );
  assert.strictEqual(
    definition?.uri,
    declarationDocument.uri,
    "Expected qualified namespaced call to resolve to function declaration document."
  );
}

function testFunctionReferencesIncludeCallbackValueUsage(): void {
  const document = TextDocument.create(
    "file:///function-reference-callback-value.as",
    "openplanet-angelscript",
    1,
    [
      "funcdef int ChildCb(int idx);",
      "namespace UiNav {",
      "  int _ChildAt(int idx) {",
      "    return idx;",
      "  }",
      "}",
      "namespace UiNav { namespace ML {",
      "  ChildCb@ GetChildCallback() {",
      "    return _ChildAt;",
      "  }",
      "} }"
    ].join("\n")
  );

  const analysis = analyzeDocument(document);
  const referencesWithDeclaration = getReferencesAtPosition(
    document,
    analysis,
    [analysis],
    2,
    8,
    true
  );
  assert.strictEqual(
    referencesWithDeclaration.length,
    2,
    "Expected function references to include callback-value usages in addition to the declaration."
  );
  assert.ok(
    referencesWithDeclaration.some((location) => location.range.start.line === 8),
    "Expected function references to include nested-namespace callback value usage."
  );

  const codeLenses = getCodeLensesForDocument(document, analysis, [analysis]);
  const childAtLens = codeLenses.find((lens) => lens.range.start.line === 2);
  assert.strictEqual(
    childAtLens?.command?.title,
    "1 reference",
    "Expected CodeLens reference counts to include callback-value function references."
  );
}

function testUsingNamespaceDoesNotLeakAcrossSiblingNamespacesForNavigation(): void {
  const declarationDocument = TextDocument.create(
    "file:///using-namespace-nav-declaration.as",
    "openplanet-angelscript",
    1,
    [
      "namespace Utils {",
      "  void OnlyThere(int value) {}",
      "}"
    ].join("\n")
  );
  const usageDocument = TextDocument.create(
    "file:///using-namespace-nav-usage.as",
    "openplanet-angelscript",
    1,
    [
      "namespace A {",
      "  using namespace Utils;",
      "  void Ok() {",
      "    OnlyThere(1);",
      "  }",
      "}",
      "namespace B {",
      "  void Bad() {",
      "    OnlyThere(1);",
      "  }",
      "}"
    ].join("\n")
  );

  const declarationAnalysis = analyzeDocument(declarationDocument);
  const usageAnalysis = analyzeDocument(usageDocument);
  const allAnalyses = [declarationAnalysis, usageAnalysis];

  const visibleDefinition = getDeclarationAtPosition(
    usageDocument,
    usageAnalysis,
    allAnalyses,
    3,
    8
  );
  assert.ok(
    visibleDefinition,
    "Expected go-to-definition inside namespace A to honor its local using namespace directive."
  );
  assert.strictEqual(
    visibleDefinition?.uri,
    declarationDocument.uri,
    "Expected namespace A short-name call to resolve to Utils::OnlyThere."
  );

  const leakedDefinition = getDeclarationAtPosition(
    usageDocument,
    usageAnalysis,
    allAnalyses,
    8,
    8
  );
  assert.strictEqual(
    leakedDefinition,
    null,
    "Expected namespace A using directive not to leak definition resolution into sibling namespace B."
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

  registerSemanticTypeInfo(index, {
    fullName: "UI::WindowFlags",
    shortName: "WindowFlags",
    namespace: "UI",
    kind: "enum",
    source: "generated",
    enumMembers: ["None"],
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
  registerSemanticTypeInfo(index, {
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

function testAutoIndexedMemberCallAndHover(
  index: ReturnType<typeof createCompletionIndex>
): void {
  registerNamespacePath(index, "IO");
  index.coreFunctionSignaturesByQualifiedName.set("IO::SetClipboard", [
    "void IO::SetClipboard(const string&in text)"
  ]);

  const source = [
    "class Entry {",
    "  string snapshotJson;",
    "}",
    "array<Entry@> g_Entries;",
    "void Main() {",
    "  auto e = g_Entries[0];",
    "  IO::SetClipboard(e.snapshotJson);",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///auto-indexed-member-call-and-hover.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);
  const allAnalyses = [analysis];
  const diagnostics = getSemanticDiagnostics(
    document,
    analysis,
    allAnalyses,
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
        diagnostic.range.start.line === 6
    ),
    "Expected auto-indexed class member argument e.snapshotJson to avoid false call-argument-type-mismatch diagnostics."
  );

  const workspaceTypeCatalog = collectWorkspaceTypeCatalog(allAnalyses);
  const effectiveIndex = createWorkspaceTypeAwareIndex(
    index,
    workspaceTypeCatalog.byFullName
  );
  const scopedReturnTypes = collectFunctionReturnTypes(allAnalyses);

  const variableTypeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    5,
    7,
    allAnalyses,
    scopedReturnTypes,
    effectiveIndex
  );
  const variableHover = getHoverAtPosition(
    document,
    5,
    7,
    effectiveIndex,
    variableTypeContext,
    analysis,
    allAnalyses
  );
  assert.ok(variableHover, "Expected hover details for inferred auto local variable e.");
  const variableHoverText = hoverToText(variableHover);
  assert.ok(
    variableHoverText.includes("Entry@ e"),
    "Expected hover on local auto variable e to show inferred Entry@ type."
  );

  const memberTypeContext = getTypeResolutionContextAtPosition(
    document,
    analysis,
    6,
    24,
    allAnalyses,
    scopedReturnTypes,
    effectiveIndex
  );
  const memberHover = getHoverAtPosition(
    document,
    6,
    24,
    effectiveIndex,
    memberTypeContext,
    analysis,
    allAnalyses
  );
  assert.ok(memberHover, "Expected hover details for member access e.snapshotJson.");
  const memberHoverText = hoverToText(memberHover);
  assert.ok(
    memberHoverText.includes("string snapshotJson"),
    "Expected hover on snapshotJson to include the member property signature."
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

function testWorkspaceGlobalFunctionSignatureHelp(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const usageDocument = TextDocument.create(
    "file:///plugin/src/main.as",
    "openplanet-angelscript",
    1,
    ["void Main() {", "  log(", "}"].join("\n")
  );
  const helperDocument = TextDocument.create(
    "file:///plugin/src/toolkit/logging.as",
    "openplanet-angelscript",
    1,
    [
      "enum LogLevel { Debug, Info }",
      "void log(",
      "  const string &in msg,",
      "  LogLevel level = LogLevel::Info,",
      "  int line = -1,",
      "  string _fnName = \"\"",
      ") {",
      "}"
    ].join("\n")
  );
  const usageAnalysis = analyzeDocument(usageDocument);
  const helperAnalysis = analyzeDocument(helperDocument);

  const signatureHelp = getSignatureHelpAtPosition(
    usageDocument,
    [usageAnalysis, helperAnalysis],
    index,
    1,
    6
  );

  assert.ok(
    signatureHelp,
    "Expected signature help for global workspace function log(...)."
  );
  assert.ok(
    signatureHelp?.signatures.some((signature) =>
      signature.label.includes(
        'void log(const string &in msg, LogLevel level = LogLevel::Info, int line = -1, string _fnName = ""'
      )
    ),
    "Expected workspace log(...) signature to include normalized parameters and default string values."
  );
  assert.strictEqual(
    signatureHelp?.activeParameter,
    0,
    "Expected the first parameter to be active immediately after log(."
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

function testNamespacedWorkspaceInlayHints(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const declarationDocument = TextDocument.create(
    "file:///inlay-hints-uinav-declaration.as",
    "openplanet-angelscript",
    1,
    [
      "namespace UiNav {",
      "namespace Builder {",
      "  bool RefreshLiveLayerBoundsOverlay(bool rescan = false, bool quiet = false) {",
      "    return false;",
      "  }",
      "}",
      "}"
    ].join("\n")
  );
  const usageDocument = TextDocument.create(
    "file:///inlay-hints-uinav-usage.as",
    "openplanet-angelscript",
    1,
    [
      "void Main() {",
      "  UiNav::Builder::RefreshLiveLayerBoundsOverlay(false, true);",
      "}"
    ].join("\n")
  );

  const declarationAnalysis = analyzeDocument(declarationDocument);
  const usageAnalysis = analyzeDocument(usageDocument);
  const workspaceFunctionDeclarationsByName = new Map<
    string,
    Array<{ analysis: DocumentAnalysis; declaration: FunctionDeclaration }>
  >();

  for (const analysis of [declarationAnalysis, usageAnalysis]) {
    for (const declaration of analysis.functions) {
      const entries = workspaceFunctionDeclarationsByName.get(declaration.name) ?? [];
      entries.push({ analysis, declaration });
      workspaceFunctionDeclarationsByName.set(declaration.name, entries);
    }
  }

  const hints = getInlayHints(
    usageDocument,
    usageAnalysis,
    index,
    {
      start: { line: 0, character: 0 },
      end: { line: 2, character: 0 }
    },
    undefined,
    workspaceFunctionDeclarationsByName
  );

  assert.ok(
    hints.some((hint) => String(hint.label).includes("rescan:")),
    "Expected namespaced workspace inlay hints to include the first UiNav boolean parameter."
  );
  assert.ok(
    hints.some((hint) => String(hint.label).includes("quiet:")),
    "Expected namespaced workspace inlay hints to include the second UiNav boolean parameter."
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

function testCodeLensesSkipsAttributedFunctions(): void {
  const document = TextDocument.create(
    "file:///code-lens-attributed.as",
    "openplanet-angelscript",
    1,
    [
      '[SettingsTab name="ControlTree UI" icon="Wrench" order="2"]',
      "void RenderUiNavControlTreeUiSettingsTab() {",
      "  UiNav::Debug::RenderControlTreeUiSettingsUI();",
      "}",
      "",
      "void Tick() {",
      "  RenderUiNavControlTreeUiSettingsTab();",
      "}"
    ].join("\n")
  );
  const analysis = analyzeDocument(document);
  const codeLenses = getCodeLensesForDocument(document, analysis, [analysis]);

  assert.ok(
    !codeLenses.some(
      (lens) =>
        lens.range.start.line === 1 &&
        lens.range.start.character === "void ".length
    ),
    "Expected attributed functions to be excluded from reference CodeLens output."
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

function testNamespaceDocumentSymbols(): void {
  const source = [
    "namespace Namespace1 {",
    "  namespace Namespace2 {",
    "    void Fn() { }",
    "  }",
    "}",
    "void GlobalFn() { }"
  ].join("\n");
  const document = TextDocument.create(
    "file:///symbols-namespaces.as",
    "openplanet-angelscript",
    1,
    source
  );
  const analysis = analyzeDocument(document);

  const namespace1 = analysis.documentSymbols.find(
    (symbol) => symbol.kind === SymbolKind.Namespace && symbol.name === "Namespace1"
  );
  assert.ok(namespace1, "Expected Namespace1 namespace symbol in document outline.");

  const namespace2 = namespace1?.children?.find(
    (symbol) => symbol.kind === SymbolKind.Namespace && symbol.name === "Namespace2"
  );
  assert.ok(namespace2, "Expected Namespace2 namespace symbol nested under Namespace1.");

  const nestedFunction = namespace2?.children?.find(
    (symbol) => symbol.kind === SymbolKind.Function && symbol.name === "Fn"
  );
  assert.ok(nestedFunction, "Expected Fn function symbol nested under namespaces.");

  const globalFunction = analysis.documentSymbols.find(
    (symbol) => symbol.kind === SymbolKind.Function && symbol.name === "GlobalFn"
  );
  assert.ok(globalFunction, "Expected GlobalFn function symbol at document root.");
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

function testUnknownPreprocessorDefinesAreReported(): void {
  const source = [
    "string FormatHeaders(dictionary@ headers) {",
    "#if OPENPLANER_VERSION_1_29_6",
    "  return Text::Join(headers.GetKeys(), \"\\r\\n\");",
    "#elif OPENPLANER_VERSION_1_29_5_OR_EARLIER",
    "  return string::Join(headers.GetKeys(), \"\\r\\n\");",
    "#endif",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///unknown-preprocessor-defines.as",
    "openplanet-angelscript",
    1,
    source
  );

  const diagnostics = collectPreprocessorDiagnostics(document);

  assert.equal(
    diagnostics.filter((diagnostic) => diagnostic.code === "unknown-preprocessor-define").length,
    2,
    "Expected both misspelled Openplanet version defines to be reported directly."
  );
}

async function testInfoTomlDefinesSuppressUnknownPreprocessorDiagnostics(): Promise<void> {
  const workspaceRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-preprocessor-defines-")
  );
  const filePath = path.join(workspaceRoot, "src", "Main.as");

  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, "info.toml"),
      ['[script]', 'defines = ["LOCAL_JOIN"]'].join("\n"),
      "utf8"
    );
    await fs.writeFile(
      filePath,
      [
        "string JoinLines(array<string>@ lines) {",
        "#if LOCAL_JOIN",
        "  return string::Join(lines, \"\\n\");",
        "#endif",
        "  return \"\";",
        "}"
      ].join("\n"),
      "utf8"
    );

    const document = TextDocument.create(
      URI.file(filePath).toString(),
      "openplanet-angelscript",
      1,
      await fs.readFile(filePath, "utf8")
    );

    const diagnostics = collectPreprocessorDiagnostics(document);
    assert.equal(
      diagnostics.filter((diagnostic) => diagnostic.code === "unknown-preprocessor-define").length,
      0,
      "Expected [script] defines from info.toml to suppress unknown-define diagnostics."
    );
  } finally {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
  }
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

function testWorkspaceEnumMembersAppearInsideEnumScope(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const lines = [
    "enum LogLevel { Debug, Info, Notice, Warning, Error, Critical, Custom }",
    "void log(const string &in msg, LogLevel level = LogLevel::D, int line = -1) {}"
  ];
  const document = TextDocument.create(
    "file:///workspace-enum-scope-completion.as",
    "openplanet-angelscript",
    1,
    lines.join("\n")
  );
  const analysis = analyzeDocument(document);
  const allAnalyses = [analysis];
  const workspaceTypeCatalog = collectWorkspaceTypeCatalog(allAnalyses);
  const effectiveIndex = createWorkspaceTypeAwareIndex(
    index,
    workspaceTypeCatalog.byFullName
  );
  const activeNamespace = getActiveNamespaceAtPosition(
    document,
    1,
    lines[1].indexOf("LogLevel::D") + "LogLevel::D".length
  );

  assert.strictEqual(
    activeNamespace,
    "LogLevel",
    "Expected enum-scope completion detection at LogLevel::D."
  );

  const items = collectCompletionItems(effectiveIndex, activeNamespace);
  assert.ok(
    items.some(
      (item) =>
        item.kind === CompletionItemKind.EnumMember && item.label === "Debug"
    ),
    "Expected workspace enum members to appear in enum-scope completion lists."
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

function testWorkspaceGlobalFunctionCompletion(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const usageDocument = TextDocument.create(
    "file:///plugin/src/main.as",
    "openplanet-angelscript",
    1,
    ["void Main() {", "  lo", "}"].join("\n")
  );
  const helperDocument = TextDocument.create(
    "file:///plugin/src/toolkit/logging.as",
    "openplanet-angelscript",
    1,
    [
      "enum LogLevel { Debug, Info }",
      "void log(",
      "  const string &in msg,",
      "  LogLevel level = LogLevel::Info,",
      "  int line = -1,",
      "  string _fnName = \"\"",
      ") {",
      "}"
    ].join("\n")
  );
  const allAnalyses = [
    analyzeDocument(usageDocument),
    analyzeDocument(helperDocument)
  ];

  const workspaceItems = collectWorkspaceFunctionCompletionItems(
    allAnalyses,
    undefined
  );
  const mergedItems = dedupeCompletionItems([
    ...workspaceItems,
    ...collectCompletionItems(index, undefined)
  ]);
  const logItem = mergedItems.find(
    (item) => item.kind === CompletionItemKind.Function && item.label === "log"
  );

  assert.ok(
    logItem,
    "Expected global workspace function log(...) to be included in root completions."
  );
  assert.ok(
    (logItem?.detail ?? "").includes("void"),
    "Expected workspace function completion to show its return type."
  );
  assert.strictEqual(
    logItem?.command?.command,
    "editor.action.triggerParameterHints",
    "Expected workspace function completion to trigger parameter hints after insertion."
  );
  const data = logItem?.data as Record<string, unknown> | undefined;
  const overloads = Array.isArray(data?.overloads) ? data.overloads : [];
  assert.ok(
    overloads.some(
      (signature) =>
        typeof signature === "string" &&
        signature.includes('string _fnName = ""')
    ),
    "Expected workspace function completion to retain default string values."
  );
}

function testCompletionSortsCallablesBeforeValues(): void {
  const index = createCompletionIndex();
  addSymbol(index, "Vehicle", {
    label: "brake",
    kind: CompletionItemKind.Field,
    detail: "bool"
  });
  addSymbol(index, "Vehicle", {
    label: "Brake",
    kind: CompletionItemKind.Function,
    detail: "void Brake()"
  });

  const items = collectCompletionItems(index, "Vehicle");
  const methodItem = items.find(
    (item) => item.kind === CompletionItemKind.Function && item.label === "Brake"
  );
  const valueItem = items.find(
    (item) => item.kind === CompletionItemKind.Field && item.label === "brake"
  );
  const keywordItem = items.find(
    (item) => item.kind === CompletionItemKind.Keyword && item.label === "break"
  );

  assert.ok(methodItem?.sortText, "Expected function completion to have sortText.");
  assert.ok(valueItem?.sortText, "Expected field completion to have sortText.");
  assert.ok(keywordItem?.sortText, "Expected keyword completion to have sortText.");
  assert.ok(
    methodItem!.sortText! < valueItem!.sortText!,
    "Expected function completions to sort before value completions."
  );
  assert.ok(
    methodItem!.sortText! < keywordItem!.sortText!,
    "Expected function completions to sort before keyword completions."
  );
}

function testMemberCompletionSortsMethodsBeforeFields(): void {
  const index = createCompletionIndex();
  registerSemanticTypeInfo(index, {
    fullName: "Vehicle",
    shortName: "Vehicle",
    namespace: "",
    kind: "class",
    source: "workspace",
    members: [
      {
        name: "brake",
        kind: "property",
        type: "bool"
      },
      {
        name: "Brake",
        kind: "method",
        returnType: "void",
        args: ""
      }
    ]
  });

  const items = collectMemberCompletionItems(index, "Vehicle", "");
  assert.strictEqual(
    items[0]?.label,
    "Brake",
    "Expected dot-member completions to put methods before fields."
  );
}

function testPreprocessorDirectiveCompletions(): void {
  const document = TextDocument.create(
    "file:///preprocessor-directive-completions.as",
    "openplanet-angelscript",
    1,
    [
      "#",
      "void Main() {}"
    ].join("\n")
  );

  const items = collectPreprocessorCompletionItems(document, 0, 1);
  const labels = new Set(items.map((item) => item.label));
  for (const directive of [
    "#define",
    "#undef",
    "#if",
    "#ifdef",
    "#ifndef",
    "#elif",
    "#else",
    "#endif",
    "#include"
  ]) {
    assert.ok(
      labels.has(directive),
      `Expected preprocessor completion list to include ${directive}.`
    );
  }
}

function testPreprocessorDefineCompletions(): void {
  const document = TextDocument.create(
    "file:///preprocessor-define-completions.as",
    "openplanet-angelscript",
    1,
    [
      "#if T",
      "void Main() {}"
    ].join("\n")
  );

  const items = collectPreprocessorCompletionItems(document, 0, 5);
  const labels = new Set(items.map((item) => item.label));
  assert.ok(
    labels.has("TMNEXT"),
    "Expected #if completions to include Openplanet built-in defines like TMNEXT."
  );
  assert.ok(
    labels.has("TURBO"),
    "Expected #if completions to include Openplanet built-in defines like TURBO."
  );

  const fullConditionDocument = TextDocument.create(
    "file:///preprocessor-condition-helpers.as",
    "openplanet-angelscript",
    1,
    [
      "#if ",
      "void Main() {}"
    ].join("\n")
  );
  const helperItems = collectPreprocessorCompletionItems(
    fullConditionDocument,
    0,
    4
  );
  const helperLabels = new Set(helperItems.map((item) => item.label));
  assert.ok(
    helperLabels.has("defined(...)"),
    "Expected #if completions to include defined(...) helper snippet."
  );
  assert.ok(
    helperLabels.has("COMP_..."),
    "Expected #if completions to include competition-profile define helper."
  );
}

function testDirectiveCommentSnippetCompletions(): void {
  const document = TextDocument.create(
    "file:///directive-comment-snippets.as",
    "openplanet-angelscript",
    1,
    [
      "void Main() {",
      "  ///",
      "}"
    ].join("\n")
  );

  const items = collectDirectiveCommentSnippetItems(document, 1, 5);
  assert.ok(
    items.length >= 10,
    "Expected typing /// in an AngelScript file to offer the directive snippet set."
  );
  assert.ok(
    items.some((item) => item.label === "OP Linter: Disable Next Line"),
    "Expected directive comment snippets to include oplint helpers."
  );
  assert.ok(
    items.some((item) => item.label === "OP Formatter: Disable Next Line"),
    "Expected directive comment snippets to include opfmt helpers."
  );
  assert.ok(
    items.every((item) => item.kind === CompletionItemKind.Snippet),
    "Expected directive comment completions to be snippet items."
  );
}

function testDirectiveCommentSnippetCompletionsPreserveIndentation(): void {
  const document = TextDocument.create(
    "file:///directive-comment-snippets-indent.as",
    "openplanet-angelscript",
    1,
    [
      "void Main() {",
      "    ///",
      "}"
    ].join("\n")
  );

  const items = collectDirectiveCommentSnippetItems(document, 1, 7);
  const blockSnippet = items.find(
    (item) => item.label === "OP Formatter: Disable Block"
  );
  assert.ok(blockSnippet, "Expected directive block snippet completion.");
  const textEdit =
    blockSnippet?.textEdit && "newText" in blockSnippet.textEdit
      ? blockSnippet.textEdit
      : undefined;
  assert.ok(textEdit, "Expected directive completion to replace the typed /// token.");
  assert.strictEqual(
    textEdit?.newText,
    [
      "// opfmt-disable-start",
      "    ${0}",
      "    // opfmt-disable-end"
    ].join("\n"),
    "Expected multi-line directive snippets to preserve the current line indentation."
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

function testBindingForInitializerRedeclarationDoesNotDuplicate(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "void Main() {",
    "  for (int i = 0; i < 4; ++i) {",
    "  }",
    "  for (int i = 0; i < 16; ++i) {",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///binding-for-initializer-redeclaration-ok.as",
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
    "Expected reusing for-loop initializer variable names in separate loops to avoid duplicate declaration diagnostics."
  );
}

function testSwitchCaseLabelsDoNotCreateFakeLocalDeclarations(
  index: ReturnType<typeof createCompletionIndex>
): void {
  const source = [
    "enum TextureFormat {",
    "  BC6,",
    "  BC7",
    "}",
    "",
    "string _lastTextureLoadError;",
    "",
    "void Decode(TextureFormat format) {",
    "  switch (format) {",
    "    case BC6:",
    '      _lastTextureLoadError = "Not implemented: BC6H DDS decode is not supported yet.";',
    "      return;",
    "    case BC7:",
    '      _lastTextureLoadError = "Not implemented: BC7 DDS decode is not supported yet.";',
    "      return;",
    "    default:",
    '      _lastTextureLoadError = "Not implemented: only DXT1/3/5 and BC4/BC5 are currently supported.";',
    "      return;",
    "  }",
    "}"
  ].join("\n");
  const document = TextDocument.create(
    "file:///case-label-fake-local-declaration.as",
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
      maxSymbolDiagnostics: 50
    }
  );

  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "binding-use-before-declaration" &&
        diagnostic.message.includes("_lastTextureLoadError")
    ),
    "Expected case/default labels to not create fake local declarations that trigger use-before-declaration diagnostics."
  );
  assert.ok(
    !diagnostics.some(
      (diagnostic) =>
        diagnostic.code === "assignment-type-mismatch" &&
        diagnostic.message.includes('"default:"')
    ),
    "Expected case/default labels to not be interpreted as declaration types for assignment diagnostics."
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

async function testImportValidationFolderJunctionWarningAndLookup(): Promise<void> {
  const pluginsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openplanet-ls-import-junction-"));
  const pluginBankRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-import-junction-bank-")
  );
  try {
    const pluginBankFolder = path.join(pluginBankRoot, "SyntaxDemo");
    await fs.mkdir(pluginBankFolder, { recursive: true });
    await fs.writeFile(
      path.join(pluginBankFolder, "Exports.as"),
      "void RemoteTick() {}\n",
      "utf8"
    );

    const linkedFolder = path.join(pluginsRoot, "SyntaxDemo");
    const created = await createDirectoryLink(pluginBankFolder, linkedFolder);
    if (!created) {
      console.warn(
        "[runTests] Skipping junction import validation test (directory link creation unavailable)."
      );
      return;
    }

    const source = 'import void RemoteTick() from "SyntaxDemo";\nvoid Main() { RemoteTick(); }';
    const document = TextDocument.create(
      "file:///import-folder-junction.as",
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
      "Expected folder-only import source warning when source is a junctioned plugin folder."
    );
    assert.ok(
      !diagnostics.some((diagnostic) => diagnostic.code === "import-function-not-found"),
      "Expected imported function lookup to resolve through junctioned plugin folders."
    );
  } finally {
    await fs.rm(pluginsRoot, { recursive: true, force: true });
    await fs.rm(pluginBankRoot, { recursive: true, force: true });
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

async function testCompletionIndexStoresQualifiedFunctionReturnTypes(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-symbol-qualified-returns-")
  );

  try {
    const nextPath = path.join(baseUserFolder, "OpenplanetNext");
    await fs.mkdir(nextPath, { recursive: true });

    const payload = {
      functions: [
        {
          name: "ExecutingPlugin",
          ns: "Meta",
          decl: "Meta::Plugin@ Meta::ExecutingPlugin()",
          desc: "Gets executing plugin"
        }
      ],
      props: [],
      funcdefs: [],
      enums: [],
      classes: [
        {
          name: "Plugin",
          ns: "Meta",
          props: [
            {
              name: "Name",
              typedecl: "string"
            }
          ],
          methods: []
        }
      ]
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
    assert.strictEqual(
      index.coreFunctionReturnTypes.get("Meta::ExecutingPlugin"),
      "Meta::Plugin@",
      "Expected qualified core function return type to be indexed."
    );
    assert.ok(
      !index.coreFunctionReturnTypes.has("ExecutingPlugin"),
      "Expected namespaced core function not to leak into unqualified return type lookup."
    );

    const completionLine = "  Meta::ExecutingPlugin().";
    const document = TextDocument.create(
      "file:///built-index-qualified-call-result-member-completion.as",
      "openplanet-angelscript",
      1,
      ["void Main() {", completionLine, "}"].join("\n")
    );
    const analysis = analyzeDocument(document);
    const dotContext = getDotCompletionContext(document, 1, completionLine.length);
    assert.ok(dotContext, "Expected dot completion context for built Meta::ExecutingPlugin().");
    const resolvedType = tryResolveExpressionTypeFullName(
      index,
      dotContext!.receiverText,
      getTypeResolutionContextAtPosition(
        document,
        analysis,
        1,
        completionLine.length,
        [analysis]
      )
    );
    assert.strictEqual(
      resolvedType,
      "Meta::Plugin",
      "Expected built qualified core function return type to drive member completion."
    );
  } finally {
    await fs.rm(baseUserFolder, { recursive: true, force: true });
  }
}

async function testCompletionIndexSeedsAlwaysAvailableNamespaces(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-symbol-always-ns-")
  );

  try {
    const settings = createDefaultSettings();
    settings.symbols.baseUserFolderPath = baseUserFolder;
    settings.symbols.enableCoreJson = false;
    settings.symbols.enableGameJson = false;
    settings.symbols.enableHeader = false;
    settings.symbols.trackmania2020.enabled = false;
    settings.symbols.turbo.enabled = false;
    settings.symbols.openplanet4.enabled = false;
    settings.completion.namespaces = [];

    const index = await buildCompletionIndex(settings, createNoopLogger());
    for (const namespaceName of [
      "Controls",
      "Camera",
      "VehicleState",
      "NadeoServices"
    ]) {
      assert.ok(
        index.namespaceBuckets.has(namespaceName) ||
          index.namespaceChildren.has(namespaceName),
        `Expected ${namespaceName} to remain a known namespace without relying on completion settings.`
      );
    }

    const document = TextDocument.create(
      "file:///always-available-namespaces.as",
      "openplanet-angelscript",
      1,
      [
        "using namespace Controls;",
        "using namespace Camera;",
        "using namespace VehicleState;",
        "using namespace NadeoServices;",
        "void Main() {",
        '  string url = "x";',
        '  auto req = NadeoServices::Get("NadeoLiveServices", url);',
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
        maxSymbolDiagnostics: 30
      }
    );

    assert.ok(
      !diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "unknown-identifier" &&
          diagnostic.message.includes("\"NadeoServices\"")
      ),
      "Expected NadeoServices namespace-qualified calls to avoid false unknown-identifier diagnostics."
    );
    assert.ok(
      !diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "unknown-identifier" &&
          diagnostic.range.start.line >= 0 &&
          diagnostic.range.start.line <= 3
      ),
      "Expected always-available namespaces to stay valid in using directives."
    );

    const runtimeSettings = createDefaultSettings();
    runtimeSettings.symbols.baseUserFolderPath = baseUserFolder;
    runtimeSettings.symbols.enableCoreJson = false;
    runtimeSettings.symbols.enableGameJson = false;
    runtimeSettings.symbols.enableHeader = false;
    runtimeSettings.symbols.trackmania2020.enabled = false;
    runtimeSettings.symbols.turbo.enabled = false;
    runtimeSettings.symbols.openplanet4.enabled = false;

    const runtimeIndex = await buildCompletionIndex(
      runtimeSettings,
      createNoopLogger()
    );
    const runtimeDocument = TextDocument.create(
      "file:///nadeoservices-direct-call.as",
      "openplanet-angelscript",
      1,
      [
        "void Main() {",
        '  string url = "x";',
        '  auto req = NadeoServices::Get("NadeoLiveServices", url);',
        "}"
      ].join("\n")
    );
    const runtimeAnalysis = analyzeDocument(runtimeDocument);
    const runtimeDiagnostics = getSemanticDiagnostics(
      runtimeDocument,
      runtimeAnalysis,
      [runtimeAnalysis],
      runtimeIndex,
      {
        enableUnknownSymbols: true,
        enableCaseMismatch: true,
        maxSymbolDiagnostics: 20
      }
    );

    assert.ok(
      !runtimeDiagnostics.some(
        (diagnostic) =>
          diagnostic.code === "unknown-identifier" &&
          diagnostic.message.includes("\"NadeoServices\"")
      ),
      "Expected NadeoServices::Get to avoid false unknown-identifier diagnostics under default completion namespace settings."
    );
  } finally {
    await fs.rm(baseUserFolder, { recursive: true, force: true });
  }
}

async function testCompletionIndexPreservesCoreClassDefaultArguments(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-symbol-core-default-")
  );

  try {
    const nextPath = path.join(baseUserFolder, "OpenplanetNext");
    await fs.mkdir(nextPath, { recursive: true });

    const payload = {
      functions: [],
      props: [],
      funcdefs: [],
      enums: [],
      classes: [
        {
          ns: "XML",
          name: "Node",
          methods: [
            {
              name: "Attribute",
              returntypedecl: "string",
              args: [
                { typedecl: "string", name: "name" },
                { typedecl: "string", name: "def", default: "\"\"" }
              ]
            }
          ]
        }
      ]
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
    const memberItems = collectMemberCompletionItems(index, "XML::Node", "Attr");
    const attributeItem = memberItems.find((item) => item.label === "Attribute");
    assert.ok(
      attributeItem?.detail?.includes('def = ""'),
      "Expected buildCompletionIndex to preserve default argument text for core class methods."
    );

    const document = TextDocument.create(
      "file:///core-json-method-default-args.as",
      "openplanet-angelscript",
      1,
      ["void Main() {", "  XML::Node node;", '  node.Attribute("bronze");', "}"].join(
        "\n"
      )
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
          diagnostic.code === "arity-mismatch" &&
          diagnostic.message.includes('"Attribute"')
      ),
      "Expected core JSON default arguments to prevent false arity diagnostics on member calls."
    );
  } finally {
    await fs.rm(baseUserFolder, { recursive: true, force: true });
  }
}

async function testCompletionIndexRegistersHeaderEnumsForPrimitiveCasts(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-symbol-header-enums-")
  );

  try {
    const nextPath = path.join(baseUserFolder, "OpenplanetNext");
    await fs.mkdir(nextPath, { recursive: true });
    await fs.writeFile(
      path.join(nextPath, "Openplanet.h"),
      [
        "class CGameManialinkControl {};",
        "enum class CGameManialinkControl::EAlignHorizontal {",
        "  Left = 0,",
        "  Center = 1,",
        "  Right = 2",
        "};"
      ].join("\n"),
      "utf8"
    );

    const settings = createDefaultSettings();
    settings.symbols.baseUserFolderPath = baseUserFolder;
    settings.symbols.enableCoreJson = false;
    settings.symbols.enableGameJson = false;
    settings.symbols.enableHeader = true;
    settings.symbols.trackmania2020.enabled = true;
    settings.symbols.turbo.enabled = false;
    settings.symbols.openplanet4.enabled = false;

    const index = await buildCompletionIndex(settings, createNoopLogger());
    const enumInfo = index.semanticTypes.get(
      "CGameManialinkControl::EAlignHorizontal"
    );
    assert.strictEqual(
      enumInfo?.kind,
      "enum",
      "Expected header enum classes to be registered as semantic enums."
    );
    assert.deepStrictEqual(
      enumInfo?.enumMembers,
      ["Left", "Center", "Right"],
      "Expected header enum members to be captured."
    );

    const document = TextDocument.create(
      "file:///header-enum-primitive-cast.as",
      "openplanet-angelscript",
      1,
      [
        "void Main() {",
        "  CGameManialinkControl::EAlignHorizontal align;",
        "  int value = int(align);",
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
        maxSymbolDiagnostics: 20
      }
    );

    assert.ok(
      !diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "call-argument-type-mismatch" &&
          diagnostic.message.includes("CGameManialinkControl::EAlignHorizontal")
      ),
      "Expected enum-to-int primitive constructor casts from header enums to be accepted."
    );
  } finally {
    await fs.rm(baseUserFolder, { recursive: true, force: true });
  }
}

async function testCompletionIndexRegistersHeaderInheritanceForUnqualifiedGameTypes(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-symbol-header-inheritance-")
  );

  try {
    const nextPath = path.join(baseUserFolder, "OpenplanetNext");
    await fs.mkdir(nextPath, { recursive: true });
    await fs.writeFile(
      path.join(nextPath, "OpenplanetNext.json"),
      `${JSON.stringify(
        {
          ns: {
            Game: {
              CGameManialinkControl: {
                p: "CMwNod",
                m: []
              },
              CGameManialinkFrame: {
                p: "CGameManialinkControl",
                m: []
              },
              Page: {
                m: [
                  {
                    n: "MainFrame",
                    t: "CGameManialinkFrame@"
                  }
                ]
              }
            }
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    );
    await fs.writeFile(
      path.join(nextPath, "Openplanet.h"),
      [
        "struct CMwNod {};",
        "struct CGameManialinkControl : public CMwNod {};",
        "struct CGameManialinkFrame : public CGameManialinkControl {};"
      ].join("\n"),
      "utf8"
    );

    const settings = createDefaultSettings();
    settings.symbols.baseUserFolderPath = baseUserFolder;
    settings.symbols.enableCoreJson = false;
    settings.symbols.enableGameJson = true;
    settings.symbols.enableHeader = true;
    settings.symbols.trackmania2020.enabled = true;
    settings.symbols.turbo.enabled = false;
    settings.symbols.openplanet4.enabled = false;

    const index = await buildCompletionIndex(settings, createNoopLogger());
    assert.strictEqual(
      index.typeInfoByFullName.get("CGameManialinkFrame")?.parentShortName,
      "CGameManialinkControl",
      "Expected header inheritance to be retained for unqualified game type shells."
    );

    const document = TextDocument.create(
      "file:///header-inherited-game-type-call.as",
      "openplanet-angelscript",
      1,
      [
        "bool _IsDescendantOrSelf(CGameManialinkControl@ root, CGameManialinkControl@ candidate) {",
        "  return true;",
        "}",
        "void Main() {",
        "  Page page;",
        "  CGameManialinkControl@ root;",
        "  if (_IsDescendantOrSelf(page.MainFrame, root)) return;",
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
        maxSymbolDiagnostics: 30
      }
    );

    assert.ok(
      !diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "call-argument-type-mismatch" &&
          diagnostic.message.includes("_IsDescendantOrSelf")
      ),
      "Expected inherited Manialink frame handles to satisfy Manialink control parameters."
    );
  } finally {
    await fs.rm(baseUserFolder, { recursive: true, force: true });
  }
}

async function testCompletionIndexIncludesBuiltinIcons(): Promise<void> {
  const baseUserFolder = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-symbol-icons-")
  );

  try {
    const settings = createDefaultSettings();
    settings.symbols.baseUserFolderPath = baseUserFolder;
    settings.symbols.enableGameJson = false;
    settings.symbols.enableHeader = false;
    settings.symbols.trackmania2020.enabled = false;
    settings.symbols.turbo.enabled = false;
    settings.symbols.openplanet4.enabled = false;

    const index = await buildCompletionIndex(settings, createNoopLogger());

    const iconsBucket = index.namespaceBuckets.get("Icons");
    assert.ok(iconsBucket, "Expected Icons namespace bucket to be present.");
    assert.ok(
      iconsBucket?.items.some((item) => item.label === "Heart"),
      "Expected built-in Icons namespace to include common icon names."
    );
    assert.ok(
      (iconsBucket?.items.length ?? 0) > 500,
      "Expected built-in icon list to provide a large Icons namespace symbol set."
    );

    const kenneyBucket = index.namespaceBuckets.get("Icons::Kenney");
    assert.ok(kenneyBucket, "Expected Icons::Kenney namespace bucket to be present.");
    assert.ok(
      kenneyBucket?.items.some((item) => item.label === "Home"),
      "Expected built-in icon list to include Icons::Kenney namespaced entries."
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

async function testWorkspaceAnalysisIndexLoadsInfoTomlDependenciesFromJunction(): Promise<void> {
  const workspaceRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-workspace-deps-junction-")
  );
  const pluginsRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-plugin-root-junction-")
  );
  const pluginBankRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-plugin-bank-junction-")
  );

  try {
    await fs.writeFile(
      path.join(workspaceRoot, "info.toml"),
      ['[script]', 'dependencies = ["DepPlugin"]'].join("\n"),
      "utf8"
    );

    const dependencyBankFolder = path.join(pluginBankRoot, "DepPlugin");
    await fs.mkdir(dependencyBankFolder, { recursive: true });
    await fs.writeFile(path.join(dependencyBankFolder, "Exports.as"), "void DepTick() {}\n", "utf8");

    const dependencyLinkedFolder = path.join(pluginsRoot, "DepPlugin");
    const created = await createDirectoryLink(dependencyBankFolder, dependencyLinkedFolder);
    if (!created) {
      console.warn(
        "[runTests] Skipping junction workspace dependency test (directory link creation unavailable)."
      );
      return;
    }

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

    const dependencyUri = URI.file(path.join(dependencyLinkedFolder, "Exports.as")).toString();
    assert.ok(
      index.has(dependencyUri),
      "Expected workspace dependency indexing to include .as files from junctioned dependency plugins."
    );
    const dependencyAnalysis = index.get(dependencyUri);
    assert.ok(dependencyAnalysis, "Expected dependency analysis to be available for junctioned plugin.");
    assert.ok(
      dependencyAnalysis?.functions.some((fn) => fn.name === "DepTick"),
      "Expected dependency analysis to parse callable declarations from junctioned plugin files."
    );
  } finally {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
    await fs.rm(pluginsRoot, { recursive: true, force: true });
    await fs.rm(pluginBankRoot, { recursive: true, force: true });
  }
}

async function testDependencyScopedTypesSuppressUnknownTypeDiagnostics(): Promise<void> {
  const workspaceRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-dependency-scope-")
  );
  const pluginsRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "openplanet-ls-dependency-scope-plugins-")
  );

  try {
    await fs.writeFile(
      path.join(workspaceRoot, "info.toml"),
      ['[script]', 'dependencies = ["DepPlugin"]'].join("\n"),
      "utf8"
    );

    const consumerPath = path.join(workspaceRoot, "Consumer.as");
    const consumerSource = "void Use(DepPlugin::ExportedType@ value) {}\n";
    await fs.writeFile(consumerPath, consumerSource, "utf8");

    const dependencyFolder = path.join(pluginsRoot, "lib-tm_DepPlugin");
    await fs.mkdir(dependencyFolder, { recursive: true });
    const dependencyPath = path.join(dependencyFolder, "Types.as");
    await fs.writeFile(
      dependencyPath,
      [
        "namespace DepPlugin {",
        "  shared class ExportedType {",
        "  }",
        "}",
      ].join("\n"),
      "utf8"
    );

    const dependencyOptions = {
      enableInfoTomlDependencies: true,
      includeOptionalDependencies: true,
      pluginRoots: [pluginsRoot],
      symbolsBaseUserFolderPath: "",
      maxDepth: 2,
      maxFiles: 200
    };
    const logger = {
      info: () => {},
      warn: () => {},
      error: () => {}
    };
    const workspaceIndex = await buildWorkspaceAnalysisIndex(
      [workspaceRoot],
      new Set<string>([URI.file(consumerPath).toString()]),
      logger,
      {
        dependencies: dependencyOptions
      }
    );
    const dependencyUris = await collectDependencyAngelScriptUrisForPlugin(
      workspaceRoot,
      [workspaceRoot],
      dependencyOptions,
      logger
    );
    const dependencyAnalyses = dependencyUris
      .map((uri) => workspaceIndex.get(uri))
      .filter((analysis): analysis is DocumentAnalysis => analysis !== undefined);

    const document = TextDocument.create(
      URI.file(consumerPath).toString(),
      "openplanet-angelscript",
      1,
      consumerSource
    );
    const analysis = analyzeDocument(document);
    const diagnostics = getSemanticDiagnostics(
      document,
      analysis,
      [analysis, ...dependencyAnalyses],
      createCompletionIndex(),
      {
        enableUnknownSymbols: true,
        enableCaseMismatch: true,
        maxSymbolDiagnostics: 20
      }
    );

    assert.ok(
      dependencyUris.includes(URI.file(dependencyPath).toString()),
      "Expected dependency scope collection to include the dependency plugin source file."
    );
    assert.ok(
      !diagnostics.some(
        (diagnostic) =>
          diagnostic.code === "unknown-type" &&
          diagnostic.message.includes("DepPlugin::ExportedType")
      ),
      "Expected info.toml dependency types to be visible in scoped diagnostics."
    );
  } finally {
    await fs.rm(workspaceRoot, { recursive: true, force: true });
    await fs.rm(pluginsRoot, { recursive: true, force: true });
  }
}

async function createDirectoryLink(targetDirectoryPath: string, linkPath: string): Promise<boolean> {
  try {
    const symlinkType: "junction" | "dir" =
      process.platform === "win32" ? "junction" : "dir";
    await fs.symlink(path.resolve(targetDirectoryPath), linkPath, symlinkType);
    return true;
  } catch {
    return false;
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
