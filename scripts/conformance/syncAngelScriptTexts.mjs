#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const defaultSource =
  "https://raw.githubusercontent.com/anjo76/angelscript/master/sdk/angelscript/source/as_texts.h";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const text = await downloadText(options.source);
  const entries = parseTextsHeader(text);
  const grouped = groupByPrefix(entries);

  const output = {
    ts_utc: new Date().toISOString(),
    source: options.source,
    total_entries: entries.length,
    groups: grouped,
    entries
  };

  await fs.mkdir(path.dirname(options.output), { recursive: true });
  await fs.writeFile(options.output, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`[sync-as-texts] Source: ${options.source}`);
  console.log(`[sync-as-texts] Entries: ${entries.length}`);
  console.log(`[sync-as-texts] Output: ${options.output}`);
}

function parseArgs(argv) {
  const thisFilePath = fileURLToPath(import.meta.url);
  const scriptsDir = path.dirname(thisFilePath);
  const repoRoot = path.resolve(scriptsDir, "..", "..");
  const defaults = {
    source: process.env.OPAS_AS_TEXTS_SOURCE || defaultSource,
    output: path.resolve(
      process.env.OPAS_AS_TEXTS_OUTPUT ||
      path.join(repoRoot, "test-files", "conformance", "angelscript-texts.json")
    )
  };

  const opts = { ...defaults };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case "--source":
        i += 1;
        opts.source = requireArgValue(argv, i, "--source");
        break;
      case "--output":
        i += 1;
        opts.output = path.resolve(requireArgValue(argv, i, "--output"));
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

function printHelpAndExit(defaults) {
  const lines = [
    "Usage: npm run test:conformance:sync-texts -- [options]",
    "",
    "Options:",
    "  --source <url>     Source URL for as_texts.h.",
    "  --output <path>    Output JSON path.",
    "  -h, --help         Show this help.",
    "",
    "Defaults:",
    `  source: ${defaults.source}`,
    `  output: ${defaults.output}`,
    "",
    "Environment overrides:",
    "  OPAS_AS_TEXTS_SOURCE",
    "  OPAS_AS_TEXTS_OUTPUT"
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

async function downloadText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function parseTextsHeader(content) {
  const lines = content.replace(/\r/g, "").split("\n");
  const entries = [];
  const definePattern = /^#define\s+(TXT_[A-Za-z0-9_]+)\s+"((?:[^"\\]|\\.)*)"\s*$/;
  for (const line of lines) {
    const match = definePattern.exec(line);
    if (!match) {
      continue;
    }
    const key = match[1];
    const rawValue = match[2];
    const message = unescapeCStyleString(rawValue);
    entries.push({
      key,
      message
    });
  }
  return entries.sort((a, b) => a.key.localeCompare(b.key));
}

function unescapeCStyleString(value) {
  return value
    .replace(/\\\\/g, "\\")
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
}

function groupByPrefix(entries) {
  const groups = {};
  for (const entry of entries) {
    const parts = entry.key.split("_");
    const prefix = parts.length >= 2 ? parts[1] : "MISC";
    groups[prefix] = (groups[prefix] ?? 0) + 1;
  }
  return groups;
}

void main().catch((error) => {
  console.error(`[sync-as-texts] FAILED: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});

