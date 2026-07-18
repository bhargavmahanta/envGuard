# Package Family

EnvGuard 2 uses independently versioned npm packages while keeping `@bhargavmahanta/envguard` as the normal installation and compatibility facade. The V2 release candidate is published under the npm `next` tag; `latest` remains on V1 until stable promotion.

| Package | Purpose |
| --- | --- |
| `@bhargavmahanta/envguard` | CLI and backward-compatible SDK/reporter facade |
| `@bhargavmahanta/envguard-core` | Scanner, configuration, rules, errors, and types without CLI presentation dependencies |
| `@bhargavmahanta/envguard-reporters` | Pure terminal, JSON, Markdown, SARIF, and GitHub formatters |
| `@bhargavmahanta/envguard-mcp` | Root-restricted, always-masked stdio MCP server |
| `@bhargavmahanta/envguard-config-*` | Declarative project presets |

Most projects should continue to install only the facade:

```bash
npm install --save-dev @bhargavmahanta/envguard@next
```

Library authors can depend on core to avoid CLI dependencies, or reporters when they only format an existing `ScanResult`. Existing root SDK imports and `@bhargavmahanta/envguard/reporters` remain supported in V2.

EnvGuard 2 requires Node.js 22 or newer. Projects that must remain on Node.js 20 should pin EnvGuard 1.

## Migrating from V1.2

For most CLI and SDK consumers, migration is limited to upgrading Node.js and the package:

```bash
npm install --save-dev @bhargavmahanta/envguard@next
```

The `envguard` executable, root SDK imports, `/reporters` subpath, rule IDs, configuration keys,
baseline format, masking defaults, and report schema `1.0.0` remain compatible. The npm package major
does not change the report schema version. Consumers that imported undocumented `src` or `dist`
paths must move to the facade, core, or reporter public exports.
