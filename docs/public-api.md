# Public API Surface

EnvGuard treats the following interfaces as stable for V1.x.

## Package Entry Points

- `@bhargavmahanta/envguard`
- `@bhargavmahanta/envguard/reporters`
- `@bhargavmahanta/envguard/package.json`
- Executable: `envguard`

Source files, `dist/*`, scanner internals, parsers, detectors, walkers, and masking helpers are not public import paths.

## SDK Exports

Functions:

- `scan`
- `createScanner`
- `shouldFail`
- `loadConfig`

Errors:

- `EnvGuardError`
- `ConfigError`
- `TargetNotFoundError`
- `TargetAccessError`
- `InvalidScanOptionsError`
- `ScanAbortedError`

Types include `Severity`, `Confidence`, `DetectionCategory`, `EnvGuardConfig`, `PartialEnvGuardConfig`, `LoadedConfig`, `LoadConfigOptions`, `Finding`, `ScanOptions`, `ScanResult`, `ScanSummary`, `ScanError`, and `Scanner`.

## Reporter Exports

- `formatTerminalReport`
- `formatJsonReport`
- `formatMarkdownReport`
- `formatSarifReport`
- `formatGitHubReport`
- `renderReport`
- `ReporterOptions`
- `OutputFormat`

Reporters are pure and masked by default. `maskSecrets: false` is an explicit unsafe opt-out.

## Commands

- `envguard scan [target]`
- `envguard scan --staged`
- `envguard scan --changed [base-ref]`
- `envguard scan [target] --agent`
- `envguard baseline audit [target]`
- `envguard init`
- `envguard rules`
- `envguard doctor`
- `envguard doctor --json`

CLI exit codes are `0` for success, `1` for policy findings, `2` for invalid input/config, `3` for target/filesystem/abort failure, and `4` for unexpected internal failure.

## Report Contract

Schema version remains `1.0.0`. Existing fields are `tool`, `version`, `schemaVersion`, `targetPath`, `generatedAt`, `configPath`, `summary`, and `findings`.

Backward-compatible additions are `metadata`, `passed`, `recommendedExitCode`, and recoverable `errors`. The schema version is independent from the npm package version.

Finding fields and rule IDs remain stable because they are used by baselines, suppressions, allowlists, reports, and CI policy.

## Configuration Files

- `envguard.config.yml`
- `.envguardignore`
- `.envguard-baseline.json`

Existing configuration keys remain stable, including `output.mask`. Programmatic scan options override file configuration. Explicit unmasked output is retained for compatibility but is unsafe; agent mode always masks.
