import type { EnvGuardConfig } from './types.js';

export const VERSION = '1.1.0';
export const REPORT_SCHEMA_VERSION = '1.0.0';
export const DEFAULT_BASELINE_FILENAME = '.envguard-baseline.json';

export const CONFIG_FILENAMES = [
  'envguard.config.yml',
  'envguard.config.yaml',
  'envguard.config.json'
];

export const DEFAULT_INCLUDE_PATTERNS = [
  '.env',
  '.env.*',
  '**/.env',
  '**/.env.*',
  '**/config.{js,ts,json,yml,yaml}',
  '**/settings.py',
  '**/application.{yml,yaml}',
  '**/docker-compose*.{yml,yaml}',
  '**/Dockerfile',
  '**/Dockerfile.*',
  '**/.github/workflows/*.{yml,yaml}',
  '**/.gitlab-ci.{yml,yaml}',
  '**/.circleci/config.{yml,yaml}',
  '**/next.config.js',
  '**/vite.config.js'
];

export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/vendor/**',
  '**/venv/**',
  '**/__pycache__/**',
  '**/.next/**',
  '**/.cache/**'
];

export const DEFAULT_CONFIG: EnvGuardConfig = {
  severity: {
    fail_on: 'high'
  },
  entropy: {
    enabled: true,
    threshold: 4.2
  },
  output: {
    mask: true
  },
  rules: {
    disabled: [],
    packs: ['node', 'python', 'docker', 'github-actions', 'ci'],
    custom: []
  },
  allow: [],
  scan: {
    max_file_mb: 2,
    timeout_seconds: 0,
    include_gitignored: false
  },
  include: DEFAULT_INCLUDE_PATTERNS,
  exclude: []
};
