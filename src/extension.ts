import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
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
