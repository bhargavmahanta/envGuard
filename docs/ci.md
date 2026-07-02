# GitHub Actions Integration

Run EnvGuard in CI to fail pull requests when high-risk configuration issues appear.

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
