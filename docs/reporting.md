# Reporting

EnvGuard supports five report formats:

| Format | Use case |
| --- | --- |
| `terminal` | Human-readable local output. |
| `json` | Automation and custom dashboards. |
| `markdown` | Saved reports in pull requests or artifacts. |
| `sarif` | GitHub code scanning and SARIF-compatible tools. |
| `github` | GitHub Actions workflow annotations. |

## JSON

```bash
npx @bhargavmahanta/envguard@next scan . --format json --output envguard-report.json
```

JSON reports include `schemaVersion: "1.0.0"` and stable finding fingerprints.

## Markdown

```bash
npx @bhargavmahanta/envguard@next scan . --format markdown --output envguard-report.md
```

## SARIF

```bash
npx @bhargavmahanta/envguard@next scan . --format sarif --output envguard.sarif
```

Upload to GitHub code scanning:

```yaml
- run: npx @bhargavmahanta/envguard@next scan . --format sarif --output envguard.sarif
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: envguard.sarif
```

## GitHub Annotations

```bash
npx @bhargavmahanta/envguard@next scan . --format github
```

All report formats mask sensitive values by default.

## SDK Reporters

Pure reporter functions are available from the supported subpath:

```ts
import {
  formatJsonReport,
  formatMarkdownReport,
  formatSarifReport
} from '@bhargavmahanta/envguard/reporters';
```

They return strings, do not print or write files, clone the supplied result, and mask by default. Passing `{ maskSecrets: false }` is an explicit unsafe opt-out.
