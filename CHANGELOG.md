# Changelog

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
