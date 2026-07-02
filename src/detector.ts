import fs from 'node:fs';
import path from 'node:path';
import { isHighEntropy } from './entropy.js';
import { maskSensitivePreview } from './masking.js';
import { calculateRiskScore } from './riskScore.js';
import { getRule } from './rules/catalog.js';
import { SEVERITY_RANK, type EnvEntry, type Finding, type ScannedFile, type Severity } from './types.js';
import {
  isComposePath,
  isExampleTemplatePath,
  isGithubWorkflowPath,
  isProductionPath,
  lineNumberForIndex,
  normalizePath
} from './utils/path.js';

export interface DetectionContext {
  root: string;
  entropyEnabled: boolean;
  entropyThreshold: number;
  maskOutput: boolean;
  disabledRules: Set<string>;
}

type FindingOverride = Partial<Pick<Finding, 'severity' | 'confidence' | 'message' | 'fix'>>;

const WEAK_VALUES = new Set([
  'secret',
  'password',
  'changeme',
  'change-me',
  'change_me',
  'dummy',
  'example',
  'test',
  'testing',
  'default',
  'admin',
  '123456',
  'your_secret_here',
  'your-secret-here',
  'your_api_key',
  'your-api-key',
  '<generate-a-strong-random-secret>'
]);

const PLACEHOLDER_VALUES = new Set([
  'placeholder',
  'replace_me',
  'replace-me',
  'your_secret_here',
  'your-secret-here',
  'your_api_key',
  'your-api-key',
  '<your-local-database-url>',
  '<generate-a-strong-random-secret>'
]);

const SPECIFIC_SECRET_REGEXES = [
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
];

const SECRET_PATTERNS: Array<{
  ruleId: string;
  regex: RegExp;
  secretGroup?: number;
}> = [
  { ruleId: 'aws-access-key', regex: /\bAKIA[0-9A-Z]{16}\b/g },
  {
    ruleId: 'github-token',
    regex: /\bgh[pousr]_[A-Za-z0-9_]{30,}\b/g
  },
  {
    ruleId: 'stripe-secret-key',
    regex: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g
  },
  {
    ruleId: 'slack-token',
    regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g
  },
  {
    ruleId: 'google-api-key',
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g
  },
  {
    ruleId: 'private-key',
    regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g
  },
  {
    ruleId: 'jwt-token',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g
  },
  {
    ruleId: 'database-url-password',
    regex: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/@]+:([^@\s]+)@[^ \t\r\n'")]+/gi,
    secretGroup: 1
  },
  {
    ruleId: 'bearer-token',
    regex: /\bBearer\s+([A-Za-z0-9._-]{20,})\b/g,
    secretGroup: 1
  },
  {
    ruleId: 'webhook-url',
    regex:
      /https:\/\/(?:hooks\.slack\.com\/services\/[A-Za-z0-9/]+|discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+)/g
  }
];

function normalizeValue(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '').toLowerCase();
}

function isSuspiciousKey(key: string): boolean {
  return /(secret|token|api[_-]?key|password|passwd|pwd|private[_-]?key|access[_-]?key)/i.test(key);
}

function valueLooksFake(value: string): boolean {
  const normalized = normalizeValue(value);
  return (
    normalized.length === 0 ||
    WEAK_VALUES.has(normalized) ||
    PLACEHOLDER_VALUES.has(normalized) ||
    normalized.includes('example') ||
    normalized.includes('placeholder') ||
    normalized.includes('changeme') ||
    normalized.includes('dummy')
  );
}

function matchesSpecificSecret(value: string): boolean {
  return SPECIFIC_SECRET_REGEXES.some((regex) => regex.test(value));
}

function linePreview(file: ScannedFile, line: number, fallback: string): string {
  return file.lines[line - 1] ?? fallback;
}

function lowerSeverity(severity: Severity): Severity {
  if (severity === 'critical') return 'high';
  if (severity === 'high') return 'medium';
  if (severity === 'medium') return 'low';
  if (severity === 'low') return 'info';
  return 'info';
}

function makeFinding(
  file: ScannedFile,
  context: DetectionContext,
  ruleId: string,
  line: number,
  preview: string,
  secret?: string,
  override: FindingOverride = {}
): Finding | undefined {
  if (context.disabledRules.has(ruleId)) {
    return undefined;
  }

  if (isInlineSuppressed(file, line, ruleId)) {
    return undefined;
  }

  const rule = getRule(ruleId);
  let severity = override.severity ?? rule.severity;
  let confidence = override.confidence ?? rule.confidence;

  if (isExampleTemplatePath(file.relativePath) && rule.category !== 'weak-secret') {
    severity = lowerSeverity(severity);
    if (confidence === 'high') {
      confidence = 'medium';
    }
  }

  const safePreview = context.maskOutput ? maskSensitivePreview(preview.trim(), secret) : preview.trim();

  return {
    id: '',
    fingerprint: '',
    ruleId,
    title: rule.title,
    category: rule.category,
    severity,
    confidence,
    riskScore: calculateRiskScore({
      severity,
      confidence,
      filePath: file.relativePath,
      ruleId
    }),
    filePath: file.relativePath,
    line,
    preview: safePreview,
    message: override.message ?? rule.description,
    fix: override.fix ?? rule.fix
  };
}

function suppressionMatches(comment: string, ruleId: string): boolean {
  const match = comment.match(/envguard-disable-(?:next-line|line)(?:\s+([A-Za-z0-9_,.-]+))?/);
  if (!match) {
    return false;
  }

  if (!match[1]) {
    return true;
  }

  return match[1]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(ruleId);
}

function isInlineSuppressed(file: ScannedFile, line: number, ruleId: string): boolean {
  const sameLine = file.lines[line - 1] ?? '';
  const previousLine = file.lines[line - 2] ?? '';

  return (
    /envguard-disable-line/.test(sameLine) &&
    suppressionMatches(sameLine, ruleId)
  ) || (
    /envguard-disable-next-line/.test(previousLine) &&
    suppressionMatches(previousLine, ruleId)
  );
}

function pushFinding(findings: Finding[], finding: Finding | undefined): void {
  if (finding) {
    findings.push(finding);
  }
}

function detectSpecificSecrets(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  for (const pattern of SECRET_PATTERNS) {
    for (const match of file.content.matchAll(pattern.regex)) {
      const index = match.index ?? 0;
      const line = lineNumberForIndex(file.content, index);
      const secret = pattern.secretGroup ? match[pattern.secretGroup] : match[0];
      pushFinding(
        findings,
        makeFinding(file, context, pattern.ruleId, line, linePreview(file, line, match[0]), secret)
      );
    }
  }

  for (const entry of file.env) {
    if (!/^AWS_SECRET_ACCESS_KEY$/i.test(entry.key)) {
      continue;
    }

    if (valueLooksFake(entry.value) || entry.value.length < 30) {
      continue;
    }

    pushFinding(
      findings,
      makeFinding(file, context, 'aws-secret-key', entry.line, entry.raw, entry.value)
    );
  }
}

function detectGenericSecrets(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  for (const entry of file.env) {
    if (!isSuspiciousKey(entry.key) || valueLooksFake(entry.value) || matchesSpecificSecret(entry.value)) {
      continue;
    }

    if (entry.value.length >= 20 || isHighEntropy(entry.value, context.entropyThreshold)) {
      pushFinding(
        findings,
        makeFinding(file, context, 'generic-api-key', entry.line, entry.raw, entry.value)
      );
    }
  }

  file.lines.forEach((raw, index) => {
    const match = raw.match(
      /\b([A-Za-z_][A-Za-z0-9_.-]*(?:SECRET|TOKEN|PASSWORD|API_KEY|ACCESS_KEY)[A-Za-z0-9_.-]*)\b\s*[:=]\s*['"]?([A-Za-z0-9_./+=:-]{20,})['"]?/i
    );

    if (!match || valueLooksFake(match[2]) || matchesSpecificSecret(match[2])) {
      return;
    }

    pushFinding(
      findings,
      makeFinding(file, context, 'generic-api-key', index + 1, raw, match[2])
    );
  });
}

function detectWeakSecrets(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  for (const entry of file.env) {
    const key = entry.key.toUpperCase();
    const value = normalizeValue(entry.value);

    if (key.includes('JWT_SECRET') && WEAK_VALUES.has(value)) {
      pushFinding(
        findings,
        makeFinding(file, context, 'weak-jwt-secret', entry.line, entry.raw, entry.value)
      );
      continue;
    }

    if (key.includes('SESSION_SECRET') && WEAK_VALUES.has(value)) {
      pushFinding(
        findings,
        makeFinding(file, context, 'weak-session-secret', entry.line, entry.raw, entry.value)
      );
      continue;
    }

    if (key.includes('PASSWORD') && ['password', 'admin', '123456', 'default'].includes(value)) {
      pushFinding(
        findings,
        makeFinding(file, context, 'weak-password', entry.line, entry.raw, entry.value)
      );
      continue;
    }

    if ((key.includes('API_KEY') || key.includes('TOKEN')) && ['dummy', 'example', 'test'].includes(value)) {
      pushFinding(
        findings,
        makeFinding(file, context, 'dummy-api-key', entry.line, entry.raw, entry.value)
      );
      continue;
    }

    if (isSuspiciousKey(key) && (PLACEHOLDER_VALUES.has(value) || value.includes('your_'))) {
      pushFinding(
        findings,
        makeFinding(file, context, 'placeholder-secret', entry.line, entry.raw, entry.value)
      );
    }
  }
}

function detectRuntimeSettings(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  for (const entry of file.env) {
    const key = entry.key.toUpperCase();
    const value = normalizeValue(entry.value);

    if ((key === 'DEBUG' || key === 'APP_DEBUG') && ['true', '1', 'yes'].includes(value)) {
      pushFinding(findings, makeFinding(file, context, 'debug-enabled', entry.line, entry.raw, entry.value));
    }

    if (key === 'NODE_ENV' && value === 'development' && isProductionPath(file.relativePath)) {
      pushFinding(
        findings,
        makeFinding(file, context, 'node-dev-production', entry.line, entry.raw, entry.value)
      );
    }

    if (key === 'FLASK_ENV' && value === 'development') {
      pushFinding(findings, makeFinding(file, context, 'flask-dev-env', entry.line, entry.raw, entry.value));
    }

    if (key === 'DJANGO_DEBUG' && ['true', '1', 'yes'].includes(value)) {
      pushFinding(findings, makeFinding(file, context, 'django-debug', entry.line, entry.raw, entry.value));
    }

    if ((key === 'VERIFY_SSL' || key === 'SSL_VERIFY') && ['false', '0', 'no'].includes(value)) {
      pushFinding(findings, makeFinding(file, context, 'ssl-disabled', entry.line, entry.raw, entry.value));
    }

    if (key === 'TLS_REJECT_UNAUTHORIZED' && value === '0') {
      pushFinding(findings, makeFinding(file, context, 'tls-disabled', entry.line, entry.raw, entry.value));
    }

    if (key === 'LOG_LEVEL' && value === 'debug') {
      const severity: Severity = isProductionPath(file.relativePath) ? 'medium' : 'low';
      pushFinding(
        findings,
        makeFinding(file, context, 'debug-logging', entry.line, entry.raw, entry.value, { severity })
      );
    }
  }
}

function detectCors(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  const wildcardEntries: EnvEntry[] = [];
  const credentialEntries: EnvEntry[] = [];

  for (const entry of file.env) {
    const key = entry.key.toUpperCase();
    const value = normalizeValue(entry.value);

    if (
      ['CORS_ORIGIN', 'ACCESS_CONTROL_ALLOW_ORIGIN'].includes(key) &&
      (value === '*' || value === '"*"')
    ) {
      wildcardEntries.push(entry);
      pushFinding(findings, makeFinding(file, context, 'cors-wildcard', entry.line, entry.raw, entry.value));
    }

    if (key === 'ALLOWED_ORIGINS' && value === '*') {
      wildcardEntries.push(entry);
      pushFinding(
        findings,
        makeFinding(file, context, 'allowed-origins-wildcard', entry.line, entry.raw, entry.value)
      );
    }

    if (/CREDENTIALS/i.test(key) && ['true', '1', 'yes'].includes(value)) {
      credentialEntries.push(entry);
    }
  }

  if (wildcardEntries.length > 0 && credentialEntries.length > 0) {
    const credential = credentialEntries[0];
    pushFinding(
      findings,
      makeFinding(
        file,
        context,
        'cors-credentials-wildcard',
        credential.line,
        credential.raw,
        credential.value
      )
    );
  }

  file.lines.forEach((raw, index) => {
    if (/origin\s*:\s*['"]?\*/i.test(raw)) {
      pushFinding(findings, makeFinding(file, context, 'cors-wildcard', index + 1, raw));
    }
  });
}

function hasDockerignore(root: string): boolean {
  return fs.existsSync(path.join(root, '.dockerignore'));
}

function detectDockerfile(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  if (file.kind !== 'dockerfile') {
    return;
  }

  let hasUserInstruction = false;
  const dockerignorePresent = hasDockerignore(context.root);

  file.lines.forEach((raw, index) => {
    const line = raw.trim();
    if (/^USER\s+\S+/i.test(line)) {
      hasUserInstruction = true;
    }

    if (/^(COPY|ADD)\s+.*(?:^|\s)\.env(?:\s|$)/i.test(line)) {
      pushFinding(findings, makeFinding(file, context, 'docker-copy-dotenv', index + 1, raw));
    }

    if (/^COPY\s+\.\s+\./i.test(line) && !dockerignorePresent) {
      pushFinding(
        findings,
        makeFinding(file, context, 'docker-copy-all', index + 1, raw, undefined, {
          message: 'COPY . . is used and no .dockerignore file was found at the scan root.'
        })
      );
    }

    if (
      /^FROM\s+\S+(?::latest)?(?:\s|$)/i.test(line) &&
      !/^FROM\s+\S+:[^@\s]+/i.test(line) &&
      !/^FROM\s+\S+@sha256:/i.test(line)
    ) {
      pushFinding(findings, makeFinding(file, context, 'docker-latest-tag', index + 1, raw));
    }

    if (/^FROM\s+\S+:latest(?:\s|$)/i.test(line)) {
      pushFinding(findings, makeFinding(file, context, 'docker-latest-tag', index + 1, raw));
    }
  });

  if (!hasUserInstruction) {
    pushFinding(
      findings,
      makeFinding(file, context, 'docker-root-user', 1, file.lines[0] ?? 'Dockerfile has no USER instruction')
    );
  }
}

function detectCompose(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  if (!isComposePath(file.relativePath)) {
    return;
  }

  file.lines.forEach((raw, index) => {
    if (/privileged\s*:\s*true/i.test(raw)) {
      pushFinding(findings, makeFinding(file, context, 'compose-privileged', index + 1, raw));
    }

    if (
      /-\s*["']?(?!(?:127\.0\.0\.1|localhost):)(?:0\.0\.0\.0:)?(?:5432|3306|6379):(5432|3306|6379)/.test(
        raw
      )
    ) {
      pushFinding(findings, makeFinding(file, context, 'compose-db-public-port', index + 1, raw));
    }

    const inlineSecret = raw.match(
      /\b([A-Za-z_][A-Za-z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|ACCESS_KEY)[A-Za-z0-9_]*)\b\s*[:=]\s*['"]?([^'"${}\s][^'"#\s]*)/i
    );

    if (inlineSecret && !valueLooksFake(inlineSecret[2])) {
      pushFinding(
        findings,
        makeFinding(file, context, 'compose-inline-secret', index + 1, raw, inlineSecret[2])
      );
    }
  });
}

function detectGithubActions(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  if (!isGithubWorkflowPath(file.relativePath)) {
    return;
  }

  let hasPermissionsBlock = false;

  file.lines.forEach((raw, index) => {
    if (/^\s*permissions\s*:/i.test(raw)) {
      hasPermissionsBlock = true;
    }

    if (/echo\s+.*\$\{\{\s*secrets\.[^}]+}}/i.test(raw)) {
      pushFinding(findings, makeFinding(file, context, 'actions-echo-secret', index + 1, raw));
    }

    if (/\bpull_request_target\b/i.test(raw)) {
      pushFinding(findings, makeFinding(file, context, 'actions-pull-request-target', index + 1, raw));
    }

    const uses = raw.match(/\buses\s*:\s*([^@\s#]+)(?:@([^\s#]+))?/i);
    if (uses) {
      const ref = uses[2];
      if (!ref || /^(main|master|latest|dev)$/i.test(ref)) {
        pushFinding(findings, makeFinding(file, context, 'actions-unpinned', index + 1, raw));
      }
    }

    if (/permissions\s*:\s*write-all/i.test(raw)) {
      pushFinding(findings, makeFinding(file, context, 'actions-broad-permissions', index + 1, raw));
    }

    const literalToken = raw.match(
      /\b(?:TOKEN|API_KEY|SECRET|PASSWORD)\b\s*[:=]\s*['"]?(?!\$\{\{\s*secrets\.)([A-Za-z0-9_./+=-]{20,})/i
    );
    if (literalToken && !valueLooksFake(literalToken[1])) {
      pushFinding(
        findings,
        makeFinding(file, context, 'actions-hardcoded-token', index + 1, raw, literalToken[1])
      );
    }
  });

  if (!hasPermissionsBlock) {
    pushFinding(
      findings,
      makeFinding(
        file,
        context,
        'actions-missing-permissions',
        1,
        file.lines[0] ?? 'Workflow has no explicit permissions block'
      )
    );
  }
}

function detectEntropy(file: ScannedFile, context: DetectionContext, findings: Finding[]): void {
  if (!context.entropyEnabled) {
    return;
  }

  for (const entry of file.env) {
    if (
      !isSuspiciousKey(entry.key) ||
      valueLooksFake(entry.value) ||
      matchesSpecificSecret(entry.value) ||
      !isHighEntropy(entry.value, context.entropyThreshold)
    ) {
      continue;
    }

    pushFinding(
      findings,
      makeFinding(file, context, 'high-entropy-value', entry.line, entry.raw, entry.value)
    );
  }
}

export function detectFindings(file: ScannedFile, context: DetectionContext): Finding[] {
  const findings: Finding[] = [];

  detectSpecificSecrets(file, context, findings);
  detectGenericSecrets(file, context, findings);
  detectWeakSecrets(file, context, findings);
  detectRuntimeSettings(file, context, findings);
  detectCors(file, context, findings);
  detectDockerfile(file, context, findings);
  detectCompose(file, context, findings);
  detectGithubActions(file, context, findings);
  detectEntropy(file, context, findings);

  return findings
    .filter((finding) => SEVERITY_RANK[finding.severity] >= SEVERITY_RANK.info)
    .map((finding) => ({
      ...finding,
      filePath: normalizePath(finding.filePath)
    }));
}
