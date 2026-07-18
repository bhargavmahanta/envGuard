# Roadmap

## v0.1.0

- CLI scanner
- Env, Docker, Compose, GitHub Actions, and config scanning
- Terminal, JSON, and Markdown reports
- Config and ignore support
- Sample vulnerable project
- Test suite

## v0.2.0

- More secret patterns
- Better YAML-aware Compose and workflow analysis
- Improved false-positive suppression
- Reusable GitHub Action wrapper

## v0.3.0

- SARIF output
- Baseline suppression file
- Custom rule packs
- GitLab CI support

## v1.0.0

- Stable rule engine API
- Public npm release
- Expanded documentation and examples
- Stable CLI commands and report schema
- SARIF output for code scanning
- Baseline and inline suppression support
- Public GitHub repository when ready for launch

## v1.1.0

- Config guardrail positioning and comparison docs
- Staged and changed-file scanning
- GitHub Actions annotation output
- Doctor JSON output and baseline audit
- Env hygiene, schema drift, GitLab CI, CircleCI, and expanded Docker/Compose checks
- Config allowlists, custom declarative rules, scan limits, pre-commit hook, and Docker image recipe

## v1.2.0

- Supported ESM, CommonJS, and TypeScript SDK
- Reusable scanner instances and structured errors
- Pure reporter subpath exports
- Deterministic agent mode and stable exit codes
- Packed-package consumer tests and monorepo integration guidance
- Internal boundary prepared for a future MCP package

## v2.0.0

- Independently versioned core and reporter packages
- Backward-compatible CLI and SDK facade
- Node.js 22 minimum runtime
- Official Node.js, Next.js, Python, and Docker presets
- Structured Kubernetes and Helm detection
- Root-restricted, always-masked stdio MCP server
- Bundled Node 24 GitHub Action
- Fixture and pinned public-repository release benchmarks

## Later

- VS Code extension
- Additional declarative presets and conservative configuration rules
- Further agent integrations built on the stable SDK and MCP boundaries
