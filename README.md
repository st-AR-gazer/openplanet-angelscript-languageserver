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

- `missing-include`
  - unresolved `#include "..."` path
- `import-source-not-found`
  - `import ... from "Module"` did not match any plugin folder or `.op` package in configured plugin roots
- `import-source-folder-only`
  - import source matched folder target(s) but no `.op` package match
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
