# Design Notes

EnvGuard follows a small rule-engine pipeline:

1. Load default config.
2. Load `envguard.config.yml` if present.
3. Load `.envguardignore` if present.
4. Resolve the scan target.
5. Discover supported files with default exclusions.
6. Parse env-style records and YAML where applicable.
7. Run secret, weak value, runtime, CORS, Docker, Compose, GitHub Actions, and entropy rules.
8. Mask previews by default.
9. Deduplicate findings.
10. Calculate severity, confidence, and risk score.
11. Render terminal, JSON, or Markdown reports.
12. Exit non-zero in CI mode when the configured threshold is met.

## Public CLI Contract

The stable commands are `scan`, `init`, `rules`, and `doctor`.

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Scan completed and the configured CI threshold was not met. |
| `1` | Findings met the CI threshold, or an unexpected scan/runtime error occurred. |
| `2` | CLI input or EnvGuard configuration is invalid. |

Automation flags:

| Flag | Purpose |
| --- | --- |
| `--ci` | Enables threshold-based failure. |
| `--fail-on <severity>` | Sets the CI failure threshold. |
| `--quiet` | Suppresses non-error output. |
| `--verbose` | Prints additional diagnostics. |
| `--no-color` | Disables colored terminal output. |

## Report Schema

JSON reports use schema version `1.0.0`:

```json
{
  "tool": "envguard",
  "version": "0.1.0",
  "schemaVersion": "1.0.0",
  "targetPath": ".",
  "generatedAt": "2026-07-02T00:00:00.000Z",
  "summary": {
    "filesScanned": 1,
    "findings": 1,
    "bySeverity": {
      "info": 0,
      "low": 0,
      "medium": 0,
      "high": 1,
      "critical": 0
    },
    "highestSeverity": "high"
  },
  "findings": [
    {
      "id": "ENV-001",
      "fingerprint": "stable-fingerprint",
      "ruleId": "github-token",
      "severity": "high",
      "confidence": "high",
      "riskScore": 85,
      "filePath": ".env",
      "line": 1,
      "preview": "GITHUB_TOKEN=ghp_********abcd",
      "message": "A value matching a GitHub token format was found.",
      "fix": "Revoke the token in GitHub and use GitHub Secrets or a local untracked env file."
    }
  ]
}
```

SARIF reports use SARIF `2.1.0` and include masked previews in `properties.preview`.

## False-Positive Controls

Use a baseline when adopting EnvGuard in an existing project:

```bash
envguard scan . --update-baseline
envguard scan . --ci --fail-on high
```

The baseline file is `.envguard-baseline.json` by default. Existing findings in the baseline are suppressed; new findings still appear.

For intentional single-line suppressions:

```env
# envguard-disable-next-line weak-jwt-secret
JWT_SECRET=secret

API_KEY=synthetic-value # envguard-disable-line generic-api-key
```

## Core Modules

| Module | Purpose |
| --- | --- |
| `walk.ts` | File discovery and ignore handling |
| `parser.ts` | Env/YAML/text normalization |
| `detector.ts` | Rule execution |
| `entropy.ts` | Shannon entropy checks |
| `masking.ts` | Secret preview masking |
| `riskScore.ts` | Numeric risk score calculation |
| `dedupe.ts` | Duplicate finding removal |
| `reporter.ts` | Terminal, JSON, and Markdown output |
| `scanner.ts` | End-to-end scan orchestration |

## Non-Goals for v1

- Git history scanning
- Live credential validation
- SARIF output
- VS Code extension
- Dashboard
- Autofix
