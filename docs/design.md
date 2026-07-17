# Design Notes

EnvGuard follows a layered dependency direction:

```text
CLI -> Public SDK -> Scanner engine -> walkers, parsers, detectors, rules, masking, scoring
```

The SDK and scanner engine do not depend on Commander, Chalk, Ora, terminal output, argument parsing, or process termination. Reporter functions are pure and available through a separate package subpath.

The scan pipeline is:

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
11. Return structured metadata, findings, recoverable errors, and a policy recommendation.
12. Let the CLI or caller render output and decide how to apply the recommendation.

## Public CLI Contract

The stable commands are `scan`, `init`, `rules`, and `doctor`.

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Scan completed and the configured CI threshold was not met. |
| `1` | Findings met the configured failure threshold. |
| `2` | CLI input or EnvGuard configuration is invalid. |
| `3` | Target, filesystem, or scan-abort failure. |
| `4` | Unexpected internal failure. |

Automation flags:

| Flag | Purpose |
| --- | --- |
| `--ci` | Enables threshold-based failure. |
| `--fail-on <severity>` | Sets the CI failure threshold. |
| `--quiet` | Suppresses non-error output. |
| `--verbose` | Prints additional diagnostics. |
| `--no-color` | Disables colored terminal output. |
| `--staged` | Scans staged git files only. |
| `--changed [base-ref]` | Scans changed git files only. |
| `--agent` | Emits deterministic masked JSON for agents and automation. |

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

SARIF reports use SARIF `2.1.0` and include masked previews in `properties.preview`. GitHub annotation output is available with `--format github`.

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

Config-level allowlists can suppress known findings by `ruleId`, `path`, `key`, or `fingerprint`. Entries require `reason` and `owner`; expired entries do not suppress findings.

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
| `reporter.ts` | Terminal, JSON, Markdown, SARIF, and GitHub annotation output |
| `scanner.ts` | End-to-end scan orchestration |

Public SDK entry points live in `index.ts`; reporter entry points live under `reporters/`; CLI-only behavior lives under `cli/`.

## Non-Goals for v1

- Git history scanning
- Live credential validation
- VS Code extension
- Dashboard
- Autofix
