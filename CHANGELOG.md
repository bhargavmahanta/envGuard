# Changelog

## [1.5.0] - Unreleased

### Added

- Added structured Kubernetes and Helm detection with seven stable rule IDs.
- Added `envguard explain <rule-id>`.
- Added labeled release benchmarks and pinned public-repository benchmark runs.

### Security

- Kubernetes and Helm secret previews remain masked in every output format.

## [1.4.0] - Unreleased

### Added

- Added `envguard init --preset` for official project presets.
- Added multi-architecture GHCR publishing with SBOM, provenance, and vulnerability scanning.
- Added current CI recipes and public preset examples.

## [1.4.0] - Unreleased

### Added

- Added `envguard init --preset` for official project presets.
- Added multi-architecture GHCR publishing with SBOM, provenance, and vulnerability scanning.
- Added current CI recipes and public preset examples.

## [1.3.0] - Unreleased

### Added

- Added npm workspaces, independent Changesets releases, and four official declarative presets.
- Added safe `extends` resolution for local and npm presets.
- Exported `defineConfig`, `defineRule`, `definePreset`, and typed preset errors.

### Security

- Rejects executable and remote presets, cycles, package path escapes, excessive nesting, and duplicate rule IDs.

## [1.2.1] - Unreleased

### Changed

- Updated GitHub Actions to Node 24-based releases and added Node 20, 22, and 24 compatibility checks.
- Added a non-failing Node 20 end-of-life warning to `doctor`.
- Added dependency update automation and npm provenance verification guidance.

All notable changes to EnvGuard are documented in this file.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) style sections and uses semantic versioning.

## 1.2.0 - 2026-07-17

### Added

- Added supported ESM, CommonJS, and TypeScript SDK entry points.
- Added reusable scanners, structured errors, recoverable scan diagnostics, and pure reporter exports.
- Added deterministic `scan --agent` output and stable CLI exit codes.
- Added packed-package consumer tests for imports, declarations, reporters, and command shims.

### Security

- Added scan-root containment, symbolic-link escape prevention, and safer handling for malformed, missing, oversized, and unsupported files.
- Agent mode forces masking and non-interactive JSON output.

## 1.1.0

### Added

- Added `scan --staged`, `scan --changed`, `--format github`, `doctor --json`, and `baseline audit`.
- Added `.env` hygiene, `.env.example` / `.env.schema` drift checks, GitLab CI, CircleCI, and expanded Docker/Compose rules.
- Added config allowlists, declarative custom rules, rule packs, and scan limits.
- Added first-party pre-commit metadata, Docker image recipe, and comparison docs.

### Changed

- Repositioned EnvGuard as security linting for env, Docker, CI, and runtime configuration.
- Documented pairing EnvGuard with Gitleaks for deep secret/history scanning.

## 1.0.0

### Added

- Added stable CLI contract docs for `scan`, `init`, `rules`, and `doctor`.
- Added stable JSON report schema version `1.0.0`.
- Added SARIF output for GitHub code scanning.
- Added baseline suppression with `.envguard-baseline.json`.
- Added inline suppression comments with `envguard-disable-next-line` and `envguard-disable-line`.
- Added reusable GitHub Action wrapper.
- Added release workflow, issue templates, PR template, and release docs.
- Added compatibility, reporting, examples, public API, and V1 readiness docs.

### Changed

- Hardened npm package metadata and release dry-run workflow.
- Expanded CI compatibility checks across Ubuntu, Windows, and macOS.

### Security

- Continued to mask detected sensitive values in all report formats by default.

## 0.1.0

### Added

- Initial EnvGuard CLI implementation.
- Added env, config, Docker, Compose, and GitHub Actions scanning.
- Added secret, weak value, runtime, CORS, Docker, CI, and entropy rules.
- Added masked terminal, JSON, and Markdown reports.
- Added config, ignore support, sample vulnerable project, tests, and documentation.
