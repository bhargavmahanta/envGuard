# Public API Surface

EnvGuard treats these interfaces as stable for V1.x.

## Package and Command

- npm package: `@bhargavmahanta/envguard`
- executable command: `envguard`

## Commands

- `envguard scan [target]`
- `envguard scan --staged`
- `envguard scan --changed [base-ref]`
- `envguard baseline audit [target]`
- `envguard init`
- `envguard rules`
- `envguard doctor`
- `envguard doctor --json`

## Config Files

- `envguard.config.yml`
- `.envguardignore`
- `.envguard-baseline.json`

## Report Formats

- `terminal`
- `json`
- `markdown`
- `sarif`
- `github`

## Config Keys

- `severity.fail_on`
- `entropy.enabled`
- `entropy.threshold`
- `output.mask`
- `rules.disabled`
- `rules.packs`
- `rules.custom[]`
- `allow[]`
- `scan.max_file_mb`
- `scan.timeout_seconds`
- `scan.include_gitignored`

## Stable Fields

JSON reports include:

- `tool`
- `version`
- `schemaVersion`
- `targetPath`
- `generatedAt`
- `configPath`
- `summary`
- `findings`

Findings include:

- `id`
- `fingerprint`
- `ruleId`
- `title`
- `category`
- `severity`
- `confidence`
- `riskScore`
- `filePath`
- `line`
- `preview`
- `message`
- `fix`
- `key`

## Rule IDs

Rule IDs are stable by V1.0 and may be used in docs, baselines, and inline suppressions.
