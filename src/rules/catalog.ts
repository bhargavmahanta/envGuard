import type { RuleMeta } from '../types.js';

export const RULES: RuleMeta[] = [
  {
    id: 'aws-access-key',
    title: 'AWS access key ID detected',
    category: 'secret',
    severity: 'high',
    confidence: 'high',
    description: 'A value matching the AWS access key ID format was found.',
    fix: 'Remove the key from source control and rotate it in AWS IAM.'
  },
  {
    id: 'aws-secret-key',
    title: 'AWS secret access key detected',
    category: 'secret',
    severity: 'critical',
    confidence: 'high',
    description: 'A high-entropy AWS secret value appears in configuration.',
    fix: 'Rotate the secret immediately and move it to a secret manager.'
  },
  {
    id: 'github-token',
    title: 'GitHub token detected',
    category: 'secret',
    severity: 'high',
    confidence: 'high',
    description: 'A value matching a GitHub token format was found.',
    fix: 'Revoke the token in GitHub and use GitHub Secrets or a local untracked env file.'
  },
  {
    id: 'stripe-secret-key',
    title: 'Stripe secret key detected',
    category: 'secret',
    severity: 'high',
    confidence: 'high',
    description: 'A Stripe secret key was found in a scanned file.',
    fix: 'Rotate the key in Stripe and load it from a protected runtime secret.'
  },
  {
    id: 'slack-token',
    title: 'Slack token detected',
    category: 'secret',
    severity: 'high',
    confidence: 'high',
    description: 'A value matching a Slack token format was found.',
    fix: 'Revoke the Slack token and move it into a secure secret store.'
  },
  {
    id: 'google-api-key',
    title: 'Google API key detected',
    category: 'secret',
    severity: 'high',
    confidence: 'high',
    description: 'A value matching the Google API key format was found.',
    fix: 'Restrict the key, rotate it if needed, and load it from a protected location.'
  },
  {
    id: 'private-key',
    title: 'Private key block detected',
    category: 'secret',
    severity: 'critical',
    confidence: 'high',
    description: 'A private key block was found in source-controlled files.',
    fix: 'Remove the key, rotate the keypair, and store private keys outside the repository.'
  },
  {
    id: 'jwt-token',
    title: 'JWT token detected',
    category: 'secret',
    severity: 'high',
    confidence: 'medium',
    description: 'A value shaped like a JWT token was found.',
    fix: 'Treat the token as sensitive, revoke affected sessions, and avoid committing live tokens.'
  },
  {
    id: 'database-url-password',
    title: 'Database URL contains a password',
    category: 'secret',
    severity: 'critical',
    confidence: 'high',
    description: 'A database connection URL includes embedded credentials.',
    fix: 'Move database credentials to a secret manager or untracked local env file.'
  },
  {
    id: 'bearer-token',
    title: 'Bearer token detected',
    category: 'secret',
    severity: 'high',
    confidence: 'medium',
    description: 'An inline bearer token was found.',
    fix: 'Move bearer tokens to a secret manager and rotate the token if it was committed.'
  },
  {
    id: 'webhook-url',
    title: 'Webhook URL detected',
    category: 'secret',
    severity: 'medium',
    confidence: 'medium',
    description: 'A webhook URL was found in source configuration.',
    fix: 'Rotate exposed webhooks and keep webhook URLs in protected secrets.'
  },
  {
    id: 'generic-api-key',
    title: 'Generic API key or token detected',
    category: 'secret',
    severity: 'medium',
    confidence: 'medium',
    description: 'A suspicious key name is assigned a long secret-like value.',
    fix: 'Move this value to a protected secret and commit only safe placeholders.'
  },
  {
    id: 'high-entropy-value',
    title: 'High-entropy secret-like value detected',
    category: 'entropy',
    severity: 'medium',
    confidence: 'medium',
    description: 'A suspicious configuration value has high randomness.',
    fix: 'Confirm whether this is a secret and move it out of tracked files if sensitive.'
  },
  {
    id: 'weak-jwt-secret',
    title: 'Weak JWT secret',
    category: 'weak-secret',
    severity: 'medium',
    confidence: 'high',
    description: 'JWT signing secrets must not use guessable words.',
    fix: 'Use a cryptographically random 32-byte or longer secret.'
  },
  {
    id: 'weak-session-secret',
    title: 'Weak session secret',
    category: 'weak-secret',
    severity: 'medium',
    confidence: 'high',
    description: 'Session secrets must not use guessable placeholder values.',
    fix: 'Use a cryptographically random secret generated outside source control.'
  },
  {
    id: 'placeholder-secret',
    title: 'Placeholder secret value',
    category: 'weak-secret',
    severity: 'low',
    confidence: 'medium',
    description: 'A placeholder secret value can accidentally reach production.',
    fix: 'Use an empty value in examples or document how to generate a strong secret.'
  },
  {
    id: 'dummy-api-key',
    title: 'Dummy API key value',
    category: 'weak-secret',
    severity: 'low',
    confidence: 'medium',
    description: 'A dummy API key can mask broken production configuration.',
    fix: 'Use empty placeholders in examples and real secrets only in protected stores.'
  },
  {
    id: 'weak-password',
    title: 'Weak password value',
    category: 'weak-secret',
    severity: 'medium',
    confidence: 'high',
    description: 'A password is set to a trivial value.',
    fix: 'Use a generated password managed by a secret store.'
  },
  {
    id: 'debug-enabled',
    title: 'Debug mode enabled',
    category: 'runtime',
    severity: 'medium',
    confidence: 'high',
    description: 'Debug mode can expose stack traces, internals, and sensitive details.',
    fix: 'Set debug flags to false in production-like configuration.'
  },
  {
    id: 'node-dev-production',
    title: 'Node environment set to development',
    category: 'runtime',
    severity: 'medium',
    confidence: 'high',
    description: 'Development mode can enable slower or less secure runtime behavior.',
    fix: 'Use NODE_ENV=production in production configuration.'
  },
  {
    id: 'flask-dev-env',
    title: 'Flask development environment enabled',
    category: 'runtime',
    severity: 'medium',
    confidence: 'high',
    description: 'Flask development mode can expose unsafe debugging behavior.',
    fix: 'Use FLASK_ENV=production or the framework-recommended production setting.'
  },
  {
    id: 'django-debug',
    title: 'Django debug enabled',
    category: 'runtime',
    severity: 'medium',
    confidence: 'high',
    description: 'Django debug mode can disclose sensitive error details.',
    fix: 'Set DJANGO_DEBUG=False in production-like configuration.'
  },
  {
    id: 'ssl-disabled',
    title: 'SSL verification disabled',
    category: 'runtime',
    severity: 'high',
    confidence: 'high',
    description: 'Disabling SSL verification can expose traffic to man-in-the-middle attacks.',
    fix: 'Enable SSL verification and fix certificate trust issues directly.'
  },
  {
    id: 'tls-disabled',
    title: 'Node TLS verification disabled',
    category: 'runtime',
    severity: 'high',
    confidence: 'high',
    description: 'TLS_REJECT_UNAUTHORIZED=0 disables certificate validation in Node.js.',
    fix: 'Remove this setting and resolve the underlying certificate problem.'
  },
  {
    id: 'debug-logging',
    title: 'Debug logging enabled',
    category: 'runtime',
    severity: 'low',
    confidence: 'medium',
    description: 'Debug logging can leak sensitive request or configuration data.',
    fix: 'Use info or warn logging in production-like environments.'
  },
  {
    id: 'cors-wildcard',
    title: 'Wildcard CORS origin',
    category: 'cors',
    severity: 'medium',
    confidence: 'high',
    description: 'A wildcard CORS origin allows any website to call the application.',
    fix: 'Replace wildcard origins with an explicit allowlist of trusted domains.'
  },
  {
    id: 'cors-credentials-wildcard',
    title: 'Wildcard CORS with credentials',
    category: 'cors',
    severity: 'high',
    confidence: 'high',
    description: 'Wildcard origins combined with credentials can expose authenticated data.',
    fix: 'Never combine credentialed CORS requests with wildcard origins.'
  },
  {
    id: 'allowed-origins-wildcard',
    title: 'Allowed origins wildcard',
    category: 'cors',
    severity: 'medium',
    confidence: 'high',
    description: 'The allowed origins list accepts every origin.',
    fix: 'Use a specific allowlist of trusted origins.'
  },
  {
    id: 'docker-copy-dotenv',
    title: 'Dockerfile copies env file',
    category: 'docker',
    severity: 'high',
    confidence: 'high',
    description: 'Copying .env files into an image can bake secrets into layers.',
    fix: 'Add .env files to .dockerignore and inject secrets at runtime.'
  },
  {
    id: 'docker-copy-all',
    title: 'Dockerfile copies entire build context',
    category: 'docker',
    severity: 'medium',
    confidence: 'medium',
    description: 'COPY . . can include secrets unless the Docker build context is tightly ignored.',
    fix: 'Use a strict .dockerignore and copy only required files.'
  },
  {
    id: 'docker-latest-tag',
    title: 'Docker image uses latest tag',
    category: 'docker',
    severity: 'low',
    confidence: 'high',
    description: 'The latest tag is mutable and can change builds unexpectedly.',
    fix: 'Pin base images to an explicit version or digest.'
  },
  {
    id: 'docker-root-user',
    title: 'Dockerfile has no non-root user',
    category: 'docker',
    severity: 'medium',
    confidence: 'medium',
    description: 'Containers run as root unless a USER instruction is provided.',
    fix: 'Create or select a non-root user and switch to it with USER.'
  },
  {
    id: 'compose-privileged',
    title: 'Compose service uses privileged mode',
    category: 'docker',
    severity: 'high',
    confidence: 'high',
    description: 'Privileged containers bypass important isolation boundaries.',
    fix: 'Remove privileged mode and grant only the minimum capabilities needed.'
  },
  {
    id: 'compose-db-public-port',
    title: 'Database port exposed publicly',
    category: 'docker',
    severity: 'medium',
    confidence: 'medium',
    description: 'Common database ports are mapped to all interfaces.',
    fix: 'Bind database ports to localhost or keep them on an internal Docker network.'
  },
  {
    id: 'compose-inline-secret',
    title: 'Compose environment contains inline secret',
    category: 'docker',
    severity: 'high',
    confidence: 'medium',
    description: 'Secrets are stored directly in docker-compose environment values.',
    fix: 'Use Compose secrets, CI secrets, or an untracked env file.'
  },
  {
    id: 'actions-echo-secret',
    title: 'GitHub Actions prints a secret',
    category: 'github-actions',
    severity: 'high',
    confidence: 'high',
    description: 'A workflow command echoes a GitHub secret.',
    fix: 'Do not print secrets. Pass them directly to tools that need them.'
  },
  {
    id: 'actions-pull-request-target',
    title: 'Workflow uses pull_request_target',
    category: 'github-actions',
    severity: 'high',
    confidence: 'medium',
    description: 'pull_request_target can expose secrets to untrusted pull request code.',
    fix: 'Avoid pull_request_target for untrusted code or isolate secret-bearing steps.'
  },
  {
    id: 'actions-unpinned',
    title: 'GitHub Action is unpinned or floating',
    category: 'github-actions',
    severity: 'medium',
    confidence: 'high',
    description: 'Floating action references can change without review.',
    fix: 'Pin third-party actions to a version tag or commit SHA.'
  },
  {
    id: 'actions-hardcoded-token',
    title: 'Workflow contains a hardcoded token',
    category: 'github-actions',
    severity: 'high',
    confidence: 'medium',
    description: 'A workflow appears to contain a literal token value.',
    fix: 'Move tokens into GitHub Secrets and reference them with secrets.NAME.'
  },
  {
    id: 'actions-broad-permissions',
    title: 'Workflow grants broad permissions',
    category: 'github-actions',
    severity: 'high',
    confidence: 'high',
    description: 'permissions: write-all grants more access than most workflows need.',
    fix: 'Declare least-privilege permissions for each workflow.'
  },
  {
    id: 'actions-missing-permissions',
    title: 'Workflow missing explicit permissions',
    category: 'github-actions',
    severity: 'low',
    confidence: 'medium',
    description: 'No explicit permissions block was found.',
    fix: 'Add a permissions block with the minimum scopes required.'
  }
];

const RULE_MAP = new Map(RULES.map((rule) => [rule.id, rule]));

export function getRule(ruleId: string): RuleMeta {
  const rule = RULE_MAP.get(ruleId);
  if (!rule) {
    throw new Error(`Unknown rule: ${ruleId}`);
  }
  return rule;
}
