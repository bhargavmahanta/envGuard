# Examples

Copy these into projects that should run EnvGuard regularly.

## GitHub Actions

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

## SARIF for GitHub Code Scanning

```yaml
- run: npx @bhargavmahanta/envguard scan . --format sarif --output envguard.sarif
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: envguard.sarif
```

## Husky Pre-Commit

```bash
npm install --save-dev husky
npx husky init
```

```bash
npx @bhargavmahanta/envguard scan . --ci --fail-on high
```

## Docker Projects

Use a strict `.dockerignore`:

```text
.env
.env.*
.git
node_modules
coverage
dist
```

Then run:

```bash
npx @bhargavmahanta/envguard scan Dockerfile docker-compose.yml
```

## Node and Next.js Projects

```bash
npx @bhargavmahanta/envguard scan . --ci --fail-on high
```

Recommended `.envguardignore`:

```text
node_modules/
.next/
dist/
coverage/
```

## Python, Flask, and Django Projects

```bash
npx @bhargavmahanta/envguard scan . --ci --fail-on high
```

Recommended `.envguardignore`:

```text
venv/
__pycache__/
.pytest_cache/
dist/
```
