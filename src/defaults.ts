import type { EnvGuardConfig } from './types.js';

export const VERSION = '0.1.0';

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
  '**/docker-compose.{yml,yaml}',
  '**/Dockerfile',
  '**/Dockerfile.*',
  '**/.github/workflows/*.{yml,yaml}',
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
    disabled: []
  },
  include: DEFAULT_INCLUDE_PATTERNS,
  exclude: []
};
