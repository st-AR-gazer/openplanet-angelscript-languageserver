# openplanet-angelscript-languageserver

Language Server extension for Openplanet AngelScript (`openplanet-angelscript`).

This repo is intentionally separate from `openplanet-angelscript-syntax` so baseline highlighting remains available even if the language server is disabled or crashes.

## What It Provides

This extension runs an LSP server with incremental text synchronization and provides:

- Completion:
  - language keywords
  - root/child namespace suggestions (`Namespace::`)
  - Openplanet symbols from configured symbol sources
  - dot-member completion (`receiver.member`) with type-aware filtering
  - member completion rows include property type / method return type
- Hover:
  - member hover on dot-access expressions with resolved signature
  - member hover links game types to `next.openplanet.dev` (member type + receiver type line)
  - type hover for Openplanet/primitive types with documentation links
  - namespace docs link is shown only when that namespace exists in loaded symbol sources
  - function hover for workspace/core callables
  - workspace function hover includes leading `//` comments with source line numbers
- Go To Definition:
  - include-path definition for `#include "..."`
  - local variable definition (scope-aware)
  - workspace function definition (open + indexed unopened files, include-scope aware)
- Go To Declaration:
  - include-path declaration for `#include "..."`
  - local/workspace declaration resolution (same symbol model as definition)
- Go To Implementation:
  - callable implementation lookup across include-scoped workspace analyses
- Go To Type Definition:
  - resolves type declarations for workspace classes/interfaces/enums
  - supports local variable, callable return type, and member result type lookups
- Find References:
  - block-scope aware local variable references
  - workspace function references (open + indexed unopened files, include-scope aware)
- Document Highlights:
  - read/write highlights for local/workspace symbols in the current document
- Rename Symbol:
  - validates new identifier name
  - block-scope aware local variable rename (supports nested shadowing)
  - workspace function rename (open + indexed unopened files, include-scope aware)
- Signature Help:
  - workspace function signatures
  - Openplanet core signatures
  - qualified-call aware lookup for namespaced calls (`UI::Text(`)
  - active overload selection by argument index
- Document Symbols:
  - function outline entries, including constructors and destructors
  - workspace type declarations (class/interface/enum) are parsed for navigation
- Workspace Symbols:
  - query functions and type declarations across open + indexed files
- Inlay Hints:
  - parameter name hints for callable arguments using workspace/core signatures
- Semantic Tokens:
  - semantic token stream for functions/methods/properties/types/namespaces/locals/parameters
  - supplements TextMate grammar colorization with semantic consistency
  - full + delta token responses for lower semantic-token update payloads
  - `semanticTokens.mode = minimal` (default) keeps syntax-highlighter colors dominant and only adds high-context local/parameter semantic coloring
- Type Hierarchy:
  - prepare/supertypes/subtypes for workspace and known indexed types
- Code Lens:
  - per-function reference count lenses via `editor.action.showReferences`
- Document Colors:
  - color extraction for `vec3(...)` / `vec4(...)` constructors
  - color presentation replacement formatting for those expressions
- Code Actions:
  - quick fixes for symbol/member case mismatch and unknown symbol/member diagnostics
  - import quick fixes for unresolved import callable names and mismatched import signatures
- Parser Diagnostics:
  - recovering grammar parser emits structural diagnostics for unparsable statements/declarations
  - valid `if/else` and `foreach (...)` control-flow forms are recognized in parser diagnostics
  - function headers now carry parsed return/parameter type text
  - local declaration parsing supports multi-declarator statements (`int a, b;`)
  - declaration/default-argument comma parsing handles brace-initializer lists (`{1, 2, 3}`)
  - type-checking uses an expression AST pipeline (operator precedence, calls, member access, ternary, `cast<T>(...)`)
  - callable overload resolution uses conversion-cost ranking + template parameter binding

## Diagnostics

All diagnostics use source `openplanet-angelscript-ls`.
Compile-blocking diagnostics are emitted as `Error` severity (red squiggles).
Compiler-parity advisory diagnostics are emitted as `Warning` severity.

- `missing-include`
  - unresolved `#include "..."` path
- `import-source-not-found`
  - `import ... from "Module"` did not match any plugin folder or `.op` package in configured plugin roots
- `import-source-folder-only`
  - import source matched folder target(s) but no `.op` package match
- `implicit-conversion-not-exact`
  - implicit floating-point to integer conversion may lose precision
- `string-parameter-pass-by-value`
  - sanity check warning for `string` parameters not passed by reference (`const string &in`)
- `import-function-not-found`
  - import source matched, but imported function name was not found in matched target sources
- `import-function-signature-mismatch`
  - import function name exists in matched target sources, but return/parameter signature is incompatible
- `unknown-symbol`
  - unresolved callable identifier
- `unknown-identifier`
  - unresolved non-call identifier usage
- `unknown-type`
  - unresolved type names in declarations/signatures
- `case-mismatch-symbol`
  - callable identifier exists with different casing
- `arity-mismatch`
  - callable exists but argument count is outside valid range
- `call-argument-type-mismatch`
  - callable exists, but no overload can accept the inferred argument types
- `assignment-type-mismatch`
  - assignment or initializer value type is incompatible with target variable type
- `operator-type-mismatch`
  - compound assignment operator (`+=`, `-=`, etc.) has incompatible operand types
- `return-type-mismatch`
  - `return` expression type is incompatible with function return type (or value returned from `void`)
- `unknown-member`
  - unresolved member on a resolved receiver type
- `case-mismatch-member`
  - member exists with different casing on a resolved receiver type
- `invalid-member-call`
  - attempted call on a property/non-callable member
- `binding-duplicate-declaration`
  - duplicate local or parameter declaration in the same lexical scope
- `binding-use-before-declaration`
  - local identifier usage appears before its declaration in the same reachable scope
- `syntax-unclosed-delimiter`
  - unmatched opening delimiter `(`, `[`, or `{`
- `syntax-unexpected-closing-delimiter`
  - unexpected closing delimiter `)`, `]`, or `}`
- `syntax-unterminated-string`
  - unterminated single or double quoted literal
- `syntax-unterminated-block-comment`
  - unterminated `/* ...` comment
- `syntax-unparsable-statement`
  - parser could not recover a valid statement/declaration structure (e.g. missing statement terminator)

Quick fixes are provided for diagnostics with replacement candidates and import signature replacement edits.

## Type Resolution Used By Members/Hover/Diagnostics

Member and semantic diagnostics use expression-AST inference with overload/type compatibility checks:

- Openplanet/API function return types from symbol index
- local/workspace function return types
- local variable types visible at cursor position
- cast expressions (`cast<Type>(...)`)
- operator precedence/type rules for unary/binary/conditional expressions
- overload selection across workspace/core symbols with numeric/object conversion scoring
- template/generic parameter binding for callable signatures (including templated return type substitution)
- inherited members (parent type member resolution)

## Include Resolution Behavior

`#include "path"` resolution checks candidates in this order:

1. current document directory
2. each workspace folder root
3. each configured include root (`openplanetLanguageServer.includePaths`):
   - absolute include root directly
   - relative include root resolved from each workspace folder

Absolute include paths are supported directly.

## Import Resolution Behavior

`import RetType Func(args) from "Module";` validation checks plugin roots for:

1. folder targets named `Module`
2. package targets named `Module.op`

Rules:

- no matches: `import-source-not-found` (Error)
- folder matches only: `import-source-folder-only` (Warning)
- `.op` match exists (with or without folder): no source-kind warning
- matched sources are scanned for callable declarations; if name is missing, `import-function-not-found` (Error)
- when name exists but signature differs, `import-function-signature-mismatch` (Error)
- import diagnostics include quick fixes:
  - rename import callable to closest exported name
  - replace import declaration with closest exported signature

Plugin roots:

- `openplanetLanguageServer.imports.pluginRoots` (absolute or workspace-relative)
- if empty, auto-fallback roots are used:
  - `<baseUserFolder>/OpenplanetNext/Plugins`
  - `<workspaceRoot>/plugins`

## Symbol Sources and Game Profiles

Symbols can be loaded from:

- `OpenplanetCore.json` (core functions/properties/enums/classes)
- game JSON (`OpenplanetNext.json`, `OpenplanetTurbo.json`, `Openplanet4.json`) for namespaces/types
- `Openplanet.h` for namespace imports and header type names

Supported game profiles:

- Trackmania 2020 (`OpenplanetNext`) enabled by default
- Turbo (`OpenplanetTurbo`) disabled by default
- Openplanet4 (`Openplanet4`) disabled by default

Path behavior:

- default base user folder is current OS home directory
- override via `openplanetLanguageServer.symbols.baseUserFolderPath`
- each profile can override core/game/header paths explicitly

## Workspace Indexing

- `.as` files under workspace roots are indexed, including unopened files
- optional `info.toml` dependency indexing adds cross-plugin `.as` symbol surface from plugin roots
- open documents override indexed on-disk analysis while editing
- file watcher updates workspace index on create/change/delete events
- symbol/navigation requests run against include-scoped analysis closures

## Command

- `Openplanet Language Server: Restart` (`openplanetLanguageServer.restartServer`)

## Settings

Top-level:

- `openplanetLanguageServer.enable`
- `openplanetLanguageServer.validateIncludes`
- `openplanetLanguageServer.maxIncludeDiagnostics`
- `openplanetLanguageServer.includePaths`
- `openplanetLanguageServer.imports.enable`
- `openplanetLanguageServer.imports.pluginRoots`
- `openplanetLanguageServer.imports.maxDiagnostics`

Diagnostics:

- `openplanetLanguageServer.diagnostics.enableUnknownSymbols`
- `openplanetLanguageServer.diagnostics.enableCaseMismatch`
- `openplanetLanguageServer.diagnostics.enableSemanticBinding`
- `openplanetLanguageServer.diagnostics.enableTypeChecking`
- `openplanetLanguageServer.diagnostics.maxSymbolDiagnostics`

Completion:

- `openplanetLanguageServer.completion.enable`
- `openplanetLanguageServer.completion.namespaces`
- `openplanetLanguageServer.completion.maxItems`

Semantic Tokens:

- `openplanetLanguageServer.semanticTokens.enable`
- `openplanetLanguageServer.semanticTokens.mode`

Parser:

- `openplanetLanguageServer.parser.enableUnparsableStatementDiagnostics`
- `openplanetLanguageServer.parser.maxDiagnostics`

Dependency Indexing:

- `openplanetLanguageServer.dependencies.enableInfoTomlDependencies`
- `openplanetLanguageServer.dependencies.includeOptionalDependencies`
- `openplanetLanguageServer.dependencies.pluginRoots`
- `openplanetLanguageServer.dependencies.maxDepth`
- `openplanetLanguageServer.dependencies.maxFiles`

Symbol loading toggles:

- `openplanetLanguageServer.symbols.enableCoreJson`
- `openplanetLanguageServer.symbols.enableGameJson`
- `openplanetLanguageServer.symbols.enableHeader`
- `openplanetLanguageServer.symbols.baseUserFolderPath`

Trackmania 2020 profile:

- `openplanetLanguageServer.symbols.trackmania2020.enabled`
- `openplanetLanguageServer.symbols.trackmania2020.openplanetCoreJsonPath`
- `openplanetLanguageServer.symbols.trackmania2020.gameJsonPath`
- `openplanetLanguageServer.symbols.trackmania2020.openplanetHeaderPath`

Turbo profile:

- `openplanetLanguageServer.symbols.turbo.enabled`
- `openplanetLanguageServer.symbols.turbo.openplanetCoreJsonPath`
- `openplanetLanguageServer.symbols.turbo.gameJsonPath`
- `openplanetLanguageServer.symbols.turbo.openplanetHeaderPath`

Openplanet4 profile:

- `openplanetLanguageServer.symbols.openplanet4.enabled`
- `openplanetLanguageServer.symbols.openplanet4.openplanetCoreJsonPath`
- `openplanetLanguageServer.symbols.openplanet4.gameJsonPath`
- `openplanetLanguageServer.symbols.openplanet4.openplanetHeaderPath`

## Dev Setup

1. Clone both repos as siblings:
   - `openplanet-angelscript-languageserver`
   - `openplanet-angelscript-syntax`
2. In this repo:

```powershell
npm install
npm run compile
npm test
```

3. Press `F5` with launch config `Run Syntax + Language Server`.

That debug config loads both extension development paths:

- this language server extension
- `../openplanet-angelscript-syntax`

`test-files/LanguageServerShowcase.as` is a manual validation file that exercises diagnostics, completion, hover, rename, signature help, include resolution, and navigation.

### Run and Debug Interactive Tests (Ctrl+Shift+D)

Use VS Code `Run and Debug` for interactive testing in an Extension Development Host:

1. Open this repo in VS Code.
2. Press `Ctrl+Shift+D`.
3. Run `Run Interactive Tests (Showcase)`.
4. In the Extension Development Host window, use `test-files/LanguageServerShowcase.as` and interact with:
   - hover, completion, go-to-definition, find-references, rename, signature help
   - diagnostics + quick fixes
   - include resolution (`LocalInclude.as` and missing include example)

If you want to debug server internals with breakpoints in `src/server.ts`, run:

1. `Run Interactive Tests + Attach Server`
2. Set breakpoints in server code and exercise features in the showcase file.

### Interactive Test Shell

Run:

```powershell
npm run test:interactive
```

This opens a CLI test shell over the fixture workspace (`test-files/*.as`) so you can manually probe language-server behavior without launching VS Code.

Useful commands:

- `help`
- `fixtures`
- `use LanguageServerShowcase.as`
- `cursor 14 9`
- `diagnostics`
- `completion 25`
- `hover`
- `signature`
- `definition`
- `references true`
- `rename localCounter`
- `symbols`
- `type app.CurrentPlayground.Analyzer.Id`
- `quit`

### Integration Regression Suite

Run:

```powershell
npm run test:integration
```

This launches the compiled language server process and validates end-to-end JSON-RPC behavior (initialize/open/publishDiagnostics/hover/references).

### Conformance Regression Suite

Run:

```powershell
npm run test:conformance
```

This executes fixture-driven compile-parity checks from `test-files/conformance/cases.jsonl`.
Each case is materialized as a temporary plugin-like folder (`info.toml` + `src/main.as` + extra files),
then language-server syntax/semantic diagnostics are classified as:

- `compile_success`
- `compile_error`

Optional warning parity fields in fixtures:

- `expect_warning` (`true|false`) to assert whether any warning diagnostics should exist
- `expect_warning_contains` (`string[]`) substrings that must appear in warning diagnostics
- `reject_warning_contains` (`string[]`) substrings that must not appear in warning diagnostics

Strict diagnostic-text parity fields in fixtures:

- `strict_diagnostic_text` (`true|false`) to opt-in per-case strict message matching
- `expect_diagnostic_text.ERR` (`string[]`) exact error messages that must appear
- `expect_diagnostic_text.WARN` (`string[]`) exact warning messages that must appear
- `expect_diagnostic_text.INFO` (`string[]`) exact info messages that must appear
- `reject_diagnostic_text.{ERR|WARN|INFO}` (`string[]`) exact messages that must not appear

CLI options:

```powershell
node out/test/runConformanceTests.js --help
```

Key options:

- `--fixtures <path>`: use a different fixture file (`.jsonl` or `.json`)
- `--case <glob>`: run a filtered subset of case IDs (repeatable)
- `--oracle-run <path>`: load expected outcomes from OpDev conformance `run.jsonl` (or run dir containing `run.jsonl`)
- `--report <path>`: write JSON summary report
- `--verbose`: include per-diagnostic lines for failed cases
- `--strict-diagnostic-text`: enforce strict `ERR`/`WARN`/`INFO` text matching when fixture includes `expect_diagnostic_text`

Env overrides:

- `OPAS_CONFORMANCE_FIXTURES`
- `OPAS_CONFORMANCE_ORACLE_RUN`
- `OPAS_CONFORMANCE_REPORT`
- `OPAS_CONFORMANCE_STRICT_DIAGNOSTIC_TEXT`

Compiler-message snapshot sync (from AngelScript `as_texts.h`):

```powershell
npm run test:conformance:sync-texts
```

This refreshes `test-files/conformance/angelscript-texts.json` from:
- `https://raw.githubusercontent.com/anjo76/angelscript/master/sdk/angelscript/source/as_texts.h`

Use this snapshot to keep normalization/mapping logic aligned when AngelScript updates message templates.

### One-Action Oracle Parity (Openplanet -> LS)

Run:

```powershell
npm run test:oracle-parity
```

This orchestrates the full parity pipeline:

1. `opdev suite companion-status`
2. `opdev suite conformance` (real Openplanet compile behavior)
3. language-server compile
4. language-server conformance run against oracle `run.jsonl`

Outputs are timestamped in:

- `out/test/oracle-parity/<timestamp>-<suite>/summary.json`
- `out/test/oracle-parity/<timestamp>-<suite>/ls-conformance-report.json`
- per-step logs (`01-companion-status.log`, `02-opdev-conformance.log`, ...)

Default suite/paths target `ExampleSuite` under `D:\OpenplanetDev`.
Override with CLI flags:

- `--suite <name>`
- `--fixtures <path>`
- `--case <glob>` (repeatable)
- `--timeout-sec <n>`
- `--wait-frames <n>`
- `--transport <auto|socket|file>`
- `--report-root <path>`
- `--snapshot-key <name>` (group reports by target/version)
- `--strict-diagnostic-text` (strict `ERR`/`WARN`/`INFO` text parity)

Or environment variables:

- `OPAS_PARITY_SUITE`
- `OPAS_PARITY_FIXTURES`
- `OPAS_SUITES_ROOT`
- `OPAS_OPDEV_PY`
- `OPAS_PYTHON`
- `OPAS_PARITY_TRANSPORT`
- `OPAS_PARITY_TIMEOUT_SEC`
- `OPAS_PARITY_WAIT_FRAMES`
- `OPAS_PARITY_COMPANION_HOST`
- `OPAS_PARITY_COMPANION_PORT`
- `OPAS_PARITY_REPORT_ROOT`
- `OPAS_PARITY_SNAPSHOT_KEY`
- `OPAS_PARITY_STRICT_DIAGNOSTIC_TEXT`

Strict single-run shortcut:

```powershell
npm run test:oracle-parity:strict
```

VS Code one-click equivalent:

- Run Task: `Oracle Parity (Openplanet)` (from `.vscode/tasks.json`)

### Multi-Version Oracle Parity Matrix

Run:

```powershell
npm run test:oracle-parity:matrix
```

This runs oracle parity sequentially for each entry in `.github/oracle-parity-matrix.json`.
Each entry gets a dedicated `snapshotKey` so results are stored as per-version snapshots under:

- `out/test/oracle-parity/<snapshotKey>/<timestamp>-<suite>/...`
- aggregate matrix report: `out/test/oracle-parity-matrix/<timestamp>-matrix/summary.json`

Current default matrix entries:

- `openplanet-next-current` (strict diagnostic-text parity)
- `openplanet-next-current-semantic` (semantic parity without strict text matching)
- `openplanet-next-smoke-compile-success` (focused compile-success smoke slice)
- `openplanet-next-smoke-compile-error` (focused compile-error smoke slice)
- `openplanet-next-full-corpus-strict` (1200-case generated corpus strict parity from `D:\OpenplanetDev\suites\ExampleSuite\conformance\generated\primitive-matrix.oracle.jsonl`)
- `openplanet-next-playersearch-smoke` (PlayerSearchSuite smoke corpus from `test-files/conformance/cross-suite-smoke.jsonl`, semantic parity)
- `openplanet-next-betterfolders-smoke` (BetterFoldersSuite filtered smoke subset from `test-files/conformance/cross-suite-smoke.jsonl`, semantic parity; excludes `smoke.compile_success.namespace_call` because it can drop the companion connection on this suite/host)

Matrix CLI options:

- `--matrix <path>`: override matrix file
- `--entry <glob>`: run a subset of matrix entries
- `--strict`: fail process if any entry fails (default)
- `--no-strict`: keep process success while still recording failures

### One-Action Oracle Bootstrap (Autogenerate Compiler Data)

Run:

```powershell
npm run test:oracle-bootstrap
```

This does a discovery + parity bootstrap automatically:

1. generate a large conformance corpus (`primitive-matrix.raw.jsonl`) with:
   - identifier-position matrix (locals, params, functions, class members, namespace symbols, enum labels)
   - default-arg quirks
   - handle/null/reference (`@`, `&in/out/inout`) cases
   - operator-overload edge cases (`opAssign`, `opImplConv`, `opIndex`, ambiguity probes)
   - import-surface oddities (folder vs `.op` mismatch patterns)
   - assignment/call/return/operator matrix
2. run Openplanet compile conformance on that corpus (discovery pass)
3. materialize oracle expectations (`primitive-matrix.oracle.jsonl`) and compiler message compendium from observed outcomes
4. run full oracle parity (`test:oracle-parity`) on the materialized fixture

Generated corpus files (suite-local):

- `D:\OpenplanetDev\suites\<Suite>\conformance\generated\primitive-matrix.raw.jsonl`
- `D:\OpenplanetDev\suites\<Suite>\conformance\generated\primitive-matrix.oracle.jsonl`
- `D:\OpenplanetDev\suites\<Suite>\conformance\generated\primitive-matrix.generation.json`
- `D:\OpenplanetDev\suites\<Suite>\conformance\generated\primitive-matrix.materialization.json`
- `D:\OpenplanetDev\suites\<Suite>\conformance\generated\primitive-matrix.message-compendium.json`
: includes full observed `ERR` / `WARN` / `INFO` compiler-message lists and compile-error-specific context message lists

Timestamped bootstrap reports:

- `out/test/oracle-bootstrap/<timestamp>-<suite>/summary.json`
- step logs in the same folder

Useful flags:

- `--suite <name>`
- `--max-cases <n>` (default: 2400)
- `--identifier-only` (generate only identifier-name edge-case corpus)
- `--timeout-sec <n>`
- `--wait-frames <n>`
- `--snapshot-key <name>`
- `--strict-diagnostic-text` (default: false)

VS Code one-click equivalents:

- workspace root: `Oracle Bootstrap (Openplanet LS)`
- LS repo: `Oracle Bootstrap (Generate Corpus + Parity)`

Identifier-only shortcut:

```powershell
npm run test:oracle-bootstrap:identifiers
```

### CI/Nightly Parity Gate

Workflow: `.github/workflows/oracle-parity-gate.yml`

- runs on `self-hosted` Windows runner with `openplanet` label
- triggers on `push`, `pull_request`, nightly schedule, and `workflow_dispatch`
- validates matrix coverage (`.github/oracle-parity-matrix.json`) with a minimum of 6 entries and required `openplanet-next-full-corpus-strict`
- executes `npm run test:oracle-parity:matrix -- --strict`
- uploads parity artifacts from `out/test/oracle-parity/**` and `out/test/oracle-parity-matrix/**`

For release gating, mark `Oracle Parity Gate / oracle-parity` as a required status check in branch protection.

### Release Hardening

Run:

```powershell
npm run release:verify
```

This executes:
- changelog/version gate
- unit/regression tests
- process-level integration tests
- VSIX packaging
- VSIX content smoke check

## Current Boundaries

This project is language-server only:

- lint rules belong in `openplanet-angelscript-linter`
- formatting belongs in `openplanet-angelscript-formatter`

Analysis now uses a recovering grammar pipeline (lexer + parser + AST) for:
- translation-unit declarations (namespace/type/function/callable)
- statement/block structure inside function bodies
- parser-driven structural diagnostics for unparsable statements

Core symbol/nav/refactor indexing remains optimized and lightweight, now backed by parser output rather than regex-only declaration matching.
