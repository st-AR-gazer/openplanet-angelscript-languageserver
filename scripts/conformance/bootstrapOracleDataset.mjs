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
    strict: false,
    strictDiagnosticText: defaults.strictDiagnosticText !== false,
    snapshotKey: defaults.snapshotKey ?? ""
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
      case "--max-cases":
        i += 1;
        opts.maxCases = toIntOrDefault(
          requireArgValue(argv, i, "--max-cases"),
          opts.maxCases
        );
        break;
      case "--report-root":
        i += 1;
        opts.reportRoot = path.resolve(requireArgValue(argv, i, "--report-root"));
        break;
      case "--snapshot-key":
        i += 1;
        opts.snapshotKey = requireArgValue(argv, i, "--snapshot-key");
        break;
      case "--identifier-only":
        opts.identifierOnly = true;
        break;
      case "--no-identifier-only":
        opts.identifierOnly = false;
        break;
      case "--strict":
        opts.strict = true;
        break;
      case "--no-strict":
        opts.strict = false;
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
  return opts;
}

function printHelpAndExit(defaults) {
  const lines = [
    "Usage: npm run test:oracle-bootstrap -- [options]",
    "",
    "Pipeline:",
    "  1) Generate conformance corpus (identifier/default-arg/handle-ref/operator/import + matrix cases)",
    "  2) Run opdev conformance on generated corpus (discovery pass)",
    "  3) Materialize oracle fixture + compiler message compendium from observed outcomes",
    "  4) Run test:oracle-parity on materialized oracle fixture",
    "",
    "Options:",
    "  --suite <name>           Suite name.",
    "  --max-cases <n>          Max generated cases after deterministic ordering.",
    "  --transport <mode>       Companion transport (auto|socket|file).",
    "  --timeout-sec <n>        Per-case timeout for opdev conformance.",
    "  --wait-frames <n>        Companion wait frames.",
    "  --companion-host <host>  Companion host.",
    "  --companion-port <n>     Companion port.",
    "  --suites-root <path>     Suites root path.",
    "  --opdev-py <path>        Path to opdev.py.",
    "  --python <exe>           Python executable.",
    "  --report-root <path>     Output root for timestamped bootstrap reports.",
    "  --snapshot-key <name>    Snapshot grouping key passed to oracle parity run.",
    "  --identifier-only        Generate only identifier-name matrix corpus.",
    "  --strict                 Return non-zero exit code when parity has mismatches.",
    "  --strict-diagnostic-text Enforce strict ERR/WARN/INFO text parity in bootstrap parity phase.",
    "  -h, --help               Show help.",
    "",
    "Defaults:",
    `  suite: ${defaults.suite}`,
    `  max-cases: ${defaults.maxCases}`,
    `  identifier-only: ${String(defaults.identifierOnly)}`,
    `  strict-diagnostic-text: ${String(defaults.strictDiagnosticText)}`,
    `  snapshot-key: ${defaults.snapshotKey || "(none)"}`,
    `  suites root: ${defaults.suitesRoot}`,
    `  opdev.py: ${defaults.opdevPyPath}`,
    `  report root: ${defaults.reportRoot}`,
    "",
    "Environment overrides:",
    "  OPAS_BOOTSTRAP_MAX_CASES",
    "  OPAS_BOOTSTRAP_IDENTIFIER_ONLY",
    "  OPAS_BOOTSTRAP_SNAPSHOT_KEY",
    "  OPAS_BOOTSTRAP_STRICT_DIAGNOSTIC_TEXT",
    "  OPAS_PARITY_SNAPSHOT_KEY"
  ];
  console.log(lines.join("\n"));
  process.exit(0);
}

async function runCommand({ label, command, args, cwd, env, shell = false }) {
  const startedAt = Date.now();
  const startedIso = nowIso();
  const cmdLine = [command, ...args].map(quoteForDisplay).join(" ");
  console.log(`[oracle-bootstrap] ${label}: ${cmdLine}`);
  if (cwd) {
    console.log(`[oracle-bootstrap] ${label}: cwd=${cwd}`);
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

function typeSpecs() {
  return [
    { type: "int", literals: ["0", "1", "-1"] },
    { type: "uint", literals: ["0u", "1u", "4294967295u"] },
    { type: "float", literals: ["0.0f", "1.5f", "-2.25f"] },
    { type: "bool", literals: ["true", "false"] },
    { type: "string", literals: ['""', '"abc"', '"123"'] }
  ];
}

function buildLiteralPool(specs) {
  const literals = [];
  for (const spec of specs) {
    for (const literal of spec.literals) {
      literals.push({
        sourceType: spec.type,
        literal
      });
    }
  }
  return literals;
}

function languageKeywordIdentifiers() {
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

function identifierControlNames() {
  return [
    "value",
    "value2",
    "_value",
    "__tmp",
    "outValue",
    "forValue",
    "namespaceValue",
    "castValue",
    "stringValue",
    "boolValue",
    "Out",
    "In",
    "InOut",
    "FunctionValue",
    "PrivateValue"
  ];
}

function makeCase(id, description, code, extras = {}) {
  return {
    id,
    description,
    expect: "compile_success",
    code,
    ...extras
  };
}

function buildIdentifierNameCases() {
  const reservedNames = languageKeywordIdentifiers();
  const controls = identifierControlNames();
  const candidates = dedupeStrings([...reservedNames, ...controls]);
  const cases = [];

  for (const identifier of candidates) {
    const idToken = encodeIdentifierForId(identifier);
    const helper = `Use_${idToken}`;
    const caller = `Call_${idToken}`;
    const fieldHolder = `FieldHolder_${idToken}`;
    const methodHolder = `MethodHolder_${idToken}`;
    const namespaceFn = `NsFn_${idToken}`;
    const namespaceVar = `NsVar_${idToken}`;
    const enumName = `Enum_${idToken}`;

    cases.push(
      makeCase(
        `identifier.local.${idToken}`,
        `Identifier local variable name "${identifier}"`,
        [
          "void Main() {",
          `    int ${identifier} = 1;`,
          "}"
        ].join("\n")
      )
    );

    cases.push(
      makeCase(
        `identifier.param.${idToken}`,
        `Identifier parameter name "${identifier}"`,
        [
          `int ${helper}(int ${identifier}) {`,
          `    return ${identifier};`,
          "}",
          "void Main() {",
          `    ${helper}(1);`,
          "}"
        ].join("\n")
      )
    );

    cases.push(
      makeCase(
        `identifier.function.${idToken}`,
        `Identifier function name "${identifier}"`,
        [
          `int ${identifier}(int value) {`,
          "    return value;",
          "}",
          "void Main() {",
          `    int outValue = ${identifier}(1);`,
          `    ${caller}(outValue);`,
          "}",
          `void ${caller}(int value) {`,
          "    value += 1;",
          "}"
        ].join("\n")
      )
    );

    cases.push(
      makeCase(
        `identifier.class_field.${idToken}`,
        `Identifier class member field name "${identifier}"`,
        [
          `class ${fieldHolder} {`,
          `    int ${identifier};`,
          "}",
          "void Main() {",
          `    ${fieldHolder} value;`,
          `    value.${identifier} = 1;`,
          "}"
        ].join("\n")
      )
    );

    cases.push(
      makeCase(
        `identifier.class_method.${idToken}`,
        `Identifier class member method name "${identifier}"`,
        [
          `class ${methodHolder} {`,
          `    void ${identifier}(int value) {`,
          "        value += 1;",
          "    }",
          "}",
          "void Main() {",
          `    ${methodHolder} value;`,
          `    value.${identifier}(1);`,
          "}"
        ].join("\n")
      )
    );

    cases.push(
      makeCase(
        `identifier.namespace_function.${idToken}`,
        `Identifier namespace function symbol "${identifier}"`,
        [
          `namespace ${namespaceFn} {`,
          `    int ${identifier}(int value) {`,
          "        return value;",
          "    }",
          "}",
          "void Main() {",
          `    ${namespaceFn}::${identifier}(1);`,
          "}"
        ].join("\n")
      )
    );

    cases.push(
      makeCase(
        `identifier.namespace_symbol.${idToken}`,
        `Identifier namespace variable symbol "${identifier}"`,
        [
          `namespace ${namespaceVar} {`,
          `    int ${identifier} = 0;`,
          "}",
          "void Main() {",
          `    ${namespaceVar}::${identifier} += 1;`,
          "}"
        ].join("\n")
      )
    );

    cases.push(
      makeCase(
        `identifier.enum_label.${idToken}`,
        `Identifier enum label "${identifier}"`,
        [
          `enum ${enumName} {`,
          `    ${identifier} = 0,`,
          "    LabelValue = 1",
          "}",
          "void Main() {",
          `    ${enumName} value = ${enumName}::${identifier};`,
          "}"
        ].join("\n")
      )
    );
  }

  return dedupeById(cases);
}

function buildDefaultArgQuirkCases() {
  const cases = [];

  cases.push(
    makeCase(
      "defaultarg.trailing.valid",
      "Default args with trailing defaults and full call matrix.",
      [
        "void Take(int a, int b = 2, int c = 3) {",
        "    int x = a + b + c;",
        "}",
        "void Main() {",
        "    Take(1);",
        "    Take(1, 2);",
        "    Take(1, 2, 3);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.ordering.required_after_default",
      "Default arg ordering quirk: required parameter after default parameter.",
      [
        "void Take(int a = 1, int b) {",
        "    int x = a + b;",
        "}",
        "void Main() {",
        "    Take(1, 2);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.call.omitted_middle",
      "Default call quirk: omit middle argument with explicit trailing argument.",
      [
        "void Take(int a, int b = 2, int c = 3) {",
        "    int x = a + b + c;",
        "}",
        "void Main() {",
        "    Take(1, , 3);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.call.named_gap_via_parens",
      "Default call quirk: omitted argument inside nested expression.",
      [
        "void Take(int a, int b = 2, int c = 3) {",
        "    int x = a + b + c;",
        "}",
        "void Main() {",
        "    int a = 1;",
        "    Take((a), , 3);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.initializer_list.array_handle",
      "Initializer list default for array handle parameter.",
      [
        "void Take(array<int>@ values = {1, 2, 3}) {",
        "    int x = values[0];",
        "}",
        "void Main() {",
        "    Take();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.initializer_list.array_nested",
      "Initializer list default for nested array handle parameter.",
      [
        "void Take(array<array<int>>@ values = {{1}, {2, 3}}) {",
        "    int x = values.Length;",
        "}",
        "void Main() {",
        "    Take();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.initializer_list.object_ctor",
      "Object constructor default argument initializer.",
      [
        "class Pair {",
        "    int value;",
        "    Pair() { value = 0; }",
        "    Pair(int x) { value = x; }",
        "}",
        "void Take(Pair value = Pair(5)) {",
        "    int x = value.value;",
        "}",
        "void Main() {",
        "    Take();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.reference_out_default",
      "Out reference default argument.",
      [
        "void Fill(int &out value = 2) {",
        "    value = 4;",
        "}",
        "void Main() {",
        "    int x = 0;",
        "    Fill(x);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.reference_in_default",
      "Const in reference default argument.",
      [
        "void Read(const int &in value = 2) {",
        "    int x = value;",
        "}",
        "void Main() {",
        "    Read();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.handle_null_default",
      "Handle default argument with null literal.",
      [
        "class Obj {",
        "    int value;",
        "    Obj() { value = 1; }",
        "}",
        "void Take(Obj@ value = null) { }",
        "void Main() {",
        "    Take();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.depends_previous_param",
      "Default argument references an earlier parameter.",
      [
        "void Take(int a, int b = a) {",
        "    int x = a + b;",
        "}",
        "void Main() {",
        "    Take(2);",
        "}"
      ].join("\n")
    )
  );

  return dedupeById(cases);
}

function buildHandleAndReferenceCases() {
  const cases = [];

  cases.push(
    makeCase(
      "handleref.assign.null",
      "Handle assignment from null literal.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing@ value = null;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.assign.ctor",
      "Handle assignment from inline constructor expression.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing@ value = RefThing();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.assign.value_to_handle",
      "Handle assignment from value type instance.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing value;",
        "    RefThing@ handleValue = value;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.compare.is_null",
      "Handle comparison with null using 'is'.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing@ value = null;",
        "    bool isNull = value is null;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.compare.eq_null",
      "Handle comparison with null using equality operator.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing@ value = null;",
        "    bool isNull = value == null;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.ref_in_valid",
      "const &in reference argument from variable.",
      [
        "void Take(const int &in value) { }",
        "void Main() {",
        "    int x = 3;",
        "    Take(x);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.ref_out_valid",
      "&out reference argument from variable.",
      [
        "void Fill(int &out value) {",
        "    value = 4;",
        "}",
        "void Main() {",
        "    int x = 0;",
        "    Fill(x);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.ref_out_literal",
      "&out reference argument from literal.",
      [
        "void Fill(int &out value) {",
        "    value = 4;",
        "}",
        "void Main() {",
        "    Fill(4);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.ref_inout_valid",
      "&inout reference argument from variable.",
      [
        "void Bump(int &inout value) {",
        "    value += 1;",
        "}",
        "void Main() {",
        "    int x = 1;",
        "    Bump(x);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.ref_inout_literal",
      "&inout reference argument from literal.",
      [
        "void Bump(int &inout value) {",
        "    value += 1;",
        "}",
        "void Main() {",
        "    Bump(1);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.handle_out_valid",
      "Handle @out parameter from variable.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Make(RefThing@ out value) {",
        "    @value = RefThing();",
        "}",
        "void Main() {",
        "    RefThing@ x = null;",
        "    Make(x);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.handle_out_temporary",
      "Handle @out parameter from temporary expression.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Make(RefThing@ out value) {",
        "    @value = RefThing();",
        "}",
        "void Main() {",
        "    Make(RefThing());",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.handle_in_null",
      "Handle @in parameter with null literal.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Read(RefThing@ in value) { }",
        "void Main() {",
        "    Read(null);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.assign.handle_copy",
      "Explicit handle copy assignment using @.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing@ a = RefThing();",
        "    RefThing@ b = null;",
        "    @b = @a;",
        "}"
      ].join("\n")
    )
  );

  const primitiveRefArgumentMatrix = [
    { mode: "in", idSuffix: "var", argExpr: "x" },
    { mode: "in", idSuffix: "literal", argExpr: "1" },
    { mode: "in", idSuffix: "expr", argExpr: "x + 1" },
    { mode: "out", idSuffix: "var", argExpr: "x" },
    { mode: "out", idSuffix: "literal", argExpr: "1" },
    { mode: "out", idSuffix: "expr", argExpr: "x + 1" },
    { mode: "inout", idSuffix: "var", argExpr: "x" },
    { mode: "inout", idSuffix: "literal", argExpr: "1" },
    { mode: "inout", idSuffix: "expr", argExpr: "x + 1" }
  ];
  for (const probe of primitiveRefArgumentMatrix) {
    const writeLine =
      probe.mode === "in" ? "    int y = value;" : "    value = value + 1;";
    cases.push(
      makeCase(
        `handleref.matrix.intref.${probe.mode}.${probe.idSuffix}`,
        `Primitive reference matrix: int &${probe.mode} called with ${probe.idSuffix}.`,
        [
          `void Touch(int &${probe.mode} value) {`,
          writeLine,
          "}",
          "void Main() {",
          "    int x = 5;",
          `    Touch(${probe.argExpr});`,
          "}"
        ].join("\n")
      )
    );
  }

  const handleRefArgumentMatrix = [
    { mode: "in", idSuffix: "var", argExpr: "x" },
    { mode: "in", idSuffix: "null", argExpr: "null" },
    { mode: "in", idSuffix: "ctor", argExpr: "RefThing()" },
    { mode: "in", idSuffix: "call", argExpr: "MakeThing()" },
    { mode: "out", idSuffix: "var", argExpr: "x" },
    { mode: "out", idSuffix: "null", argExpr: "null" },
    { mode: "out", idSuffix: "ctor", argExpr: "RefThing()" },
    { mode: "out", idSuffix: "call", argExpr: "MakeThing()" },
    { mode: "inout", idSuffix: "var", argExpr: "x" },
    { mode: "inout", idSuffix: "null", argExpr: "null" },
    { mode: "inout", idSuffix: "ctor", argExpr: "RefThing()" },
    { mode: "inout", idSuffix: "call", argExpr: "MakeThing()" }
  ];
  for (const probe of handleRefArgumentMatrix) {
    const writeLine =
      probe.mode === "in"
        ? "    int y = value is null ? 0 : value.value;"
        : "    @value = MakeThing();";
    cases.push(
      makeCase(
        `handleref.matrix.handleref.${probe.mode}.${probe.idSuffix}`,
        `Handle reference matrix: RefThing@ ${probe.mode} called with ${probe.idSuffix}.`,
        [
          "class RefThing {",
          "    int value;",
          "    RefThing() { value = 0; }",
          "    RefThing(int x) { value = x; }",
          "}",
          "RefThing@ MakeThing() {",
          "    RefThing@ value = RefThing(7);",
          "    return value;",
          "}",
          `void Touch(RefThing@ ${probe.mode} value) {`,
          writeLine,
          "}",
          "void Main() {",
          "    RefThing@ x = MakeThing();",
          `    Touch(${probe.argExpr});`,
          "}"
        ].join("\n")
      )
    );
  }

  cases.push(
    makeCase(
      "handleref.assign.value_from_handle",
      "Value assignment from handle variable.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing@ source = RefThing();",
        "    RefThing target = source;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.assign.value_from_null",
      "Value assignment from null literal.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing value = null;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.handle_value_param_null",
      "Value parameter call with null literal.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void ConsumeValue(RefThing value) { }",
        "void Main() {",
        "    ConsumeValue(null);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.call.handle_handle_param_value",
      "Handle parameter call with value variable.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void ConsumeHandle(RefThing@ value) { }",
        "void Main() {",
        "    RefThing value;",
        "    ConsumeHandle(value);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.compare.is_notis_mix",
      "Handle comparison matrix using is / !is.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    RefThing@ a = RefThing();",
        "    RefThing@ b = null;",
        "    bool x = a is b;",
        "    bool y = a !is b;",
        "    bool z = b !is null;",
        "}"
      ].join("\n")
    )
  );

  return dedupeById(cases);
}

function buildOperatorOverloadCases() {
  const cases = [];

  cases.push(
    makeCase(
      "operator.opassign.basic",
      "Operator overload: basic opAssign usage.",
      [
        "class Box {",
        "    int value;",
        "    Box() { value = 0; }",
        "    Box(int x) { value = x; }",
        "    Box& opAssign(const Box &in other) {",
        "        value = other.value;",
        "        return this;",
        "    }",
        "}",
        "void Main() {",
        "    Box a(1);",
        "    Box b(2);",
        "    a = b;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opassign.void_return",
      "Operator overload: opAssign with void return type.",
      [
        "class Box {",
        "    int value;",
        "    Box() { value = 0; }",
        "    void opAssign(const Box &in other) {",
        "        value = other.value;",
        "    }",
        "}",
        "void Main() {",
        "    Box a;",
        "    Box b;",
        "    a = b;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opassign.chain",
      "Operator overload: chained assignment evaluation.",
      [
        "class Box {",
        "    int value;",
        "    Box() { value = 0; }",
        "    Box(int x) { value = x; }",
        "    Box& opAssign(const Box &in other) {",
        "        value = other.value;",
        "        return this;",
        "    }",
        "}",
        "void Main() {",
        "    Box a(1);",
        "    Box b(2);",
        "    Box c(3);",
        "    a = b = c;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opimplconv.int_assignment",
      "Operator overload: implicit conversion in assignment.",
      [
        "class Meters {",
        "    int value;",
        "    Meters() { value = 5; }",
        "    int opImplConv() {",
        "        return value;",
        "    }",
        "}",
        "void Main() {",
        "    Meters m;",
        "    int x = m;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opimplconv.ambiguous_call",
      "Operator overload: ambiguous call from multiple opImplConv definitions.",
      [
        "class Scalar {",
        "    int value;",
        "    Scalar() { value = 1; }",
        "    int opImplConv() { return value; }",
        "    float opImplConv() { return float(value); }",
        "}",
        "void Consume(int value) { }",
        "void Consume(float value) { }",
        "void Main() {",
        "    Scalar value;",
        "    Consume(value);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opindex.read_basic",
      "Operator overload: opIndex read with uint parameter.",
      [
        "class Grid {",
        "    int opIndex(uint index) {",
        "        return int(index);",
        "    }",
        "}",
        "void Main() {",
        "    Grid grid;",
        "    int value = grid[0];",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opindex.read_invalid_arg",
      "Operator overload: opIndex read with mismatched argument type.",
      [
        "class Grid {",
        "    int opIndex(uint index) {",
        "        return int(index);",
        "    }",
        "}",
        "void Main() {",
        "    Grid grid;",
        "    int value = grid[\"a\"];",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opindex.write_ref",
      "Operator overload: opIndex returning writable reference.",
      [
        "class Grid {",
        "    array<int> values = {0, 1, 2};",
        "    int &opIndex(uint index) {",
        "        return values[index];",
        "    }",
        "}",
        "void Main() {",
        "    Grid grid;",
        "    grid[1] = 9;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opassign.cross_type",
      "Operator overload: opAssign from primitive argument.",
      [
        "class Box {",
        "    int value;",
        "    Box() { value = 0; }",
        "    Box& opAssign(int x) {",
        "        value = x;",
        "        return this;",
        "    }",
        "}",
        "void Main() {",
        "    Box value;",
        "    value = 3;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.compare.opcmp_opequals",
      "Operator overload: opCmp + opEquals comparison surface.",
      [
        "class NumberBox {",
        "    int value;",
        "    NumberBox() { value = 0; }",
        "    NumberBox(int x) { value = x; }",
        "    int opCmp(const NumberBox &in other) const {",
        "        if (value < other.value) { return -1; }",
        "        if (value > other.value) { return 1; }",
        "        return 0;",
        "    }",
        "    bool opEquals(const NumberBox &in other) const {",
        "        return value == other.value;",
        "    }",
        "}",
        "void Main() {",
        "    NumberBox a(1);",
        "    NumberBox b(2);",
        "    bool lt = a < b;",
        "    bool eq = a == b;",
        "    bool neq = a != b;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.arithmetic.opadd_opsub",
      "Operator overload: opAdd/opSub arithmetic surface.",
      [
        "class NumberBox {",
        "    int value;",
        "    NumberBox() { value = 0; }",
        "    NumberBox(int x) { value = x; }",
        "    NumberBox opAdd(const NumberBox &in other) const {",
        "        return NumberBox(value + other.value);",
        "    }",
        "    NumberBox opSub(const NumberBox &in other) const {",
        "        return NumberBox(value - other.value);",
        "    }",
        "}",
        "void Main() {",
        "    NumberBox a(2);",
        "    NumberBox b(3);",
        "    NumberBox c = a + b;",
        "    NumberBox d = c - a;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.unary.opneg",
      "Operator overload: unary negation via opNeg.",
      [
        "class NumberBox {",
        "    int value;",
        "    NumberBox() { value = 0; }",
        "    NumberBox(int x) { value = x; }",
        "    NumberBox opNeg() const {",
        "        return NumberBox(-value);",
        "    }",
        "}",
        "void Main() {",
        "    NumberBox a(2);",
        "    NumberBox b = -a;",
        "}"
      ].join("\n")
    )
  );

  const opAssignSourceMatrix = [
    { idSuffix: "int", expr: "1" },
    { idSuffix: "float", expr: "1.0f" },
    { idSuffix: "bool", expr: "true" },
    { idSuffix: "string", expr: '"\"x\"' }
  ];
  for (const source of opAssignSourceMatrix) {
    cases.push(
      makeCase(
        `operator.opassign.matrix.${source.idSuffix}`,
        `Operator overload matrix: opAssign overload ranking for ${source.idSuffix}.`,
        [
          "class AssignBox {",
          "    int value;",
          "    AssignBox() { value = 0; }",
          "    AssignBox& opAssign(int x) {",
          "        value = x;",
          "        return this;",
          "    }",
          "    AssignBox& opAssign(float x) {",
          "        value = int(x);",
          "        return this;",
          "    }",
          "}",
          "void Main() {",
          "    AssignBox value;",
          `    value = ${source.expr};`,
          "}"
        ].join("\n")
      )
    );
  }

  cases.push(
    makeCase(
      "operator.opadd.overload_rank_literals",
      "Operator overload: opAdd overload ranking for numeric literals.",
      [
        "class NumberBox {",
        "    int value;",
        "    NumberBox() { value = 0; }",
        "    NumberBox(int x) { value = x; }",
        "    NumberBox opAdd(int x) const {",
        "        return NumberBox(value + x);",
        "    }",
        "    NumberBox opAdd(float x) const {",
        "        return NumberBox(value + int(x));",
        "    }",
        "}",
        "void Main() {",
        "    NumberBox a(1);",
        "    NumberBox b = a + 1;",
        "    NumberBox c = a + 1.0f;",
        "    NumberBox d = a + 1.0;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opindex.write_to_value",
      "Operator overload: writing to opIndex result returned by value.",
      [
        "class ReadOnlyGrid {",
        "    int opIndex(uint index) {",
        "        return int(index);",
        "    }",
        "}",
        "void Main() {",
        "    ReadOnlyGrid grid;",
        "    grid[1] = 5;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opindex.const_receiver_nonconst",
      "Operator overload: const receiver with non-const opIndex method.",
      [
        "class Grid {",
        "    array<int> values = {0, 1, 2};",
        "    int &opIndex(uint index) {",
        "        return values[index];",
        "    }",
        "}",
        "void Read(const Grid &in grid) {",
        "    int value = grid[0];",
        "}",
        "void Main() {",
        "    Grid grid;",
        "    Read(grid);",
        "}"
      ].join("\n")
    )
  );

  const opIndexArgMatrix = [
    { idSuffix: "uint", expr: "1u" },
    { idSuffix: "int", expr: "1" },
    { idSuffix: "string", expr: '"\"k\"' },
    { idSuffix: "bool", expr: "true" }
  ];
  for (const source of opIndexArgMatrix) {
    cases.push(
      makeCase(
        `operator.opindex.matrix.${source.idSuffix}`,
        `Operator overload matrix: opIndex argument probe for ${source.idSuffix}.`,
        [
          "class Lookup {",
          "    int opIndex(uint index) {",
          "        return int(index);",
          "    }",
          "    int opIndex(const string &in key) {",
          "        return key.Length;",
          "    }",
          "}",
          "void Main() {",
          "    Lookup value;",
          `    int x = value[${source.expr}];`,
          "}"
        ].join("\n")
      )
    );
  }

  cases.push(
    makeCase(
      "operator.opimplconv.assignment_matrix",
      "Operator overload: opImplConv assignment and call matrix.",
      [
        "class Scalar {",
        "    int value;",
        "    Scalar() { value = 2; }",
        "    int opImplConv() { return value; }",
        "    float opImplConv() { return float(value); }",
        "}",
        "void TakeInt(int value) { }",
        "void TakeFloat(float value) { }",
        "void Main() {",
        "    Scalar value;",
        "    int x = value;",
        "    float y = value;",
        "    TakeInt(value);",
        "    TakeFloat(value);",
        "}"
      ].join("\n")
    )
  );

  return dedupeById(cases);
}

function buildImportSurfaceOddityCases() {
  const cases = [];
  const moduleTargets = [
    {
      idSuffix: "folder_exact",
      modulePath: "OpDevCompanion",
      dependencies: ["OpDevCompanion"]
    },
    {
      idSuffix: "package_suffix",
      modulePath: "OpDevCompanion.op",
      dependencies: ["OpDevCompanion"]
    },
    {
      idSuffix: "folder_case_mismatch",
      modulePath: "opdevcompanion",
      dependencies: ["OpDevCompanion"]
    },
    {
      idSuffix: "bank_folder",
      modulePath: "bank/OpDevCompanion",
      dependencies: ["OpDevCompanion"]
    },
    {
      idSuffix: "bank_package",
      modulePath: "bank/OpDevCompanion.op",
      dependencies: ["OpDevCompanion"]
    },
    {
      idSuffix: "missing_folder",
      modulePath: "DefinitelyMissingPlugin"
    },
    {
      idSuffix: "missing_package",
      modulePath: "DefinitelyMissingPlugin.op"
    }
  ];

  for (const moduleTarget of moduleTargets) {
    cases.push(
      makeCase(
        `importsurface.from.${moduleTarget.idSuffix}`,
        `Import target mismatch probe for "${moduleTarget.modulePath}".`,
        [
          `import int RemoteTick(int count) from "${moduleTarget.modulePath}";`,
          "void Main() {",
          "    RemoteTick(1);",
          "}"
        ].join("\n"),
        moduleTarget.dependencies ? { dependencies: moduleTarget.dependencies } : {}
      )
    );

    cases.push(
      makeCase(
        `importsurface.signature.${moduleTarget.idSuffix}`,
        `Import signature/default-arg mismatch probe for "${moduleTarget.modulePath}".`,
        [
          `import int RemoteTick(int count, const string &in label = "x") from "${moduleTarget.modulePath}";`,
          "void Main() {",
          "    RemoteTick(1);",
          "}"
        ].join("\n"),
        moduleTarget.dependencies ? { dependencies: moduleTarget.dependencies } : {}
      )
    );
  }

  cases.push(
    makeCase(
      "importsurface.folder_vs_package.double_decl",
      "Dual import declaration for folder name and .op package name.",
      [
        'import int RemoteTick(int count) from "OpDevCompanion";',
        'import int RemoteTick(int count) from "OpDevCompanion.op";',
        "void Main() {",
        "    RemoteTick(1);",
        "}"
      ].join("\n"),
      { dependencies: ["OpDevCompanion"] }
    )
  );

  cases.push(
    makeCase(
      "importsurface.dep_name_package_suffix",
      "Dependency name mismatch probe (dependency uses .op suffix).",
      [
        'import int RemoteTick(int count) from "OpDevCompanion";',
        "void Main() {",
        "    RemoteTick(1);",
        "}"
      ].join("\n"),
      { dependencies: ["OpDevCompanion.op"] }
    )
  );

  return dedupeById(cases);
}

function buildTemplateAndFuncdefCases() {
  const cases = [];

  cases.push(
    makeCase(
      "template.array.nested_index",
      "Template/generic: nested array indexing and assignment.",
      [
        "void Main() {",
        "    array<array<int>> values = {{1, 2}, {3, 4}};",
        "    values[1][0] = 7;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "template.array.handle_elem",
      "Template/generic: array of handles with null assignment.",
      [
        "class RefThing {",
        "    int value;",
        "    RefThing() { value = 0; }",
        "}",
        "void Main() {",
        "    array<RefThing@> values;",
        "    values.InsertLast(null);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "template.dictionary.basic",
      "Template/generic: dictionary set/get surface.",
      [
        "void Main() {",
        "    dictionary values;",
        '    values["x"] = 1;',
        "    int outValue = 0;",
        '    values.Get("x", outValue);',
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "template.auto.infer_array",
      "Template/generic: auto inference from generic element access.",
      [
        "void Main() {",
        "    array<int> values = {1, 2, 3};",
        "    auto first = values[0];",
        "    first += 1;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "funcdef.callback.direct",
      "funcdef/delegate: direct callback invocation.",
      [
        "funcdef int Compute(int value);",
        "int AddOne(int value) {",
        "    return value + 1;",
        "}",
        "void Main() {",
        "    Compute@ fn = AddOne;",
        "    int outValue = fn(3);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "funcdef.callback.null_guard",
      "funcdef/delegate: nullable callback check and invocation.",
      [
        "funcdef int Compute(int value);",
        "int AddOne(int value) {",
        "    return value + 1;",
        "}",
        "void Main() {",
        "    Compute@ fn = null;",
        "    if (fn is null) {",
        "        @fn = AddOne;",
        "    }",
        "    int outValue = fn(2);",
        "}"
      ].join("\n")
    )
  );

  return dedupeById(cases);
}

function buildInheritanceAndOverrideCases() {
  const cases = [];

  cases.push(
    makeCase(
      "inheritance.base_to_derived_assign",
      "Inheritance: assigning base instance to derived variable.",
      [
        "class Base {",
        "    int value;",
        "    Base() { value = 1; }",
        "}",
        "class Derived : Base {",
        "    int more;",
        "    Derived() { more = 2; }",
        "}",
        "void Main() {",
        "    Base baseValue;",
        "    Derived derivedValue = cast<Derived>(baseValue);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "inheritance.derived_to_base_assign",
      "Inheritance: assigning derived instance to base variable.",
      [
        "class Base {",
        "    int value;",
        "    Base() { value = 1; }",
        "}",
        "class Derived : Base {",
        "    int more;",
        "    Derived() { more = 2; }",
        "}",
        "void Main() {",
        "    Derived derivedValue;",
        "    Base baseValue = derivedValue;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "inheritance.interface_impl",
      "Inheritance: interface implementation and dispatch.",
      [
        "interface IBox {",
        "    int GetValue();",
        "}",
        "class Box : IBox {",
        "    int value;",
        "    Box() { value = 3; }",
        "    int GetValue() {",
        "        return value;",
        "    }",
        "}",
        "void Main() {",
        "    Box box;",
        "    IBox@ iface = box;",
        "    int outValue = iface.GetValue();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "inheritance.override_signature_mismatch",
      "Inheritance: override signature mismatch in derived method.",
      [
        "class Base {",
        "    int GetValue(int x) {",
        "        return x;",
        "    }",
        "}",
        "class Derived : Base {",
        "    int GetValue() override {",
        "        return 1;",
        "    }",
        "}",
        "void Main() {",
        "    Derived value;",
        "    value.GetValue();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "inheritance.abstract_missing_impl",
      "Inheritance: abstract method missing implementation.",
      [
        "class Base {",
        "    int GetValue() abstract;",
        "}",
        "class Derived : Base {",
        "}",
        "void Main() {",
        "    Derived value;",
        "}"
      ].join("\n")
    )
  );

  return dedupeById(cases);
}

function buildFlowAndScopingCases() {
  const cases = [];

  cases.push(
    makeCase(
      "flow.switch.enum_case",
      "Control flow: enum switch with explicit labels.",
      [
        "enum Mode {",
        "    A = 0,",
        "    B = 1",
        "}",
        "int ReadMode(Mode mode) {",
        "    switch (mode) {",
        "        case Mode::A: return 1;",
        "        case Mode::B: return 2;",
        "    }",
        "    return 0;",
        "}",
        "void Main() {",
        "    int value = ReadMode(Mode::A);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "flow.for.break_continue",
      "Control flow: nested loops with break/continue.",
      [
        "void Main() {",
        "    int sum = 0;",
        "    for (uint i = 0; i < 10; i++) {",
        "        if ((i % 2) == 0) {",
        "            continue;",
        "        }",
        "        sum += int(i);",
        "        if (sum > 10) {",
        "            break;",
        "        }",
        "    }",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "flow.while.do_while",
      "Control flow: while and do-while parity.",
      [
        "void Main() {",
        "    int i = 0;",
        "    while (i < 2) {",
        "        i++;",
        "    }",
        "    do {",
        "        i--;",
        "    } while (i > 0);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "flow.scope.shadowing",
      "Scoping: local shadowing across nested blocks.",
      [
        "void Main() {",
        "    int value = 1;",
        "    {",
        "        int value = 2;",
        "        value += 1;",
        "    }",
        "    value += 1;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "flow.scope.use_before_decl",
      "Scoping: use-before-declaration in local scope.",
      [
        "void Main() {",
        "    int y = x;",
        "    int x = 1;",
        "}"
      ].join("\n")
    )
  );

  return dedupeById(cases);
}

function buildExtendedCompilerEdgeCaseFamilies() {
  const cases = [];

  cases.push(
    makeCase(
      "identifier.matrix.namespace_type_member",
      "Identifier matrix: namespace/type/member declaration interactions.",
      [
        "namespace ScopeNs {",
        "    class Carrier {",
        "        int Value;",
        "        void SetValue(int value) { Value = value; }",
        "    }",
        "}",
        "void Main() {",
        "    ScopeNs::Carrier carrier;",
        "    carrier.SetValue(1);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.ordering.named_and_positional_mix",
      "Default args: named/positional mixing with trailing defaults.",
      [
        "void SetConfig(int a, int b = 2, int c = 3) { }",
        "void Main() {",
        "    SetConfig(1, c: 9);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "defaultarg.old_named_assignment_syntax",
      "Default args: legacy named argument assignment syntax compatibility.",
      [
        "void SetConfig(int a, int b = 2, int c = 3) { }",
        "void Main() {",
        "    SetConfig(1, c = 7);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "handleref.inout_typed_mismatch",
      "Handle/ref: typed inout mismatch should be rejected.",
      [
        "void Touch(int &inout value) { value++; }",
        "void Main() {",
        "    float value = 0.0f;",
        "    Touch(value);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.ambiguous_overload.rank",
      "Operator overload: ambiguity and overload ranking.",
      [
        "class Numberish {",
        "    int v;",
        "    Numberish() { v = 0; }",
        "    Numberish &opAssign(int value) { v = value; return this; }",
        "    Numberish &opAssign(float value) { v = int(value); return this; }",
        "}",
        "void Main() {",
        "    Numberish n;",
        "    n = 1;",
        "    n = 2.0f;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "operator.opindex.multiple_receiver_types",
      "Operator index: overload matching by receiver/index type.",
      [
        "class Grid {",
        "    int opIndex(uint i) const { return int(i); }",
        "    int opIndex(const string &in key) const { return key.Length; }",
        "}",
        "void Main() {",
        "    Grid g;",
        "    int a = g[3];",
        "    int b = g[\"abc\"];",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "importsurface.folder_package_signature_drift",
      "Import surface: folder/.op signature drift handling.",
      [
        "import void ImportedCall(int value) from \"EdgeCaseModule\";",
        "void Main() {",
        "    ImportedCall(1);",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "preprocessor.if_define_include_surface",
      "Preprocessor: #define/#if/#include interactions.",
      [
        "#define HAS_FEATURE",
        "#if HAS_FEATURE",
        "int BuildValue() { return 1; }",
        "#else",
        "int BuildValue() { return 0; }",
        "#endif",
        "void Main() {",
        "    BuildValue();",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "contextual.keyword.from_as_identifier",
      "Contextual keyword: from used as identifier outside import context.",
      [
        "void Main() {",
        "    int from = 1;",
        "    from += 1;",
        "}"
      ].join("\n")
    )
  );

  cases.push(
    makeCase(
      "contextual.keyword.shared_as_identifier",
      "Contextual keyword: shared used as identifier in local scope.",
      [
        "void Main() {",
        "    int shared = 1;",
        "    shared += 1;",
        "}"
      ].join("\n")
    )
  );

  return dedupeById(cases);
}

function buildGeneratedCases(maxCases, options = {}) {
  const identifierOnly = options.identifierOnly === true;
  const specs = typeSpecs();
  const literalPool = buildLiteralPool(specs);
  const cases = [];

  const identifierCases = buildIdentifierNameCases();
  cases.push(...identifierCases);

  if (identifierOnly) {
    return applyCaseCap(cases, maxCases);
  }

  const defaultArgCases = buildDefaultArgQuirkCases();
  const handleAndReferenceCases = buildHandleAndReferenceCases();
  const operatorCases = buildOperatorOverloadCases();
  const importSurfaceCases = buildImportSurfaceOddityCases();
  const templateAndFuncdefCases = buildTemplateAndFuncdefCases();
  const inheritanceCases = buildInheritanceAndOverrideCases();
  const flowAndScopingCases = buildFlowAndScopingCases();
  const extendedEdgeCases = buildExtendedCompilerEdgeCaseFamilies();
  cases.push(
    ...defaultArgCases,
    ...handleAndReferenceCases,
    ...operatorCases,
    ...importSurfaceCases,
    ...templateAndFuncdefCases,
    ...inheritanceCases,
    ...flowAndScopingCases,
    ...extendedEdgeCases
  );

  for (const target of specs) {
    for (const source of literalPool) {
      cases.push({
        id: `matrix.assign.${target.type}.from.${source.sourceType}.${sanitizeToken(source.literal)}`,
        description: `Assignment: ${target.type} <- ${source.sourceType} (${source.literal})`,
        expect: "compile_success",
        code: [
          "void Main() {",
          `    ${target.type} value = ${source.literal};`,
          "}"
        ].join("\n")
      });
    }
  }

  for (const target of specs) {
    for (const source of literalPool) {
      cases.push({
        id: `matrix.call.${target.type}.arg.${source.sourceType}.${sanitizeToken(source.literal)}`,
        description: `Call arg: Take(${target.type}) <- ${source.sourceType} (${source.literal})`,
        expect: "compile_success",
        code: [
          `void Take(${target.type} value) { }`,
          "void Main() {",
          `    Take(${source.literal});`,
          "}"
        ].join("\n")
      });
    }
  }

  for (const target of specs) {
    for (const source of literalPool) {
      cases.push({
        id: `matrix.return.${target.type}.from.${source.sourceType}.${sanitizeToken(source.literal)}`,
        description: `Return: ${target.type} <- ${source.sourceType} (${source.literal})`,
        expect: "compile_success",
        code: [
          `${target.type} BuildValue() {`,
          `    return ${source.literal};`,
          "}",
          "void Main() {",
          "    BuildValue();",
          "}"
        ].join("\n")
      });
    }
  }

  const binaryOperators = ["+", "-", "*", "/", "%", "==", "!=", "<", "<=", ">", ">=", "&&", "||"];
  for (const lhs of specs) {
    for (const rhs of specs) {
      for (const op of binaryOperators) {
        const lhsLiteral = lhs.literals[0];
        const rhsLiteral = rhs.literals[0];
        const isComparisonOperator =
          op === "==" ||
          op === "!=" ||
          op === "<" ||
          op === "<=" ||
          op === ">" ||
          op === ">=" ||
          op === "&&" ||
          op === "||";

        const expressionLine = isComparisonOperator
          ? `    bool result = lhs ${op} rhs;`
          : `    lhs ${op} rhs;`;
        cases.push({
          id: `matrix.binary.${opToToken(op)}.${lhs.type}.${rhs.type}`,
          description: `Binary op: ${lhs.type} ${op} ${rhs.type}`,
          expect: "compile_success",
          code: [
            "void Main() {",
            `    ${lhs.type} lhs = ${lhsLiteral};`,
            `    ${rhs.type} rhs = ${rhsLiteral};`,
            expressionLine,
            "}"
          ].join("\n")
        });
      }
    }
  }

  const compoundOperators = ["+=", "-=", "*=", "/=", "%=", "&=", "|=", "^="];
  for (const lhs of specs) {
    for (const rhs of specs) {
      for (const op of compoundOperators) {
        const lhsLiteral = lhs.literals[0];
        const rhsLiteral = rhs.literals[0];
        cases.push({
          id: `matrix.compound.${opToToken(op)}.${lhs.type}.${rhs.type}`,
          description: `Compound op: ${lhs.type} ${op} ${rhs.type}`,
          expect: "compile_success",
          code: [
            "void Main() {",
            `    ${lhs.type} lhs = ${lhsLiteral};`,
            `    ${rhs.type} rhs = ${rhsLiteral};`,
            `    lhs ${op} rhs;`,
            "}"
          ].join("\n")
        });
      }
    }
  }

  return applyCaseCap(cases, maxCases);
}

function applyCaseCap(cases, maxCases) {
  const stable = dedupeById(cases);
  if (maxCases > 0 && stable.length > maxCases) {
    return stable.slice(0, maxCases);
  }
  return stable;
}

function dedupeById(cases) {
  const out = [];
  const seen = new Set();
  for (const item of cases) {
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function sanitizeToken(text) {
  return text
    .replace(/[^A-Za-z0-9]+/g, "")
    .toLowerCase() || "lit";
}

function encodeIdentifierForId(identifier) {
  return Buffer.from(identifier, "utf8").toString("hex");
}

function dedupeStrings(values) {
  const out = [];
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    out.push(value);
  }
  return out;
}

function opToToken(op) {
  return op
    .replace(/==/g, "eq")
    .replace(/!=/g, "neq")
    .replace(/<=/g, "le")
    .replace(/>=/g, "ge")
    .replace(/&&/g, "and")
    .replace(/\|\|/g, "or")
    .replace(/\+=/g, "addeq")
    .replace(/-=/g, "subeq")
    .replace(/\*=/g, "muleq")
    .replace(/\/=/g, "diveq")
    .replace(/%=/g, "modeq")
    .replace(/&=/g, "andeq")
    .replace(/\|=/g, "oreq")
    .replace(/\^=/g, "xoreq")
    .replace(/\+/g, "add")
    .replace(/-/g, "sub")
    .replace(/\*/g, "mul")
    .replace(/\//g, "div")
    .replace(/%/g, "mod")
    .replace(/</g, "lt")
    .replace(/>/g, "gt");
}

function summarizeGeneratedFamilies(cases) {
  const counts = {};
  for (const testCase of cases) {
    const id = typeof testCase.id === "string" ? testCase.id : "";
    if (!id) {
      continue;
    }
    const parts = id.split(".");
    const root = parts[0] ?? "unknown";
    let key = root;
    if (root === "identifier") {
      key = `${root}.${parts[1] ?? "unknown"}`;
    } else if (parts[1]) {
      key = `${root}.${parts[1]}`;
    }
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
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

async function materializeOracleFixture({
  rawFixturePath,
  oracleRunDir,
  oracleFixturePath,
  materializationSummaryPath,
  messageCompendiumPath,
  strictDiagnosticText
}) {
  const rawCases = await readJsonl(rawFixturePath);
  const runJsonlPath = path.join(oracleRunDir, "run.jsonl");
  const runRows = await readJsonl(runJsonlPath);
  const observedById = new Map();
  for (const row of runRows) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const caseId = typeof row.case_id === "string" ? row.case_id : "";
    const observed = typeof row.observed === "string" ? row.observed : "";
    if (!caseId || !observed) {
      continue;
    }
    const compileExcerptPath =
      typeof row.compile_excerpt_path === "string" && row.compile_excerpt_path.trim()
        ? path.resolve(row.compile_excerpt_path)
        : null;
    observedById.set(caseId, {
      observed,
      compileExcerptPath
    });
  }

  const included = [];
  const dropped = [];
  let casesWithWarnings = 0;
  const warningMessageCounts = new Map();
  const errorMessageCounts = new Map();
  const infoMessageCounts = new Map();
  const metaMessageCounts = new Map();
  const compileErrorWarningCounts = new Map();
  const compileErrorErrorCounts = new Map();
  const compileErrorInfoCounts = new Map();
  const compileErrorMetaCounts = new Map();
  for (const rawCase of rawCases) {
    const caseId = typeof rawCase.id === "string" ? rawCase.id : "";
    if (!caseId) {
      continue;
    }
    const observedEntry = observedById.get(caseId);
    if (!observedEntry) {
      dropped.push({ id: caseId, reason: "missing_in_oracle_run" });
      continue;
    }
    const observed = observedEntry.observed;
    if (observed === "harness_error") {
      dropped.push({ id: caseId, reason: "harness_error" });
      continue;
    }
    if (observed !== "compile_success" && observed !== "compile_error") {
      dropped.push({ id: caseId, reason: `unknown_observed:${observed}` });
      continue;
    }
    const compilerMessages = observedEntry.compileExcerptPath
      ? await extractOpenplanetCompilerMessages(observedEntry.compileExcerptPath)
      : emptyCompilerMessages();
    const warningMessages = compilerMessages.warnings;
    if (warningMessages.length > 0) {
      casesWithWarnings += 1;
    }
    incrementMessageCounts(warningMessageCounts, warningMessages);
    incrementMessageCounts(errorMessageCounts, compilerMessages.errors);
    incrementMessageCounts(infoMessageCounts, compilerMessages.infos);
    incrementMessageCounts(metaMessageCounts, compilerMessages.meta);
    if (observed === "compile_error") {
      incrementMessageCounts(compileErrorWarningCounts, warningMessages);
      incrementMessageCounts(compileErrorErrorCounts, compilerMessages.errors);
      incrementMessageCounts(compileErrorInfoCounts, compilerMessages.infos);
      incrementMessageCounts(compileErrorMetaCounts, compilerMessages.meta);
    }
    included.push({
      ...rawCase,
      expect: observed,
      expect_warning: warningMessages.length > 0,
      expect_warning_contains: warningMessages,
      strict_diagnostic_text: strictDiagnosticText === true,
      expect_diagnostic_text: {
        ERR: compilerMessages.errors,
        WARN: compilerMessages.warnings,
        INFO: compilerMessages.infos
      }
    });
  }

  await writeJsonl(oracleFixturePath, included);
  const compendium = {
    ts_utc: nowIso(),
    rawFixturePath,
    oracleRunDir,
    runJsonlPath,
    oracleFixturePath,
    totalRawCases: rawCases.length,
    includedCases: included.length,
    droppedCases: dropped.length,
    observedCases: observedById.size,
    uniqueMessages: {
      ERR: errorMessageCounts.size,
      WARN: warningMessageCounts.size,
      INFO: infoMessageCounts.size,
      META: metaMessageCounts.size
    },
    allMessages: {
      ERR: messageCounts(errorMessageCounts),
      WARN: messageCounts(warningMessageCounts),
      INFO: messageCounts(infoMessageCounts),
      META: messageCounts(metaMessageCounts)
    },
    compileErrorMessages: {
      ERR: messageCounts(compileErrorErrorCounts),
      WARN: messageCounts(compileErrorWarningCounts),
      INFO: messageCounts(compileErrorInfoCounts),
      META: messageCounts(compileErrorMetaCounts)
    }
  };
  if (messageCompendiumPath) {
    await fs.writeFile(messageCompendiumPath, `${JSON.stringify(compendium, null, 2)}\n`, "utf8");
  }
  const summary = {
    ts_utc: nowIso(),
    rawFixturePath,
    oracleRunDir,
    runJsonlPath,
    oracleFixturePath,
    messageCompendiumPath,
    totalRaw: rawCases.length,
    included: included.length,
    casesWithWarnings,
    topWarningMessages: topMessageCounts(warningMessageCounts),
    topErrorMessages: topMessageCounts(errorMessageCounts),
    topInfoMessages: topMessageCounts(infoMessageCounts),
    topMetaMessages: topMessageCounts(metaMessageCounts),
    dropped: dropped.length,
    droppedDetails: dropped
  };
  await fs.writeFile(materializationSummaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return summary;
}

function emptyCompilerMessages() {
  return {
    warnings: [],
    errors: [],
    infos: [],
    meta: []
  };
}

async function extractOpenplanetCompilerMessages(compileExcerptPath) {
  let content = "";
  try {
    content = await fs.readFile(compileExcerptPath, "utf8");
  } catch {
    return emptyCompilerMessages();
  }

  const warnings = [];
  const errors = [];
  const infos = [];
  const meta = [];
  for (const rawLine of content.split(/\r?\n/)) {
    const parsed = parseOpenplanetCompilerMessage(rawLine);
    if (!parsed) {
      continue;
    }
    if (parsed.severity === "WARN") {
      pushUnique(warnings, parsed.message);
      continue;
    }
    if (parsed.severity === "ERR") {
      pushUnique(errors, parsed.message);
      continue;
    }
    if (parsed.severity === "INFO") {
      pushUnique(infos, parsed.message);
      continue;
    }
    pushUnique(meta, parsed.message);
  }
  return {
    warnings,
    errors,
    infos,
    meta
  };
}

function parseOpenplanetCompilerMessage(rawLine) {
  const line = sanitizeOpenplanetLogLine(rawLine);
  if (!line) {
    return null;
  }

  const markerMatch = line.match(/\b(INFO|WARN|WARNING|ERR|ERROR)\s*:\s*(.+)$/i);
  if (markerMatch) {
    const severityToken = markerMatch[1];
    const rawMessage = markerMatch[2]?.trim() ?? "";
    const severity = normalizeCompilerSeverityToken(severityToken);
    if (!rawMessage || !severity) {
      return null;
    }
    if (severity === "WARN") {
      const message = normalizeOpenplanetWarningMessage(rawMessage);
      return message ? { severity, message } : null;
    }
    if (severity === "ERR") {
      const message = normalizeOpenplanetErrorMessage(rawMessage);
      return message ? { severity, message } : null;
    }
    if (severity === "INFO") {
      const message = normalizeOpenplanetInfoMessage(rawMessage);
      return message ? { severity, message } : null;
    }
  }

  const knownErrorPattern = line.match(
    /(Script compilation failed!|Couldn'?t find required plugin dependency.+|Couldn'?t find exported script.+|Unable to load plugin.+)$/i
  );
  if (knownErrorPattern) {
    const message = normalizeOpenplanetErrorMessage(knownErrorPattern[1]);
    if (!message) {
      return null;
    }
    return {
      severity: "ERR",
      message
    };
  }

  return null;
}

function normalizeCompilerSeverityToken(token) {
  const normalized = String(token ?? "")
    .trim()
    .toUpperCase();
  if (normalized === "WARN" || normalized === "WARNING") {
    return "WARN";
  }
  if (normalized === "ERR" || normalized === "ERROR") {
    return "ERR";
  }
  if (normalized === "INFO") {
    return "INFO";
  }
  return null;
}

function sanitizeOpenplanetLogLine(line) {
  if (typeof line !== "string") {
    return "";
  }
  return line
    .replace(/\$[A-Za-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeOpenplanetWarningMessage(lineOrMessage) {
  const markerIndex = lineOrMessage.indexOf("WARN :");
  const rawMessage =
    markerIndex >= 0 ? lineOrMessage.slice(markerIndex + "WARN :".length) : lineOrMessage;
  const message = normalizeWhitespace(rawMessage);
  if (!message) {
    return undefined;
  }
  if (/^Implicit conversion of value is not exact\b/i.test(message)) {
    return "Implicit conversion of value is not exact";
  }
  if (/^Sanity check: Use 'const string &in\b/i.test(message)) {
    return "Sanity check: Use 'const string &in";
  }
  return message;
}

function normalizeOpenplanetInfoMessage(lineOrMessage) {
  const markerIndex = lineOrMessage.indexOf("INFO :");
  const rawMessage =
    markerIndex >= 0 ? lineOrMessage.slice(markerIndex + "INFO :".length) : lineOrMessage;
  const message = normalizeWhitespace(rawMessage);
  if (!message) {
    return undefined;
  }
  return message;
}

function normalizeOpenplanetErrorMessage(lineOrMessage) {
  const line = normalizeWhitespace(lineOrMessage);
  const markers = ["ERROR :", "ERR  :", "ERR :", "error :"];
  for (const marker of markers) {
    const markerIndex = line.indexOf(marker);
    if (markerIndex < 0) {
      continue;
    }
    const message = line.slice(markerIndex + marker.length).trim();
    if (message) {
      return message;
    }
  }
  return line || undefined;
}

function normalizeWhitespace(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/\s+/g, " ").trim();
}

function pushUnique(values, value) {
  if (!value) {
    return;
  }
  if (!values.includes(value)) {
    values.push(value);
  }
}

function incrementMessageCounts(map, messages) {
  for (const message of messages) {
    map.set(message, (map.get(message) ?? 0) + 1);
  }
}

function messageCounts(map, limit = null) {
  const rows = [...map.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([message, count]) => ({
      message,
      count
    }));
  if (typeof limit === "number" && limit >= 0) {
    return rows.slice(0, limit);
  }
  return rows;
}

function topMessageCounts(map) {
  return messageCounts(map, 20);
}

async function main() {
  const thisFilePath = fileURLToPath(import.meta.url);
  const scriptsDir = path.dirname(thisFilePath);
  const repoRoot = path.resolve(scriptsDir, "..", "..");
  const defaults = {
    suite: process.env.OPAS_BOOTSTRAP_SUITE || process.env.OPAS_PARITY_SUITE || "ExampleSuite",
    suitesRoot: path.resolve(process.env.OPAS_SUITES_ROOT || "D:\\OpenplanetDev\\suites"),
    opdevPyPath: path.resolve(process.env.OPAS_OPDEV_PY || "D:\\OpenplanetDev\\tools\\opdev\\opdev.py"),
    pythonExe: process.env.OPAS_PYTHON || "python",
    transport: process.env.OPAS_PARITY_TRANSPORT || "auto",
    timeoutSec: toIntOrDefault(process.env.OPAS_PARITY_TIMEOUT_SEC, 20),
    waitFrames: toIntOrDefault(process.env.OPAS_PARITY_WAIT_FRAMES, 20),
    companionHost: process.env.OPAS_PARITY_COMPANION_HOST || "127.0.0.1",
    companionPort: toIntOrDefault(process.env.OPAS_PARITY_COMPANION_PORT, 32000),
    maxCases: toIntOrDefault(process.env.OPAS_BOOTSTRAP_MAX_CASES, 2400),
    identifierOnly:
      String(process.env.OPAS_BOOTSTRAP_IDENTIFIER_ONLY ?? "").trim().toLowerCase() ===
      "true",
    reportRoot: path.resolve(
      process.env.OPAS_BOOTSTRAP_REPORT_ROOT ||
      path.join(repoRoot, "out", "test", "oracle-bootstrap")
    ),
    strict: false,
    strictDiagnosticText: parseBoolOrDefault(
      process.env.OPAS_BOOTSTRAP_STRICT_DIAGNOSTIC_TEXT,
      false
    ),
    snapshotKey:
      process.env.OPAS_BOOTSTRAP_SNAPSHOT_KEY ||
      process.env.OPAS_PARITY_SNAPSHOT_KEY ||
      ""
  };
  const opts = parseArgs(process.argv.slice(2), defaults);

  const runId = `${timestampForPath()}-${opts.suite}`;
  const reportDir = path.join(opts.reportRoot, runId);
  await fs.mkdir(reportDir, { recursive: true });

  const generatedDir = path.join(opts.suitesRoot, opts.suite, "conformance", "generated");
  const rawFixturePath = path.join(generatedDir, "primitive-matrix.raw.jsonl");
  const oracleFixturePath = path.join(generatedDir, "primitive-matrix.oracle.jsonl");
  const generationSummaryPath = path.join(generatedDir, "primitive-matrix.generation.json");
  const materializationSummaryPath = path.join(generatedDir, "primitive-matrix.materialization.json");
  const messageCompendiumPath = path.join(generatedDir, "primitive-matrix.message-compendium.json");

  const summary = {
    startedAt: nowIso(),
    finishedAt: null,
    status: "failed",
    suite: opts.suite,
    reportDir,
    rawFixturePath,
    oracleFixturePath,
    generationSummaryPath,
    materializationSummaryPath,
    messageCompendiumPath,
    discoveryOracleRunDir: null,
    paritySummaryPath: null,
    config: {
      ...opts
    },
    commands: [],
    error: null
  };

  try {
    const generatedCases = buildGeneratedCases(opts.maxCases, {
      identifierOnly: opts.identifierOnly
    });
    const familyCounts = summarizeGeneratedFamilies(generatedCases);
    await writeJsonl(rawFixturePath, generatedCases);
    const generationSummary = {
      ts_utc: nowIso(),
      rawFixturePath,
      totalCases: generatedCases.length,
      maxCases: opts.maxCases,
      identifierOnly: opts.identifierOnly,
      familyCounts
    };
    await fs.mkdir(path.dirname(generationSummaryPath), { recursive: true });
    await fs.writeFile(generationSummaryPath, `${JSON.stringify(generationSummary, null, 2)}\n`, "utf8");
    console.log(`[oracle-bootstrap] Generated raw fixture: ${rawFixturePath}`);
    console.log(`[oracle-bootstrap] Cases generated: ${generatedCases.length}`);
    const identifierCaseCount = Object.entries(familyCounts)
      .filter(([key]) => key.startsWith("identifier."))
      .reduce((sum, [, count]) => sum + count, 0);
    console.log(
      `[oracle-bootstrap] Identifier cases: ${String(identifierCaseCount)}`
    );

    const discoveryArgs = [
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
    const discovery = await runCommand({
      label: "01-discovery-opdev-conformance",
      command: opts.pythonExe,
      args: discoveryArgs,
      cwd: repoRoot,
      env: process.env
    });
    discovery.logPath = await writeCommandLog(reportDir, discovery);
    summary.commands.push(sanitizeCommandResult(discovery));

    let discoveryRunDir = parseOracleRunDir(discovery.stdout);
    if (!discoveryRunDir) {
      discoveryRunDir = await findLatestOracleRunDir(opts.suitesRoot, opts.suite);
    }
    if (!discoveryRunDir) {
      throw new Error("Could not determine discovery oracle run directory.");
    }
    summary.discoveryOracleRunDir = discoveryRunDir;
    console.log(`[oracle-bootstrap] Discovery oracle run: ${discoveryRunDir}`);

    const materialization = await materializeOracleFixture({
      rawFixturePath,
      oracleRunDir: discoveryRunDir,
      oracleFixturePath,
      materializationSummaryPath,
      messageCompendiumPath,
      strictDiagnosticText: opts.strictDiagnosticText
    });
    console.log(`[oracle-bootstrap] Oracle fixture materialized: ${oracleFixturePath}`);
    if (materialization.messageCompendiumPath) {
      console.log(
        `[oracle-bootstrap] Compiler message compendium: ${materialization.messageCompendiumPath}`
      );
    }
    console.log(
      `[oracle-bootstrap] Included cases: ${materialization.included}; dropped: ${materialization.dropped}`
    );
    if (materialization.included <= 0) {
      throw new Error("No cases left after materialization.");
    }

    const parityCommand = buildNpmRunCommand("test:oracle-parity");
    const parityArgs = [
      ...parityCommand.args,
      "--",
      "--suite",
      opts.suite,
      "--fixtures",
      oracleFixturePath,
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
    if (opts.strictDiagnosticText) {
      parityArgs.push("--strict-diagnostic-text");
    } else {
      parityArgs.push("--no-strict-diagnostic-text");
    }
    if (opts.snapshotKey) {
      parityArgs.push("--snapshot-key", opts.snapshotKey);
    }
    const parity = await runCommand({
      label: "02-oracle-parity",
      command: parityCommand.command,
      args: parityArgs,
      cwd: repoRoot,
      env: process.env,
      shell: parityCommand.shell
    });
    parity.logPath = await writeCommandLog(reportDir, parity);
    summary.commands.push(sanitizeCommandResult(parity));
    if (parity.exitCode !== 0 && opts.strict) {
      throw new Error("Oracle parity run failed on materialized fixture.");
    }

    const paritySummaryMatch = parity.stdout.match(/^\[oracle-parity\]\s+Summary:\s*(.+)$/m);
    if (paritySummaryMatch) {
      summary.paritySummaryPath = path.resolve(paritySummaryMatch[1].trim());
    }

    if (parity.exitCode !== 0 && !opts.strict) {
      summary.status = "completed_with_mismatches";
      summary.error =
        "Oracle parity reported mismatches (non-strict mode kept bootstrap successful).";
    } else {
      summary.status = "passed";
    }
  } catch (error) {
    summary.error = error instanceof Error ? error.message : String(error);
    process.exitCode = 1;
  } finally {
    summary.finishedAt = nowIso();
    const summaryPath = path.join(reportDir, "summary.json");
    await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    console.log(`[oracle-bootstrap] Summary: ${summaryPath}`);
    if (summary.status === "completed_with_mismatches") {
      console.log("[oracle-bootstrap] COMPLETED_WITH_MISMATCHES");
    } else if (summary.status !== "passed") {
      console.error(`[oracle-bootstrap] FAILED: ${summary.error ?? "Unknown error"}`);
    } else {
      console.log("[oracle-bootstrap] PASS");
    }
  }
}

void main();
