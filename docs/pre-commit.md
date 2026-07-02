# Pre-Commit Integration

EnvGuard can run before commits so unsafe env and config values are caught locally.

## Husky

```bash
npm install --save-dev husky
npx husky init
```

Add this to `.husky/pre-commit`:

```bash
npx @bhargavmahanta/envguard scan . --ci --fail-on high
```

On Windows PowerShell, use:

```powershell
npx --package @bhargavmahanta/envguard envguard.cmd scan . --ci --fail-on high
```

## npm Script

```json
{
  "scripts": {
    "security:env": "envguard scan . --ci --fail-on high"
  }
}
```

Then run:

```bash
npm run security:env
```

Use `.envguardignore` for generated files, fixtures, or intentionally vulnerable examples.
