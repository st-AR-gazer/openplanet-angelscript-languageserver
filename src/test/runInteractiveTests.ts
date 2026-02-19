import * as fs from "fs/promises";
import * as path from "path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { pathToFileURL } from "node:url";
import type { Diagnostic, Location, WorkspaceEdit } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  analyzeDocument,
  collectFunctionReturnTypes,
  getTypeResolutionContextAtPosition,
  type DocumentAnalysis,
  type FunctionDeclaration
} from "../server/analysis";
import {
  collectCompletionItems,
  createCompletionIndex,
  getActiveNamespaceAtPosition
} from "../server/completions";
import {
  buildQuickFixCodeActions,
  getSemanticDiagnostics,
  getSyntaxDiagnostics
} from "../server/diagnostics";
import { getHoverAtPosition } from "../server/hover";
import { getImportDiagnostics } from "../server/imports";
import {
  getIncludeAtPosition,
  getIncludeDiagnostics,
  resolveIncludePath
} from "../server/includes";
import {
  collectMemberCompletionItems,
  getDotCompletionContext,
  tryResolveExpressionTypeFullName
} from "../server/members";
import {
  getReferencesAtPosition,
  getRenameWorkspaceEditAtPosition,
  getSignatureHelpAtPosition,
  getSymbolDefinitionAtPosition,
  type WorkspaceFunctionDeclarationsByName
} from "../server/navigation";
import type {
  CompletionIndex,
  DiagnosticSettings,
  ImportValidationSettings
} from "../server/types";
import { uriToFsPath } from "../server/util";
import { seedTestSymbols } from "./seedTestSymbols";

const languageId = "openplanet-angelscript";
const repositoryRoot = path.resolve(__dirname, "..", "..");
const fixtureDirectory = path.join(repositoryRoot, "test-files");
const defaultCompletionsLimit = 20;
const defaultDiagnosticSettings: DiagnosticSettings = {
  enableUnknownSymbols: true,
  enableCaseMismatch: true,
  maxSymbolDiagnostics: 200
};
const defaultImportValidationSettings: ImportValidationSettings = {
  enable: true,
  pluginRoots: [],
  maxDiagnostics: 200
};

interface State {
  documents: Map<string, TextDocument>;
  activeUri: string;
  cursorLine: number;
  cursorCharacter: number;
}

interface Context {
  analysisByUri: Map<string, DocumentAnalysis>;
  allAnalyses: DocumentAnalysis[];
  workspaceFunctionReturnTypes: Map<string, string>;
  workspaceFunctionDeclarationsByName: WorkspaceFunctionDeclarationsByName;
}

async function main(): Promise<void> {
  const completionIndex = createCompletionIndex();
  seedTestSymbols(completionIndex);

  const state = await initializeState();
  const rl = readline.createInterface({
    input,
    output,
    terminal: Boolean(input.isTTY && output.isTTY)
  });

  printIntro(state);

  try {
    while (true) {
      const raw = (await rl.question(getPrompt(state))).trim();
      if (!raw) {
        continue;
      }

      const shouldExit = await runCommand(raw, state, completionIndex);
      if (shouldExit) {
        break;
      }
    }
  } finally {
    rl.close();
  }
}

async function initializeState(): Promise<State> {
  const fixtureNames = await listFixtureNames();
  if (fixtureNames.length === 0) {
    throw new Error(`No .as fixtures found in ${fixtureDirectory}`);
  }

  const documents = new Map<string, TextDocument>();
  for (const fixtureName of fixtureNames) {
    const fixturePath = path.join(fixtureDirectory, fixtureName);
    const source = await fs.readFile(fixturePath, "utf8");
    const uri = pathToFileURL(fixturePath).toString();
    documents.set(uri, TextDocument.create(uri, languageId, 1, source));
  }

  const showcaseName = "LanguageServerShowcase.as";
  const activeName = fixtureNames.includes(showcaseName)
    ? showcaseName
    : fixtureNames[0];
  const activeUri = pathToFileURL(path.join(fixtureDirectory, activeName)).toString();

  const state: State = {
    documents,
    activeUri,
    cursorLine: 0,
    cursorCharacter: 0
  };
  clampCursor(state);
  return state;
}

async function runCommand(
  raw: string,
  state: State,
  completionIndex: CompletionIndex
): Promise<boolean> {
  const [command, ...args] = raw.split(/\s+/);
  const normalized = command.toLowerCase();

  switch (normalized) {
    case "help":
      printHelp();
      return false;
    case "fixtures":
      await printFixtures();
      return false;
    case "use":
      switchActiveFixture(state, args[0]);
      return false;
    case "show":
      showDocument(state, args);
      return false;
    case "where":
      printCursor(state);
      return false;
    case "cursor":
      setCursor(state, args);
      return false;
    case "diagnostics":
      await printDiagnostics(state, completionIndex);
      return false;
    case "quickfixes":
      printQuickFixes(state, completionIndex);
      return false;
    case "completion":
      printCompletion(state, completionIndex, args[0]);
      return false;
    case "hover":
      printHover(state, completionIndex);
      return false;
    case "signature":
      printSignature(state, completionIndex);
      return false;
    case "definition":
      await printDefinition(state);
      return false;
    case "references":
      printReferences(state, args[0]);
      return false;
    case "rename":
      printRenamePreview(state, args[0]);
      return false;
    case "symbols":
      printSymbols(state);
      return false;
    case "analysis":
      printAnalysis(state);
      return false;
    case "type":
      printTypeResolution(state, completionIndex, raw);
      return false;
    case "quit":
    case "exit":
      return true;
    default:
      console.log(`Unknown command \"${normalized}\". Type \"help\".`);
      return false;
  }
}

function printIntro(state: State): void {
  console.log("Openplanet AngelScript Interactive Test Runner");
  console.log(`Fixture directory: ${fixtureDirectory}`);
  console.log(`Loaded docs: ${state.documents.size}`);
  console.log('Type "help" for commands.');
  printCursor(state);
}

function printHelp(): void {
  console.log("Commands:");
  console.log("  help                        Show commands.");
  console.log("  fixtures                    List fixture files.");
  console.log("  use <fixture>               Switch active fixture.");
  console.log("  show [all|start end]        Show active document lines.");
  console.log("  where                       Show current cursor context.");
  console.log("  cursor <line> <char>        Move cursor (1-based).");
  console.log("  diagnostics                 Include + import + semantic diagnostics.");
  console.log("  quickfixes                  Quick-fix suggestions for semantic diagnostics.");
  console.log("  completion [limit]          Completion items at cursor.");
  console.log("  hover                       Hover result at cursor.");
  console.log("  signature                   Signature help at cursor.");
  console.log("  definition                  Definition/include target at cursor.");
  console.log("  references [true|false]     Reference locations at cursor.");
  console.log("  rename <newName>            Rename preview edit list.");
  console.log("  symbols                     Document symbols for active file.");
  console.log("  analysis                    Parsed functions and locals.");
  console.log("  type <expression>           Resolve expression type at cursor context.");
  console.log("  quit                        Exit.");
}

async function printFixtures(): Promise<void> {
  const names = await listFixtureNames();
  if (names.length === 0) {
    console.log("No fixture files.");
    return;
  }

  console.log("Fixtures:");
  for (const name of names) {
    console.log(`  ${name}`);
  }
}

function switchActiveFixture(state: State, fixtureName: string | undefined): void {
  if (!fixtureName) {
    console.log("Usage: use <fixture>");
    return;
  }

  const normalized = fixtureName.toLowerCase().endsWith(".as")
    ? fixtureName
    : `${fixtureName}.as`;

  for (const uri of state.documents.keys()) {
    if (path.basename(uriToFsPath(uri)).toLowerCase() === normalized.toLowerCase()) {
      state.activeUri = uri;
      clampCursor(state);
      printCursor(state);
      return;
    }
  }

  console.log(`Fixture not loaded: ${normalized}`);
}

function showDocument(state: State, args: string[]): void {
  const doc = getActiveDoc(state);
  const lines = getLines(doc);

  let start = 1;
  let end = lines.length;

  if (args[0] && args[0].toLowerCase() !== "all") {
    const a = Number.parseInt(args[0], 10);
    const b = Number.parseInt(args[1] ?? args[0], 10);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      start = Math.max(1, Math.min(a, b));
      end = Math.min(lines.length, Math.max(a, b));
    }
  } else if (!args[0]) {
    start = Math.max(1, state.cursorLine + 1 - 8);
    end = Math.min(lines.length, state.cursorLine + 1 + 8);
  }

  const width = String(end).length;
  for (let line = start; line <= end; line += 1) {
    const marker = line - 1 === state.cursorLine ? ">" : " ";
    console.log(`${marker} ${String(line).padStart(width, " ")} | ${lines[line - 1]}`);
  }
}

function printCursor(state: State): void {
  const doc = getActiveDoc(state);
  const lineText = getLineText(doc, state.cursorLine);
  const spaces = " ".repeat(Math.max(0, state.cursorCharacter));

  console.log(
    `${getActiveDocName(state)}:${state.cursorLine + 1}:${state.cursorCharacter + 1}`
  );
  console.log(`  ${lineText}`);
  console.log(`  ${spaces}^`);
}

function setCursor(state: State, args: string[]): void {
  const line = Number.parseInt(args[0] ?? "", 10);
  const character = Number.parseInt(args[1] ?? "", 10);
  if (!Number.isFinite(line) || !Number.isFinite(character)) {
    console.log("Usage: cursor <line> <char>");
    return;
  }

  state.cursorLine = Math.max(0, line - 1);
  state.cursorCharacter = Math.max(0, character - 1);
  clampCursor(state);
  printCursor(state);
}

async function printDiagnostics(
  state: State,
  completionIndex: CompletionIndex
): Promise<void> {
  const context = buildContext(state);
  const doc = getActiveDoc(state);
  const analysis = context.analysisByUri.get(doc.uri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  const includeDiagnostics = await getIncludeDiagnostics(
    doc,
    getWorkspaceRoots(state),
    [],
    200
  );
  const importDiagnostics = await getImportDiagnostics(
    doc,
    analysis,
    getWorkspaceRoots(state),
    defaultImportValidationSettings,
    ""
  );

  const semanticDiagnostics = getSemanticDiagnostics(
    doc,
    analysis,
    context.allAnalyses,
    completionIndex,
    defaultDiagnosticSettings,
    context.workspaceFunctionReturnTypes
  );

  const syntaxDiagnostics = getSyntaxDiagnostics(doc, analysis);
  const allDiagnostics = [
    ...includeDiagnostics,
    ...importDiagnostics,
    ...syntaxDiagnostics,
    ...semanticDiagnostics
  ];
  if (allDiagnostics.length === 0) {
    console.log("No diagnostics.");
    return;
  }

  for (const diagnostic of allDiagnostics) {
    console.log(formatDiagnostic(diagnostic));
  }
  console.log(`Total diagnostics: ${allDiagnostics.length}`);
}

function printQuickFixes(state: State, completionIndex: CompletionIndex): void {
  const context = buildContext(state);
  const doc = getActiveDoc(state);
  const analysis = context.analysisByUri.get(doc.uri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  const diagnostics = getSemanticDiagnostics(
    doc,
    analysis,
    context.allAnalyses,
    completionIndex,
    defaultDiagnosticSettings,
    context.workspaceFunctionReturnTypes
  );

  const actions = buildQuickFixCodeActions(doc.uri, diagnostics);
  if (actions.length === 0) {
    console.log("No quick fixes.");
    return;
  }

  for (const action of actions) {
    const edit = action.edit?.changes?.[doc.uri]?.[0];
    if (!edit) {
      continue;
    }

    const line = edit.range.start.line + 1;
    const char = edit.range.start.character + 1;
    console.log(`${line}:${char} ${action.title}`);
  }
}

function printCompletion(
  state: State,
  completionIndex: CompletionIndex,
  limitText: string | undefined
): void {
  const limit = parsePositive(limitText) ?? defaultCompletionsLimit;
  const context = buildContext(state);
  const doc = getActiveDoc(state);
  const analysis = context.analysisByUri.get(doc.uri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  const dot = getDotCompletionContext(doc, state.cursorLine, state.cursorCharacter);
  let items;

  if (dot) {
    const typeContext = getTypeResolutionContextAtPosition(
      doc,
      analysis,
      state.cursorLine,
      state.cursorCharacter,
      context.allAnalyses,
      context.workspaceFunctionReturnTypes
    );
    const resolvedType = tryResolveExpressionTypeFullName(
      completionIndex,
      dot.receiverText,
      typeContext
    );
    console.log(
      `Dot completion receiver=\"${dot.receiverText}\" prefix=\"${dot.memberPrefix}\" type=${resolvedType ?? "unresolved"}`
    );
    items = resolvedType
      ? collectMemberCompletionItems(completionIndex, resolvedType, dot.memberPrefix)
      : [];
  } else {
    const activeNamespace = getActiveNamespaceAtPosition(
      doc,
      state.cursorLine,
      state.cursorCharacter
    );
    console.log(`Namespace completion context: ${activeNamespace ?? "<root>"}`);
    items = collectCompletionItems(completionIndex, activeNamespace);
  }

  if (items.length === 0) {
    console.log("No completion items.");
    return;
  }

  const visible = items.slice(0, limit);
  for (const item of visible) {
    console.log(`${item.label}${item.detail ? ` - ${item.detail}` : ""}`);
  }

  if (items.length > visible.length) {
    console.log(`... ${items.length - visible.length} more`);
  }
}

function printHover(state: State, completionIndex: CompletionIndex): void {
  const context = buildContext(state);
  const doc = getActiveDoc(state);
  const analysis = context.analysisByUri.get(doc.uri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  const typeContext = getTypeResolutionContextAtPosition(
    doc,
    analysis,
    state.cursorLine,
    state.cursorCharacter,
    context.allAnalyses,
    context.workspaceFunctionReturnTypes
  );

  const hover = getHoverAtPosition(
    doc,
    state.cursorLine,
    state.cursorCharacter,
    completionIndex,
    typeContext,
    analysis,
    context.allAnalyses,
    context.workspaceFunctionDeclarationsByName
  );

  if (!hover) {
    console.log("No hover result.");
    return;
  }

  if (typeof hover.contents === "string") {
    console.log(hover.contents);
    return;
  }

  if (Array.isArray(hover.contents)) {
    for (const item of hover.contents) {
      console.log(typeof item === "string" ? item : item.value);
    }
    return;
  }

  console.log(hover.contents.value);
}

function printSignature(state: State, completionIndex: CompletionIndex): void {
  const context = buildContext(state);
  const doc = getActiveDoc(state);

  const signatureHelp = getSignatureHelpAtPosition(
    doc,
    context.allAnalyses,
    completionIndex,
    state.cursorLine,
    state.cursorCharacter,
    context.workspaceFunctionDeclarationsByName
  );

  if (!signatureHelp) {
    console.log("No signature help.");
    return;
  }

  console.log(`Active parameter: ${signatureHelp.activeParameter ?? 0}`);
  for (const signature of signatureHelp.signatures) {
    console.log(`  ${signature.label}`);
  }
}

async function printDefinition(state: State): Promise<void> {
  const context = buildContext(state);
  const doc = getActiveDoc(state);
  const analysis = context.analysisByUri.get(doc.uri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  const include = getIncludeAtPosition(doc, state.cursorLine, state.cursorCharacter);
  if (include) {
    const resolvedUri = await resolveIncludePath(
      doc.uri,
      include.pathText,
      getWorkspaceRoots(state),
      []
    );

    if (!resolvedUri) {
      console.log(`Include not resolved: ${include.pathText}`);
      return;
    }

    console.log(`Include definition: ${formatUri(resolvedUri)}:1:1`);
    return;
  }

  const location = getSymbolDefinitionAtPosition(
    doc,
    analysis,
    context.allAnalyses,
    state.cursorLine,
    state.cursorCharacter,
    context.workspaceFunctionDeclarationsByName
  );

  if (!location) {
    console.log("No definition result.");
    return;
  }

  console.log(`Definition: ${formatLocation(location)}`);
}

function printReferences(state: State, includeDeclarationText: string | undefined): void {
  const context = buildContext(state);
  const doc = getActiveDoc(state);
  const analysis = context.analysisByUri.get(doc.uri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  const includeDeclaration = parseBool(includeDeclarationText, true);
  const locations = getReferencesAtPosition(
    doc,
    analysis,
    context.allAnalyses,
    state.cursorLine,
    state.cursorCharacter,
    includeDeclaration,
    context.workspaceFunctionDeclarationsByName
  );

  if (locations.length === 0) {
    console.log("No references.");
    return;
  }

  for (const location of locations) {
    console.log(formatLocation(location));
  }
}

function printRenamePreview(state: State, newName: string | undefined): void {
  if (!newName) {
    console.log("Usage: rename <newName>");
    return;
  }

  const context = buildContext(state);
  const doc = getActiveDoc(state);
  const analysis = context.analysisByUri.get(doc.uri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  const edit = getRenameWorkspaceEditAtPosition(
    doc,
    analysis,
    context.allAnalyses,
    state.cursorLine,
    state.cursorCharacter,
    newName,
    context.workspaceFunctionDeclarationsByName
  );

  if (!edit?.changes) {
    console.log("No rename edits.");
    return;
  }

  printWorkspaceEdit(edit);
}

function printSymbols(state: State): void {
  const analysis = buildContext(state).analysisByUri.get(state.activeUri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  if (analysis.documentSymbols.length === 0) {
    console.log("No document symbols.");
    return;
  }

  for (const symbol of analysis.documentSymbols) {
    const line = symbol.selectionRange.start.line + 1;
    const char = symbol.selectionRange.start.character + 1;
    console.log(`${line}:${char} ${symbol.name}`);
  }
}

function printAnalysis(state: State): void {
  const analysis = buildContext(state).analysisByUri.get(state.activeUri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  if (analysis.functions.length === 0) {
    console.log("No parsed functions.");
    return;
  }

  for (const fn of analysis.functions) {
    const start = fn.range.start.line + 1;
    const end = fn.range.end.line + 1;
    console.log(`${fn.returnType || "<ctor/dtor>"} ${fn.name}(${fn.argsText}) [${start}-${end}]`);

    for (const parameter of fn.parameters) {
      const line = parameter.range.start.line + 1;
      console.log(`  param ${parameter.type} ${parameter.name} @ line ${line}`);
    }

    for (const local of fn.localDeclarations) {
      const line = local.range.start.line + 1;
      console.log(`  local ${local.type} ${local.name} @ line ${line}`);
    }
  }
}

function printTypeResolution(
  state: State,
  completionIndex: CompletionIndex,
  rawCommand: string
): void {
  const expression = rawCommand.slice("type".length).trim();
  if (!expression) {
    console.log("Usage: type <expression>");
    return;
  }

  const context = buildContext(state);
  const doc = getActiveDoc(state);
  const analysis = context.analysisByUri.get(doc.uri);
  if (!analysis) {
    console.log("No analysis for active document.");
    return;
  }

  const typeContext = getTypeResolutionContextAtPosition(
    doc,
    analysis,
    state.cursorLine,
    state.cursorCharacter,
    context.allAnalyses,
    context.workspaceFunctionReturnTypes
  );
  const resolvedType = tryResolveExpressionTypeFullName(
    completionIndex,
    expression,
    typeContext
  );

  console.log(`${expression} => ${resolvedType ?? "unresolved"}`);
}

function buildContext(state: State): Context {
  const analysisByUri = new Map<string, DocumentAnalysis>();
  const allAnalyses: DocumentAnalysis[] = [];

  for (const doc of state.documents.values()) {
    const analysis = analyzeDocument(doc);
    analysisByUri.set(doc.uri, analysis);
    allAnalyses.push(analysis);
  }

  const workspaceFunctionReturnTypes = collectFunctionReturnTypes(allAnalyses);
  const workspaceFunctionDeclarationsByName: WorkspaceFunctionDeclarationsByName =
    new Map<
      string,
      Array<{ analysis: DocumentAnalysis; declaration: FunctionDeclaration }>
    >();

  for (const analysis of allAnalyses) {
    for (const declaration of analysis.functions) {
      const entries = workspaceFunctionDeclarationsByName.get(declaration.name) ?? [];
      entries.push({ analysis, declaration });
      workspaceFunctionDeclarationsByName.set(declaration.name, entries);
    }
  }

  for (const entries of workspaceFunctionDeclarationsByName.values()) {
    entries.sort((a, b) => {
      if (a.analysis.uri === b.analysis.uri) {
        return a.declaration.start - b.declaration.start;
      }
      return a.analysis.uri.localeCompare(b.analysis.uri);
    });
  }

  return {
    analysisByUri,
    allAnalyses,
    workspaceFunctionReturnTypes,
    workspaceFunctionDeclarationsByName
  };
}

function getWorkspaceRoots(state: State): string[] {
  const roots = new Set<string>([repositoryRoot, fixtureDirectory]);
  for (const uri of state.documents.keys()) {
    try {
      roots.add(path.dirname(uriToFsPath(uri)));
    } catch { }
  }

  return [...roots];
}

function printWorkspaceEdit(edit: WorkspaceEdit): void {
  const changes = edit.changes;
  if (!changes) {
    console.log("No edits.");
    return;
  }

  for (const [uri, edits] of Object.entries(changes)) {
    for (const textEdit of edits) {
      const line = textEdit.range.start.line + 1;
      const char = textEdit.range.start.character + 1;
      console.log(`${formatUri(uri)}:${line}:${char} -> \"${textEdit.newText}\"`);
    }
  }
}

function formatDiagnostic(diagnostic: Diagnostic): string {
  const line = diagnostic.range.start.line + 1;
  const char = diagnostic.range.start.character + 1;
  const code =
    typeof diagnostic.code === "string" || typeof diagnostic.code === "number"
      ? diagnostic.code
      : "diag";
  return `${line}:${char} [${code}] ${diagnostic.message}`;
}

function formatLocation(location: Location): string {
  return `${formatUri(location.uri)}:${location.range.start.line + 1}:${
    location.range.start.character + 1
  }`;
}

function formatUri(uri: string): string {
  try {
    const fsPath = uriToFsPath(uri);
    return path.relative(repositoryRoot, fsPath) || fsPath;
  } catch {
    return uri;
  }
}

function parsePositive(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }

  return fallback;
}

async function listFixtureNames(): Promise<string[]> {
  const entries = await fs.readdir(fixtureDirectory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".as"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function getPrompt(state: State): string {
  return `ls-test:${getActiveDocName(state)}:${state.cursorLine + 1}:${
    state.cursorCharacter + 1
  }> `;
}

function getActiveDocName(state: State): string {
  return path.basename(uriToFsPath(state.activeUri));
}

function getActiveDoc(state: State): TextDocument {
  const doc = state.documents.get(state.activeUri);
  if (!doc) {
    throw new Error(`Missing active doc: ${state.activeUri}`);
  }

  return doc;
}

function getLines(doc: TextDocument): string[] {
  return doc.getText().replace(/\r/g, "").split("\n");
}

function getLineText(doc: TextDocument, line: number): string {
  return doc
    .getText({
      start: { line, character: 0 },
      end: { line: line + 1, character: 0 }
    })
    .replace(/\r?\n$/, "");
}

function clampCursor(state: State): void {
  const doc = getActiveDoc(state);
  const max = doc.positionAt(doc.getText().length);

  state.cursorLine = Math.max(0, Math.min(state.cursorLine, max.line));
  const lineText = getLineText(doc, state.cursorLine);
  state.cursorCharacter = Math.max(
    0,
    Math.min(state.cursorCharacter, lineText.length)
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Interactive test runner failed: ${message}`);
  process.exitCode = 1;
});
