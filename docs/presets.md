# Declarative Presets

EnvGuard presets share safe rule and file-selection defaults without executing JavaScript from a
project configuration file.

## Official Presets

```bash
npm install --save-dev @bhargavmahanta/envguard @bhargavmahanta/envguard-config-node
npm install --save-dev @bhargavmahanta/envguard @bhargavmahanta/envguard-config-next
npm install --save-dev @bhargavmahanta/envguard @bhargavmahanta/envguard-config-python
npm install --save-dev @bhargavmahanta/envguard @bhargavmahanta/envguard-config-docker
```

```yaml
extends:
  - "@bhargavmahanta/envguard-config-node"
  - "@bhargavmahanta/envguard-config-docker"
```

Presets are loaded in listed order. Local configuration replaces preset arrays, programmatic
configuration overrides file configuration, and top-level scan options remain highest priority.

## Local Presets

Relative JSON and YAML files are resolved from the configuration file that declares them:

```yaml
extends:
  - ./security/envguard-base.yml
```

JavaScript files, URLs, cyclic inheritance, path escapes, and duplicate rule IDs are rejected.
Presets cannot change masking, failure thresholds, allowlists, or ignored-file policy.

## Publishing A Preset

A preset package publishes JSON or YAML and points to it from `package.json`:

```json
{
  "name": "@example/envguard-config-web",
  "exports": {
    ".": "./preset.json",
    "./package.json": "./package.json"
  },
  "envguard": {
    "preset": "./preset.json"
  },
  "peerDependencies": {
    "@bhargavmahanta/envguard": "^1.3.0"
  }
}
```

Use `definePreset`, `defineRule`, and `defineConfig` when authoring typed SDK configuration. The CLI
still consumes only declarative JSON or YAML.
