# Public API Surface

EnvGuard treats these interfaces as stable for V1.0.

## Package and Command

- npm package: `@bhargavmahanta/envguard`
- executable command: `envguard`

## Commands

- `envguard scan [target]`
- `envguard init`
- `envguard rules`
- `envguard doctor`

## Config Files

- `envguard.config.yml`
- `.envguardignore`
- `.envguard-baseline.json`

## Report Formats

- `terminal`
- `json`
- `markdown`
- `sarif`

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

## Rule IDs

Rule IDs are stable by V1.0 and may be used in docs, baselines, and inline suppressions.
