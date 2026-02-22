# Changelog

## [0.1.2]

- Added editor debug-adjacent UX:
  - inline values provider wiring (client/server request path)
  - file decorations based on current published diagnostics
- Expanded inlay hint configurability with per-category controls:
  - constants / complex expressions / reference parameters
  - single-parameter call behavior
  - `auto` type hints + ignored parameter/function name lists
- Added deterministic in-repo conformance corpora:
  - medium fixture corpus in `test-files/conformance/cases.jsonl`
  - cross-suite smoke corpus in `test-files/conformance/cross-suite-smoke.jsonl`
- Added and wired modular diagnostics layers:
  - parser (`diagnosticsParser.ts`)
  - import (`diagnosticsImport.ts`)
  - binder (`diagnosticsBinder.ts`)
  - type (`diagnosticsType.ts`)
  - with compiler-text parity annotation support
- Added oracle parity matrix/gate workflow assets and matrix entries for multi-suite coverage.
- Stabilized BetterFoldersSuite matrix runs by excluding `smoke.compile_success.namespace_call` from that suite's smoke entry due to reproducible companion socket drops on this host.

## [0.1.1]

- Completed grammar-pipeline callable declaration parsing for:
  - `funcdef ...;`
  - `import ... from "...";`
- Added callable parser recovery helpers to avoid declaration-scan races during error recovery.
- Improved nested generic parsing support for parser token passes that split by top-level comma/equals checks (`array<array<int>>` forms).
- Added parser regression coverage for:
  - callable declaration AST capture
  - import module-name offset capture
  - nested-template callable parameter splitting

## [0.1.0]

- Added deeper semantic diagnostics:
  - `call-argument-type-mismatch`
  - `assignment-type-mismatch`
  - `return-type-mismatch`
  - `operator-type-mismatch`
- Improved parser coverage for comma-splitting with brace-initializer expressions.
- Added process-level LSP integration regression test runner (`npm run test:integration`).
- Added release hardening scripts:
  - changelog/version check (`npm run release:check-changelog`)
  - VSIX packaging smoke test (`npm run release:smoke`)
