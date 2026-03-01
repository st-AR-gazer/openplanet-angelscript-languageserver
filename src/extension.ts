import * as fs from "fs/promises";
import type { Dirent } from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  RequestType,
  RequestType0,
  ServerOptions,
  TransportKind
} from "vscode-languageclient/node";

let languageServerClient: LanguageClient | undefined;

interface LspLikePosition {
  line: number;
  character: number;
}

interface LspLikeRange {
  start: LspLikePosition;
  end: LspLikePosition;
}

interface LspLikeLocation {
  uri: string;
  range: LspLikeRange;
}

interface InlineValuesRequestParams {
  textDocument: {
    uri: string;
  };
  range: LspLikeRange;
}

type InlineValuePayload =
  | {
    kind: "variableLookup";
    range: LspLikeRange;
    variableName: string;
    caseSensitiveLookup?: boolean;
  }
  | {
    kind: "evaluatableExpression";
    range: LspLikeRange;
    expression?: string;
  }
  | {
    kind: "text";
    range: LspLikeRange;
    text: string;
  };

interface FileDecorationPayload {
  badge?: string;
  tooltip?: string;
  color?: string;
  propagate?: boolean;
}

interface ReloadInfoTomlResult {
  indexedFiles: number;
}

interface ImportSourceMatch {
  kind: "folder" | "op";
  path: string;
}

const provideInlineValuesRequest = new RequestType<
  InlineValuesRequestParams,
  InlineValuePayload[],
  void
>("openplanet/provideInlineValues");
const provideFileDecorationRequest = new RequestType<
  string,
  FileDecorationPayload | null,
  void
>("openplanet/provideFileDecoration");
const reloadInfoTomlRequest = new RequestType0<
  ReloadInfoTomlResult,
  void
>("openplanet/reloadInfoToml");

class OpenplanetInlineValuesProvider implements vscode.InlineValuesProvider {
  public async provideInlineValues(
    document: vscode.TextDocument,
    viewPort: vscode.Range,
    _context: vscode.InlineValueContext,
    _token: vscode.CancellationToken
  ): Promise<vscode.InlineValue[]> {
    const client = languageServerClient;
    if (!client) {
      return [];
    }

    const payload = await client.sendRequest(provideInlineValuesRequest, {
      textDocument: { uri: document.uri.toString() },
      range: toLspRange(viewPort)
    });
    return (payload ?? []).map((item) => toInlineValue(item));
  }
}

class OpenplanetFileDecorationProvider
  implements vscode.FileDecorationProvider, vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[]>();

  public readonly onDidChangeFileDecorations = this.emitter.event;

  public fire(uris: readonly vscode.Uri[]): void {
    if (uris.length === 0) {
      return;
    }
    this.emitter.fire([...uris]);
  }

  public async provideFileDecoration(
    uri: vscode.Uri,
    _token: vscode.CancellationToken
  ): Promise<vscode.FileDecoration | undefined> {
    const client = languageServerClient;
    if (!client) {
      return undefined;
    }

    const payload = await client.sendRequest(provideFileDecorationRequest, uri.toString());
    if (!payload) {
      return undefined;
    }

    const decoration = new vscode.FileDecoration(
      payload.badge,
      payload.tooltip,
      payload.color ? new vscode.ThemeColor(payload.color) : undefined
    );
    if (typeof payload.propagate === "boolean") {
      decoration.propagate = payload.propagate;
    }
    return decoration;
  }

  public dispose(): void {
    this.emitter.dispose();
  }
}

function createServerOptions(context: vscode.ExtensionContext): ServerOptions {
  const serverModule = context.asAbsolutePath(path.join("out", "server.js"));
  const debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  return {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };
}

async function startClient(context: vscode.ExtensionContext): Promise<void> {
  if (languageServerClient) {
    return;
  }

  const config = vscode.workspace.getConfiguration("openplanetLanguageServer");
  const enabled = config.get<boolean>("enable", true);
  if (!enabled) {
    return;
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "openplanet-angelscript" },
      { scheme: "untitled", language: "openplanet-angelscript" }
    ],
    synchronize: {
      configurationSection: "openplanetLanguageServer"
    }
  };

  languageServerClient = new LanguageClient(
    "openplanet-angelscript-language-server",
    "Openplanet AngelScript Language Server",
    createServerOptions(context),
    clientOptions
  );

  await languageServerClient.start();
}

async function stopClient(): Promise<void> {
  if (!languageServerClient) {
    return;
  }

  const runningClient = languageServerClient;
  languageServerClient = undefined;
  await runningClient.stop();
}

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "openplanet-angelscript",
      new OpenplanetDebugConfigurationProvider()
    )
  );

  const inlineValuesProvider = new OpenplanetInlineValuesProvider();
  const fileDecorationProvider = new OpenplanetFileDecorationProvider();
  context.subscriptions.push(
    vscode.languages.registerInlineValuesProvider(
      { language: "openplanet-angelscript" },
      inlineValuesProvider
    )
  );
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(fileDecorationProvider)
  );
  context.subscriptions.push(fileDecorationProvider);
  context.subscriptions.push(
    vscode.languages.onDidChangeDiagnostics((event) => {
      fileDecorationProvider.fire(event.uris);
    })
  );

  await startClient(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("openplanetLanguageServer.restartServer", async () => {
      await stopClient();
      await startClient(context);
      void vscode.window.showInformationMessage(
        "Openplanet language server restarted."
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "openplanetLanguageServer.reloadInfoToml",
      async () => {
        const client = languageServerClient;
        if (!client) {
          void vscode.window.showWarningMessage(
            "Openplanet language server is not running."
          );
          return;
        }

        try {
          const result = await client.sendRequest(reloadInfoTomlRequest);
          const indexedFiles = result?.indexedFiles ?? 0;
          void vscode.window.showInformationMessage(
            `Reloaded info.toml dependencies. Indexed files: ${indexedFiles}.`
          );
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          void vscode.window.showErrorMessage(
            `Failed to reload info.toml dependencies: ${message}`
          );
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "openplanetLanguageServer.copyImportPath",
      async (resource?: vscode.Uri) => {
        const targetUri = getTargetUri(resource);
        if (!targetUri || targetUri.scheme !== "file") {
          void vscode.window.showWarningMessage(
            "Select a local file or folder to copy an import path."
          );
          return;
        }

        const pluginRoots = await resolvePluginRoots();
        const moduleName = deriveImportModuleName(targetUri.fsPath, pluginRoots);
        if (!moduleName) {
          void vscode.window.showWarningMessage(
            "Unable to determine import module name for the selected path."
          );
          return;
        }

        await vscode.env.clipboard.writeText(moduleName);
        void vscode.window.showInformationMessage(
          `Copied import module: ${moduleName}`
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "openplanetLanguageServer.addImport",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== "openplanet-angelscript") {
          void vscode.window.showWarningMessage(
            "Open an Openplanet AngelScript editor to add imports."
          );
          return;
        }

        const pluginRoots = await resolvePluginRoots();
        const modules = await collectPluginModuleNames(pluginRoots);
        if (modules.length === 0) {
          void vscode.window.showWarningMessage(
            "No import modules found in configured plugin roots."
          );
          return;
        }

        const selectedModule = await vscode.window.showQuickPick(modules, {
          placeHolder: "Select module for import statement"
        });
        if (!selectedModule) {
          return;
        }

        const symbolName = getSelectedSymbolName(editor) ?? "ImportedFunc";
        if (documentAlreadyHasImport(editor.document, symbolName, selectedModule)) {
          void vscode.window.showInformationMessage(
            `Import for "${symbolName}" from "${selectedModule}" already exists.`
          );
          return;
        }

        const insertLine = findImportInsertLine(editor.document);
        const insertPos = new vscode.Position(insertLine, 0);
        const nextLineText =
          insertLine < editor.document.lineCount
            ? editor.document.lineAt(insertLine).text.trim()
            : "";
        const suffixBlankLine = nextLineText.length > 0 ? "\n" : "";
        const snippet = new vscode.SnippetString(
          `import \${1:void} \${2:${escapeSnippet(symbolName)}}(\${3:void}) from "${escapeSnippet(
            selectedModule
          )}";\n${suffixBlankLine}\${0}`
        );
        await editor.insertSnippet(snippet, insertPos);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "openplanetLanguageServer.quickOpenImport",
      async () => {
        const editor = vscode.window.activeTextEditor;
        const moduleName =
          (editor ? getImportModuleOnCurrentLine(editor) : undefined) ?? "";
        if (!moduleName) {
          await vscode.commands.executeCommand("workbench.action.quickOpen", "");
          return;
        }

        const pluginRoots = await resolvePluginRoots();
        const matches = await findImportSourceMatches(moduleName, pluginRoots);
        if (matches.length === 0) {
          await vscode.commands.executeCommand(
            "workbench.action.quickOpen",
            moduleName
          );
          return;
        }

        let selectedMatch = matches[0];
        if (matches.length > 1) {
          const selectedPath = await vscode.window.showQuickPick(
            matches.map((entry) => entry.path),
            {
              placeHolder: `Multiple matches for "${moduleName}" - select source`
            }
          );
          if (!selectedPath) {
            return;
          }
          const found = matches.find((entry) => entry.path === selectedPath);
          if (!found) {
            return;
          }
          selectedMatch = found;
        }

        await openImportMatch(selectedMatch);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("openplanetLanguageServer.goToSymbol", async () => {
      const editor = vscode.window.activeTextEditor;
      const seed = editor ? getSelectedSymbolName(editor) : undefined;
      await vscode.commands.executeCommand(
        "workbench.action.quickOpen",
        `#${seed ?? ""}`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "openplanetLanguageServer.parenCompletion",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== "openplanet-angelscript") {
          return;
        }

        await vscode.commands.executeCommand("acceptSelectedSuggestion");

        const shouldInsertParens = vscode.workspace
          .getConfiguration("openplanetLanguageServer")
          .get<boolean>("completion.insertParenthesesOnFunctionCompletion", false);
        if (!shouldInsertParens) {
          return;
        }

        const selection = editor.selection.active;
        const lineText = editor.document.lineAt(selection.line).text;
        if (lineText[selection.character] === "(") {
          return;
        }

        await editor.insertSnippet(
          new vscode.SnippetString("($0)"),
          selection,
          {
            undoStopBefore: false,
            undoStopAfter: true
          }
        );

        await vscode.commands.executeCommand("editor.action.triggerParameterHints");
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "openplanetLanguageServer.showReferences",
      async (
        uriText: string,
        positionLike: LspLikePosition,
        locationLikes: LspLikeLocation[]
      ) => {
        const uri = vscode.Uri.parse(uriText);
        const position = new vscode.Position(
          positionLike.line,
          positionLike.character
        );
        const locations = (locationLikes ?? []).map((locationLike) => {
          const start = new vscode.Position(
            locationLike.range.start.line,
            locationLike.range.start.character
          );
          const end = new vscode.Position(
            locationLike.range.end.line,
            locationLike.range.end.character
          );
          return new vscode.Location(
            vscode.Uri.parse(locationLike.uri),
            new vscode.Range(start, end)
          );
        });

        await vscode.commands.executeCommand(
          "editor.action.showReferences",
          uri,
          position,
          locations
        );
      }
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (!event.affectsConfiguration("openplanetLanguageServer.enable")) {
        return;
      }

      const enabled = vscode.workspace
        .getConfiguration("openplanetLanguageServer")
        .get<boolean>("enable", true);

      if (enabled) {
        await startClient(context);
        return;
      }

      await stopClient();
    })
  );
}

export async function deactivate(): Promise<void> {
  await stopClient();
}

function toLspRange(range: vscode.Range): LspLikeRange {
  return {
    start: {
      line: range.start.line,
      character: range.start.character
    },
    end: {
      line: range.end.line,
      character: range.end.character
    }
  };
}

function toVsCodeRange(range: LspLikeRange): vscode.Range {
  return new vscode.Range(
    new vscode.Position(range.start.line, range.start.character),
    new vscode.Position(range.end.line, range.end.character)
  );
}

function toInlineValue(payload: InlineValuePayload): vscode.InlineValue {
  const range = toVsCodeRange(payload.range);

  if (payload.kind === "variableLookup") {
    return new vscode.InlineValueVariableLookup(
      range,
      payload.variableName,
      payload.caseSensitiveLookup ?? true
    );
  }

  if (payload.kind === "evaluatableExpression") {
    return new vscode.InlineValueEvaluatableExpression(range, payload.expression);
  }

  return new vscode.InlineValueText(range, payload.text);
}

class OpenplanetDebugConfigurationProvider
  implements vscode.DebugConfigurationProvider {
  public resolveDebugConfiguration(
    _folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration
  ): vscode.ProviderResult<vscode.DebugConfiguration> {
    if (config.type || config.request || config.name) {
      return config;
    }

    const editor = vscode.window.activeTextEditor;
    if (editor?.document.languageId !== "openplanet-angelscript") {
      return config;
    }

    return {
      type: "openplanet-angelscript",
      name: "Debug Openplanet AngelScript",
      request: "launch",
      port: 27099
    };
  }
}

function getTargetUri(resource?: vscode.Uri): vscode.Uri | undefined {
  if (resource) {
    return resource;
  }

  return vscode.window.activeTextEditor?.document.uri;
}

async function resolvePluginRoots(): Promise<string[]> {
  const config = vscode.workspace.getConfiguration("openplanetLanguageServer");
  const configuredRoots = config.get<string[]>("imports.pluginRoots", []);
  const baseUserFolderPath = config.get<string>("symbols.baseUserFolderPath", "");
  const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
  const candidates = new Set<string>();

  if (configuredRoots.length > 0) {
    for (const configuredRoot of configuredRoots) {
      if (path.isAbsolute(configuredRoot)) {
        candidates.add(path.normalize(resolveUserPath(configuredRoot)));
        continue;
      }

      for (const folder of workspaceFolders) {
        candidates.add(path.normalize(path.resolve(folder.uri.fsPath, configuredRoot)));
      }
    }
  } else {
    const baseFolder =
      baseUserFolderPath.trim().length > 0
        ? resolveUserPath(baseUserFolderPath)
        : os.homedir();
    candidates.add(path.normalize(path.join(baseFolder, "OpenplanetNext", "Plugins")));
    for (const folder of workspaceFolders) {
      candidates.add(path.normalize(path.join(folder.uri.fsPath, "plugins")));
    }
  }

  const roots = [...candidates];
  const existingChecks = await Promise.all(
    roots.map(async (candidate) => {
      try {
        const stats = await fs.stat(candidate);
        return stats.isDirectory() ? candidate : undefined;
      } catch {
        return undefined;
      }
    })
  );

  return existingChecks
    .filter((entry): entry is string => typeof entry === "string")
    .sort((left, right) => left.localeCompare(right));
}

function resolveUserPath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.startsWith("~")) {
    const suffix = trimmed.slice(1).replace(/^[/\\]/, "");
    return path.join(os.homedir(), suffix);
  }

  return path.resolve(trimmed);
}

function deriveImportModuleName(
  targetPath: string,
  pluginRoots: string[]
): string | undefined {
  const normalizedTarget = path.normalize(targetPath);
  const lowerTarget = normalizedTarget.toLowerCase();
  if (lowerTarget.endsWith(".op")) {
    return path.basename(normalizedTarget, path.extname(normalizedTarget));
  }

  const sortedRoots = pluginRoots
    .slice()
    .sort((left, right) => right.length - left.length);
  for (const root of sortedRoots) {
    const normalizedRoot = path.normalize(root);
    const relative = path.relative(normalizedRoot, normalizedTarget);
    if (
      !relative ||
      relative.startsWith("..") ||
      path.isAbsolute(relative)
    ) {
      continue;
    }

    const segments = relative
      .split(path.sep)
      .filter((segment) => segment.length > 0);
    if (segments.length === 0) {
      continue;
    }

    const first = segments[0];
    if (first.toLowerCase().endsWith(".op")) {
      return first.slice(0, -3);
    }
    return first;
  }

  const statsGuessIsFile =
    path.extname(normalizedTarget).length > 0 &&
    path.basename(normalizedTarget).includes(".");
  const fallbackDir = statsGuessIsFile
    ? path.basename(path.dirname(normalizedTarget))
    : path.basename(normalizedTarget);
  return fallbackDir || undefined;
}

async function collectPluginModuleNames(pluginRoots: string[]): Promise<string[]> {
  const modules = new Set<string>();

  for (const pluginRoot of pluginRoots) {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(pluginRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(pluginRoot, entry.name);
      const entryKind = await resolveDirentKind(pluginRoot, entry);
      if (entryKind === "directory") {
        modules.add(entry.name);
        continue;
      }

      if (entryKind === "file" && entry.name.toLowerCase().endsWith(".op")) {
        modules.add(entry.name.slice(0, -3));
      }
    }
  }

  return [...modules].sort((left, right) => left.localeCompare(right));
}

function getSelectedSymbolName(editor: vscode.TextEditor): string | undefined {
  const selectedText = editor.document.getText(editor.selection).trim();
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(selectedText)) {
    return selectedText;
  }

  const wordRange = editor.document.getWordRangeAtPosition(editor.selection.active);
  if (!wordRange) {
    return undefined;
  }

  const word = editor.document.getText(wordRange).trim();
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(word) ? word : undefined;
}

function documentAlreadyHasImport(
  document: vscode.TextDocument,
  symbolName: string,
  moduleName: string
): boolean {
  const escapedSymbol = escapeRegExp(symbolName);
  const escapedModule = escapeRegExp(moduleName);
  const pattern = new RegExp(
    `\\bimport\\s+[^;]*\\b${escapedSymbol}\\s*\\([^;]*\\)\\s+from\\s+"${escapedModule}"\\s*;`,
    "i"
  );
  return pattern.test(document.getText());
}

function findImportInsertLine(document: vscode.TextDocument): number {
  let insertLine = 0;
  for (let line = 0; line < document.lineCount; line += 1) {
    const trimmed = document.lineAt(line).text.trim();
    if (!trimmed) {
      insertLine = line + 1;
      continue;
    }
    if (
      /^#\s*include\b/.test(trimmed) ||
      /^import\b/.test(trimmed)
    ) {
      insertLine = line + 1;
      continue;
    }
    break;
  }

  return insertLine;
}

function getImportModuleOnCurrentLine(editor: vscode.TextEditor): string | undefined {
  const lineText = editor.document.lineAt(editor.selection.active.line).text;
  const fromMatch = /\bfrom\s+"([^"\r\n]+)"/.exec(lineText);
  if (fromMatch?.[1]) {
    return fromMatch[1].trim();
  }

  const simpleImportMatch = /^\s*import\s+([A-Za-z_][A-Za-z0-9_.]*)\s*;/.exec(lineText);
  if (simpleImportMatch?.[1]) {
    return simpleImportMatch[1].trim();
  }

  return undefined;
}

async function findImportSourceMatches(
  moduleName: string,
  pluginRoots: string[]
): Promise<ImportSourceMatch[]> {
  const normalizedModule = moduleName.toLowerCase();
  const matches: ImportSourceMatch[] = [];

  for (const pluginRoot of pluginRoots) {
    let entries: Dirent[];
    try {
      entries = await fs.readdir(pluginRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(pluginRoot, entry.name);
      const entryKind = await resolveDirentKind(pluginRoot, entry);
      if (entryKind === "directory" && entry.name.toLowerCase() === normalizedModule) {
        matches.push({
          kind: "folder",
          path: fullPath
        });
        continue;
      }

      if (
        entryKind === "file" &&
        entry.name.toLowerCase().endsWith(".op") &&
        entry.name.slice(0, -3).toLowerCase() === normalizedModule
      ) {
        matches.push({
          kind: "op",
          path: fullPath
        });
      }
    }
  }

  return matches;
}

async function resolveDirentKind(
  parentPath: string,
  entry: Dirent
): Promise<"directory" | "file" | "other"> {
  if (entry.isDirectory()) {
    return "directory";
  }
  if (entry.isFile()) {
    return "file";
  }
  if (!entry.isSymbolicLink()) {
    return "other";
  }

  try {
    const resolved = await fs.stat(path.join(parentPath, entry.name));
    if (resolved.isDirectory()) {
      return "directory";
    }
    if (resolved.isFile()) {
      return "file";
    }
  } catch { }

  return "other";
}

async function openImportMatch(match: ImportSourceMatch): Promise<void> {
  if (match.kind === "op") {
    const uri = vscode.Uri.file(match.path);
    await vscode.window.showTextDocument(uri, { preview: false });
    return;
  }

  const candidate = await findFirstAngelScriptFile(match.path);
  if (!candidate) {
    void vscode.window.showWarningMessage(
      `No .as files found in import source: ${match.path}`
    );
    return;
  }

  const uri = vscode.Uri.file(candidate);
  await vscode.window.showTextDocument(uri, { preview: false });
}

async function findFirstAngelScriptFile(folderPath: string): Promise<string | undefined> {
  const queue: string[] = [folderPath];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    let entries: Dirent[];
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }

    const sortedEntries = entries.slice().sort((left, right) =>
      left.name.localeCompare(right.name)
    );
    for (const entry of sortedEntries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith(".as")) {
        return fullPath;
      }
    }
  }

  return undefined;
}

function escapeSnippet(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/\}/g, "\\}");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
