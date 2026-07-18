# @bhargavmahanta/envguard-mcp

A stdio MCP server exposing EnvGuard `scan`, `rules`, and `doctor` tools.

Targets are restricted to explicitly configured roots. Scans always mask findings, perform no credential validation, and make no network requests.

```sh
npx @bhargavmahanta/envguard-mcp --root /absolute/project/path
```

Repeat `--root` to allow more than one project root. When omitted, only the current working directory is allowed.
