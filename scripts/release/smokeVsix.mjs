import fs from "fs";
import path from "path";

const workspaceRoot = process.cwd();
const packageJsonPath = path.join(workspaceRoot, "package.json");
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const version = String(pkg.version ?? "").trim();
const name = String(pkg.name ?? "").trim();

if (!name || !version) {
  throw new Error("package.json must have name and version for VSIX smoke test.");
}

const vsixFileName = `${name}-${version}.vsix`;
const vsixPath = path.join(workspaceRoot, vsixFileName);
if (!fs.existsSync(vsixPath)) {
  throw new Error(`VSIX file not found: ${vsixPath}`);
}

const buffer = fs.readFileSync(vsixPath);
if (buffer.length === 0) {
  throw new Error(`VSIX is empty: ${vsixPath}`);
}

const entries = listZipEntries(buffer);
const normalizedEntries = new Set([...entries].map((entry) => entry.toLowerCase()));
const requiredEntries = [
  "extension/package.json",
  "extension/readme.md",
  "extension/out/extension.js",
  "extension/out/server.js"
];

for (const entry of requiredEntries) {
  if (!normalizedEntries.has(entry)) {
    throw new Error(`VSIX missing required entry: ${entry}`);
  }
}

console.log(`VSIX smoke check passed: ${vsixFileName}`);

function listZipEntries(buffer) {
  const entries = new Set();
  const eocdSignature = 0x06054b50;
  const centralHeaderSignature = 0x02014b50;

  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= 0; i -= 1) {
    if (buffer.readUInt32LE(i) === eocdSignature) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    throw new Error("VSIX zip EOCD record not found.");
  }

  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

  let offset = centralDirectoryOffset;
  while (offset + 46 <= centralDirectoryEnd && offset + 46 <= buffer.length) {
    if (buffer.readUInt32LE(offset) !== centralHeaderSignature) {
      break;
    }

    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const fileNameStart = offset + 46;
    const fileNameEnd = fileNameStart + fileNameLength;
    const fileName = buffer.slice(fileNameStart, fileNameEnd).toString("utf8");
    entries.add(fileName);

    offset = fileNameEnd + extraLength + commentLength;
  }

  return entries;
}
