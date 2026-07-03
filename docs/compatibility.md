# Compatibility

EnvGuard targets Node.js `>=20`.

The package is tested on:

- Ubuntu latest
- Windows latest
- macOS latest

## Windows PowerShell

PowerShell may block the generated `envguard.ps1` shim when script execution is disabled. Use the `.cmd` shim:

```powershell
envguard.cmd scan .
npx --package @bhargavmahanta/envguard envguard.cmd scan .
```

## Package Contents

The npm package should contain only:

- `dist`
- `README.md`
- `LICENSE`
- `package.json`

Verify locally:

```bash
npm pack --dry-run
```

## Docker

Build a local image:

```bash
docker build -t envguard .
```

Scan the current project:

```bash
docker run --rm -v "$PWD:/work" -w /work envguard scan . --ci --fail-on high
```
