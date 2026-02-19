import fs from "fs";
import path from "path";

const workspaceRoot = process.cwd();
const packageJsonPath = path.join(workspaceRoot, "package.json");
const changelogPath = path.join(workspaceRoot, "CHANGELOG.md");

if (!fs.existsSync(packageJsonPath)) {
  throw new Error(`Missing package.json at ${packageJsonPath}`);
}
if (!fs.existsSync(changelogPath)) {
  throw new Error("Missing CHANGELOG.md. Add release notes before publishing.");
}

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const version = String(pkg.version ?? "").trim();
if (!version) {
  throw new Error("package.json version is empty.");
}

const changelog = fs.readFileSync(changelogPath, "utf8");
const versionHeadingPattern = new RegExp(
  `^##\\s*\\[?v?${escapeRegExp(version)}\\]?\\s*$`,
  "m"
);
if (!versionHeadingPattern.test(changelog)) {
  throw new Error(
    `CHANGELOG.md must include a heading for version ${version} (for example: "## [${version}]").`
  );
}

console.log(`Changelog check passed for version ${version}.`);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
