# How EnvGuard Compares

EnvGuard is a configuration security guardrail. It focuses on files developers touch every day: `.env`, examples and schemas, Dockerfiles, Compose files, and CI/CD workflow YAML.

## Best Fit

Use EnvGuard when you want quick feedback on:

- unsafe runtime defaults such as debug mode, disabled TLS, and wildcard CORS
- risky Docker and Compose configuration
- GitHub Actions, GitLab CI, and CircleCI configuration risks
- `.env` hygiene and drift between runtime env files and examples
- masked JSON, Markdown, SARIF, or GitHub annotation output in CI

## Complementary Tools

| Tool | Best at | Pair with EnvGuard for |
| --- | --- | --- |
| Gitleaks | Git history, directory, stdin secret scanning, mature baselines | Deep secret/history coverage plus EnvGuard config-risk checks |
| TruffleHog | Broad source scanning and active credential verification | Verified leaked credential detection plus EnvGuard runtime/Docker/CI checks |
| detect-secrets | Enterprise baseline workflows and plugin/filter control | Baseline-heavy secret prevention plus EnvGuard config linting |
| dotenv-linter | `.env` formatting and schema hygiene | Fast dotenv formatting checks plus EnvGuard security-focused rules |
| secretlint | Pluggable Node secret linting and formatter ecosystem | Custom text/rule workflows plus EnvGuard Docker/CI/runtime checks |

## Recommended CI Pairing

Run Gitleaks for secret history and EnvGuard for configuration risk:

```yaml
name: Security

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write

jobs:
  config-and-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - run: npx --yes @bhargavmahanta/envguard@latest scan . --ci --fail-on high
```

## Non-Goals

EnvGuard does not validate live credentials, rotate secrets, or rewrite git history. Keep those workflows in dedicated incident-response and secret-scanning tools.
