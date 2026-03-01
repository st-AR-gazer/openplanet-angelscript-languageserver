import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const passThroughArgs = process.argv.slice(2);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

if (passThroughArgs.includes("--help") || passThroughArgs.includes("-h")) {
  const lines = [
    "Usage:",
    "  npm run release:verify:strict -- --suite <name> [suite-diff options]",
    "",
    "Runs:",
    "  1) npm run release:verify",
    "  2) npm run release:verify:false-positives -- <args>"
  ];
  console.error(lines.join("\n"));
  process.exit(0);
}

runStep(["run", "release:verify"]);
runStep(["run", "release:verify:false-positives", "--", ...passThroughArgs]);

function runStep(args) {
  const result = spawnSync(npmCommand, args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: process.env
  });
  if (result.error) {
    console.error(`[release-gate] Failed to run ${args.join(" ")}: ${String(result.error)}`);
    process.exit(1);
  }
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}
