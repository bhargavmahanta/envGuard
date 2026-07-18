# Pre-Commit Integration

EnvGuard can run before commits so unsafe env and config values are caught locally.

## pre-commit

```yaml
repos:
  - repo: https://github.com/bhargavmahanta/envGuard
    rev: v1.1.0
    hooks:
      - id: envguard
```

The hook runs `envguard scan --staged` so local commits only scan staged files.

## Husky

```bash
npm install --save-dev husky
npx husky init
```

Add this to `.husky/pre-commit`:

```bash
npx @bhargavmahanta/envguard@next scan --staged --ci --fail-on high
```

On Windows PowerShell, use:

```powershell
npx --package @bhargavmahanta/envguard envguard.cmd scan --staged --ci --fail-on high
```

## npm Script

```json
{
  "scripts": {
    "security:env": "envguard scan . --ci --fail-on high",
    "security:env:staged": "envguard scan --staged --ci --fail-on high"
  }
}
```

Then run:

```bash
npm run security:env
```

Use `.envguardignore` for generated files, fixtures, or intentionally vulnerable examples.
