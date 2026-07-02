# Changelog

All notable changes to EnvGuard are documented in this file.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) style sections and uses semantic versioning.

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
