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
  },
  {
    id: 'env-duplicate-key',
    title: 'Duplicate env key',
    category: 'env-hygiene',
    severity: 'low',
    confidence: 'high',
    description: 'The same environment key appears more than once.',
    fix: 'Keep a single value for each environment key.'
  },
  {
    id: 'env-empty-value',
    title: 'Empty env value',
    category: 'env-hygiene',
    severity: 'low',
    confidence: 'high',
    description: 'An environment key has an empty value.',
    fix: 'Set an intentional value or document why the value must stay empty.'
  },
  {
    id: 'env-invalid-key',
    title: 'Invalid env key name',
    category: 'env-hygiene',
    severity: 'low',
    confidence: 'high',
    description: 'An environment key uses characters that many dotenv parsers reject.',
    fix: 'Use uppercase letters, numbers, and underscores for portable env keys.'
  },
  {
    id: 'env-malformed-line',
    title: 'Malformed env line',
    category: 'env-hygiene',
    severity: 'low',
    confidence: 'medium',
    description: 'A non-comment line in an env file is not a valid key-value assignment.',
    fix: 'Use KEY=value syntax or comment out explanatory text.'
  },
  {
    id: 'env-inconsistent-quotes',
    title: 'Inconsistent env quotes',
    category: 'env-hygiene',
    severity: 'low',
    confidence: 'medium',
    description: 'An env value starts with a quote but does not close with the same quote.',
    fix: 'Use matching single or double quotes around the whole value.'
  },
  {
    id: 'env-schema-missing-key',
    title: 'Env key missing from example or schema',
    category: 'schema',
    severity: 'low',
    confidence: 'medium',
    description: 'A runtime env key is absent from the example or schema file.',
    fix: 'Add the key to the example/schema file with a safe placeholder.'
  },
  {
    id: 'env-schema-extra-key',
    title: 'Example or schema env key is unused',
    category: 'schema',
    severity: 'info',
    confidence: 'medium',
    description: 'An example/schema key does not appear in the runtime env file.',
    fix: 'Remove stale keys or add the missing runtime configuration.'
  },
  {
    id: 'env-schema-unsafe-default',
    title: 'Unsafe default in env example or schema',
    category: 'schema',
    severity: 'medium',
    confidence: 'medium',
    description: 'An example/schema file contains a risky default value.',
    fix: 'Use an empty value, local-only placeholder, or documented setup instruction.'
  },
  {
    id: 'gitlab-echo-secret',
    title: 'GitLab CI prints a secret',
    category: 'ci',
    severity: 'high',
    confidence: 'medium',
    description: 'A GitLab CI command appears to echo a secret variable.',
    fix: 'Avoid printing secrets and pass them directly to tools that need them.'
  },
  {
    id: 'gitlab-unpinned-image',
    title: 'GitLab CI image uses a floating tag',
    category: 'ci',
    severity: 'low',
    confidence: 'medium',
    description: 'A GitLab CI image uses latest or no explicit version.',
    fix: 'Pin CI images to an explicit version or digest.'
  },
  {
    id: 'circleci-echo-secret',
    title: 'CircleCI prints a secret',
    category: 'ci',
    severity: 'high',
    confidence: 'medium',
    description: 'A CircleCI command appears to echo a secret variable.',
    fix: 'Avoid printing secrets and pass them directly to tools that need them.'
  },
  {
    id: 'circleci-broad-context',
    title: 'CircleCI uses broad organization context',
    category: 'ci',
    severity: 'medium',
    confidence: 'medium',
    description: 'A workflow references a broad organization context that may expose many secrets.',
    fix: 'Use the narrowest possible CircleCI context for each job.'
  },
  {
    id: 'docker-missing-dockerignore',
    title: 'Docker build context has no dockerignore',
    category: 'docker',
    severity: 'medium',
    confidence: 'high',
    description: 'No .dockerignore file was found for a Docker build context.',
    fix: 'Add a .dockerignore that excludes env files, build output, dependencies, and VCS data.'
  },
  {
    id: 'docker-add-remote-url',
    title: 'Dockerfile adds a remote URL',
    category: 'docker',
    severity: 'medium',
    confidence: 'high',
    description: 'ADD downloads remote content during image build.',
    fix: 'Download remote artifacts with pinned checksums in a controlled build step.'
  },
  {
    id: 'compose-host-network',
    title: 'Compose service uses host networking',
    category: 'docker',
    severity: 'high',
    confidence: 'high',
    description: 'Host networking removes important container network isolation.',
    fix: 'Use a scoped Docker network and expose only required ports.'
  },
  {
    id: 'compose-unsafe-volume',
    title: 'Compose mounts a sensitive host path',
    category: 'docker',
    severity: 'high',
    confidence: 'medium',
    description: 'A Compose volume mounts a sensitive host path or Docker socket.',
    fix: 'Avoid mounting host secrets, root paths, or the Docker socket into containers.'
  },
  {
    id: 'compose-latest-tag',
    title: 'Compose image uses latest tag',
    category: 'docker',
    severity: 'low',
    confidence: 'high',
    description: 'A Compose service image uses the mutable latest tag.',
    fix: 'Pin Compose images to explicit versions or digests.'
  },
  {
    id: 'k8s-privileged',
    title: 'Kubernetes container uses privileged mode',
    category: 'kubernetes',
    severity: 'high',
    confidence: 'high',
    description: 'A Kubernetes workload enables privileged container execution.',
    fix: 'Remove privileged mode and grant only explicitly required capabilities.'
  },
  {
    id: 'k8s-host-network',
    title: 'Kubernetes workload uses host networking',
    category: 'kubernetes',
    severity: 'high',
    confidence: 'high',
    description: 'Host networking bypasses Kubernetes network isolation.',
    fix: 'Disable hostNetwork and expose only required ports through Services.'
  },
  {
    id: 'k8s-host-path',
    title: 'Kubernetes workload mounts a host path',
    category: 'kubernetes',
    severity: 'high',
    confidence: 'medium',
    description: 'A hostPath volume exposes node filesystem content to a workload.',
    fix: 'Use a managed volume and avoid direct node filesystem mounts.'
  },
  {
    id: 'k8s-run-as-root',
    title: 'Kubernetes workload permits root execution',
    category: 'kubernetes',
    severity: 'high',
    confidence: 'high',
    description: 'A pod or container security context explicitly permits root execution.',
    fix: 'Set runAsNonRoot: true and use a non-zero runAsUser.'
  },
  {
    id: 'k8s-dangerous-capability',
    title: 'Kubernetes workload adds a dangerous capability',
    category: 'kubernetes',
    severity: 'high',
    confidence: 'high',
    description: 'The container adds a broad Linux capability that weakens isolation.',
    fix: 'Drop all capabilities and add back only the minimum capability required.'
  },
  {
    id: 'k8s-unpinned-image',
    title: 'Kubernetes image uses a floating reference',
    category: 'kubernetes',
    severity: 'low',
    confidence: 'high',
    description: 'A workload image uses latest or has no explicit tag or digest.',
    fix: 'Pin the image to an immutable digest or explicit version tag.'
  },
  {
    id: 'k8s-literal-secret',
    title: 'Kubernetes configuration contains a literal secret',
    category: 'kubernetes',
    severity: 'high',
    confidence: 'medium',
    description: 'A Kubernetes Secret, environment value, or Helm value contains secret material directly.',
    fix: 'Use an external secret manager and reference the secret at deployment time.'
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
