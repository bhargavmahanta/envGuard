# GitHub Actions Integration

Run EnvGuard in CI to fail pull requests when high-risk configuration issues appear.

## Reusable GitHub Action

```yaml
name: EnvGuard

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  envguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: bhargavmahanta/envGuard@main
        with:
          target: .
          fail-on: high
```

## npx Setup

```yaml
name: EnvGuard

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  envguard:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npx @bhargavmahanta/envguard scan . --ci --fail-on high
```

Generate a JSON report:

```bash
npx @bhargavmahanta/envguard scan . --format json --output envguard-report.json
```

Generate a Markdown report:

```bash
npx @bhargavmahanta/envguard scan . --format markdown --output envguard-report.md
```

Generate GitHub Actions annotations:

```bash
npx @bhargavmahanta/envguard scan . --format github
```

## Pair With Gitleaks

Use Gitleaks for deep secret and git-history scanning, then EnvGuard for environment, Docker, and CI configuration risks:

```yaml
name: Security

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: npx @bhargavmahanta/envguard scan . --ci --fail-on high
```

On Windows PowerShell, use the `.cmd` shim if script execution blocks `envguard.ps1`:

```powershell
npx --package @bhargavmahanta/envguard envguard.cmd scan . --ci --fail-on high
```
