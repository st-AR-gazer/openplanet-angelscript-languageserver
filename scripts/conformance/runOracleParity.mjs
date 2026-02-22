#!/usr/bin/env node

import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

function toIntOrDefault(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

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

function parseArgs(argv, defaults) {
  const opts = {
    ...defaults,
    casePatterns: [],
    keepGenerated: false,
    stopOnFail: false,
    lsVerbose: true,
    strictDiagnosticText: defaults.strictDiagnosticText === true,
    snapshotKey: defaults.snapshotKey ?? ""
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--suite":
        i += 1;
        opts.suite = requireArgValue(argv, i, "--suite");
        break;
      case "--fixtures":
        i += 1;
        opts.fixturesPath = path.resolve(requireArgValue(argv, i, "--fixtures"));
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
        opts.timeoutSec = toIntOrDefault(requireArgValue(argv, i, "--timeout-sec"), opts.timeoutSec);
        break;
      case "--wait-frames":
        i += 1;
        opts.waitFrames = toIntOrDefault(requireArgValue(argv, i, "--wait-frames"), opts.waitFrames);
        break;
      case "--companion-host":
        i += 1;
        opts.companionHost = requireArgValue(argv, i, "--companion-host");
        break;
      case "--companion-port":
        i += 1;
        opts.companionPort = toIntOrDefault(requireArgValue(argv, i, "--companion-port"), opts.companionPort);
        break;
      case "--report-root":
        i += 1;
        opts.reportRoot = path.resolve(requireArgValue(argv, i, "--report-root"));
        break;
      case "--snapshot-key":
        i += 1;
        opts.snapshotKey = requireArgValue(argv, i, "--snapshot-key");
        break;
      case "--case":
        i += 1;
        opts.casePatterns.push(requireArgValue(argv, i, "--case"));
        break;
      case "--keep-generated":
        opts.keepGenerated = true;
        break;
      case "--stop-on-fail":
        opts.stopOnFail = true;
        break;
      case "--no-ls-verbose":
        opts.lsVerbose = false;
        break;
      case "--strict-diagnostic-text":
        opts.strictDiagnosticText = true;
        break;
      case "--no-strict-diagnostic-text":
        opts.strictDiagnosticText = false;
        break;
      case "--help":
      case "-h":
        printHelpAndExit(defaults);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}. Use --help for usage.`);
    }
  }

  if (!opts.fixturesPath) {
    opts.fixturesPath = path.resolve(
      opts.suitesRoot,
      opts.suite,
      "conformance",
      "cases.jsonl"
    );
  }

  return opts;
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

function printHelpAndExit(defaults) {
  const lines = [
    "Usage: npm run test:oracle-parity -- [options]",
    "",
    "Pipeline:",
    "  1) opdev suite companion-status",
    "  2) opdev suite conformance",
    "  3) npm run compile",
    "  4) node out/test/runConformanceTests.js --oracle-run ...",
    "",
    "Options:",
    "  --suite <name>          Suite name (default from env or ExampleSuite).",
    "  --fixtures <path>       Fixture file path (.jsonl/.json).",
    "  --suites-root <path>    Root suites dir (default: D:\\OpenplanetDev\\suites).",
    "  --opdev-py <path>       Path to opdev.py.",
    "  --python <exe>          Python executable (default: python).",
    "  --transport <mode>      Companion transport (auto|socket|file).",
    "  --timeout-sec <n>       Per-case timeout for opdev conformance.",
    "  --wait-frames <n>       Frames for companion wait after load.",
    "  --companion-host <host> Companion host.",
    "  --companion-port <n>    Companion port.",
    "  --report-root <path>    Timestamped output root.",
    "  --snapshot-key <name>   Snapshot grouping key (e.g. op-next-v1.2.3).",
    "  --case <glob>           Case filter (repeatable).",
    "  --keep-generated        Keep generated oracle plugins.",
    "  --stop-on-fail          Stop oracle run on first failure.",
    "  --no-ls-verbose         Do not pass --verbose to LS conformance runner.",
    "  --strict-diagnostic-text  Enforce strict ERR/WARN/INFO text parity when fixture provides expect_diagnostic_text.",
    "  -h, --help              Show this help.",
    "",
    "Default paths:",
    `  opdev.py: ${defaults.opdevPyPath}`,
    `  fixtures: ${defaults.fixturesPath}`,
    `  report root: ${defaults.reportRoot}`,
    "",
    "Environment overrides:",
    "  OPAS_PARITY_SUITE",
    "  OPAS_PARITY_FIXTURES",
    "  OPAS_SUITES_ROOT",
    "  OPAS_OPDEV_PY",
    "  OPAS_PYTHON",
    "  OPAS_PARITY_TRANSPORT",
    "  OPAS_PARITY_TIMEOUT_SEC",
    "  OPAS_PARITY_WAIT_FRAMES",
    "  OPAS_PARITY_COMPANION_HOST",
    "  OPAS_PARITY_COMPANION_PORT",
    "  OPAS_PARITY_REPORT_ROOT",
    "  OPAS_PARITY_STRICT_DIAGNOSTIC_TEXT",
    "  OPAS_PARITY_SNAPSHOT_KEY"
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

async function runCommand({
  label,
  command,
  args,
  cwd,
  env,
  shell = false
}) {
  const startedAt = Date.now();
  const startedIso = nowIso();
  const cmdLine = [command, ...args].map(quoteForDisplay).join(" ");
  console.log(`[oracle-parity] ${label}: ${cmdLine}`);
  if (cwd) {
    console.log(`[oracle-parity] ${label}: cwd=${cwd}`);
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

  const durationMs = Date.now() - startedAt;
  const finishedIso = nowIso();
  return {
    label,
    command,
    args,
    cwd: cwd ?? process.cwd(),
    startedAt: startedIso,
    finishedAt: finishedIso,
    durationMs,
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

function parseOracleRunDir(stdoutText) {
  const match = stdoutText.match(/^\[suite conformance\]\s+Run dir:\s*(.+)$/m);
  if (!match) {
    return null;
  }
  const raw = match[1].trim();
  if (!raw) {
    return null;
  }
  return path.resolve(raw);
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
    if (!entry.isDirectory()) {
      continue;
    }
    if (!entry.name.startsWith("run-")) {
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

async function readOracleConformanceSummary(runDir) {
  if (!runDir) {
    return null;
  }
  const summaryPath = path.join(runDir, "summary.json");
  try {
    const raw = await fs.readFile(summaryPath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function main() {
  const thisFilePath = fileURLToPath(import.meta.url);
  const scriptsDir = path.dirname(thisFilePath);
  const repoRoot = path.resolve(scriptsDir, "..", "..");

  const defaults = {
    suite: process.env.OPAS_PARITY_SUITE || "ExampleSuite",
    suitesRoot: path.resolve(process.env.OPAS_SUITES_ROOT || "D:\\OpenplanetDev\\suites"),
    opdevPyPath: path.resolve(process.env.OPAS_OPDEV_PY || "D:\\OpenplanetDev\\tools\\opdev\\opdev.py"),
    pythonExe: process.env.OPAS_PYTHON || "python",
    fixturesPath: process.env.OPAS_PARITY_FIXTURES
      ? path.resolve(process.env.OPAS_PARITY_FIXTURES)
      : path.resolve(
        process.env.OPAS_SUITES_ROOT || "D:\\OpenplanetDev\\suites",
        process.env.OPAS_PARITY_SUITE || "ExampleSuite",
        "conformance",
        "cases.jsonl"
      ),
    transport: process.env.OPAS_PARITY_TRANSPORT || "auto",
    timeoutSec: toIntOrDefault(process.env.OPAS_PARITY_TIMEOUT_SEC, 20),
    waitFrames: toIntOrDefault(process.env.OPAS_PARITY_WAIT_FRAMES, 20),
    companionHost: process.env.OPAS_PARITY_COMPANION_HOST || "127.0.0.1",
    companionPort: toIntOrDefault(process.env.OPAS_PARITY_COMPANION_PORT, 32000),
    strictDiagnosticText:
      String(process.env.OPAS_PARITY_STRICT_DIAGNOSTIC_TEXT ?? "")
        .trim()
        .toLowerCase() === "true",
    snapshotKey: process.env.OPAS_PARITY_SNAPSHOT_KEY || "",
    reportRoot: path.resolve(
      process.env.OPAS_PARITY_REPORT_ROOT ||
      path.join(repoRoot, "out", "test", "oracle-parity")
    )
  };

  const opts = parseArgs(process.argv.slice(2), defaults);
  const snapshotKey = sanitizeSnapshotKey(opts.snapshotKey);
  const reportRoot = snapshotKey
    ? path.join(opts.reportRoot, snapshotKey)
    : opts.reportRoot;
  const runId = `${timestampForPath()}-${opts.suite}`;
  const reportDir = path.join(reportRoot, runId);
  await fs.mkdir(reportDir, { recursive: true });

  const summary = {
    startedAt: nowIso(),
    finishedAt: null,
    status: "failed",
    suite: opts.suite,
    config: {
      suite: opts.suite,
      fixturesPath: opts.fixturesPath,
      suitesRoot: opts.suitesRoot,
      opdevPyPath: opts.opdevPyPath,
      pythonExe: opts.pythonExe,
      transport: opts.transport,
      timeoutSec: opts.timeoutSec,
      waitFrames: opts.waitFrames,
      companionHost: opts.companionHost,
      companionPort: opts.companionPort,
      casePatterns: opts.casePatterns,
      keepGenerated: opts.keepGenerated,
      stopOnFail: opts.stopOnFail,
      lsVerbose: opts.lsVerbose,
      strictDiagnosticText: opts.strictDiagnosticText,
      snapshotKey
    },
    reportDir,
    oracleRunDir: null,
    oracleConformanceSummary: null,
    oracleConformanceHarnessOnlyFailure: false,
    lsReportPath: path.join(reportDir, "ls-conformance-report.json"),
    commands: [],
    error: null
  };

  try {
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
      throw new Error("Companion status check failed. Ensure Trackmania/Openplanet + OpDevCompanion are running.");
    }

    const conformanceArgs = [
      opts.opdevPyPath,
      "suite",
      "conformance",
      opts.suite,
      "--fixtures",
      opts.fixturesPath,
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
    for (const pattern of opts.casePatterns) {
      conformanceArgs.push("--case", pattern);
    }
    if (opts.keepGenerated) {
      conformanceArgs.push("--keep-generated");
    }
    if (opts.stopOnFail) {
      conformanceArgs.push("--stop-on-fail");
    }

    const oracleConformance = await runCommand({
      label: "02-opdev-conformance",
      command: opts.pythonExe,
      args: conformanceArgs,
      cwd: repoRoot,
      env: process.env
    });
    oracleConformance.logPath = await writeCommandLog(reportDir, oracleConformance);
    summary.commands.push(sanitizeCommandResult(oracleConformance));

    let oracleRunDir = parseOracleRunDir(oracleConformance.stdout);
    if (!oracleRunDir) {
      oracleRunDir = await findLatestOracleRunDir(opts.suitesRoot, opts.suite);
    }
    if (!oracleRunDir) {
      throw new Error("Could not determine oracle conformance run directory.");
    }
    summary.oracleRunDir = oracleRunDir;

    const oracleConformanceSummary = await readOracleConformanceSummary(oracleRunDir);
    summary.oracleConformanceSummary = oracleConformanceSummary;

    if (oracleConformance.exitCode !== 0) {
      const failedCount = Number(oracleConformanceSummary?.failed ?? 0);
      const harnessErrorCount = Number(oracleConformanceSummary?.harness_errors ?? 0);
      const harnessOnlyFailure =
        failedCount > 0 &&
        harnessErrorCount > 0 &&
        failedCount === harnessErrorCount;

      if (!harnessOnlyFailure) {
        throw new Error("Openplanet oracle conformance failed.");
      }

      summary.oracleConformanceHarnessOnlyFailure = true;
      console.warn(
        `[oracle-parity] WARNING: oracle conformance had ${harnessErrorCount} harness error(s); continuing LS parity against fixture expectations.`
      );
    }

    const compileCommand = buildNpmRunCommand("compile");
    const compileLs = await runCommand({
      label: "03-ls-compile",
      command: compileCommand.command,
      args: compileCommand.args,
      cwd: repoRoot,
      env: process.env,
      shell: compileCommand.shell
    });
    compileLs.logPath = await writeCommandLog(reportDir, compileLs);
    summary.commands.push(sanitizeCommandResult(compileLs));
    if (compileLs.exitCode !== 0) {
      throw new Error("Language-server compile failed.");
    }

    const lsArgs = [
      path.join("out", "test", "runConformanceTests.js"),
      "--fixtures",
      opts.fixturesPath
    ];
    if (!summary.oracleConformanceHarnessOnlyFailure) {
      lsArgs.push("--oracle-run", oracleRunDir);
    }
    lsArgs.push("--report", summary.lsReportPath);
    for (const pattern of opts.casePatterns) {
      lsArgs.push("--case", pattern);
    }
    if (opts.lsVerbose) {
      lsArgs.push("--verbose");
    }
    if (opts.strictDiagnosticText) {
      lsArgs.push("--strict-diagnostic-text");
    }

    const lsConformance = await runCommand({
      label: "04-ls-conformance",
      command: process.execPath,
      args: lsArgs,
      cwd: repoRoot,
      env: process.env
    });
    lsConformance.logPath = await writeCommandLog(reportDir, lsConformance);
    summary.commands.push(sanitizeCommandResult(lsConformance));
    if (lsConformance.exitCode !== 0) {
      throw new Error("Language-server conformance against oracle failed.");
    }

    summary.status = summary.oracleConformanceHarnessOnlyFailure
      ? "passed_with_oracle_harness_errors"
      : "passed";
  } catch (error) {
    summary.error = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
  } finally {
    summary.finishedAt = nowIso();
    const summaryPath = path.join(reportDir, "summary.json");
    await fs.writeFile(`${summaryPath}`, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(`[oracle-parity] Summary: ${summaryPath}`);
    if (summary.lsReportPath) {
      console.log(`[oracle-parity] LS report: ${summary.lsReportPath}`);
    }
    if (summary.oracleRunDir) {
      console.log(`[oracle-parity] Oracle run: ${summary.oracleRunDir}`);
    }
    if (
      summary.status !== "passed" &&
      summary.status !== "passed_with_oracle_harness_errors"
    ) {
      console.error(`[oracle-parity] FAILED: ${summary.error ?? "Unknown error"}`);
    } else {
      console.log("[oracle-parity] PASS");
    }
  }
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

void main();

function sanitizeSnapshotKey(value) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return "";
  }
  return raw.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildNpmRunCommand(scriptName) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath && npmExecPath.trim()) {
    return {
      command: process.execPath,
      args: [npmExecPath, "run", scriptName],
      shell: false
    };
  }

  return {
    command: "npm",
    args: ["run", scriptName],
    shell: process.platform === "win32"
  };
}
