import type {
  GameSymbolSourceSettings,
  OpenplanetLanguageServerSettings
} from "./types";
import { toRecord } from "./util";

const defaultCompletionNamespaces = [
  "UI",
  "IO",
  "Net",
  "Json",
  "Math",
  "Text",
  "Time",
  "Meta",
  "DataFileMgr",
  "Editor"
];

export function createDefaultSettings(): OpenplanetLanguageServerSettings {
  return {
    validateIncludes: true,
    includePaths: [],
    maxIncludeDiagnostics: 200,
    imports: {
      enable: true,
      pluginRoots: [],
      maxDiagnostics: 200
    },
    parser: {
      enableUnparsableStatementDiagnostics: true,
      enableDebugOutput: false,
      crashOnParseError: false,
      maxDiagnostics: 200
    },
    dependencies: {
      enableInfoTomlDependencies: true,
      includeOptionalDependencies: true,
      pluginRoots: [],
      maxDepth: 4,
      maxFiles: 2500
    },
    diagnostics: {
      enableUnknownSymbols: true,
      enableCaseMismatch: true,
      enableSemanticBinding: true,
      enableTypeChecking: true,
      enableCrossGameCompatibility: true,
      maxSymbolDiagnostics: 200
    },
    completion: {
      enable: true,
      namespaces: [...defaultCompletionNamespaces],
      maxItems: 500,
      shortcuts: {
        math: true,
        ui: true,
        mathX: true,
        ux: true,
        mat: true,
        quat: true,
        string: true
      }
    },
    inlayHints: {
      enable: true,
      parameterHintsForConstants: true,
      parameterHintsForComplexExpressions: true,
      parameterReferenceHints: true,
      parameterHintsForSingleParameterFunctions: false,
      typeHintsForAutos: true,
      parameterHintsIgnoredParameterNames: [
        "Object",
        "FunctionName",
        "Value",
        "InValue",
        "NewValue",
        "Condition",
        "Parameters",
        "Params"
      ],
      parameterHintsIgnoredFunctionNames: []
    },
    inlineValues: {
      enable: true,
      showInlineValueForLocalVariables: true,
      showInlineValueForParameters: true,
      showInlineValueForMemberAssignment: true,
      showInlineValueForFunctionThisObject: true
    },
    semanticTokens: {
      enable: true,
      mode: "minimal"
    },
    symbols: {
      enableCoreJson: true,
      enableGameJson: true,
      enableHeader: true,
      baseUserFolderPath: "",
      trackmania2020: {
        enabled: true,
        openplanetCoreJsonPath: "",
        gameJsonPath: "",
        openplanetHeaderPath: ""
      },
      turbo: {
        enabled: false,
        openplanetCoreJsonPath: "",
        gameJsonPath: "",
        openplanetHeaderPath: ""
      },
      openplanet4: {
        enabled: false,
        openplanetCoreJsonPath: "",
        gameJsonPath: "",
        openplanetHeaderPath: ""
      }
    }
  };
}

export function normalizeSettings(raw: unknown): OpenplanetLanguageServerSettings {
  const defaults = createDefaultSettings();
  const root = toRecord(raw);
  const completionRoot = toRecord(root.completion);
  const completionShortcutsRoot = toRecord(completionRoot.shortcuts);
  const diagnosticsRoot = toRecord(root.diagnostics);
  const importsRoot = toRecord(root.imports);
  const parserRoot = toRecord(root.parser);
  const dependencyRoot = toRecord(root.dependencies);
  const symbolRoot = toRecord(root.symbols);
  const inlayHintsRoot = toRecord(root.inlayHints);
  const inlineValuesRoot = toRecord(root.inlineValues);
  const semanticTokenRoot = toRecord(root.semanticTokens);
  const trackmania2020Root = toRecord(symbolRoot.trackmania2020);
  const turboRoot = toRecord(symbolRoot.turbo);
  const openplanet4Root = toRecord(symbolRoot.openplanet4);

  const validateIncludes =
    typeof root.validateIncludes === "boolean"
      ? root.validateIncludes
      : defaults.validateIncludes;

  const includePaths = normalizeStringArray(
    root.includePaths,
    defaults.includePaths
  );

  const maxIncludeDiagnostics = normalizeNumber(
    root.maxIncludeDiagnostics,
    defaults.maxIncludeDiagnostics,
    0
  );

  const importValidationEnabled =
    typeof importsRoot.enable === "boolean"
      ? importsRoot.enable
      : defaults.imports.enable;

  const importPluginRoots = normalizeStringArray(
    importsRoot.pluginRoots,
    defaults.imports.pluginRoots
  );

  const importMaxDiagnostics = normalizeNumber(
    importsRoot.maxDiagnostics,
    defaults.imports.maxDiagnostics,
    0
  );

  const enableUnparsableStatementDiagnostics =
    typeof parserRoot.enableUnparsableStatementDiagnostics === "boolean"
      ? parserRoot.enableUnparsableStatementDiagnostics
      : defaults.parser.enableUnparsableStatementDiagnostics;

  const parserMaxDiagnostics = normalizeNumber(
    parserRoot.maxDiagnostics,
    defaults.parser.maxDiagnostics,
    0
  );

  const parserEnableDebugOutput =
    typeof parserRoot.enableDebugOutput === "boolean"
      ? parserRoot.enableDebugOutput
      : defaults.parser.enableDebugOutput;

  const parserCrashOnParseError =
    typeof parserRoot.crashOnParseError === "boolean"
      ? parserRoot.crashOnParseError
      : defaults.parser.crashOnParseError;

  const enableInfoTomlDependencies =
    typeof dependencyRoot.enableInfoTomlDependencies === "boolean"
      ? dependencyRoot.enableInfoTomlDependencies
      : defaults.dependencies.enableInfoTomlDependencies;

  const includeOptionalDependencies =
    typeof dependencyRoot.includeOptionalDependencies === "boolean"
      ? dependencyRoot.includeOptionalDependencies
      : defaults.dependencies.includeOptionalDependencies;

  const dependencyPluginRoots = normalizeStringArray(
    dependencyRoot.pluginRoots,
    defaults.dependencies.pluginRoots
  );

  const dependencyMaxDepth = normalizeNumber(
    dependencyRoot.maxDepth,
    defaults.dependencies.maxDepth,
    0
  );

  const dependencyMaxFiles = normalizeNumber(
    dependencyRoot.maxFiles,
    defaults.dependencies.maxFiles,
    0
  );

  const enableUnknownSymbols =
    typeof diagnosticsRoot.enableUnknownSymbols === "boolean"
      ? diagnosticsRoot.enableUnknownSymbols
      : defaults.diagnostics.enableUnknownSymbols;

  const enableCaseMismatch =
    typeof diagnosticsRoot.enableCaseMismatch === "boolean"
      ? diagnosticsRoot.enableCaseMismatch
      : defaults.diagnostics.enableCaseMismatch;

  const enableSemanticBinding =
    typeof diagnosticsRoot.enableSemanticBinding === "boolean"
      ? diagnosticsRoot.enableSemanticBinding
      : defaults.diagnostics.enableSemanticBinding ?? true;

  const enableTypeChecking =
    typeof diagnosticsRoot.enableTypeChecking === "boolean"
      ? diagnosticsRoot.enableTypeChecking
      : defaults.diagnostics.enableTypeChecking ?? true;

  const enableCrossGameCompatibility =
    typeof diagnosticsRoot.enableCrossGameCompatibility === "boolean"
      ? diagnosticsRoot.enableCrossGameCompatibility
      : defaults.diagnostics.enableCrossGameCompatibility ?? true;

  const maxSymbolDiagnostics = normalizeNumber(
    diagnosticsRoot.maxSymbolDiagnostics,
    defaults.diagnostics.maxSymbolDiagnostics,
    0
  );

  const completionEnable =
    typeof completionRoot.enable === "boolean"
      ? completionRoot.enable
      : defaults.completion.enable;

  const completionNamespaces = normalizeStringArray(
    completionRoot.namespaces,
    defaults.completion.namespaces
  );

  const completionMaxItems = normalizeNumber(
    completionRoot.maxItems,
    defaults.completion.maxItems,
    50
  );

  const completionShortcutMath =
    typeof completionShortcutsRoot.math === "boolean"
      ? completionShortcutsRoot.math
      : defaults.completion.shortcuts.math;
  const completionShortcutUi =
    typeof completionShortcutsRoot.ui === "boolean"
      ? completionShortcutsRoot.ui
      : defaults.completion.shortcuts.ui;
  const completionShortcutMathX =
    typeof completionShortcutsRoot.mathX === "boolean"
      ? completionShortcutsRoot.mathX
      : defaults.completion.shortcuts.mathX;
  const completionShortcutUx =
    typeof completionShortcutsRoot.ux === "boolean"
      ? completionShortcutsRoot.ux
      : defaults.completion.shortcuts.ux;
  const completionShortcutMat =
    typeof completionShortcutsRoot.mat === "boolean"
      ? completionShortcutsRoot.mat
      : defaults.completion.shortcuts.mat;
  const completionShortcutQuat =
    typeof completionShortcutsRoot.quat === "boolean"
      ? completionShortcutsRoot.quat
      : defaults.completion.shortcuts.quat;
  const completionShortcutString =
    typeof completionShortcutsRoot.string === "boolean"
      ? completionShortcutsRoot.string
      : defaults.completion.shortcuts.string;

  const inlayHintsEnable =
    typeof inlayHintsRoot.enable === "boolean"
      ? inlayHintsRoot.enable
      : defaults.inlayHints.enable;

  const parameterHintsForConstants =
    typeof inlayHintsRoot.parameterHintsForConstants === "boolean"
      ? inlayHintsRoot.parameterHintsForConstants
      : defaults.inlayHints.parameterHintsForConstants;

  const parameterHintsForComplexExpressions =
    typeof inlayHintsRoot.parameterHintsForComplexExpressions === "boolean"
      ? inlayHintsRoot.parameterHintsForComplexExpressions
      : defaults.inlayHints.parameterHintsForComplexExpressions;

  const parameterReferenceHints =
    typeof inlayHintsRoot.parameterReferenceHints === "boolean"
      ? inlayHintsRoot.parameterReferenceHints
      : defaults.inlayHints.parameterReferenceHints;

  const parameterHintsForSingleParameterFunctions =
    typeof inlayHintsRoot.parameterHintsForSingleParameterFunctions === "boolean"
      ? inlayHintsRoot.parameterHintsForSingleParameterFunctions
      : defaults.inlayHints.parameterHintsForSingleParameterFunctions;

  const typeHintsForAutos =
    typeof inlayHintsRoot.typeHintsForAutos === "boolean"
      ? inlayHintsRoot.typeHintsForAutos
      : defaults.inlayHints.typeHintsForAutos;

  const parameterHintsIgnoredParameterNames = normalizeStringArray(
    inlayHintsRoot.parameterHintsIgnoredParameterNames,
    defaults.inlayHints.parameterHintsIgnoredParameterNames
  );

  const parameterHintsIgnoredFunctionNames = normalizeStringArray(
    inlayHintsRoot.parameterHintsIgnoredFunctionNames,
    defaults.inlayHints.parameterHintsIgnoredFunctionNames
  );

  const inlineValuesEnable =
    typeof inlineValuesRoot.enable === "boolean"
      ? inlineValuesRoot.enable
      : defaults.inlineValues.enable;
  const showInlineValueForLocalVariables =
    typeof inlineValuesRoot.showInlineValueForLocalVariables === "boolean"
      ? inlineValuesRoot.showInlineValueForLocalVariables
      : defaults.inlineValues.showInlineValueForLocalVariables;
  const showInlineValueForParameters =
    typeof inlineValuesRoot.showInlineValueForParameters === "boolean"
      ? inlineValuesRoot.showInlineValueForParameters
      : defaults.inlineValues.showInlineValueForParameters;
  const showInlineValueForMemberAssignment =
    typeof inlineValuesRoot.showInlineValueForMemberAssignment === "boolean"
      ? inlineValuesRoot.showInlineValueForMemberAssignment
      : defaults.inlineValues.showInlineValueForMemberAssignment;
  const showInlineValueForFunctionThisObject =
    typeof inlineValuesRoot.showInlineValueForFunctionThisObject === "boolean"
      ? inlineValuesRoot.showInlineValueForFunctionThisObject
      : defaults.inlineValues.showInlineValueForFunctionThisObject;

  const semanticTokensEnable =
    typeof semanticTokenRoot.enable === "boolean"
      ? semanticTokenRoot.enable
      : defaults.semanticTokens.enable;

  const semanticTokenMode =
    semanticTokenRoot.mode === "balanced" || semanticTokenRoot.mode === "minimal"
      ? semanticTokenRoot.mode
      : defaults.semanticTokens.mode;

  const enableCoreJson =
    typeof symbolRoot.enableCoreJson === "boolean"
      ? symbolRoot.enableCoreJson
      : defaults.symbols.enableCoreJson;

  const enableGameJson =
    typeof symbolRoot.enableGameJson === "boolean"
      ? symbolRoot.enableGameJson
      : typeof symbolRoot.enableNextJson === "boolean"
        ? (symbolRoot.enableNextJson as boolean)
        : defaults.symbols.enableGameJson;

  const enableHeader =
    typeof symbolRoot.enableHeader === "boolean"
      ? symbolRoot.enableHeader
      : defaults.symbols.enableHeader;

  const baseUserFolderPath = normalizeString(
    symbolRoot.baseUserFolderPath,
    defaults.symbols.baseUserFolderPath
  );

  const legacyTrackmaniaCoreJsonPath = normalizeString(
    symbolRoot.openplanetCoreJsonPath,
    ""
  );

  const legacyTrackmaniaGameJsonPath = normalizeString(
    symbolRoot.openplanetNextJsonPath,
    ""
  );

  const legacyTrackmaniaHeaderPath = normalizeString(
    symbolRoot.openplanetHeaderPath,
    ""
  );

  const trackmania2020 = normalizeGameSourceSettings(
    trackmania2020Root,
    defaults.symbols.trackmania2020,
    {
      openplanetCoreJsonPath: legacyTrackmaniaCoreJsonPath,
      gameJsonPath: legacyTrackmaniaGameJsonPath,
      openplanetHeaderPath: legacyTrackmaniaHeaderPath
    }
  );

  const turbo = normalizeGameSourceSettings(turboRoot, defaults.symbols.turbo);

  const openplanet4 = normalizeGameSourceSettings(
    openplanet4Root,
    defaults.symbols.openplanet4
  );

  return {
    validateIncludes,
    includePaths,
    maxIncludeDiagnostics,
    imports: {
      enable: importValidationEnabled,
      pluginRoots: importPluginRoots,
      maxDiagnostics: importMaxDiagnostics
    },
    parser: {
      enableUnparsableStatementDiagnostics,
      enableDebugOutput: parserEnableDebugOutput,
      crashOnParseError: parserCrashOnParseError,
      maxDiagnostics: parserMaxDiagnostics
    },
    dependencies: {
      enableInfoTomlDependencies,
      includeOptionalDependencies,
      pluginRoots: dependencyPluginRoots,
      maxDepth: dependencyMaxDepth,
      maxFiles: dependencyMaxFiles
    },
    diagnostics: {
      enableUnknownSymbols,
      enableCaseMismatch,
      enableSemanticBinding,
      enableTypeChecking,
      enableCrossGameCompatibility,
      maxSymbolDiagnostics
    },
    completion: {
      enable: completionEnable,
      namespaces: completionNamespaces,
      maxItems: completionMaxItems,
      shortcuts: {
        math: completionShortcutMath,
        ui: completionShortcutUi,
        mathX: completionShortcutMathX,
        ux: completionShortcutUx,
        mat: completionShortcutMat,
        quat: completionShortcutQuat,
        string: completionShortcutString
      }
    },
    inlayHints: {
      enable: inlayHintsEnable,
      parameterHintsForConstants,
      parameterHintsForComplexExpressions,
      parameterReferenceHints,
      parameterHintsForSingleParameterFunctions,
      typeHintsForAutos,
      parameterHintsIgnoredParameterNames,
      parameterHintsIgnoredFunctionNames
    },
    inlineValues: {
      enable: inlineValuesEnable,
      showInlineValueForLocalVariables,
      showInlineValueForParameters,
      showInlineValueForMemberAssignment,
      showInlineValueForFunctionThisObject
    },
    semanticTokens: {
      enable: semanticTokensEnable,
      mode: semanticTokenMode
    },
    symbols: {
      enableCoreJson,
      enableGameJson,
      enableHeader,
      baseUserFolderPath,
      trackmania2020,
      turbo,
      openplanet4
    }
  };
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return normalized.length > 0 ? [...new Set(normalized)] : [...fallback];
}

function normalizeNumber(value: unknown, fallback: number, min: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.floor(value));
}

function normalizeGameSourceSettings(
  raw: Record<string, unknown>,
  defaults: GameSymbolSourceSettings,
  legacyOverride?: Partial<Omit<GameSymbolSourceSettings, "enabled">>
): GameSymbolSourceSettings {
  const enabled =
    typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled;

  const openplanetCoreJsonPath = normalizeString(
    raw.openplanetCoreJsonPath,
    defaults.openplanetCoreJsonPath
  );

  const gameJsonPath = normalizeString(raw.gameJsonPath, defaults.gameJsonPath);

  const openplanetHeaderPath = normalizeString(
    raw.openplanetHeaderPath,
    defaults.openplanetHeaderPath
  );

  return {
    enabled,
    openplanetCoreJsonPath:
      openplanetCoreJsonPath.length > 0
        ? openplanetCoreJsonPath
        : legacyOverride?.openplanetCoreJsonPath ??
          defaults.openplanetCoreJsonPath,
    gameJsonPath:
      gameJsonPath.length > 0
        ? gameJsonPath
        : legacyOverride?.gameJsonPath ?? defaults.gameJsonPath,
    openplanetHeaderPath:
      openplanetHeaderPath.length > 0
        ? openplanetHeaderPath
        : legacyOverride?.openplanetHeaderPath ?? defaults.openplanetHeaderPath
  };
}
