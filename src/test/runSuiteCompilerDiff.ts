import { spawn } from "child_process";
import * as fs from "fs/promises";
import * as path from "path";
import { DiagnosticSeverity, type Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import {
  analyzeDocument,
  collectFunctionReturnTypes,
  type DocumentAnalysis
} from "../server/analysis";
import { getSemanticDiagnostics, getSyntaxDiagnostics } from "../server/diagnostics";
import { createDefaultSettings } from "../server/settings";
import { buildCompletionIndex } from "../server/symbols";
import { uriToFsPath } from "../server/util";

type DiagnosticBucket = "ERR" | "WARN" | "INFO";

interface CliOptions {
  suite: string;
  suitesRoot: string;
  opdevPyPath: string;
  pythonExe: string;
  plugins: string[];
  skipCompile: boolean;
  transport: "auto" | "socket" | "file";
  companionHost: string;
  companionPort: number;
  waitFrames: number;
  timeoutSec: number;
  preserveRuntime: boolean | null;
  reportPath: string;
  failOnFalsePositives: boolean;
  includeWarnings: boolean;
}

interface SourcePluginRecord {
  path: string;
}

interface SuiteLockfile {
  suite?: string;
  roots?: string[];
  deps_source?: string[];
  source_plugins?: Record<string, SourcePluginRecord>;
}

interface CompileRunRecord {
  ts_utc?: string;
  suite?: string;
  plugin_name?: string;
  success?: boolean;
  timed_out?: boolean;
  result_path?: string;
  excerpt_path?: string;
}

interface StagedDependencyRecord {
  name?: string;
  source_path?: string;
  staging_path?: string;
}

interface CompileCheckResult {
  success?: boolean;
  timed_out?: boolean;
  plugin_source_path?: string;
  staging_path?: string;
  staged_dependencies?: StagedDependencyRecord[];
  response?: {
    error?: string;
  };
}

interface CompilerDiagnostic {
  pluginName: string;
  filePath: string;
  line: number;
  column: number;
  bucket: DiagnosticBucket;
  message: string;
  source: "excerpt" | "response-error";
}

interface LsDiagnostic {
  filePath: string;
  line: number;
  column: number;
  severity: DiagnosticSeverity;
  code: string;
  message: string;
}

interface CompileInvocationResult {
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  runRecord: CompileRunRecord | null;
  resultPath: string | null;
  excerptPath: string | null;
  compileResult: CompileCheckResult | null;
  compilerDiagnostics: CompilerDiagnostic[];
  compilerErrors: CompilerDiagnostic[];
}

interface PluginParityReport {
  pluginName: string;
  pluginPath: string;
  compile: {
    executed: boolean;
    exitCode: number | null;
    success: boolean | null;
    timedOut: boolean | null;
    resultPath: string | null;
    excerptPath: string | null;
    responseError: string | null;
  };
  counts: {
    lsErrors: number;
    lsWarnings: number;
    compilerErrors: number;
    compilerWarnings: number;
    falsePositives: number;
    falseNegatives: number;
  };
  falsePositives: LsDiagnostic[];
  falseNegatives: CompilerDiagnostic[];
  matched: Array<{
    filePath: string;
    line: number;
    lsCode: string;
    lsMessage: string;
    compilerMessage: string;
  }>;
}

interface FinalReport {
  tsUtc: string;
  suite: string;
  suiteRoot: string;
  lockfilePath: string;
  config: {
    skipCompile: boolean;
    includeWarnings: boolean;
    failOnFalsePositives: boolean;
    plugins: string[];
    transport: "auto" | "socket" | "file";
    companionHost: string;
    companionPort: number;
    waitFrames: number;
    timeoutSec: number;
    preserveRuntime: boolean | null;
  };
  totals: {
    filesScanned: number;
    lsFailedFiles: number;
    lsDiagnostics: number;
    lsErrors: number;
    lsWarnings: number;
    compilerErrors: number;
    compilerWarnings: number;
    falsePositives: number;
    falseNegatives: number;
  };
  compileInvocations: Record<string, Omit<CompileInvocationResult, "compilerDiagnostics" | "compilerErrors">>;
  lsFailedFiles: Array<{ filePath: string; error: string }>;
  plugins: PluginParityReport[];
}

const languageId = "openplanet-angelscript";
const repositoryRoot = path.resolve(__dirname, "..", "..");

function timestampForPath(): string {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function toIntOrDefault(raw: unknown, fallback: number): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function requireArgValue(argv: string[], index: number, flagName: string): string {
  if (index >= argv.length) {
    throw new Error(`${flagName} requires a value.`);
  }
  const value = argv[index];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flagName} requires a value.`);
  }
  return value;
}

function normalizeTransport(raw: unknown): "auto" | "socket" | "file" | null {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (value === "auto" || value === "socket" || value === "file") {
    return value;
  }
  return null;
}

function parseCliArgs(argv: string[]): CliOptions {
  const defaultReportRoot = path.join(repositoryRoot, "out", "test", "suite-compiler-diff");
  const defaults: CliOptions = {
    suite: process.env.OPAS_PARITY_SUITE || "ExampleSuite",
    suitesRoot: path.resolve(process.env.OPAS_SUITES_ROOT || "D:\\OpenplanetDev\\suites"),
    opdevPyPath: path.resolve(process.env.OPAS_OPDEV_PY || "D:\\OpenplanetDev\\tools\\opdev\\opdev.py"),
    pythonExe: process.env.OPAS_PYTHON || "python",
    plugins: [],
    skipCompile: false,
    transport: normalizeTransport(process.env.OPAS_PARITY_TRANSPORT) ?? "auto",
    companionHost: process.env.OPAS_PARITY_COMPANION_HOST || "127.0.0.1",
    companionPort: toIntOrDefault(process.env.OPAS_PARITY_COMPANION_PORT, 32000),
    waitFrames: toIntOrDefault(process.env.OPAS_PARITY_WAIT_FRAMES, 20),
    timeoutSec: toIntOrDefault(process.env.OPAS_PARITY_TIMEOUT_SEC, 20),
    preserveRuntime: null,
    reportPath: path.join(
      defaultReportRoot,
      `${timestampForPath()}-${(process.env.OPAS_PARITY_SUITE || "ExampleSuite").replace(/[^A-Za-z0-9._-]+/g, "-")}.json`
    ),
    failOnFalsePositives: false,
    includeWarnings: false
  };

  const opts: CliOptions = {
    ...defaults,
    plugins: []
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--suite":
        i += 1;
        opts.suite = requireArgValue(argv, i, "--suite");
        break;
      case "--suites-root":
        i += 1;
        opts.suitesRoot = path.resolve(requireArgValue(argv, i, "--suites-root"));
        break;
      case "--opdev-py":
        i += 1;
        opts.opdevPyPath = path.resolve(requireArgValue(argv, i, "--opdev-py"));
        break;
      case "--python":
        i += 1;
        opts.pythonExe = requireArgValue(argv, i, "--python");
        break;
      case "--plugin":
        i += 1;
        opts.plugins.push(requireArgValue(argv, i, "--plugin"));
        break;
      case "--skip-compile":
        opts.skipCompile = true;
        break;
      case "--transport":
        i += 1;
        opts.transport = normalizeTransport(requireArgValue(argv, i, "--transport")) ?? "auto";
        break;
      case "--companion-host":
        i += 1;
        opts.companionHost = requireArgValue(argv, i, "--companion-host");
        break;
      case "--companion-port":
        i += 1;
        opts.companionPort = toIntOrDefault(requireArgValue(argv, i, "--companion-port"), opts.companionPort);
        break;
      case "--wait-frames":
        i += 1;
        opts.waitFrames = toIntOrDefault(requireArgValue(argv, i, "--wait-frames"), opts.waitFrames);
        break;
      case "--timeout-sec":
        i += 1;
        opts.timeoutSec = toIntOrDefault(requireArgValue(argv, i, "--timeout-sec"), opts.timeoutSec);
        break;
      case "--preserve-runtime":
        opts.preserveRuntime = true;
        break;
      case "--no-preserve-runtime":
        opts.preserveRuntime = false;
        break;
      case "--report":
        i += 1;
        opts.reportPath = path.resolve(requireArgValue(argv, i, "--report"));
        break;
      case "--fail-on-false-positives":
        opts.failOnFalsePositives = true;
        break;
      case "--include-warnings":
        opts.includeWarnings = true;
        break;
      case "--help":
      case "-h":
        printHelpAndExit(defaults);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}. Use --help for usage.`);
    }
  }

  return opts;
}

function printHelpAndExit(defaults: CliOptions): never {
  const lines = [
    "Usage: npm run test:suite-compiler-diff -- [options]",
    "",
    "Runs Openplanet compile-check for suite plugin(s), runs LS diagnostics on the same files,",
    "and reports LS-only diagnostics (false positives) and compiler-only diagnostics (false negatives).",
    "",
    "Options:",
    "  --suite <name>              Suite name (default from OPAS_PARITY_SUITE or ExampleSuite).",
    "  --suites-root <path>        Suites root (default: D:\\OpenplanetDev\\suites).",
    "  --opdev-py <path>           Path to opdev.py.",
    "  --python <exe>              Python executable (default: python).",
    "  --plugin <name>             Restrict to one plugin; repeat for multiple.",
    "  --skip-compile              Skip opdev compile-check and use latest logs in logs/_compile.",
    "  --transport <mode>          auto|socket|file (default: auto).",
    "  --companion-host <host>     OpDevCompanion host (default: 127.0.0.1).",
    "  --companion-port <n>        OpDevCompanion port (default: 32000).",
    "  --wait-frames <n>           Frames to wait after compile-check load (default: 20).",
    "  --timeout-sec <n>           Compile-check timeout seconds (default: 20).",
    "  --preserve-runtime          Pass --preserve-runtime to opdev compile-check.",
    "  --no-preserve-runtime       Pass --no-preserve-runtime to opdev compile-check.",
    "  --report <path>             Output report path (JSON).",
    "  --include-warnings          Include warning severity in false-positive set.",
    "  --fail-on-false-positives   Exit 1 when false positives are found.",
    "  -h, --help                  Show this message.",
    "",
    "Defaults:",
    `  suite: ${defaults.suite}`,
    `  suites-root: ${defaults.suitesRoot}`,
    `  opdev.py: ${defaults.opdevPyPath}`,
    `  report: ${defaults.reportPath}`
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const child = spawn(command, args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    shell: false
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
    process.stdout.write(chunk);
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
    process.stderr.write(chunk);
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });

  return { exitCode, stdout, stderr };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function loadSuiteLockfile(lockfilePath: string): Promise<SuiteLockfile> {
  let raw: string;
  try {
    raw = await fs.readFile(lockfilePath, "utf8");
  } catch {
    throw new Error(`Suite lockfile not found: ${lockfilePath}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in lockfile ${lockfilePath}: ${String(error)}`);
  }

  if (!isRecord(parsed)) {
    throw new Error(`Invalid lockfile shape at ${lockfilePath}`);
  }

  return parsed as SuiteLockfile;
}

async function readLatestJsonlRecord<T>(
  filePath: string
): Promise<T | null> {
  let text: string;
  try {
    text = await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }

  const lines = text.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    try {
      const parsed = JSON.parse(line);
      if (isRecord(parsed)) {
        return parsed as unknown as T;
      }
    } catch {
      continue;
    }
  }
  return null;
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeFsPath(inputPath: string): string {
  const normalized = path.normalize(inputPath.replace(/\//g, "\\"));
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function isPathWithin(filePath: string, rootPath: string): boolean {
  const normalizedFile = normalizeFsPath(path.resolve(filePath));
  const normalizedRoot = normalizeFsPath(path.resolve(rootPath));
  if (normalizedFile === normalizedRoot) {
    return true;
  }
  const rootWithSep = normalizedRoot.endsWith(path.sep)
    ? normalizedRoot
    : `${normalizedRoot}${path.sep}`;
  return normalizedFile.startsWith(rootWithSep);
}

function mapStagedPathToSource(
  filePath: string,
  pathMappings: Array<{ stagingPath: string; sourcePath: string }>
): string {
  const normalizedCandidate = path.normalize(filePath.replace(/\//g, "\\"));
  const sortedMappings = [...pathMappings].sort(
    (a, b) => b.stagingPath.length - a.stagingPath.length
  );

  const candidateNormCmp = normalizeFsPath(normalizedCandidate);
  for (const mapping of sortedMappings) {
    const stagingNorm = path.normalize(mapping.stagingPath.replace(/\//g, "\\"));
    const stagingNormCmp = normalizeFsPath(stagingNorm);
    if (candidateNormCmp === stagingNormCmp) {
      return path.resolve(mapping.sourcePath);
    }
    const stagingPrefix = stagingNormCmp.endsWith(path.sep)
      ? stagingNormCmp
      : `${stagingNormCmp}${path.sep}`;
    if (candidateNormCmp.startsWith(stagingPrefix)) {
      const relative = path.relative(stagingNorm, normalizedCandidate);
      if (!relative.startsWith("..")) {
        return path.resolve(mapping.sourcePath, relative);
      }
    }
  }

  return path.resolve(normalizedCandidate);
}

function parseCompilerDiagnosticsFromText(
  pluginName: string,
  text: string,
  source: "excerpt" | "response-error",
  pathMappings: Array<{ stagingPath: string; sourcePath: string }>
): CompilerDiagnostic[] {
  if (!text.trim()) {
    return [];
  }

  const diagnostics: CompilerDiagnostic[] = [];
  const lineRegex =
    /\]\s+(?<file>.+?\.as)\s+\((?<line>\d+)\s*,\s*(?<col>\d+)\)\s*:\s*(?<bucket>ERR|WARN|INFO)\s*:\s*(?<message>.+)$/i;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }
    const match = lineRegex.exec(line);
    if (!match || !match.groups) {
      continue;
    }

    const filePathRaw = match.groups.file?.trim();
    const lineRaw = Number.parseInt(match.groups.line ?? "", 10);
    const colRaw = Number.parseInt(match.groups.col ?? "", 10);
    const bucketRaw = (match.groups.bucket ?? "").toUpperCase();
    const messageRaw = match.groups.message?.trim() ?? "";

    if (!filePathRaw || !Number.isFinite(lineRaw) || !Number.isFinite(colRaw)) {
      continue;
    }
    if (bucketRaw !== "ERR" && bucketRaw !== "WARN" && bucketRaw !== "INFO") {
      continue;
    }

    const mappedPath = mapStagedPathToSource(filePathRaw, pathMappings);
    diagnostics.push({
      pluginName,
      filePath: mappedPath,
      line: lineRaw,
      column: colRaw,
      bucket: bucketRaw,
      message: messageRaw,
      source
    });
  }

  return dedupeCompilerDiagnostics(diagnostics);
}

function dedupeCompilerDiagnostics(diagnostics: CompilerDiagnostic[]): CompilerDiagnostic[] {
  const seen = new Set<string>();
  const out: CompilerDiagnostic[] = [];
  for (const diagnostic of diagnostics) {
    const key = [
      normalizeFsPath(diagnostic.filePath),
      diagnostic.line,
      diagnostic.column,
      diagnostic.bucket,
      diagnostic.message
    ].join("|");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(diagnostic);
  }
  return out;
}

async function collectAsFiles(rootPath: string): Promise<string[]> {
  const out: string[] = [];
  const stack: string[] = [rootPath];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".as")) {
        out.push(path.resolve(fullPath));
      }
    }
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

async function collectLanguageServerDiagnostics(
  roots: string[]
): Promise<{
  filesScanned: number;
  diagnostics: LsDiagnostic[];
  failedFiles: Array<{ filePath: string; error: string }>;
}> {
  const uniqueRoots = [...new Set(roots.map((root) => path.resolve(root)))];
  const fileSet = new Set<string>();
  for (const root of uniqueRoots) {
    const files = await collectAsFiles(root);
    for (const filePath of files) {
      fileSet.add(filePath);
    }
  }

  const filePaths = [...fileSet].sort((a, b) => a.localeCompare(b));
  const documents: TextDocument[] = [];
  for (const filePath of filePaths) {
    let text: string;
    try {
      text = await fs.readFile(filePath, "utf8");
    } catch {
      continue;
    }
    documents.push(
      TextDocument.create(
        URI.file(filePath).toString(),
        languageId,
        1,
        text
      )
    );
  }

  const analyses: DocumentAnalysis[] = documents.map((document) => analyzeDocument(document));
  const analysisByUri = new Map<string, DocumentAnalysis>(
    analyses.map((analysis) => [analysis.uri, analysis])
  );

  const settings = createDefaultSettings();
  const logger = {
    info: (message: string) => {
      console.log(`[suite-diff] ${message}`);
    },
    warn: (message: string) => {
      console.warn(`[suite-diff] ${message}`);
    },
    error: (message: string) => {
      console.error(`[suite-diff] ${message}`);
    }
  };
  const completionIndex = await buildCompletionIndex(settings, logger);
  const workspaceFunctionReturnTypes = collectFunctionReturnTypes(analyses);

  const diagnostics: LsDiagnostic[] = [];
  const failedFiles: Array<{ filePath: string; error: string }> = [];
  for (const document of documents) {
    const analysis = analysisByUri.get(document.uri);
    if (!analysis) {
      continue;
    }
    try {
      const syntaxDiagnostics = getSyntaxDiagnostics(document, analysis, {
        enableUnparsableStatementDiagnostics: true,
        maxDiagnostics: 500
      });
      const semanticDiagnostics = getSemanticDiagnostics(
        document,
        analysis,
        analyses,
        completionIndex,
        {
          enableUnknownSymbols: true,
          enableCaseMismatch: true,
          enableSemanticBinding: true,
          enableTypeChecking: true,
          maxSymbolDiagnostics: 500
        },
        workspaceFunctionReturnTypes
      );
      for (const diagnostic of [...syntaxDiagnostics, ...semanticDiagnostics]) {
        diagnostics.push(toLsDiagnostic(document, diagnostic));
      }
    } catch (error) {
      const filePath = path.resolve(uriToFsPath(document.uri));
      const message = error instanceof Error ? error.message : String(error);
      failedFiles.push({ filePath, error: message });
      console.warn(
        `[suite-diff] WARNING: diagnostics failed for ${filePath}: ${message}`
      );
    }
  }

  return {
    filesScanned: documents.length,
    diagnostics,
    failedFiles
  };
}

function toLsDiagnostic(document: TextDocument, diagnostic: Diagnostic): LsDiagnostic {
  const severity = diagnostic.severity ?? DiagnosticSeverity.Error;
  const code =
    typeof diagnostic.code === "string" || typeof diagnostic.code === "number"
      ? String(diagnostic.code)
      : "diag";
  return {
    filePath: path.resolve(uriToFsPath(document.uri)),
    line: diagnostic.range.start.line + 1,
    column: diagnostic.range.start.character + 1,
    severity,
    code,
    message: diagnostic.message
  };
}

function shouldConsiderLsDiagnostic(
  diagnostic: LsDiagnostic,
  includeWarnings: boolean
): boolean {
  if (diagnostic.severity === DiagnosticSeverity.Error) {
    return true;
  }
  if (includeWarnings && diagnostic.severity === DiagnosticSeverity.Warning) {
    return true;
  }
  return false;
}

function lsSeverityName(severity: DiagnosticSeverity): string {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return "Error";
    case DiagnosticSeverity.Warning:
      return "Warning";
    case DiagnosticSeverity.Information:
      return "Information";
    case DiagnosticSeverity.Hint:
      return "Hint";
    default:
      return "Unknown";
  }
}

function findCompilerMatch(
  lsDiagnostic: LsDiagnostic,
  compilerDiagnostics: CompilerDiagnostic[]
): CompilerDiagnostic | null {
  const normalizedLsFile = normalizeFsPath(lsDiagnostic.filePath);
  for (const compilerDiagnostic of compilerDiagnostics) {
    if (normalizeFsPath(compilerDiagnostic.filePath) !== normalizedLsFile) {
      continue;
    }
    if (compilerDiagnostic.line !== lsDiagnostic.line) {
      continue;
    }
    return compilerDiagnostic;
  }
  return null;
}

async function runCompileCheck(
  options: CliOptions,
  suiteRoot: string,
  pluginName: string
): Promise<CompileInvocationResult> {
  const args = [
    options.opdevPyPath,
    "suite",
    "compile-check",
    options.suite,
    pluginName,
    "--transport",
    options.transport,
    "--companion-host",
    options.companionHost,
    "--companion-port",
    String(options.companionPort),
    "--wait-frames",
    String(options.waitFrames),
    "--timeout-sec",
    String(options.timeoutSec)
  ];
  if (options.preserveRuntime === true) {
    args.push("--preserve-runtime");
  } else if (options.preserveRuntime === false) {
    args.push("--no-preserve-runtime");
  }

  const runResult = await runCommand(options.pythonExe, args, repositoryRoot);
  return loadCompileArtifactsForPlugin(
    suiteRoot,
    pluginName,
    {
      command: options.pythonExe,
      args,
      exitCode: runResult.exitCode,
      stdout: runResult.stdout,
      stderr: runResult.stderr
    }
  );
}

async function loadCompileArtifactsForPlugin(
  suiteRoot: string,
  pluginName: string,
  runContext: {
    command: string;
    args: string[];
    exitCode: number;
    stdout: string;
    stderr: string;
  }
): Promise<CompileInvocationResult> {
  const compileDir = path.join(suiteRoot, "logs", "_compile", pluginName);
  const runJsonlPath = path.join(compileDir, "run.jsonl");
  const runRecord = await readLatestJsonlRecord<CompileRunRecord>(runJsonlPath);
  const resultPath = path.resolve(
    runRecord?.result_path || path.join(compileDir, "result.json")
  );
  const excerptPath = path.resolve(
    runRecord?.excerpt_path || path.join(compileDir, "openplanet_excerpt.txt")
  );
  const compileResult = await readJsonFile<CompileCheckResult>(resultPath);
  const excerptText = await readTextFile(excerptPath);
  const pathMappings = collectPathMappings(compileResult);
  const responseError = compileResult?.response?.error ?? "";
  const excerptDiagnostics = parseCompilerDiagnosticsFromText(
    pluginName,
    excerptText,
    "excerpt",
    pathMappings
  );
  const responseDiagnostics = parseCompilerDiagnosticsFromText(
    pluginName,
    responseError,
    "response-error",
    pathMappings
  );
  const compilerDiagnostics = dedupeCompilerDiagnostics([
    ...excerptDiagnostics,
    ...responseDiagnostics
  ]);
  const compilerErrors = compilerDiagnostics.filter((entry) => entry.bucket === "ERR");

  return {
    command: runContext.command,
    args: runContext.args,
    exitCode: runContext.exitCode,
    stdout: runContext.stdout,
    stderr: runContext.stderr,
    runRecord,
    resultPath: await fileExists(resultPath) ? resultPath : null,
    excerptPath: await fileExists(excerptPath) ? excerptPath : null,
    compileResult,
    compilerDiagnostics,
    compilerErrors
  };
}

function collectPathMappings(
  compileResult: CompileCheckResult | null
): Array<{ stagingPath: string; sourcePath: string }> {
  if (!compileResult) {
    return [];
  }
  const mappings: Array<{ stagingPath: string; sourcePath: string }> = [];
  if (compileResult.staging_path && compileResult.plugin_source_path) {
    mappings.push({
      stagingPath: compileResult.staging_path,
      sourcePath: compileResult.plugin_source_path
    });
  }
  for (const dep of compileResult.staged_dependencies ?? []) {
    if (!dep?.staging_path || !dep?.source_path) {
      continue;
    }
    mappings.push({
      stagingPath: dep.staging_path,
      sourcePath: dep.source_path
    });
  }
  return mappings;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

function summarizeCompileInvocation(invocation: CompileInvocationResult): Omit<CompileInvocationResult, "compilerDiagnostics" | "compilerErrors"> {
  return {
    command: invocation.command,
    args: invocation.args,
    exitCode: invocation.exitCode,
    stdout: invocation.stdout,
    stderr: invocation.stderr,
    runRecord: invocation.runRecord,
    resultPath: invocation.resultPath,
    excerptPath: invocation.excerptPath,
    compileResult: invocation.compileResult
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function collectDependencyAnalysisRoots(
  lockfile: SuiteLockfile,
  sourcePlugins: Record<string, SourcePluginRecord>,
  selectedPluginPaths: string[],
  compileInvocations: Map<string, CompileInvocationResult>
): Promise<string[]> {
  const selectedPathSet = new Set(
    selectedPluginPaths.map((pluginPath) => normalizeFsPath(path.resolve(pluginPath)))
  );
  const dependencyRoots = new Set<string>();

  for (const dependencyName of lockfile.deps_source ?? []) {
    const candidatePath = path.resolve(sourcePlugins[dependencyName]?.path ?? "");
    if (!candidatePath) {
      continue;
    }
    if (!(await pathExists(candidatePath))) {
      continue;
    }
    if (selectedPathSet.has(normalizeFsPath(candidatePath))) {
      continue;
    }
    dependencyRoots.add(candidatePath);
  }

  for (const invocation of compileInvocations.values()) {
    for (const dependency of invocation.compileResult?.staged_dependencies ?? []) {
      const sourcePathRaw = String(dependency.source_path ?? "").trim();
      if (sourcePathRaw.length > 0) {
        const sourcePath = path.resolve(sourcePathRaw);
        if (
          (await pathExists(sourcePath)) &&
          !selectedPathSet.has(normalizeFsPath(sourcePath))
        ) {
          dependencyRoots.add(sourcePath);
        }
      }

      const dependencyName = String(dependency.name ?? "").trim();
      if (dependencyName.length === 0) {
        continue;
      }
      const lockfilePath = path.resolve(sourcePlugins[dependencyName]?.path ?? "");
      if (!lockfilePath) {
        continue;
      }
      if (
        (await pathExists(lockfilePath)) &&
        !selectedPathSet.has(normalizeFsPath(lockfilePath))
      ) {
        dependencyRoots.add(lockfilePath);
      }
    }
  }

  return [...dependencyRoots].sort((a, b) => a.localeCompare(b));
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const suiteRoot = path.join(options.suitesRoot, options.suite);
  const lockfilePath = path.join(suiteRoot, "suite.lock.json");
  const lockfile = await loadSuiteLockfile(lockfilePath);
  const sourcePlugins = lockfile.source_plugins ?? {};
  const availablePluginNames = Object.keys(sourcePlugins).sort((a, b) => a.localeCompare(b));
  if (availablePluginNames.length === 0) {
    throw new Error(`No source_plugins entries found in ${lockfilePath}`);
  }

  const selectedPluginNames =
    options.plugins.length > 0
      ? options.plugins
      : availablePluginNames;
  const missingPluginNames = selectedPluginNames.filter((name) => !(name in sourcePlugins));
  if (missingPluginNames.length > 0) {
    throw new Error(
      `Plugins not found in lockfile: ${missingPluginNames.join(", ")}`
    );
  }

  const selectedPluginPaths = selectedPluginNames.map((name) =>
    path.resolve(sourcePlugins[name]?.path ?? "")
  );
  for (const pluginPath of selectedPluginPaths) {
    if (!pluginPath || !(await pathExists(pluginPath))) {
      throw new Error(`Plugin path does not exist: ${pluginPath}`);
    }
  }

  console.log(`[suite-diff] Suite: ${options.suite}`);
  console.log(`[suite-diff] Plugins: ${selectedPluginNames.join(", ")}`);
  console.log(`[suite-diff] Skip compile: ${String(options.skipCompile)}`);

  const compileInvocations = new Map<string, CompileInvocationResult>();
  for (const pluginName of selectedPluginNames) {
    if (options.skipCompile) {
      console.log(`[suite-diff] Loading latest compile logs for ${pluginName}`);
      const invocation = await loadCompileArtifactsForPlugin(
        suiteRoot,
        pluginName,
        {
          command: "<skipped>",
          args: [],
          exitCode: 0,
          stdout: "",
          stderr: ""
        }
      );
      compileInvocations.set(pluginName, invocation);
      continue;
    }

    console.log(`[suite-diff] compile-check ${pluginName}`);
    const invocation = await runCompileCheck(options, suiteRoot, pluginName);
    compileInvocations.set(pluginName, invocation);
    if (invocation.exitCode !== 0) {
      console.warn(
        `[suite-diff] WARNING: compile-check exited with ${invocation.exitCode} for ${pluginName}`
      );
    }
  }

  const dependencyAnalysisRoots = await collectDependencyAnalysisRoots(
    lockfile,
    sourcePlugins,
    selectedPluginPaths,
    compileInvocations
  );
  if (dependencyAnalysisRoots.length > 0) {
    console.log(
      `[suite-diff] Dependency analysis roots: ${dependencyAnalysisRoots.join(", ")}`
    );
  }

  console.log("[suite-diff] Running language-server diagnostics scan...");
  const lsScan = await collectLanguageServerDiagnostics([
    ...selectedPluginPaths,
    ...dependencyAnalysisRoots
  ]);
  const lsDiagnosticsByPlugin = new Map<string, LsDiagnostic[]>();
  for (const pluginName of selectedPluginNames) {
    const pluginPath = path.resolve(sourcePlugins[pluginName]?.path ?? "");
    const entries = lsScan.diagnostics.filter((diagnostic) =>
      isPathWithin(diagnostic.filePath, pluginPath)
    );
    lsDiagnosticsByPlugin.set(pluginName, entries);
  }

  const pluginReports: PluginParityReport[] = [];
  for (const pluginName of selectedPluginNames) {
    const pluginPath = path.resolve(sourcePlugins[pluginName]?.path ?? "");
    const compileInvocation = compileInvocations.get(pluginName) ?? null;
    const compilerDiagnostics = (compileInvocation?.compilerDiagnostics ?? []).filter(
      (entry) => isPathWithin(entry.filePath, pluginPath)
    );
    const compilerErrors = compilerDiagnostics.filter((entry) => entry.bucket === "ERR");
    const compilerWarnings = compilerDiagnostics.filter((entry) => entry.bucket === "WARN");
    const lsDiagnostics = lsDiagnosticsByPlugin.get(pluginName) ?? [];
    const lsErrors = lsDiagnostics.filter(
      (entry) => entry.severity === DiagnosticSeverity.Error
    );
    const lsWarnings = lsDiagnostics.filter(
      (entry) => entry.severity === DiagnosticSeverity.Warning
    );
    const consideredLsDiagnostics = lsDiagnostics.filter((diagnostic) =>
      shouldConsiderLsDiagnostic(diagnostic, options.includeWarnings)
    );

    const falsePositives: LsDiagnostic[] = [];
    const matchedCompilerKeys = new Set<string>();
    const matched: Array<{
      filePath: string;
      line: number;
      lsCode: string;
      lsMessage: string;
      compilerMessage: string;
    }> = [];

    for (const lsDiagnostic of consideredLsDiagnostics) {
      const compilerMatch = findCompilerMatch(lsDiagnostic, compilerErrors);
      if (!compilerMatch) {
        falsePositives.push(lsDiagnostic);
        continue;
      }
      matchedCompilerKeys.add(
        `${normalizeFsPath(compilerMatch.filePath)}:${compilerMatch.line}`
      );
      matched.push({
        filePath: lsDiagnostic.filePath,
        line: lsDiagnostic.line,
        lsCode: lsDiagnostic.code,
        lsMessage: lsDiagnostic.message,
        compilerMessage: compilerMatch.message
      });
    }

    const falseNegatives = compilerErrors.filter((compilerDiagnostic) => {
      const key = `${normalizeFsPath(compilerDiagnostic.filePath)}:${compilerDiagnostic.line}`;
      return !matchedCompilerKeys.has(key);
    });

    pluginReports.push({
      pluginName,
      pluginPath,
      compile: {
        executed: !options.skipCompile,
        exitCode: compileInvocation?.exitCode ?? null,
        success: compileInvocation?.compileResult?.success ?? null,
        timedOut: compileInvocation?.compileResult?.timed_out ?? null,
        resultPath: compileInvocation?.resultPath ?? null,
        excerptPath: compileInvocation?.excerptPath ?? null,
        responseError: compileInvocation?.compileResult?.response?.error?.trim()
          ? compileInvocation.compileResult.response.error
          : null
      },
      counts: {
        lsErrors: lsErrors.length,
        lsWarnings: lsWarnings.length,
        compilerErrors: compilerErrors.length,
        compilerWarnings: compilerWarnings.length,
        falsePositives: falsePositives.length,
        falseNegatives: falseNegatives.length
      },
      falsePositives,
      falseNegatives,
      matched
    });
  }

  pluginReports.sort((a, b) => a.pluginName.localeCompare(b.pluginName));
  const allLsErrors = lsScan.diagnostics.filter((entry) => entry.severity === DiagnosticSeverity.Error).length;
  const allLsWarnings = lsScan.diagnostics.filter((entry) => entry.severity === DiagnosticSeverity.Warning).length;
  const totalCompilerErrors = pluginReports.reduce(
    (sum, plugin) => sum + plugin.counts.compilerErrors,
    0
  );
  const totalCompilerWarnings = pluginReports.reduce(
    (sum, plugin) => sum + plugin.counts.compilerWarnings,
    0
  );
  const totalFalsePositives = pluginReports.reduce(
    (sum, plugin) => sum + plugin.counts.falsePositives,
    0
  );
  const totalFalseNegatives = pluginReports.reduce(
    (sum, plugin) => sum + plugin.counts.falseNegatives,
    0
  );

  const compileInvocationSummary: Record<string, Omit<CompileInvocationResult, "compilerDiagnostics" | "compilerErrors">> = {};
  for (const [pluginName, invocation] of compileInvocations.entries()) {
    compileInvocationSummary[pluginName] = summarizeCompileInvocation(invocation);
  }

  const report: FinalReport = {
    tsUtc: new Date().toISOString(),
    suite: options.suite,
    suiteRoot,
    lockfilePath,
    config: {
      skipCompile: options.skipCompile,
      includeWarnings: options.includeWarnings,
      failOnFalsePositives: options.failOnFalsePositives,
      plugins: selectedPluginNames,
      transport: options.transport,
      companionHost: options.companionHost,
      companionPort: options.companionPort,
      waitFrames: options.waitFrames,
      timeoutSec: options.timeoutSec,
      preserveRuntime: options.preserveRuntime
    },
    totals: {
      filesScanned: lsScan.filesScanned,
      lsFailedFiles: lsScan.failedFiles.length,
      lsDiagnostics: lsScan.diagnostics.length,
      lsErrors: allLsErrors,
      lsWarnings: allLsWarnings,
      compilerErrors: totalCompilerErrors,
      compilerWarnings: totalCompilerWarnings,
      falsePositives: totalFalsePositives,
      falseNegatives: totalFalseNegatives
    },
    compileInvocations: compileInvocationSummary,
    lsFailedFiles: lsScan.failedFiles,
    plugins: pluginReports
  };

  await fs.mkdir(path.dirname(options.reportPath), { recursive: true });
  await fs.writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`[suite-diff] Report: ${options.reportPath}`);
  console.log(`[suite-diff] Files scanned: ${lsScan.filesScanned}`);
  console.log(`[suite-diff] LS failed files: ${lsScan.failedFiles.length}`);
  console.log(`[suite-diff] LS diagnostics: total=${lsScan.diagnostics.length} errors=${allLsErrors} warnings=${allLsWarnings}`);
  console.log(`[suite-diff] Compiler diagnostics: errors=${totalCompilerErrors} warnings=${totalCompilerWarnings}`);
  console.log(`[suite-diff] False positives: ${totalFalsePositives}`);
  console.log(`[suite-diff] False negatives: ${totalFalseNegatives}`);

  for (const plugin of pluginReports) {
    if (plugin.falsePositives.length === 0) {
      continue;
    }
    console.log(
      `[suite-diff] ${plugin.pluginName}: ${plugin.falsePositives.length} false positives`
    );
    for (const diagnostic of plugin.falsePositives.slice(0, 20)) {
      const relativePath = path.relative(plugin.pluginPath, diagnostic.filePath) || diagnostic.filePath;
      console.log(
        `[suite-diff]   ${relativePath}:${diagnostic.line}:${diagnostic.column} [${diagnostic.code}] ${lsSeverityName(diagnostic.severity)} ${diagnostic.message}`
      );
    }
    if (plugin.falsePositives.length > 20) {
      console.log(
        `[suite-diff]   ... ${plugin.falsePositives.length - 20} more`
      );
    }
  }

  if (options.failOnFalsePositives && totalFalsePositives > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[suite-diff] FAILED: ${message}`);
  process.exitCode = 1;
});
