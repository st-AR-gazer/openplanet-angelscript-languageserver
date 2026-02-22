#!/usr/bin/env node

import { spawn } from "child_process";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

function parseArgs(argv, defaults) {
  const opts = {
    ...defaults,
    skipReservedScan: false,
    skipBootstrap: false,
    skipMatrixParity: false,
    dryRun: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--suite":
        i += 1;
        opts.suite = requireArgValue(argv, i, "--suite");
        break;
      case "--max-cases":
        i += 1;
        opts.maxCases = toIntOrDefault(requireArgValue(argv, i, "--max-cases"), opts.maxCases);
        break;
      case "--snapshot-key":
        i += 1;
        opts.snapshotKey = requireArgValue(argv, i, "--snapshot-key");
        break;
      case "--skip-reserved-scan":
        opts.skipReservedScan = true;
        break;
      case "--skip-bootstrap":
        opts.skipBootstrap = true;
        break;
      case "--skip-matrix-parity":
        opts.skipMatrixParity = true;
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

function requireArgValue(argv, index, flagName) {
  if (index >= argv.length) {
    throw new Error(`${flagName} requires a value.`);
  }
  const value = argv[index];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flagName} requires a value.`);
  }
  return value;
}

function toIntOrDefault(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function printHelpAndExit(defaults) {
  const lines = [
    "Usage: npm run test:compiler-grade -- [options]",
    "",
    "Runs the full compiler-grade parity pipeline in one command:",
    "  1) sync AngelScript texts",
    "  2) sync AngelScript token defs + generate LS token tables",
    "  3) reserved identifier scan (updates generated reserved list)",
    "  4) oracle bootstrap corpus generation/materialization",
    "  5) oracle parity matrix strict gate",
    "",
    "Options:",
    "  --suite <name>            Suite name for oracle/bootstrap scans.",
    "  --max-cases <n>           Max cases for bootstrap corpus generation.",
    "  --snapshot-key <name>     Optional snapshot key for direct parity run context.",
    "  --skip-reserved-scan      Skip high-volume reserved identifier scan stage.",
    "  --skip-bootstrap          Skip oracle bootstrap stage.",
    "  --skip-matrix-parity      Skip strict oracle parity matrix stage.",
    "  --dry-run                 Print commands without executing.",
    "  -h, --help                Show help.",
    "",
    "Defaults:",
    `  suite: ${defaults.suite}`,
    `  max-cases: ${defaults.maxCases}`
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

async function runCommand(label, command, args, cwd, dryRun) {
  const display = [command, ...args].join(" ");
  console.log(`[compiler-grade] ${label}: ${display}`);
  if (dryRun) {
    return 0;
  }

  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(`[compiler-grade] ${label} failed with exit code ${exitCode}`);
  }
  return exitCode;
}

async function main() {
  const thisFilePath = fileURLToPath(import.meta.url);
  const scriptsDir = path.dirname(thisFilePath);
  const repoRoot = path.resolve(scriptsDir, "..", "..");

  const defaults = {
    suite: process.env.OPAS_PARITY_SUITE || "ExampleSuite",
    maxCases: toIntOrDefault(process.env.OPAS_ORACLE_BOOTSTRAP_MAX_CASES, 1200),
    snapshotKey: process.env.OPAS_PARITY_SNAPSHOT_KEY || ""
  };

  const opts = parseArgs(process.argv.slice(2), defaults);
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  await runCommand(
    "sync-texts",
    npmCmd,
    ["run", "test:conformance:sync-texts"],
    repoRoot,
    opts.dryRun
  );

  await runCommand(
    "sync-tokens",
    npmCmd,
    ["run", "test:conformance:sync-tokens"],
    repoRoot,
    opts.dryRun
  );

  if (!opts.skipReservedScan) {
    await runCommand(
      "reserved-scan",
      npmCmd,
      [
        "run",
        "test:reserved-identifiers",
        "--",
        "--suite",
        opts.suite
      ],
      repoRoot,
      opts.dryRun
    );
  }

  if (!opts.skipBootstrap) {
    await runCommand(
      "oracle-bootstrap",
      npmCmd,
      [
        "run",
        "test:oracle-bootstrap",
        "--",
        "--suite",
        opts.suite,
        "--max-cases",
        String(opts.maxCases),
        "--strict-diagnostic-text"
      ],
      repoRoot,
      opts.dryRun
    );
  }

  if (!opts.skipMatrixParity) {
    const parityArgs = [
      "run",
      "test:oracle-parity:matrix",
      "--",
      "--strict"
    ];
    await runCommand(
      "oracle-parity-matrix",
      npmCmd,
      parityArgs,
      repoRoot,
      opts.dryRun
    );
  } else if (opts.snapshotKey) {
    await runCommand(
      "oracle-parity-direct",
      npmCmd,
      [
        "run",
        "test:oracle-parity",
        "--",
        "--suite",
        opts.suite,
        "--snapshot-key",
        opts.snapshotKey,
        "--strict-diagnostic-text"
      ],
      repoRoot,
      opts.dryRun
    );
  }

  console.log("[compiler-grade] Pipeline completed.");
}

void main().catch((error) => {
  console.error(`[compiler-grade] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
