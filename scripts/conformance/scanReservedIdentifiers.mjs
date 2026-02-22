#!/usr/bin/env node

import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

function nowIso() {
  return new Date().toISOString();
}

function timestampForPath() {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

function toIntOrDefault(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function parseBoolean(raw, fallback) {
  const normalized = String(raw ?? "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (["1", "true", "yes", "y", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function requireArgValue(argv, i, flagName) {
  if (i >= argv.length) {
    throw new Error(`${flagName} requires a value.`);
  }
  const value = argv[i];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flagName} requires a value.`);
  }
  return value;
}

function parseArgs(argv, defaults) {
  const opts = {
    ...defaults
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
      case "--transport":
        i += 1;
        opts.transport = requireArgValue(argv, i, "--transport");
        break;
      case "--timeout-sec":
        i += 1;
        opts.timeoutSec = toIntOrDefault(
          requireArgValue(argv, i, "--timeout-sec"),
          opts.timeoutSec
        );
        break;
      case "--wait-frames":
        i += 1;
        opts.waitFrames = toIntOrDefault(
          requireArgValue(argv, i, "--wait-frames"),
          opts.waitFrames
        );
        break;
      case "--companion-host":
        i += 1;
        opts.companionHost = requireArgValue(argv, i, "--companion-host");
        break;
      case "--companion-port":
        i += 1;
        opts.companionPort = toIntOrDefault(
          requireArgValue(argv, i, "--companion-port"),
          opts.companionPort
        );
        break;
      case "--max-candidates":
        i += 1;
        opts.maxCandidates = toIntOrDefault(
          requireArgValue(argv, i, "--max-candidates"),
          opts.maxCandidates
        );
        break;
      case "--batch-size":
        i += 1;
        opts.batchSize = toIntOrDefault(
          requireArgValue(argv, i, "--batch-size"),
          opts.batchSize
        );
        break;
      case "--report-root":
        i += 1;
        opts.reportRoot = path.resolve(requireArgValue(argv, i, "--report-root"));
        break;
      case "--candidates-file":
        i += 1;
        opts.candidatesFile = path.resolve(
          requireArgValue(argv, i, "--candidates-file")
        );
        break;
      case "--include-seed-keywords":
        opts.includeSeedKeywords = true;
        break;
      case "--no-seed-keywords":
        opts.includeSeedKeywords = false;
        break;
      case "--dry-run":
        opts.dryRun = true;
        break;
      case "--help":
      case "-h":
        printHelpAndExit(defaults);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}. Use --help for usage.`);
    }
  }

  if (!Number.isFinite(opts.maxCandidates) || opts.maxCandidates <= 0) {
    throw new Error("--max-candidates must be > 0");
  }
  if (!Number.isFinite(opts.batchSize) || opts.batchSize <= 0) {
    throw new Error("--batch-size must be > 0");
  }

  return opts;
}

function printHelpAndExit(defaults) {
  const lines = [
    "Usage: npm run test:reserved-identifiers -- [options]",
    "",
    "Generates high-volume identifier batches, compiles through Openplanet,",
    "and extracts identifiers reported as reserved keywords.",
    "",
    "Options:",
    "  --suite <name>            Suite name (default: ExampleSuite).",
    "  --max-candidates <n>      Number of candidate names to test.",
    "  --batch-size <n>          Candidates per generated case.",
    "  --candidates-file <path>  Optional newline-separated candidates to prepend.",
    "  --include-seed-keywords   Include built-in AngelScript/Openplanet keyword seeds.",
    "  --no-seed-keywords        Disable built-in keyword seeds.",
    "  --transport <mode>        Companion transport (auto|socket|file).",
    "  --timeout-sec <n>         Per-case timeout for suite conformance.",
    "  --wait-frames <n>         Companion wait frames.",
    "  --companion-host <host>   Companion host.",
    "  --companion-port <n>      Companion port.",
    "  --suites-root <path>      Suites root path.",
    "  --opdev-py <path>         Path to opdev.py.",
    "  --python <exe>            Python executable.",
    "  --report-root <path>      Output root for scan reports.",
    "  --dry-run                 Generate fixture and summary only (no opdev run).",
    "  -h, --help                Show help.",
    "",
    "Defaults:",
    `  suite: ${defaults.suite}`,
    `  max-candidates: ${defaults.maxCandidates}`,
    `  batch-size: ${defaults.batchSize}`,
    `  include-seed-keywords: ${String(defaults.includeSeedKeywords)}`,
    `  suites root: ${defaults.suitesRoot}`,
    `  opdev.py: ${defaults.opdevPyPath}`,
    `  report root: ${defaults.reportRoot}`
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

async function runCommand({ label, command, args, cwd, env, shell = false }) {
  const startedAt = Date.now();
  const startedIso = nowIso();
  const cmdLine = [command, ...args].map(quoteForDisplay).join(" ");
  console.log(`[reserved-scan] ${label}: ${cmdLine}`);
  if (cwd) {
    console.log(`[reserved-scan] ${label}: cwd=${cwd}`);
  }

  const child = spawn(command, args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    shell
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
    process.stdout.write(chunk);
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
    process.stderr.write(chunk);
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });

  return {
    label,
    command,
    args,
    cwd: cwd ?? process.cwd(),
    startedAt: startedIso,
    finishedAt: nowIso(),
    durationMs: Date.now() - startedAt,
    exitCode,
    stdout,
    stderr
  };
}

function quoteForDisplay(arg) {
  if (/^[A-Za-z0-9_./:\\-]+$/.test(arg)) {
    return arg;
  }
  return `"${arg.replace(/"/g, '\\"')}"`;
}

async function writeCommandLog(reportDir, commandResult) {
  const logPath = path.join(reportDir, `${commandResult.label}.log`);
  const text = [
    `label: ${commandResult.label}`,
    `startedAt: ${commandResult.startedAt}`,
    `finishedAt: ${commandResult.finishedAt}`,
    `durationMs: ${commandResult.durationMs}`,
    `exitCode: ${commandResult.exitCode}`,
    `cwd: ${commandResult.cwd}`,
    `command: ${commandResult.command}`,
    `args: ${JSON.stringify(commandResult.args)}`,
    "",
    "--- stdout ---",
    commandResult.stdout,
    "",
    "--- stderr ---",
    commandResult.stderr
  ].join("\n");
  await fs.writeFile(logPath, text, "utf8");
  return logPath;
}

async function writeJsonl(filePath, items) {
  const lines = items.map((item) => JSON.stringify(item));
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
}

async function readJsonl(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    out.push(JSON.parse(trimmed));
  }
  return out;
}

function parseOracleRunDir(stdoutText) {
  const match = stdoutText.match(/^\[suite conformance\]\s+Run dir:\s*(.+)$/m);
  if (!match) {
    return null;
  }
  const raw = match[1].trim();
  return raw ? path.resolve(raw) : null;
}

async function findLatestOracleRunDir(suitesRoot, suite) {
  const root = path.join(suitesRoot, suite, "logs", "_conformance");
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return null;
  }

  const dirs = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("run-")) {
      continue;
    }
    const fullPath = path.join(root, entry.name);
    try {
      const stats = await fs.stat(fullPath);
      dirs.push({ fullPath, mtimeMs: stats.mtimeMs });
    } catch { }
  }
  dirs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return dirs.length > 0 ? dirs[0].fullPath : null;
}

function sanitizeCommandResult(result) {
  return {
    label: result.label,
    command: result.command,
    args: result.args,
    cwd: result.cwd,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    logPath: result.logPath
  };
}

function seedKeywordIdentifiers() {
  return [
    "if",
    "else",
    "for",
    "foreach",
    "while",
    "do",
    "switch",
    "case",
    "default",
    "break",
    "continue",
    "return",
    "class",
    "interface",
    "enum",
    "namespace",
    "funcdef",
    "typedef",
    "using",
    "import",
    "from",
    "in",
    "out",
    "inout",
    "is",
    "not",
    "and",
    "or",
    "xor",
    "cast",
    "mixin",
    "try",
    "catch",
    "throw",
    "const",
    "private",
    "protected",
    "shared",
    "override",
    "external",
    "final",
    "explicit",
    "abstract",
    "delete",
    "this",
    "super",
    "property",
    "get",
    "set",
    "function",
    "true",
    "false",
    "null",
    "void",
    "bool",
    "int",
    "int8",
    "int16",
    "int32",
    "int64",
    "uint",
    "uint8",
    "uint16",
    "uint32",
    "uint64",
    "float",
    "double",
    "string",
    "auto"
  ];
}

async function loadExtraCandidates(filePath) {
  if (!filePath) {
    return [];
  }
  let raw = "";
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Failed reading candidates file "${filePath}": ${String(error)}`);
  }

  const out = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const value = rawLine.trim();
    if (!value || value.startsWith("#")) {
      continue;
    }
    if (isValidIdentifier(value)) {
      out.push(value);
    }
  }
  return out;
}

function isValidIdentifier(value) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function alphabeticalIdentifierAt(index) {
  let remaining = index;
  let length = 1;
  let bucketSize = 26;
  while (remaining >= bucketSize) {
    remaining -= bucketSize;
    length += 1;
    bucketSize *= 26;
  }

  const chars = new Array(length);
  for (let i = length - 1; i >= 0; i -= 1) {
    chars[i] = String.fromCharCode(97 + (remaining % 26));
    remaining = Math.floor(remaining / 26);
  }
  return chars.join("");
}

function buildCandidateList(maxCandidates, options) {
  const includeSeedKeywords = options.includeSeedKeywords === true;
  const seed = includeSeedKeywords ? seedKeywordIdentifiers() : [];
  const extra = options.extraCandidates ?? [];
  const out = [];
  const seen = new Set();

  const pushCandidate = (value) => {
    if (!isValidIdentifier(value)) {
      return;
    }
    if (seen.has(value)) {
      return;
    }
    seen.add(value);
    out.push(value);
  };

  for (const value of seed) {
    if (out.length >= maxCandidates) {
      return out;
    }
    pushCandidate(value);
  }

  for (const value of extra) {
    if (out.length >= maxCandidates) {
      return out;
    }
    pushCandidate(value);
  }

  let i = 0;
  while (out.length < maxCandidates) {
    pushCandidate(alphabeticalIdentifierAt(i));
    i += 1;
  }

  return out.slice(0, maxCandidates);
}

function buildScanCases(candidates, batchSize) {
  const cases = [];
  for (let start = 0; start < candidates.length; start += batchSize) {
    const batch = candidates.slice(start, Math.min(candidates.length, start + batchSize));
    const batchNo = Math.floor(start / batchSize) + 1;
    const lineStart = 2;
    const lines = [
      "void Main() {",
      ...batch.map((name) => `    string ${name};`),
      "}"
    ];

    cases.push({
      id: `reservedscan.batch.${String(batchNo).padStart(5, "0")}`,
      description: `Reserved identifier scan batch ${batchNo} (${batch.length} candidates).`,
      expect: "compile_success",
      code: lines.join("\n"),
      meta: {
        lineStart,
        candidates: batch
      }
    });
  }
  return cases;
}

function parseReservedMatchesFromExcerpt(content) {
  const matches = [];
  const pattern =
    /\((\d+),\s*(\d+)\)\s*:\s*ERR\s*:\s*Instead found reserved keyword '([^']+)'/gi;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    matches.push({
      line: Number.parseInt(match[1], 10),
      column: Number.parseInt(match[2], 10),
      keyword: String(match[3] ?? "").trim()
    });
  }
  return matches;
}

async function extractReservedIdentifierFindings({
  runDir,
  rawFixturePath,
  detailsJsonlPath
}) {
  const cases = await readJsonl(rawFixturePath);
  const caseById = new Map(
    cases.map((entry) => [entry.id, entry])
  );

  const runRows = await readJsonl(path.join(runDir, "run.jsonl"));
  const findings = [];
  const reservedCandidateSet = new Set();
  const reservedTokenSet = new Set();
  let rowsWithCompileErrors = 0;
  let rowsWithHarnessErrors = 0;
  let rowsWithCompileSuccess = 0;
  let rowsWithExcerpt = 0;

  for (const row of runRows) {
    const caseId = typeof row.case_id === "string" ? row.case_id : "";
    const observed = typeof row.observed === "string" ? row.observed : "";
    if (!caseId) {
      continue;
    }
    if (observed === "compile_error") {
      rowsWithCompileErrors += 1;
    } else if (observed === "harness_error") {
      rowsWithHarnessErrors += 1;
    } else if (observed === "compile_success") {
      rowsWithCompileSuccess += 1;
    }

    const compileExcerptPath =
      typeof row.compile_excerpt_path === "string" && row.compile_excerpt_path.trim()
        ? path.resolve(row.compile_excerpt_path)
        : null;
    if (!compileExcerptPath) {
      continue;
    }
    rowsWithExcerpt += 1;

    let excerpt = "";
    try {
      excerpt = await fs.readFile(compileExcerptPath, "utf8");
    } catch {
      continue;
    }

    const parsed = parseReservedMatchesFromExcerpt(excerpt);
    if (parsed.length === 0) {
      continue;
    }

    const fixture = caseById.get(caseId);
    const lineStart = Number(fixture?.meta?.lineStart ?? 2);
    const candidates = Array.isArray(fixture?.meta?.candidates)
      ? fixture.meta.candidates
      : [];

    for (const item of parsed) {
      const candidateIndex = item.line - lineStart;
      const candidate =
        candidateIndex >= 0 && candidateIndex < candidates.length
          ? candidates[candidateIndex]
          : null;
      const keyword = item.keyword;
      if (candidate) {
        reservedCandidateSet.add(candidate);
      } else if (keyword && isValidIdentifier(keyword)) {
        reservedCandidateSet.add(keyword);
      }
      if (keyword) {
        reservedTokenSet.add(keyword);
      }
      findings.push({
        caseId,
        observed,
        compileExcerptPath,
        line: item.line,
        column: item.column,
        reservedKeyword: keyword,
        candidate,
        keywordMatchesCandidate:
          !!candidate && keyword.toLowerCase() === String(candidate).toLowerCase()
      });
    }
  }

  await writeJsonl(detailsJsonlPath, findings);
  return {
    findings,
    rowsTotal: runRows.length,
    rowsWithHarnessErrors,
    rowsWithCompileSuccess,
    rowsWithExcerpt,
    rowsWithCompileErrors,
    reservedIdentifiers: [...reservedCandidateSet].sort((a, b) =>
      a.localeCompare(b)
    ),
    reservedTokens: [...reservedTokenSet].sort((a, b) => a.localeCompare(b))
  };
}

async function readConformanceSummary(runDir) {
  if (!runDir) {
    return null;
  }
  const summaryPath = path.join(runDir, "summary.json");
  try {
    const raw = await fs.readFile(summaryPath, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

function toTsStringLiteral(value) {
  return JSON.stringify(value);
}

async function readExistingGeneratedLanguageServerReservedIdentifiers(outputPath) {
  let content = "";
  try {
    content = await fs.readFile(outputPath, "utf8");
  } catch {
    return [];
  }
  const matches = content.match(/"([A-Za-z_][A-Za-z0-9_]*)"/g) ?? [];
  const values = [];
  for (const raw of matches) {
    const identifier = raw.slice(1, -1);
    if (!isValidIdentifier(identifier)) {
      continue;
    }
    values.push(identifier);
  }
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

async function writeGeneratedLanguageServerReservedIdentifiers({
  repoRoot,
  reservedIdentifiers,
  suite,
  runDir
}) {
  const outputPath = path.join(
    repoRoot,
    "src",
    "server",
    "reservedIdentifiers.generated.ts"
  );
  const existing = await readExistingGeneratedLanguageServerReservedIdentifiers(
    outputPath
  );
  const normalized = [...new Set([...existing, ...reservedIdentifiers])]
    .filter((item) => isValidIdentifier(item))
    .sort((a, b) => a.localeCompare(b));

  const lines = [
    "// This file is auto-generated by scripts/conformance/scanReservedIdentifiers.mjs.",
    "// Do not edit manually.",
    `// Generated at: ${nowIso()}`,
    `// Suite: ${suite}`,
    `// Oracle run: ${runDir}`,
    "",
    "export const generatedReservedIdentifiers = [",
    ...normalized.map((item) => `  ${toTsStringLiteral(item)},`),
    "] as const;",
    ""
  ];
  await fs.writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
  return {
    outputPath,
    mergedCount: normalized.length,
    existingCount: existing.length,
    extractedCount: reservedIdentifiers.length
  };
}

async function main() {
  const thisFilePath = fileURLToPath(import.meta.url);
  const scriptsDir = path.dirname(thisFilePath);
  const repoRoot = path.resolve(scriptsDir, "..", "..");

  const defaults = {
    suite: process.env.OPAS_RESERVED_SCAN_SUITE || "ExampleSuite",
    suitesRoot: path.resolve(process.env.OPAS_SUITES_ROOT || "D:\\OpenplanetDev\\suites"),
    opdevPyPath: path.resolve(process.env.OPAS_OPDEV_PY || "D:\\OpenplanetDev\\tools\\opdev\\opdev.py"),
    pythonExe: process.env.OPAS_PYTHON || "python",
    transport: process.env.OPAS_PARITY_TRANSPORT || "socket",
    timeoutSec: toIntOrDefault(process.env.OPAS_PARITY_TIMEOUT_SEC, 20),
    waitFrames: toIntOrDefault(process.env.OPAS_PARITY_WAIT_FRAMES, 20),
    companionHost: process.env.OPAS_PARITY_COMPANION_HOST || "127.0.0.1",
    companionPort: toIntOrDefault(process.env.OPAS_PARITY_COMPANION_PORT, 32000),
    maxCandidates: toIntOrDefault(process.env.OPAS_RESERVED_SCAN_MAX_CANDIDATES, 50000),
    batchSize: toIntOrDefault(process.env.OPAS_RESERVED_SCAN_BATCH_SIZE, 500),
    candidatesFile: process.env.OPAS_RESERVED_SCAN_CANDIDATES_FILE
      ? path.resolve(process.env.OPAS_RESERVED_SCAN_CANDIDATES_FILE)
      : null,
    includeSeedKeywords: parseBoolean(
      process.env.OPAS_RESERVED_SCAN_INCLUDE_SEED_KEYWORDS,
      true
    ),
    dryRun: false,
    reportRoot: path.resolve(
      process.env.OPAS_RESERVED_SCAN_REPORT_ROOT ||
      path.join(repoRoot, "out", "test", "reserved-identifiers")
    )
  };

  const opts = parseArgs(process.argv.slice(2), defaults);

  const runId = `${timestampForPath()}-${opts.suite}`;
  const reportDir = path.join(opts.reportRoot, runId);
  await fs.mkdir(reportDir, { recursive: true });

  const generatedDir = path.join(opts.suitesRoot, opts.suite, "conformance", "generated");
  const rawFixturePath = path.join(generatedDir, "reserved-identifiers.raw.jsonl");
  const detailsJsonlPath = path.join(reportDir, "reserved-findings.jsonl");
  const reservedJsonPath = path.join(reportDir, "reserved-identifiers.json");
  const reservedTxtPath = path.join(reportDir, "reserved-identifiers.txt");

  const summary = {
    startedAt: nowIso(),
    finishedAt: null,
    status: "failed",
    suite: opts.suite,
    reportDir,
    rawFixturePath,
    detailsJsonlPath,
    reservedJsonPath,
    reservedTxtPath,
    languageServerGeneratedPath: null,
    runDir: null,
    conformanceSummary: null,
    config: { ...opts },
    totals: null,
    commands: [],
    error: null
  };

  try {
    const extraCandidates = await loadExtraCandidates(opts.candidatesFile);
    const candidates = buildCandidateList(opts.maxCandidates, {
      includeSeedKeywords: opts.includeSeedKeywords,
      extraCandidates
    });
    const cases = buildScanCases(candidates, opts.batchSize);
    await writeJsonl(rawFixturePath, cases);

    summary.totals = {
      candidates: candidates.length,
      batches: cases.length
    };

    console.log(`[reserved-scan] Fixture: ${rawFixturePath}`);
    console.log(`[reserved-scan] Candidates: ${String(candidates.length)}`);
    console.log(`[reserved-scan] Batches: ${String(cases.length)}`);

    if (opts.dryRun) {
      summary.status = "dry_run";
    } else {
      const statusArgs = [
        opts.opdevPyPath,
        "suite",
        "companion-status",
        opts.suite,
        "--companion-host",
        opts.companionHost,
        "--companion-port",
        String(opts.companionPort),
        "--timeout-sec",
        "5"
      ];
      const companionStatus = await runCommand({
        label: "01-companion-status",
        command: opts.pythonExe,
        args: statusArgs,
        cwd: repoRoot,
        env: process.env
      });
      companionStatus.logPath = await writeCommandLog(reportDir, companionStatus);
      summary.commands.push(sanitizeCommandResult(companionStatus));
      if (companionStatus.exitCode !== 0) {
        throw new Error(
          "Companion status check failed. Ensure Trackmania/Openplanet + OpDevCompanion are running."
        );
      }

      const conformanceArgs = [
        opts.opdevPyPath,
        "suite",
        "conformance",
        opts.suite,
        "--fixtures",
        rawFixturePath,
        "--transport",
        opts.transport,
        "--companion-host",
        opts.companionHost,
        "--companion-port",
        String(opts.companionPort),
        "--wait-frames",
        String(opts.waitFrames),
        "--timeout-sec",
        String(opts.timeoutSec)
      ];
      const conformance = await runCommand({
        label: "02-opdev-conformance",
        command: opts.pythonExe,
        args: conformanceArgs,
        cwd: repoRoot,
        env: process.env
      });
      conformance.logPath = await writeCommandLog(reportDir, conformance);
      summary.commands.push(sanitizeCommandResult(conformance));

      let runDir = parseOracleRunDir(conformance.stdout);
      if (!runDir) {
        runDir = await findLatestOracleRunDir(opts.suitesRoot, opts.suite);
      }
      if (!runDir) {
        throw new Error("Could not determine conformance run directory.");
      }
      summary.runDir = runDir;

      const extraction = await extractReservedIdentifierFindings({
        runDir,
        rawFixturePath,
        detailsJsonlPath
      });
      const conformanceSummary = await readConformanceSummary(runDir);
      summary.conformanceSummary = conformanceSummary;

      const allHarnessErrors =
        extraction.rowsTotal > 0 &&
        extraction.rowsWithHarnessErrors === extraction.rowsTotal;
      if (allHarnessErrors) {
        throw new Error(
          "Conformance run produced only harness_error rows; no compile data available."
        );
      }

      await fs.writeFile(
        reservedJsonPath,
        `${JSON.stringify(
          {
            ts_utc: nowIso(),
            suite: opts.suite,
            runDir,
            candidatesTested: candidates.length,
            batchSize: opts.batchSize,
            conformance: conformanceSummary,
            rowsTotal: extraction.rowsTotal,
            rowsWithCompileSuccess: extraction.rowsWithCompileSuccess,
            compileErrorBatches: extraction.rowsWithCompileErrors,
            harnessErrorBatches: extraction.rowsWithHarnessErrors,
            rowsWithExcerpt: extraction.rowsWithExcerpt,
            reservedIdentifiers: extraction.reservedIdentifiers,
            compilerReservedTokens: extraction.reservedTokens
          },
          null,
          2
        )}\n`,
        "utf8"
      );
      await fs.writeFile(
        reservedTxtPath,
        `${extraction.reservedIdentifiers.join("\n")}\n`,
        "utf8"
      );
      const languageServerGenerated =
        await writeGeneratedLanguageServerReservedIdentifiers({
          repoRoot,
          reservedIdentifiers: extraction.reservedIdentifiers,
          suite: opts.suite,
          runDir
        });
      summary.languageServerGeneratedPath = languageServerGenerated.outputPath;

      summary.totals = {
        ...(summary.totals ?? {}),
        rowsTotal: extraction.rowsTotal,
        rowsWithCompileSuccess: extraction.rowsWithCompileSuccess,
        rowsWithExcerpt: extraction.rowsWithExcerpt,
        harnessErrorBatches: extraction.rowsWithHarnessErrors,
        compileErrorBatches: extraction.rowsWithCompileErrors,
        reservedMentions: extraction.findings.length,
        reservedUnique: extraction.reservedIdentifiers.length
      };

      if (opts.includeSeedKeywords && extraction.reservedIdentifiers.length === 0) {
        throw new Error(
          "No reserved identifiers detected while seed keywords were enabled."
        );
      }

      console.log(
        `[reserved-scan] Reserved identifiers found: ${String(extraction.reservedIdentifiers.length)}`
      );
      console.log(`[reserved-scan] Reserved list: ${reservedTxtPath}`);
      console.log(`[reserved-scan] Detailed findings: ${detailsJsonlPath}`);
      console.log(
        `[reserved-scan] LS generated source: ${languageServerGenerated.outputPath} (merged ${languageServerGenerated.extractedCount} extracted with ${languageServerGenerated.existingCount} existing -> ${languageServerGenerated.mergedCount})`
      );

      summary.status = "completed";
    }
  } catch (error) {
    summary.error = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
  } finally {
    summary.finishedAt = nowIso();
    const summaryPath = path.join(reportDir, "summary.json");
    await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(`[reserved-scan] Summary: ${summaryPath}`);
    if (summary.status === "completed" || summary.status === "dry_run") {
      console.log("[reserved-scan] PASS");
    } else {
      console.error(`[reserved-scan] FAILED: ${summary.error ?? "Unknown error"}`);
    }
  }
}

void main();
