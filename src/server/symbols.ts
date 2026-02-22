import * as fs from "fs/promises";
import * as path from "path";
import {
  CompletionItemKind
} from "vscode-languageserver/node";
import type {
  CompletionIndex,
  GameDefinition,
  GameIdentifier,
  GameSymbolSourceSettings,
  Logger,
  OpenplanetLanguageServerSettings,
  SymbolSettings
} from "./types";
import { addSymbol, createCompletionIndex, registerNamespacePath } from "./completions";
import {
  registerCoreClassTypeInfo,
  registerGameTypeInfo,
  registerNamedTypeInfo
} from "./members";
import {
  getBaseUserFolderPath,
  readString,
  resolveConfiguredOrDefaultPath,
  toObjectArray,
  toRecord
} from "./util";

const gameDefinitions: GameDefinition[] = [
  {
    id: "trackmania2020",
    folder: "OpenplanetNext",
    gameJsonFile: "OpenplanetNext.json"
  },
  {
    id: "turbo",
    folder: "OpenplanetTurbo",
    gameJsonFile: "OpenplanetTurbo.json"
  },
  {
    id: "openplanet4",
    folder: "Openplanet4",
    gameJsonFile: "Openplanet4.json"
  }
];

export async function buildCompletionIndex(
  desiredSettings: OpenplanetLanguageServerSettings,
  logger: Logger
): Promise<CompletionIndex> {
  const index = createCompletionIndex();
  const baseUserFolderPath = getBaseUserFolderPath(
    desiredSettings.symbols.baseUserFolderPath
  );

  for (const namespaceName of desiredSettings.completion.namespaces) {
    registerNamespacePath(index, namespaceName);
  }

  for (const gameDefinition of gameDefinitions) {
    const gameSettings = getGameSourceSettings(
      desiredSettings.symbols,
      gameDefinition.id
    );
    if (!gameSettings.enabled) {
      continue;
    }

    const gameBasePath = path.join(baseUserFolderPath, gameDefinition.folder);

    if (desiredSettings.symbols.enableCoreJson) {
      const corePath = resolveConfiguredOrDefaultPath(
        gameSettings.openplanetCoreJsonPath,
        path.join(gameBasePath, "OpenplanetCore.json")
      );
      await loadCoreSymbolsFromJson(corePath, index, logger);
    }

    if (desiredSettings.symbols.enableGameJson) {
      const gameJsonPath = resolveConfiguredOrDefaultPath(
        gameSettings.gameJsonPath,
        path.join(gameBasePath, gameDefinition.gameJsonFile)
      );
      await loadNextSymbolsFromJson(gameJsonPath, index, logger);
    }

    if (desiredSettings.symbols.enableHeader) {
      const headerPath = resolveConfiguredOrDefaultPath(
        gameSettings.openplanetHeaderPath,
        path.join(gameBasePath, "Openplanet.h")
      );
      await loadHeaderSymbolsFromHeader(headerPath, index, logger);
    }
  }

  return index;
}

function getGameSourceSettings(
  symbolSettings: SymbolSettings,
  gameId: GameIdentifier
): GameSymbolSourceSettings {
  switch (gameId) {
    case "trackmania2020":
      return symbolSettings.trackmania2020;
    case "turbo":
      return symbolSettings.turbo;
    case "openplanet4":
      return symbolSettings.openplanet4;
  }
}

async function loadCoreSymbolsFromJson(
  filePath: string,
  index: CompletionIndex,
  logger: Logger
): Promise<void> {
  const parsed = await readJsonFile(filePath, logger);
  if (!parsed) {
    return;
  }

  const root = toRecord(parsed);

  for (const entry of toObjectArray(root.functions)) {
    const name = readString(entry.name);
    if (!name) {
      continue;
    }

    const namespaceName = readString(entry.ns);
    const isGlobalNamespace = !namespaceName || namespaceName.length === 0;
    const qualifiedName = isGlobalNamespace ? name : `${namespaceName}::${name}`;

    const decl = readString(entry.decl);
    if (decl) {
      const returnType = parseReturnTypeFromDecl(decl, name);
      if (isGlobalNamespace && returnType) {
        index.coreFunctionReturnTypes.set(name, returnType);
      }

      if (isGlobalNamespace) {
        const signatures = index.coreFunctionSignatures.get(name) ?? [];
        if (!signatures.includes(decl)) {
          signatures.push(decl);
          index.coreFunctionSignatures.set(name, signatures);
        }
      }

      const qualifiedSignatures =
        index.coreFunctionSignaturesByQualifiedName.get(qualifiedName) ?? [];
      if (!qualifiedSignatures.includes(decl)) {
        qualifiedSignatures.push(decl);
        index.coreFunctionSignaturesByQualifiedName.set(
          qualifiedName,
          qualifiedSignatures
        );
      }
    }

    if (isGlobalNamespace) {
      index.coreGlobalFunctionNames.add(name);
    }

    addSymbol(index, namespaceName, {
      label: name,
      kind: CompletionItemKind.Function,
      detail: decl ?? "Openplanet function",
      documentation: readString(entry.desc)
    });
  }

  for (const entry of toObjectArray(root.props)) {
    const name = readString(entry.name);
    if (!name) {
      continue;
    }

    const namespaceName = readString(entry.ns);
    if (!namespaceName || namespaceName.length === 0) {
      index.coreGlobalValueNames.add(name);
    }
    const typeDecl = readString(entry.typedecl);
    addSymbol(index, namespaceName, {
      label: name,
      kind: CompletionItemKind.Field,
      detail: typeDecl ? `${typeDecl} property` : "Openplanet property",
      documentation: readString(entry.desc)
    });
  }

  for (const entry of toObjectArray(root.funcdefs)) {
    const name = readString(entry.name);
    if (!name) {
      continue;
    }

    const namespaceName = readString(entry.ns);
    const fullName =
      namespaceName && namespaceName.length > 0 ? `${namespaceName}::${name}` : name;

    registerNamedTypeInfo(index, fullName);

    if (!namespaceName || namespaceName.length === 0) {
      index.coreGlobalFuncdefNames.add(name);
    }
    addSymbol(index, namespaceName, {
      label: name,
      kind: CompletionItemKind.Interface,
      detail: readString(entry.decl) ?? "Openplanet funcdef",
      documentation: readString(entry.desc)
    });
  }

  for (const entry of toObjectArray(root.enums)) {
    const enumName = readString(entry.name);
    if (!enumName) {
      continue;
    }

    const namespaceName = readString(entry.ns);
    const enumScopeName =
      namespaceName && namespaceName.length > 0
        ? `${namespaceName}::${enumName}`
        : enumName;

    registerNamedTypeInfo(index, enumScopeName);
    registerNamespacePath(index, enumScopeName);

    if (!namespaceName || namespaceName.length === 0) {
      index.coreGlobalValueNames.add(enumName);
    }
    addSymbol(index, namespaceName, {
      label: enumName,
      kind: CompletionItemKind.Enum,
      detail: "Openplanet enum",
      documentation: readString(entry.desc)
    });

    const values = toRecord(entry.values);
    for (const valueName of Object.keys(values)) {
      if (!namespaceName || namespaceName.length === 0) {
        index.coreGlobalValueNames.add(valueName);
      }

      addSymbol(index, enumScopeName, {
        label: valueName,
        kind: CompletionItemKind.EnumMember,
        detail: `Enum value (${enumName})`
      });
    }
  }

  for (const entry of toObjectArray(root.classes)) {
    const rawName = readString(entry.name);
    if (!rawName) {
      continue;
    }

    const rawNs = readString(entry.ns);
    const className =
      rawNs && !rawName.includes("::") ? `${rawNs}::${rawName}` : rawName;

    const splitIndex = className.lastIndexOf("::");
    const namespaceName =
      splitIndex >= 0 ? className.slice(0, splitIndex) : undefined;
    const displayName =
      splitIndex >= 0 ? className.slice(splitIndex + 2) : className;

    addSymbol(index, namespaceName, {
      label: displayName,
      kind: CompletionItemKind.Class,
      detail: "Openplanet class"
    });

    registerCoreClassTypeInfo(index, className, entry);
  }

  logger.info(`[symbols] Loaded Openplanet core symbols from ${filePath}`);
}

async function loadNextSymbolsFromJson(
  filePath: string,
  index: CompletionIndex,
  logger: Logger
): Promise<void> {
  const parsed = await readJsonFile(filePath, logger);
  if (!parsed) {
    return;
  }

  const root = toRecord(parsed);
  const namespaces = toRecord(root.ns);

  for (const [namespaceName, namespaceValue] of Object.entries(namespaces)) {
    registerNamespacePath(index, namespaceName);

    const namespaceRecord = toRecord(namespaceValue);
    for (const [typeName, typeValue] of Object.entries(namespaceRecord)) {
      const typeRecord = toRecord(typeValue);
      if (!looksLikeGameTypeRecord(typeRecord)) {
        continue;
      }

      addSymbol(index, undefined, {
        label: typeName,
        kind: CompletionItemKind.Class,
        detail: `Openplanet engine type (${namespaceName})`
      });

      registerGameTypeInfo(index, namespaceName, typeName, typeRecord);
    }
  }

  logger.info(`[symbols] Loaded Openplanet game namespaces from ${filePath}`);
}

function looksLikeGameTypeRecord(record: Record<string, unknown>): boolean {
  return (
    "i" in record ||
    "s" in record ||
    "m" in record ||
    "p" in record ||
    "c" in record
  );
}

async function loadHeaderSymbolsFromHeader(
  filePath: string,
  index: CompletionIndex,
  logger: Logger
): Promise<void> {
  let raw = "";

  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`[symbols] Failed to load ${filePath}: ${message}`);
    return;
  }

  const namespacePattern = /using\s+namespace\s+([A-Za-z_][A-Za-z0-9_:]*)\s*;/g;
  let namespaceMatch: RegExpExecArray | null;
  while ((namespaceMatch = namespacePattern.exec(raw)) !== null) {
    registerNamespacePath(index, namespaceMatch[1]);
  }

  const typePattern = /\b(?:struct|class)\s+([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let typeMatch: RegExpExecArray | null;
  while ((typeMatch = typePattern.exec(raw)) !== null) {
    addSymbol(index, undefined, {
      label: typeMatch[1],
      kind: CompletionItemKind.Class,
      detail: "Openplanet header type"
    });
  }

  logger.info(`[symbols] Loaded Openplanet header symbols from ${filePath}`);
}

async function readJsonFile(
  filePath: string,
  logger: Logger
): Promise<unknown | undefined> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`[symbols] Failed to load ${filePath}: ${message}`);
    return undefined;
  }
}

function parseReturnTypeFromDecl(
  decl: string,
  functionName: string
): string | undefined {
  const nameIndex = decl.indexOf(functionName);
  if (nameIndex < 0) {
    return undefined;
  }

  const beforeName = decl.slice(0, nameIndex).trim();
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
