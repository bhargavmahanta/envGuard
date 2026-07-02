# EnvGuard

> Developer-first CLI scanner for unsafe `.env`, Docker, config, and CI/CD settings.

[![npm](https://img.shields.io/npm/v/@bhargavmahanta/envguard)](https://www.npmjs.com/package/@bhargavmahanta/envguard)
[![CI](https://github.com/bhargavmahanta/envGuard/actions/workflows/test.yml/badge.svg)](https://github.com/bhargavmahanta/envGuard/actions/workflows/test.yml)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

EnvGuard helps developers catch leaked secrets, weak environment values, unsafe Docker defaults, and risky GitHub Actions patterns before they reach production.

## Features

- Scan `.env`, config, Docker, Compose, and GitHub Actions files
- Detect real-looking secrets, weak secrets, unsafe runtime settings, and wildcard CORS
- Detect Docker and CI/CD security issues
- Mask secrets by default in terminal, JSON, and Markdown reports
- Support local CLI usage, pre-commit hooks, and GitHub Actions
- Configure behavior with `envguard.config.yml` and `.envguardignore`

## Installation

```bash
npx @bhargavmahanta/envguard scan .
```

Or install globally:

```bash
npm install -g @bhargavmahanta/envguard
```

## Quick Start

```bash
envguard scan .
envguard scan . --ci --fail-on high
envguard scan . --format json --output report.json
envguard scan . --format markdown --output report.md
envguard init
envguard rules
envguard doctor
```

On Windows PowerShell, if script execution blocks the generated `envguard.ps1` shim, use the `.cmd` shim:

```powershell
envguard.cmd scan .
npx --package @bhargavmahanta/envguard envguard.cmd scan .
```

## Example Output

```text
[HIGH] Database URL contains a password (database-url-password)
  File: .env:3
  Preview: DATABASE_URL=postgres://admin:********@localhost:5432/app
  Risk: 100/100 | Confidence: high
  Fix: Move database credentials to a secret manager or untracked local env file.
```

## Supported Detections

- AWS keys, GitHub tokens, Stripe keys, Slack tokens, Google API keys
- Private keys, JWT tokens, bearer tokens, database URLs with passwords
- Weak JWT/session/API secrets and placeholder values
- `DEBUG=true`, development runtimes, disabled SSL/TLS verification
- Wildcard CORS and wildcard CORS with credentials
- Dockerfiles that copy `.env`, use `latest`, or run as root
- Compose privileged containers, public database ports, and inline secrets
- GitHub Actions secret printing, `pull_request_target`, floating actions, broad permissions

## Configuration

Create starter files:

```bash
envguard init
```

Example `envguard.config.yml`:

```yaml
severity:
  fail_on: high

entropy:
  enabled: true
  threshold: 4.2

output:
  mask: true

rules:
  disabled: []
```

Example `.envguardignore`:

```text
node_modules/
dist/
docs/fixtures/
```

## Reports

EnvGuard supports:

```text
terminal
json
markdown
```

## Sample Vulnerable Project

Try EnvGuard against the included fake vulnerable project:

```bash
npm install
npm run build
node dist/cli.js scan examples/vulnerable-project
```

## Limitations

EnvGuard uses pattern-based and heuristic detection. It may produce false positives or miss some secrets. It does not validate, transmit, or use detected credentials.

## Documentation

- [Rule catalog](https://github.com/bhargavmahanta/envGuard/blob/main/docs/rules.md)
- [Remediation guide](https://github.com/bhargavmahanta/envGuard/blob/main/docs/remediation.md)
- [GitHub Actions setup](https://github.com/bhargavmahanta/envGuard/blob/main/docs/ci.md)
- [Pre-commit setup](https://github.com/bhargavmahanta/envGuard/blob/main/docs/pre-commit.md)
- [Design notes](https://github.com/bhargavmahanta/envGuard/blob/main/docs/design.md)
- [Roadmap](https://github.com/bhargavmahanta/envGuard/blob/main/docs/roadmap.md)

## License

MIT

## Disclaimer

EnvGuard is a defensive security tool. Only scan repositories you own or have permission to test.
