import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const rawArgs = process.argv.slice(2);

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  printHelp();
  process.exit(0);
}

const suiteFromArgs = getFlagValue(rawArgs, "--suite");
const suiteFromEnv = (process.env.OPAS_PARITY_SUITE ?? "").trim();
if (!suiteFromArgs && !suiteFromEnv) {
  console.error(
    "[release-gate] Missing suite name. Pass --suite <name> or set OPAS_PARITY_SUITE."
  );
  console.error("");
  printHelp();
  process.exit(1);
}

const passThroughArgs = [...rawArgs];
ensureFlag(passThroughArgs, "--fail-on-false-positives");

const hasPluginFlags = passThroughArgs.includes("--plugin");
if (!hasPluginFlags) {
  const pluginList = parseCsv(process.env.OPAS_PARITY_PLUGINS);
  for (const pluginName of pluginList) {
    passThroughArgs.push("--plugin", pluginName);
  }
}

if (!passThroughArgs.includes("--include-warnings")) {
  const includeWarningsRaw = (process.env.OPAS_PARITY_INCLUDE_WARNINGS ?? "").trim().toLowerCase();
  if (includeWarningsRaw === "1" || includeWarningsRaw === "true" || includeWarningsRaw === "yes") {
    passThroughArgs.push("--include-warnings");
  }
}

if (!passThroughArgs.includes("--skip-compile")) {
  const skipCompileRaw = (process.env.OPAS_PARITY_SKIP_COMPILE ?? "").trim().toLowerCase();
  if (skipCompileRaw === "1" || skipCompileRaw === "true" || skipCompileRaw === "yes") {
    passThroughArgs.push("--skip-compile");
  }
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const runResult = spawnSync(
  npmCommand,
  ["run", "test:suite-compiler-diff", "--", ...passThroughArgs],
  {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env
  }
);

if (runResult.error) {
  console.error(`[release-gate] Failed to invoke suite compiler diff: ${String(runResult.error)}`);
  process.exit(1);
}

process.exit(runResult.status ?? 1);

function ensureFlag(args, flag) {
  if (!args.includes(flag)) {
    args.push(flag);
  }
}

function getFlagValue(args, flag) {
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] !== flag) {
      continue;
    }
    if (i + 1 < args.length) {
      return args[i + 1];
    }
    return "";
  }
  return "";
}

function parseCsv(raw) {
  return String(raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function printHelp() {
  const lines = [
    "Usage:",
    "  npm run release:verify:false-positives -- --suite <name> [suite-diff options]",
    "",
    "Behavior:",
    "  - always enables --fail-on-false-positives",
    "  - forwards all args to test:suite-compiler-diff",
    "  - can inject --plugin from OPAS_PARITY_PLUGINS when no --plugin flags are provided",
    "",
    "Supported env helpers:",
    "  OPAS_PARITY_SUITE=<suite-name>",
    "  OPAS_PARITY_PLUGINS=PluginA,PluginB",
    "  OPAS_PARITY_INCLUDE_WARNINGS=true|false",
    "  OPAS_PARITY_SKIP_COMPILE=true|false"
  ];
  console.error(lines.join("\n"));
}
