import type { CompletionItem } from "vscode-languageserver/node";
import type {
  SemanticTypeKind,
  SemanticSymbolSource,
  SemanticTypeRegistry
} from "openplanet-angelscript-core";

export interface CompletionShortcutSettings {
  math: boolean;
  ui: boolean;
  mathX: boolean;
  ux: boolean;
  mat: boolean;
  quat: boolean;
  string: boolean;
}

export interface CompletionSettings {
  enable: boolean;
  namespaces: string[];
  maxItems: number;
  shortcuts: CompletionShortcutSettings;
}

export interface InlayHintSettings {
  enable: boolean;
  parameterHintsForConstants: boolean;
  parameterHintsForComplexExpressions: boolean;
  parameterReferenceHints: boolean;
  parameterHintsForSingleParameterFunctions: boolean;
  typeHintsForAutos: boolean;
  parameterHintsIgnoredParameterNames: string[];
  parameterHintsIgnoredFunctionNames: string[];
}

export interface InlineValueSettings {
  enable: boolean;
  showInlineValueForLocalVariables: boolean;
  showInlineValueForParameters: boolean;
  showInlineValueForMemberAssignment: boolean;
  showInlineValueForFunctionThisObject: boolean;
}

export type SemanticTokenMode = "minimal" | "balanced";

export interface SemanticTokenSettings {
  enable: boolean;
  mode: SemanticTokenMode;
}

export interface DiagnosticSettings {
  enableUnknownSymbols: boolean;
  enableCaseMismatch: boolean;
  enableSemanticBinding?: boolean;
  enableTypeChecking?: boolean;
  maxSymbolDiagnostics: number;
}

export interface ImportValidationSettings {
  enable: boolean;
  pluginRoots: string[];
  maxDiagnostics: number;
}

export interface ParserSettings {
  enableUnparsableStatementDiagnostics: boolean;
  enableDebugOutput?: boolean;
  crashOnParseError?: boolean;
  maxDiagnostics: number;
}

export interface DependencySettings {
  enableInfoTomlDependencies: boolean;
  includeOptionalDependencies: boolean;
  pluginRoots: string[];
  maxDepth: number;
  maxFiles: number;
}

export interface GameSymbolSourceSettings {
  enabled: boolean;
  openplanetCoreJsonPath: string;
  gameJsonPath: string;
  openplanetHeaderPath: string;
}

export interface SymbolSettings {
  enableCoreJson: boolean;
  enableGameJson: boolean;
  enableHeader: boolean;
  baseUserFolderPath: string;
  trackmania2020: GameSymbolSourceSettings;
  turbo: GameSymbolSourceSettings;
  openplanet4: GameSymbolSourceSettings;
}

export interface OpenplanetLanguageServerSettings {
  validateIncludes: boolean;
  includePaths: string[];
  maxIncludeDiagnostics: number;
  imports: ImportValidationSettings;
  parser: ParserSettings;
  dependencies: DependencySettings;
  diagnostics: DiagnosticSettings;
  completion: CompletionSettings;
  inlayHints: InlayHintSettings;
  inlineValues: InlineValueSettings;
  semanticTokens: SemanticTokenSettings;
  symbols: SymbolSettings;
}

export interface CompletionBucket {
  items: CompletionItem[];
  seen: Set<string>;
  functionByLabel: Map<string, CompletionItem>;
}

export type TypeMemberKind = "property" | "method";

export interface TypeMemberInfo {
  name: string;
  kind: TypeMemberKind;
  type?: string;
  returnType?: string;
  args?: string;
}

export interface TypeInfo {
  fullName: string;
  shortName: string;
  namespace: string;
  kind?: SemanticTypeKind;
  source?: SemanticSymbolSource;
  parentShortName?: string;
  members: TypeMemberInfo[];
  enumMembers?: string[];
}

export interface CompletionIndex {
  global: CompletionBucket;
  namespaceBuckets: Map<string, CompletionBucket>;
  namespaceChildren: Map<string, Set<string>>;
  semanticTypes: SemanticTypeRegistry;
  typeInfoByFullName: Map<string, TypeInfo>;
  typeFullNamesByShortName: Map<string, string[]>;
  gameTypeFullNames: Set<string>;
  resolvedMembersCache: Map<string, TypeMemberInfo[]>;
  resolvedMemberCompletionsCache: Map<string, CompletionItem[]>;
  coreGlobalFunctionNames: Set<string>;
  coreGlobalFuncdefNames: Set<string>;
  coreGlobalValueNames: Set<string>;
  coreFunctionReturnTypes: Map<string, string>;
  coreFunctionSignatures: Map<string, string[]>;
  coreFunctionSignaturesByQualifiedName: Map<string, string[]>;
}

export interface TypeResolutionContext {
  localVariableTypes: Map<string, string>;
  localFunctionReturnTypes: Map<string, string>;
}

export type GameIdentifier = "trackmania2020" | "turbo" | "openplanet4";

export interface GameDefinition {
  id: GameIdentifier;
  folder: string;
  gameJsonFile: string;
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}
