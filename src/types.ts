export const SEVERITIES = ['info', 'low', 'medium', 'high', 'critical'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const CONFIDENCES = ['low', 'medium', 'high'] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export type OutputFormat = 'terminal' | 'json' | 'markdown' | 'sarif' | 'github';

export type DetectionCategory =
  | 'secret'
  | 'weak-secret'
  | 'runtime'
  | 'cors'
  | 'docker'
  | 'github-actions'
  | 'ci'
  | 'env-hygiene'
  | 'schema'
  | 'custom'
  | 'entropy';

export type FileKind = 'env' | 'yaml' | 'dockerfile' | 'github-actions' | 'gitlab-ci' | 'circleci' | 'text';

export interface CustomRuleConfig {
  id: string;
  severity: Severity;
  confidence: Confidence;
  file_globs: string[];
  pattern: string;
  message: string;
  fix: string;
}

export interface AllowConfig {
  ruleId?: string;
  path?: string;
  key?: string;
  fingerprint?: string;
  reason: string;
  owner: string;
  expires?: string;
}

export interface EnvGuardConfig {
  severity: {
    fail_on: Severity;
  };
  entropy: {
    enabled: boolean;
    threshold: number;
  };
  output: {
    mask: boolean;
  };
  rules: {
    disabled: string[];
    packs: string[];
    custom: CustomRuleConfig[];
  };
  allow: AllowConfig[];
  scan: {
    max_file_mb: number;
    timeout_seconds: number;
    include_gitignored: boolean;
  };
  include: string[];
  exclude: string[];
}

export interface LoadedConfig {
  config: EnvGuardConfig;
  configPath?: string;
}

export interface RuleMeta {
  id: string;
  title: string;
  category: DetectionCategory;
  severity: Severity;
  confidence: Confidence;
  description: string;
  fix: string;
}

export interface Finding {
  id: string;
  fingerprint: string;
  ruleId: string;
  title: string;
  category: DetectionCategory;
  severity: Severity;
  confidence: Confidence;
  riskScore: number;
  filePath: string;
  line: number;
  preview: string;
  message: string;
  fix: string;
  key?: string;
}

export interface EnvEntry {
  key: string;
  value: string;
  line: number;
  raw: string;
}

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  kind: FileKind;
  content: string;
  lines: string[];
  env: EnvEntry[];
  yaml?: unknown;
}

export interface ScanOptions {
  cwd?: string;
  baselinePath?: string;
  useBaseline?: boolean;
  targetFiles?: string[];
}

export interface ScanSummary {
  filesScanned: number;
  findings: number;
  bySeverity: Record<Severity, number>;
  highestSeverity?: Severity;
  skippedFiles: number;
}

export interface ScanResult {
  tool: 'envguard';
  version: string;
  schemaVersion: '1.0.0';
  targetPath: string;
  generatedAt: string;
  configPath?: string;
  summary: ScanSummary;
  findings: Finding[];
}

export interface BaselineFile {
  tool: 'envguard';
  schemaVersion: '1.0.0';
  generatedAt: string;
  findings: Array<{
    fingerprint: string;
    ruleId: string;
    filePath: string;
    line: number;
    title: string;
    reason?: string;
    owner?: string;
    expires?: string;
  }>;
}

export const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

export const CONFIDENCE_RANK: Record<Confidence, number> = {
  low: 0,
  medium: 1,
  high: 2
};
