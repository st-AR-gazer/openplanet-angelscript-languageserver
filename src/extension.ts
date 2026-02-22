import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  RequestType,
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
