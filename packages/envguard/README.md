# EnvGuard

> Security linting for environment variables, Docker, CI, Kubernetes, and runtime configuration.

[![npm](https://img.shields.io/npm/v/@bhargavmahanta/envguard)](https://www.npmjs.com/package/@bhargavmahanta/envguard)
[![npm provenance](https://img.shields.io/badge/npm-provenance-verified-brightgreen)](https://www.npmjs.com/package/@bhargavmahanta/envguard)
[![CI](https://github.com/bhargavmahanta/envGuard/actions/workflows/test.yml/badge.svg)](https://github.com/bhargavmahanta/envGuard/actions/workflows/test.yml)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

EnvGuard helps developers catch unsafe environment values, risky runtime defaults, Docker/Compose hazards, and CI/CD configuration issues before they reach production. It complements deep secret-history scanners like Gitleaks and TruffleHog rather than replacing them.

EnvGuard V2 is the current stable release and requires Node.js 22 or newer.

## Quick Start

### CLI

Run the CLI without installing it globally:

```bash
npx @bhargavmahanta/envguard scan .
```

### GitHub Action

Add EnvGuard to pull requests without installing it in the repository:

```yaml
name: EnvGuard

on:
  pull_request:

permissions:
  contents: read

jobs:
  envguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: bhargavmahanta/envGuard@v2
        with:
          fail-on: high
```

See the [complete CI guide](https://github.com/bhargavmahanta/envGuard/blob/main/docs/ci.md) for SARIF uploads, annotations, and immutable version pins.

### SDK

Use EnvGuard from TypeScript or JavaScript:

```ts
import { scan } from "@bhargavmahanta/envguard";

const result = await scan({ target: ".", failOn: "high" });
console.log(result.passed, result.findings);
```

### Agents and MCP

Use deterministic, always-masked JSON from build systems and coding agents:

```bash
npx @bhargavmahanta/envguard scan . --agent
```

For tool-based integrations, use the root-restricted [EnvGuard MCP server](https://github.com/bhargavmahanta/envGuard/blob/main/docs/mcp-architecture.md). See the [agent integration guide](https://github.com/bhargavmahanta/envGuard/blob/main/docs/agent-integration.md) for exit codes and safe focused scans.

## Features

- Scan `.env`, config, Docker, Compose, and GitHub Actions files
- Scan GitLab CI and CircleCI configuration
- Check `.env` hygiene and `.env.example` / `.env.schema` drift
- Detect real-looking secrets, weak secrets, unsafe runtime settings, and wildcard CORS
- Detect Docker and CI/CD security issues
- Detect conservative Kubernetes and Helm configuration risks
- Mask secrets by default in terminal, JSON, Markdown, SARIF, and GitHub annotation reports
- Support local CLI usage, pre-commit hooks, and GitHub Actions
- Scan only staged or changed files for fast developer workflows
- Use the bundled `bhargavmahanta/envGuard@v2` GitHub Action
- Configure behavior with `envguard.config.yml` and `.envguardignore`

## Installation

Install the stable V2 release:

```bash
npm install --save-dev @bhargavmahanta/envguard
```

Or install globally:

```bash
npm install -g @bhargavmahanta/envguard
```

EnvGuard releases are published through npm trusted publishing with provenance. Verify the
installed dependency signatures with `npm audit signatures`.

Use a declarative framework preset:

```bash
npm install --save-dev @bhargavmahanta/envguard @bhargavmahanta/envguard-config-next
```

```yaml
extends:
  - "@bhargavmahanta/envguard-config-next"
```

## CLI Commands

```bash
envguard scan .
envguard scan . --ci --fail-on high
envguard scan . --format json --output report.json
envguard scan . --format markdown --output report.md
envguard scan --staged
envguard scan --changed origin/main
envguard scan . --format github
envguard baseline audit
envguard init
envguard rules
envguard doctor --json
envguard explain k8s-privileged
envguard scan . --agent
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
- `.env` duplicate keys, empty values, malformed lines, invalid keys, and schema drift
- Dockerfiles that copy `.env`, use `latest`, run as root, miss `.dockerignore`, or use remote `ADD`
- Compose privileged containers, public database ports, host networking, unsafe volumes, inline secrets, and `latest` tags
- GitHub Actions secret printing, `pull_request_target`, floating actions, broad permissions
- GitLab CI and CircleCI secret-printing and risky defaults

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
  packs:
    - node
    - python
    - docker
    - github-actions
    - ci
  custom: []

allow: []

scan:
  max_file_mb: 2
  timeout_seconds: 0
  include_gitignored: false
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
sarif
github
```

## How EnvGuard Fits

| Tool | Primary focus | Use with EnvGuard for |
| --- | --- | --- |
| EnvGuard | Environment, runtime, Docker, Kubernetes, and CI configuration | Fast configuration-security feedback before production |
| Gitleaks | Git history and repository secret scanning | Deep secret-history coverage |
| TruffleHog | Broad secret discovery and credential verification | Incident response and verified credential detection |

EnvGuard does not replace a git-history secret scanner. See the [full comparison and recommended pairing](https://github.com/bhargavmahanta/envGuard/blob/main/docs/comparison.md).

## Limitations

EnvGuard uses pattern-based and heuristic detection. It may produce false positives or miss some secrets. It does not validate, transmit, or use detected credentials.

## Documentation

- [Rule catalog](https://github.com/bhargavmahanta/envGuard/blob/main/docs/rules.md)
- [How EnvGuard compares](https://github.com/bhargavmahanta/envGuard/blob/main/docs/comparison.md)
- [Remediation guide](https://github.com/bhargavmahanta/envGuard/blob/main/docs/remediation.md)
- [GitHub Actions setup](https://github.com/bhargavmahanta/envGuard/blob/main/docs/ci.md)
- [Pre-commit setup](https://github.com/bhargavmahanta/envGuard/blob/main/docs/pre-commit.md)
- [Integration examples](https://github.com/bhargavmahanta/envGuard/blob/main/docs/examples.md)
- [Reporting](https://github.com/bhargavmahanta/envGuard/blob/main/docs/reporting.md)
- [Public API surface](https://github.com/bhargavmahanta/envGuard/blob/main/docs/public-api.md)
- [SDK guide](https://github.com/bhargavmahanta/envGuard/blob/main/docs/sdk.md)
- [Presets](https://github.com/bhargavmahanta/envGuard/blob/main/docs/presets.md)
- [Container image](https://github.com/bhargavmahanta/envGuard/blob/main/docs/containers.md)
- [Benchmarks](https://github.com/bhargavmahanta/envGuard/blob/main/docs/benchmarks.md)
- [Agent integration](https://github.com/bhargavmahanta/envGuard/blob/main/docs/agent-integration.md)
- [Package family](https://github.com/bhargavmahanta/envGuard/blob/main/docs/package-family.md)
- [MCP server](https://github.com/bhargavmahanta/envGuard/blob/main/docs/mcp-architecture.md)
- [Release process](https://github.com/bhargavmahanta/envGuard/blob/main/docs/releasing.md)
- [V2.0 release notes](https://github.com/bhargavmahanta/envGuard/blob/main/docs/release-notes-v2.md)
- [V1.0 release notes](https://github.com/bhargavmahanta/envGuard/blob/main/docs/release-notes-v1.md)
- [V1.0 readiness](https://github.com/bhargavmahanta/envGuard/blob/main/docs/v1-readiness.md)
- [Compatibility](https://github.com/bhargavmahanta/envGuard/blob/main/docs/compatibility.md)
- [Design notes](https://github.com/bhargavmahanta/envGuard/blob/main/docs/design.md)
- [Roadmap](https://github.com/bhargavmahanta/envGuard/blob/main/docs/roadmap.md)

## Community

- Read the [contribution guide](https://github.com/bhargavmahanta/envGuard/blob/main/CONTRIBUTING.md) before opening a pull request.
- Report sensitive vulnerabilities through the process in the [security policy](https://github.com/bhargavmahanta/envGuard/blob/main/SECURITY.md).

## License

MIT

## Disclaimer

EnvGuard is a defensive security tool. Only scan repositories you own or have permission to test.
