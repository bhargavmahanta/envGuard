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
