# EnvGuard 1.0.0 Release Notes

EnvGuard 1.0.0 is the first production-ready release of the developer-first environment and configuration security scanner.

## Highlights

- Stable CLI commands: `scan`, `init`, `rules`, and `doctor`
- Stable JSON report schema version `1.0.0`
- Terminal, JSON, Markdown, and SARIF reports
- Baseline suppression with `.envguard-baseline.json`
- Inline suppression comments for intentional findings
- GitHub Actions wrapper and CI examples
- Public API, compatibility, reporting, release, and V1 readiness documentation

## Install

```bash
npx @bhargavmahanta/envguard scan .
npm install -g @bhargavmahanta/envguard
```

Windows PowerShell:

```powershell
envguard.cmd scan .
npx --package @bhargavmahanta/envguard envguard.cmd scan .
```

## Known Limitations

- EnvGuard uses pattern-based and heuristic detection.
- EnvGuard may produce false positives.
- EnvGuard may miss some secrets.
- EnvGuard does not validate, transmit, revoke, or rotate credentials.
- EnvGuard does not scan git history in V1.0.
