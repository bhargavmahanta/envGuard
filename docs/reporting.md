# Reporting

EnvGuard supports four report formats:

| Format | Use case |
| --- | --- |
| `terminal` | Human-readable local output. |
| `json` | Automation and custom dashboards. |
| `markdown` | Saved reports in pull requests or artifacts. |
| `sarif` | GitHub code scanning and SARIF-compatible tools. |

## JSON

```bash
npx @bhargavmahanta/envguard scan . --format json --output envguard-report.json
```

JSON reports include `schemaVersion: "1.0.0"` and stable finding fingerprints.

## Markdown

```bash
npx @bhargavmahanta/envguard scan . --format markdown --output envguard-report.md
```

## SARIF

```bash
npx @bhargavmahanta/envguard scan . --format sarif --output envguard.sarif
```

Upload to GitHub code scanning:

```yaml
- run: npx @bhargavmahanta/envguard scan . --format sarif --output envguard.sarif
- uses: github/codeql-action/upload-sarif@v3
  with:
    sarif_file: envguard.sarif
```

All report formats mask sensitive values by default.
