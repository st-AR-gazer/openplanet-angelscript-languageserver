import * as assert from "assert";
import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import * as path from "path";
import { URI } from "vscode-uri";

interface JsonRpcMessage {
  jsonrpc: "2.0";
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

class LspProcessClient {
  private readonly process: ChildProcessWithoutNullStreams;
  private readonly pendingRequests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
  >();
  private readonly pendingNotifications: Array<{
    method: string;
    predicate: (params: unknown) => boolean;
    resolve: (params: unknown) => void;
    reject: (reason: unknown) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private readonly stderrChunks: string[] = [];
  private messageId = 0;
  private readBuffer = Buffer.alloc(0);

  public constructor(serverModulePath: string, cwd: string) {
    this.process = spawn(process.execPath, [serverModulePath], {
      cwd,
      stdio: "pipe"
    });

    this.process.stdout.on("data", (chunk: Buffer) => {
      this.readBuffer = Buffer.concat([this.readBuffer, chunk]);
      this.consumeMessages();
    });
    this.process.stderr.on("data", (chunk: Buffer) => {
      this.stderrChunks.push(chunk.toString("utf8"));
    });
    this.process.on("exit", (code, signal) => {
      const reason = new Error(
        `Language server exited before test completed (code=${String(code)} signal=${String(
          signal
        )}). stderr:\n${this.stderrChunks.join("")}`
      );

      for (const pending of this.pendingRequests.values()) {
        pending.reject(reason);
      }
      this.pendingRequests.clear();

      for (const pending of this.pendingNotifications) {
        clearTimeout(pending.timeout);
        pending.reject(reason);
      }
      this.pendingNotifications.length = 0;
    });
  }

  public async request(method: string, params: unknown): Promise<unknown> {
    const id = ++this.messageId;
    const payload: JsonRpcMessage = {
      jsonrpc: "2.0",
      id,
      method,
      params
    };

    const promise = new Promise<unknown>((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
    });

    this.writeMessage(payload);
    return promise;
  }

  public notify(method: string, params: unknown): void {
    const payload: JsonRpcMessage = {
      jsonrpc: "2.0",
      method,
      params
    };
    this.writeMessage(payload);
  }

  public async waitForNotification(
    method: string,
    predicate: (params: unknown) => boolean,
    timeoutMs: number
  ): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(
          new Error(
            `Timed out waiting for "${method}" notification. stderr:\n${this.stderrChunks.join(
              ""
            )}`
          )
        );
      }, timeoutMs);

      this.pendingNotifications.push({
        method,
        predicate,
        resolve,
        reject,
        timeout
      });
    });
  }

  public async shutdown(): Promise<void> {
    try {
      await this.request("shutdown", null);
    } catch { }
    this.notify("exit", null);

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        this.process.kill();
        resolve();
      }, 2000);

      this.process.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  private writeMessage(message: JsonRpcMessage): void {
    const body = Buffer.from(JSON.stringify(message), "utf8");
    const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, "ascii");
    this.process.stdin.write(Buffer.concat([header, body]));
  }

  private consumeMessages(): void {
    while (true) {
      const delimiterIndex = this.readBuffer.indexOf("\r\n\r\n");
      if (delimiterIndex < 0) {
        return;
      }

      const headerBuffer = this.readBuffer.slice(0, delimiterIndex);
      const headerText = headerBuffer.toString("ascii");
      const match = /Content-Length:\s*(\d+)/i.exec(headerText);
      if (!match) {
        throw new Error(`Malformed LSP header: ${headerText}`);
      }

      const contentLength = Number.parseInt(match[1], 10);
      const bodyStart = delimiterIndex + 4;
      const bodyEnd = bodyStart + contentLength;
      if (this.readBuffer.length < bodyEnd) {
        return;
      }

      const body = this.readBuffer.slice(bodyStart, bodyEnd).toString("utf8");
      this.readBuffer = this.readBuffer.slice(bodyEnd);

      const message = JSON.parse(body) as JsonRpcMessage;
      this.dispatchMessage(message);
    }
  }

  private dispatchMessage(message: JsonRpcMessage): void {
    if (typeof message.id === "number") {
      const pending = this.pendingRequests.get(message.id);
      if (!pending) {
        return;
      }
      this.pendingRequests.delete(message.id);
      if (message.error) {
        pending.reject(
          new Error(`JSON-RPC error ${message.error.code}: ${message.error.message}`)
        );
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (!message.method) {
      return;
    }

    for (let i = 0; i < this.pendingNotifications.length; i += 1) {
      const pending = this.pendingNotifications[i];
      if (pending.method !== message.method) {
        continue;
      }
      if (!pending.predicate(message.params)) {
        continue;
      }

      clearTimeout(pending.timeout);
      this.pendingNotifications.splice(i, 1);
      pending.resolve(message.params);
      return;
    }
  }
}

async function main(): Promise<void> {
  await testIgnoredFenceSuppressesDiagnostics();
  await testBaselineIntegrationDiagnostics();
}

async function testBaselineIntegrationDiagnostics(): Promise<void> {
  const workspaceRoot = path.resolve(__dirname, "..", "..");
  const serverModulePath = path.resolve(__dirname, "..", "server.js");
  const client = new LspProcessClient(serverModulePath, workspaceRoot);

  try {
    await client.request("initialize", {
      processId: process.pid,
      rootUri: URI.file(workspaceRoot).toString(),
      capabilities: {},
      workspaceFolders: [
        {
          uri: URI.file(workspaceRoot).toString(),
          name: path.basename(workspaceRoot)
        }
      ]
    });
    client.notify("initialized", {});

    const documentUri = "file:///integration-smoke.as";
    const source = [
      "int Add(int value) {",
      "  return value;",
      "}",
      "",
      "void Main() {",
      "  Add(\"bad\");",
      "}"
    ].join("\n");

    client.notify("textDocument/didOpen", {
      textDocument: {
        uri: documentUri,
        languageId: "openplanet-angelscript",
        version: 1,
        text: source
      }
    });

    const diagnosticsNotification = (await client.waitForNotification(
      "textDocument/publishDiagnostics",
      (params) =>
        typeof params === "object" &&
        params !== null &&
        (params as { uri?: string }).uri === documentUri,
      15000
    )) as { diagnostics?: Array<{ code?: string }> };

    const codes = new Set(
      (diagnosticsNotification.diagnostics ?? []).map((diagnostic) =>
        String(diagnostic.code ?? "")
      )
    );
    assert.ok(
      codes.has("call-argument-type-mismatch"),
      "Expected integration diagnostics to include call-argument-type-mismatch."
    );

    const hover = (await client.request("textDocument/hover", {
      textDocument: { uri: documentUri },
      position: { line: 5, character: 3 }
    })) as { contents?: unknown } | null;
    assert.ok(hover, "Expected hover response in integration test.");

    const references = (await client.request("textDocument/references", {
      textDocument: { uri: documentUri },
      position: { line: 0, character: 4 },
      context: { includeDeclaration: true }
    })) as Array<unknown> | null;
    assert.ok(
      Array.isArray(references) && references.length >= 2,
      "Expected references request to return declaration + call usage."
    );

    console.log("Integration tests passed.");
  } finally {
    await client.shutdown();
  }
}

async function testIgnoredFenceSuppressesDiagnostics(): Promise<void> {
  const workspaceRoot = path.resolve(__dirname, "..", "..");
  const serverModulePath = path.resolve(__dirname, "..", "server.js");
  const client = new LspProcessClient(serverModulePath, workspaceRoot);

  try {
    await client.request("initialize", {
      processId: process.pid,
      rootUri: URI.file(workspaceRoot).toString(),
      capabilities: {},
      workspaceFolders: [
        {
          uri: URI.file(workspaceRoot).toString(),
          name: path.basename(workspaceRoot)
        }
      ]
    });
    client.notify("initialized", {});

    const documentUri = "file:///integration-ignored-fence.as";
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

    client.notify("textDocument/didOpen", {
      textDocument: {
        uri: documentUri,
        languageId: "openplanet-angelscript",
        version: 1,
        text: source
      }
    });

    const diagnosticsNotification = (await client.waitForNotification(
      "textDocument/publishDiagnostics",
      (params) =>
        typeof params === "object" &&
        params !== null &&
        (params as { uri?: string }).uri === documentUri,
      15000
    )) as { diagnostics?: Array<{ code?: string }> };

    const codes = new Set(
      (diagnosticsNotification.diagnostics ?? []).map((diagnostic) =>
        String(diagnostic.code ?? "")
      )
    );
    assert.ok(
      !codes.has("call-argument-type-mismatch"),
      "Expected diagnostics inside ///< ///> fence to be suppressed."
    );
  } finally {
    await client.shutdown();
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
