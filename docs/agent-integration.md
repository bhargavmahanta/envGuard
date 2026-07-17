# Agent Integration

Use agent mode for deterministic machine-readable scans:

```bash
envguard scan . --agent
```

Agent mode always emits one masked JSON report to stdout. It disables color, spinners, banners, interactive behavior, and report-written messages. Successful scans keep stderr empty; errors and optional verbose diagnostics use stderr only.

`--agent` overrides `--format`, `--quiet`, color settings, and unsafe masking configuration. It cannot be combined with `--output` or `--update-baseline`.

## Exit Codes

| Code | Meaning |
| --- | --- |
| `0` | Scan completed and passed policy. |
| `1` | Findings reached the failure threshold. |
| `2` | CLI options or configuration are invalid. |
| `3` | Target, filesystem, or abort failure. |
| `4` | Unexpected internal failure. |

## Focused Scans

Prefer files changed by the current task:

```bash
envguard scan --staged --agent
envguard scan --changed origin/main --agent
```

Changed-file scanning includes applicable committed, staged, working-tree, and untracked files. Deleted files are ignored safely, and selected paths remain constrained to the scan root and ignore policy.

Agents must never request, reconstruct, print, transmit, or validate full credentials. Parse stdout directly as JSON, inspect `findings` and recoverable `errors`, propose remediation before changing security-sensitive configuration, and run a focused follow-up scan after edits.
