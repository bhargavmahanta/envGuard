# EnvGuard MCP

`@bhargavmahanta/envguard-mcp` is a stdio-only MCP server built on the public core and reporter packages.

```bash
npx @bhargavmahanta/envguard-mcp@next --root /absolute/project/path
```

Repeat `--root` to expose multiple project roots. Without the option, the server allows only its current working directory. `ENVGUARD_MCP_ROOTS` may also contain a platform-delimited root list.

The server exposes three read-only tools:

- `scan`: scan a contained target with forced masking.
- `rules`: list built-in rule metadata.
- `doctor`: check Node.js and configuration loading for allowed roots.

Every target is canonicalized before scanning and must remain inside an allowed root. Symbolic-link traversal, ignored-file scanning, credential validation, write tools, network validation, and unmasked output are not supported. Protocol output uses stdout; startup failures use stderr.
