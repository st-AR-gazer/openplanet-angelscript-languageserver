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

function parseBoolOrDefault(raw, fallback) {
  if (raw === undefined || raw === null) {
    return fallback;
  }
  const normalized = String(raw).trim().toLowerCase();
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
    ...defaults,
    entryPatterns: [],
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--matrix":
        i += 1;
        opts.matrixPath = path.resolve(requireArgValue(argv, i, "--matrix"));
        break;
      case "--entry":
      case "--target":
      case "--version":
        i += 1;
        opts.entryPatterns.push(requireArgValue(argv, i, arg));
        break;
      case "--report-root":
        i += 1;
        opts.reportRoot = path.resolve(requireArgValue(argv, i, "--report-root"));
        break;
      case "--strict":
        opts.strict = true;
        break;
      case "--no-strict":
        opts.strict = false;
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

  return opts;
}

function printHelpAndExit(defaults) {
  const lines = [
    "Usage: npm run test:oracle-parity:matrix -- [options]",
    "",
    "Runs runOracleParity.mjs for each entry in a matrix config.",
    "Each entry should represent one Openplanet target/version and gets its own snapshot key.",
    "",
    "Options:",
    "  --matrix <path>        Matrix JSON file (default from env or .github/oracle-parity-matrix.json).",
    "  --entry <glob>         Select subset of entries by id/snapshot key (repeatable).",
    "  --report-root <path>   Aggregate matrix report output root.",
    "  --strict               Exit non-zero when any entry fails.",
    "  --no-strict            Always exit zero (summary still records failures).",
    "  --dry-run              Resolve matrix and print commands without running.",
    "  -h, --help             Show help.",
    "",
    "Defaults:",
    `  matrix: ${defaults.matrixPath}`,
    `  strict: ${String(defaults.strict)}`,
    `  report root: ${defaults.reportRoot}`,
    "",
    "Environment overrides:",
    "  OPAS_PARITY_MATRIX",
    "  OPAS_PARITY_MATRIX_STRICT",
    "  OPAS_PARITY_MATRIX_REPORT_ROOT"
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

function normalizeSnapshotKey(raw) {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) {
    return "";
  }
  return trimmed.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeString(raw) {
  if (typeof raw !== "string") {
    return "";
  }
  return raw.trim();
}

function normalizeStringArray(raw) {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (typeof raw === "string") {
    const value = raw.trim();
    return value ? [value] : [];
  }
  if (!Array.isArray(raw)) {
    throw new Error("Expected string[] or string.");
  }
  return raw
    .filter((entry) => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function normalizeEnvMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!key || typeof key !== "string") {
      continue;
    }
    if (value === undefined || value === null) {
      continue;
    }
    out[key] = String(value);
  }
  return out;
}

function globMatch(value, pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(value);
}

function sanitizeForPath(value) {
  const raw = normalizeString(value);
  if (!raw) {
    return "entry";
  }
  return raw.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "entry";
}

function quoteForDisplay(arg) {
  if (/^[A-Za-z0-9_./:\\-]+$/.test(arg)) {
    return arg;
  }
  return `"${arg.replace(/"/g, '\\"')}"`;
}

async function runCommand({ label, command, args, cwd, env, shell = false }) {
  const startedAt = Date.now();
  const startedIso = nowIso();
  const cmdLine = [command, ...args].map(quoteForDisplay).join(" ");
  console.log(`[oracle-parity-matrix] ${label}: ${cmdLine}`);
  if (cwd) {
    console.log(`[oracle-parity-matrix] ${label}: cwd=${cwd}`);
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

async function writeCommandLog(reportDir, label, result) {
  const logPath = path.join(reportDir, `${label}.log`);
  const text = [
    `label: ${result.label}`,
    `startedAt: ${result.startedAt}`,
    `finishedAt: ${result.finishedAt}`,
    `durationMs: ${result.durationMs}`,
    `exitCode: ${result.exitCode}`,
    `cwd: ${result.cwd}`,
    `command: ${result.command}`,
    `args: ${JSON.stringify(result.args)}`,
    "",
    "--- stdout ---",
    result.stdout,
    "",
    "--- stderr ---",
    result.stderr
  ].join("\n");
  await fs.writeFile(logPath, text, "utf8");
  return logPath;
}

function parseSummaryPath(stdoutText) {
  const match = stdoutText.match(/^\[oracle-parity\]\s+Summary:\s*(.+)$/m);
  if (!match) {
    return null;
  }
  const raw = match[1].trim();
  return raw ? path.resolve(raw) : null;
}

function parseLsReportPath(stdoutText) {
  const match = stdoutText.match(/^\[oracle-parity\]\s+LS report:\s*(.+)$/m);
  if (!match) {
    return null;
  }
  const raw = match[1].trim();
  return raw ? path.resolve(raw) : null;
}

function parseOracleRunPath(stdoutText) {
  const match = stdoutText.match(/^\[oracle-parity\]\s+Oracle run:\s*(.+)$/m);
  if (!match) {
    return null;
  }
  const raw = match[1].trim();
  return raw ? path.resolve(raw) : null;
}

async function readMatrixConfig(matrixPath) {
  let raw = "";
  try {
    raw = await fs.readFile(matrixPath, "utf8");
  } catch (error) {
    throw new Error(`Could not read matrix file "${matrixPath}": ${String(error)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in matrix file "${matrixPath}": ${String(error)}`);
  }

  if (Array.isArray(parsed)) {
    return {
      defaults: {},
      entries: parsed
    };
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Matrix file "${matrixPath}" must be an array or object.`);
  }
  const defaults = parsed.defaults && typeof parsed.defaults === "object" ? parsed.defaults : {};
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  if (entries.length === 0) {
    throw new Error(`Matrix file "${matrixPath}" does not contain any entries.`);
  }
  return {
    defaults,
    entries
  };
}

function normalizeEntry(rawEntry, index, matrixDefaults) {
  if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
    throw new Error(`Matrix entry #${index + 1} must be an object.`);
  }

  const fromDefaults = (key) =>
    Object.prototype.hasOwnProperty.call(rawEntry, key) ? rawEntry[key] : matrixDefaults[key];
  const id = normalizeString(fromDefaults("id") || fromDefaults("name")) || `entry-${index + 1}`;
  const snapshotKey = normalizeSnapshotKey(fromDefaults("snapshotKey")) || normalizeSnapshotKey(id);
  const suite = normalizeString(fromDefaults("suite")) || "ExampleSuite";
  const fixturesPathRaw = normalizeString(fromDefaults("fixtures") || fromDefaults("fixturesPath"));
  const reportRootRaw = normalizeString(fromDefaults("reportRoot"));

  return {
    id,
    snapshotKey,
    suite,
    fixturesPath: fixturesPathRaw ? path.resolve(fixturesPathRaw) : null,
    transport: normalizeString(fromDefaults("transport")),
    timeoutSec: toIntOrDefault(fromDefaults("timeoutSec"), 0),
    waitFrames: toIntOrDefault(fromDefaults("waitFrames"), 0),
    companionHost: normalizeString(fromDefaults("companionHost")),
    companionPort: toIntOrDefault(fromDefaults("companionPort"), 0),
    strictDiagnosticText: parseBoolOrDefault(fromDefaults("strictDiagnosticText"), true),
    casePatterns: normalizeStringArray(fromDefaults("casePatterns") || fromDefaults("cases")),
    extraArgs: normalizeStringArray(fromDefaults("args") || fromDefaults("extraArgs")),
    env: normalizeEnvMap(fromDefaults("env")),
    reportRoot: reportRootRaw ? path.resolve(reportRootRaw) : null
  };
}

function selectEntries(entries, patterns) {
  if (patterns.length === 0) {
    return entries;
  }
  return entries.filter((entry) =>
    patterns.some(
      (pattern) =>
        globMatch(entry.id, pattern) || globMatch(entry.snapshotKey, pattern)
    )
  );
}

function buildParityArgs(entry, globalReportRoot, parityScriptPath) {
  const args = [parityScriptPath, "--suite", entry.suite, "--snapshot-key", entry.snapshotKey];

  if (entry.fixturesPath) {
    args.push("--fixtures", entry.fixturesPath);
  }
  if (entry.transport) {
    args.push("--transport", entry.transport);
  }
  if (entry.timeoutSec > 0) {
    args.push("--timeout-sec", String(entry.timeoutSec));
  }
  if (entry.waitFrames > 0) {
    args.push("--wait-frames", String(entry.waitFrames));
  }
  if (entry.companionHost) {
    args.push("--companion-host", entry.companionHost);
  }
  if (entry.companionPort > 0) {
    args.push("--companion-port", String(entry.companionPort));
  }
  const resolvedReportRoot = entry.reportRoot || globalReportRoot;
  if (resolvedReportRoot) {
    args.push("--report-root", resolvedReportRoot);
  }

  if (entry.strictDiagnosticText) {
    args.push("--strict-diagnostic-text");
  } else {
    args.push("--no-strict-diagnostic-text");
  }

  for (const pattern of entry.casePatterns) {
    args.push("--case", pattern);
  }
  if (entry.extraArgs.length > 0) {
    args.push(...entry.extraArgs);
  }

  return args;
}

async function main() {
  const thisFilePath = fileURLToPath(import.meta.url);
  const scriptsDir = path.dirname(thisFilePath);
  const repoRoot = path.resolve(scriptsDir, "..", "..");
  const defaults = {
    matrixPath: path.resolve(
      process.env.OPAS_PARITY_MATRIX || path.join(repoRoot, ".github", "oracle-parity-matrix.json")
    ),
    strict: parseBoolOrDefault(process.env.OPAS_PARITY_MATRIX_STRICT, true),
    reportRoot: path.resolve(
      process.env.OPAS_PARITY_MATRIX_REPORT_ROOT ||
      path.join(repoRoot, "out", "test", "oracle-parity-matrix")
    )
  };
  const opts = parseArgs(process.argv.slice(2), defaults);
  const matrix = await readMatrixConfig(opts.matrixPath);
  const normalizedEntries = matrix.entries.map((entry, index) =>
    normalizeEntry(entry, index, matrix.defaults)
  );
  const selectedEntries = selectEntries(normalizedEntries, opts.entryPatterns);
  if (selectedEntries.length === 0) {
    throw new Error("No matrix entries selected.");
  }

  const runId = `${timestampForPath()}-matrix`;
  const reportDir = path.join(opts.reportRoot, runId);
  await fs.mkdir(reportDir, { recursive: true });
  const parityScriptPath = path.join(scriptsDir, "runOracleParity.mjs");

  const summary = {
    startedAt: nowIso(),
    finishedAt: null,
    status: "failed",
    strict: opts.strict,
    dryRun: opts.dryRun,
    matrixPath: opts.matrixPath,
    reportDir,
    selectedEntries: selectedEntries.map((entry) => ({
      id: entry.id,
      snapshotKey: entry.snapshotKey,
      suite: entry.suite
    })),
    results: [],
    failedEntries: 0
  };

  try {
    for (const [index, entry] of selectedEntries.entries()) {
      const labelPrefix = `${String(index + 1).padStart(2, "0")}-${sanitizeForPath(entry.id)}`;
      const args = buildParityArgs(entry, null, parityScriptPath);
      const cmdLine = [process.execPath, ...args].map(quoteForDisplay).join(" ");
      if (opts.dryRun) {
        console.log(`[oracle-parity-matrix] DRY-RUN ${entry.id}: ${cmdLine}`);
        summary.results.push({
          id: entry.id,
          snapshotKey: entry.snapshotKey,
          suite: entry.suite,
          command: process.execPath,
          args,
          skipped: true
        });
        continue;
      }

      const env = {
        ...process.env,
        ...entry.env
      };
      const commandResult = await runCommand({
        label: `${labelPrefix}-oracle-parity`,
        command: process.execPath,
        args,
        cwd: repoRoot,
        env
      });
      const logPath = await writeCommandLog(reportDir, `${labelPrefix}-oracle-parity`, commandResult);
      const summaryPath = parseSummaryPath(commandResult.stdout);
      const lsReportPath = parseLsReportPath(commandResult.stdout);
      const oracleRunPath = parseOracleRunPath(commandResult.stdout);
      const passed = commandResult.exitCode === 0;
      if (!passed) {
        summary.failedEntries += 1;
      }

      summary.results.push({
        id: entry.id,
        snapshotKey: entry.snapshotKey,
        suite: entry.suite,
        command: commandResult.command,
        args: commandResult.args,
        exitCode: commandResult.exitCode,
        durationMs: commandResult.durationMs,
        startedAt: commandResult.startedAt,
        finishedAt: commandResult.finishedAt,
        passed,
        summaryPath,
        lsReportPath,
        oracleRunPath,
        logPath
      });
    }

    if (opts.dryRun) {
      summary.status = "dry_run";
    } else if (summary.failedEntries > 0) {
      summary.status = "failed_entries";
      if (opts.strict) {
        process.exitCode = 1;
      }
    } else {
      summary.status = "passed";
    }
  } finally {
    summary.finishedAt = nowIso();
    const summaryPath = path.join(reportDir, "summary.json");
    await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(`[oracle-parity-matrix] Summary: ${summaryPath}`);
    if (summary.status === "passed") {
      console.log("[oracle-parity-matrix] PASS");
    } else if (summary.status === "dry_run") {
      console.log("[oracle-parity-matrix] DRY RUN COMPLETE");
    } else if (summary.status === "failed_entries") {
      if (opts.strict) {
        console.error(
          `[oracle-parity-matrix] FAILED: ${summary.failedEntries} entr${summary.failedEntries === 1 ? "y" : "ies"} failed.`
        );
      } else {
        console.log(
          `[oracle-parity-matrix] COMPLETED_WITH_FAILURES: ${summary.failedEntries} entr${summary.failedEntries === 1 ? "y" : "ies"} failed.`
        );
      }
    }
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[oracle-parity-matrix] FAILED: ${message}`);
  process.exitCode = 1;
});
