# Remediation Guide

## If a Real Secret Was Committed

1. Remove the secret from the repository.
2. Rotate or revoke the credential with the provider.
3. Move the value into a secret manager, CI secret, or untracked local env file.
4. Audit logs for suspicious use.
5. Clean git history only when necessary and with caution.

## Safer `.env.example`

Bad:

```env
JWT_SECRET=secret
DATABASE_URL=postgres://admin:password@localhost:5432/app
```

Good:

```env
JWT_SECRET=
DATABASE_URL=
```

Also acceptable:

```env
JWT_SECRET="<generate-a-strong-random-secret>"
DATABASE_URL="<your-local-database-url>"
```

## GitHub Actions Secrets

Use:

```yaml
env:
  API_KEY: ${{ secrets.API_KEY }}
```

Do not print secrets:

```yaml
run: echo "${{ secrets.API_KEY }}"
```

## Docker

Add this to `.dockerignore`:

```text
.env
.env.*
.git
node_modules
coverage
dist
```

Prefer copying only the files your image needs instead of `COPY . .`.

## Runtime Settings

Use production-safe values:

```env
DEBUG=false
NODE_ENV=production
VERIFY_SSL=true
LOG_LEVEL=info
CORS_ORIGIN=https://app.example.com
```

## Secret Managers

Recommended places for real secrets:

- AWS Secrets Manager
- AWS Systems Manager Parameter Store
- Azure Key Vault
- Google Secret Manager
- Doppler
- 1Password Secrets Automation
- HashiCorp Vault
