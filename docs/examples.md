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
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: npx @bhargavmahanta/envguard@next scan . --ci --fail-on high
```

## Pull Request Changed Files

```yaml
- run: npx @bhargavmahanta/envguard@next scan --changed origin/main --ci --fail-on high
```

## GitHub Annotations

```yaml
- run: npx @bhargavmahanta/envguard@next scan . --format github
```

## SARIF for GitHub Code Scanning

```yaml
- run: npx @bhargavmahanta/envguard@next scan . --format sarif --output envguard.sarif
- uses: github/codeql-action/upload-sarif@v4
  with:
    sarif_file: envguard.sarif
```

## Husky Pre-Commit

```bash
npm install --save-dev husky
npx husky init
```

```bash
npx @bhargavmahanta/envguard@next scan --staged --ci --fail-on high
```

## Custom Rule

```yaml
rules:
  custom:
    - id: no-localhost-callback
      severity: medium
      confidence: high
      file_globs:
        - ".env"
        - ".env.*"
      pattern: "CALLBACK_URL=http://localhost"
      message: "Localhost callback URL is unsafe in shared config."
      fix: "Use an environment-specific callback URL."
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
npx @bhargavmahanta/envguard@next scan .
```

## Node and Next.js Projects

```bash
npx @bhargavmahanta/envguard@next scan . --ci --fail-on high
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
npx @bhargavmahanta/envguard@next scan . --ci --fail-on high
```

Recommended `.envguardignore`:

```text
venv/
__pycache__/
.pytest_cache/
dist/
```

## GitLab CI

```yaml
envguard:
  image: node:24-alpine
  script:
    - npx --yes @bhargavmahanta/envguard scan . --ci --fail-on high
```

## Bitbucket Pipelines

```yaml
pipelines:
  default:
    - step:
        image: node:24-alpine
        script:
          - npx --yes @bhargavmahanta/envguard scan . --ci --fail-on high
```

## Azure DevOps

```yaml
steps:
  - task: NodeTool@0
    inputs:
      versionSpec: "24.x"
  - script: npx --yes @bhargavmahanta/envguard scan . --ci --fail-on high
```

## Nx And Turborepo

Add `envguard scan --changed origin/main --ci --fail-on high` as a root task. EnvGuard performs one
repository scan and deterministically deduplicates files selected by Git, so workspace packages do
not need separate scanner installations.
