import fs from 'node:fs/promises';
import path from 'node:path';
import picomatch from 'picomatch';
import { applyBaseline, defaultBaselinePath, findingFingerprint, loadBaseline } from './baseline.js';
import { DEFAULT_CONFIG, DEFAULT_EXCLUDE_PATTERNS, REPORT_SCHEMA_VERSION, VERSION } from './defaults.js';
import { loadConfig } from './config.js';
import { dedupeFindings } from './dedupe.js';
import { detectFindings } from './detector.js';
import { maskSensitivePreview } from './masking.js';
import { parseScannedFile } from './parser.js';
import { calculateRiskScore } from './riskScore.js';
import { getRule } from './rules/catalog.js';
import {
  SEVERITIES,
  SEVERITY_RANK,
  type EnvGuardConfig,
  type EnvEntry,
  type Finding,
  type ScannedFile,
  type ScanOptions,
  type ScanResult,
  type Severity
} from './types.js';
import { resolveScanRoot, discoverFiles } from './walk.js';
import { normalizePath } from './utils/path.js';

function sortFindings(a: Finding, b: Finding): number {
  const severityDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
  if (severityDiff !== 0) {
    return severityDiff;
  }

  const riskDiff = b.riskScore - a.riskScore;
  if (riskDiff !== 0) {
    return riskDiff;
  }

  const pathDiff = a.filePath.localeCompare(b.filePath);
  if (pathDiff !== 0) {
    return pathDiff;
  }

  return a.line - b.line;
}

function envDirectory(file: ScannedFile): string {
  return path.posix.dirname(normalizePath(file.relativePath));
}

function isRuntimeEnvFile(file: ScannedFile): boolean {
  const base = path.posix.basename(normalizePath(file.relativePath)).toLowerCase();
  return file.kind === 'env' && base.startsWith('.env') && !base.includes('example') && !base.includes('sample') && !base.includes('template') && !base.includes('schema');
}

function isSchemaEnvFile(file: ScannedFile): boolean {
  const base = path.posix.basename(normalizePath(file.relativePath)).toLowerCase();
  return file.kind === 'env' && (base.includes('example') || base.includes('sample') || base.includes('template') || base.includes('schema'));
}

function entryMap(entries: EnvEntry[]): Map<string, EnvEntry> {
  return new Map(entries.map((entry) => [entry.key, entry]));
}

function makeProjectFinding(
  file: ScannedFile,
  config: EnvGuardConfig,
  disabledRules: Set<string>,
  ruleId: string,
  entry: EnvEntry,
  message?: string
): Finding | undefined {
  if (disabledRules.has(ruleId)) {
    return undefined;
  }

  const rule = getRule(ruleId);
  const preview = config.output.mask ? maskSensitivePreview(entry.raw, entry.value) : entry.raw;
  return {
    id: '',
    fingerprint: '',
    ruleId,
    title: rule.title,
    category: rule.category,
    severity: rule.severity,
    confidence: rule.confidence,
    riskScore: calculateRiskScore({
      severity: rule.severity,
      confidence: rule.confidence,
      filePath: file.relativePath,
      ruleId
    }),
    filePath: normalizePath(file.relativePath),
    line: entry.line,
    preview,
    message: message ?? rule.description,
    fix: rule.fix,
    key: entry.key
  };
}

function detectEnvSchemaDrift(
  files: ScannedFile[],
  config: EnvGuardConfig,
  disabledRules: Set<string>
): Finding[] {
  const findings: Finding[] = [];
  const schemas = files.filter(isSchemaEnvFile);
  if (schemas.length === 0) {
    return findings;
  }

  for (const runtime of files.filter(isRuntimeEnvFile)) {
    const schema = schemas.find((candidate) => envDirectory(candidate) === envDirectory(runtime));
    if (!schema) {
      continue;
    }

    const runtimeEntries = entryMap(runtime.env);
    const schemaEntries = entryMap(schema.env);

    for (const [key, entry] of runtimeEntries) {
      if (!schemaEntries.has(key)) {
        const finding = makeProjectFinding(
          runtime,
          config,
          disabledRules,
          'env-schema-missing-key',
          entry,
          `${key} appears in ${runtime.relativePath} but not in ${schema.relativePath}.`
        );
        if (finding) findings.push(finding);
      }
    }

    for (const [key, entry] of schemaEntries) {
      if (!runtimeEntries.has(key)) {
        const finding = makeProjectFinding(
          schema,
          config,
          disabledRules,
          'env-schema-extra-key',
          entry,
          `${key} appears in ${schema.relativePath} but not in ${runtime.relativePath}.`
        );
        if (finding) findings.push(finding);
      }
    }
  }

  return findings;
}

function summarize(findings: Finding[], filesScanned: number, skippedFiles: number): ScanResult['summary'] {
  const bySeverity = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])) as Record<
    Severity,
    number
  >;

  for (const finding of findings) {
    bySeverity[finding.severity] += 1;
  }

  const highestSeverity = [...SEVERITIES].reverse().find((severity) => bySeverity[severity] > 0);

  return {
    filesScanned,
    findings: findings.length,
    bySeverity,
    highestSeverity,
    skippedFiles
  };
}

function findingKey(finding: Finding): string | undefined {
  if (finding.key) {
    return finding.key;
  }

  return finding.preview.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=/)?.[1];
}

function isAllowed(finding: Finding, config: EnvGuardConfig): boolean {
  const now = Date.now();

  return config.allow.some((allow) => {
    if (allow.expires) {
      const expiresAt = Date.parse(allow.expires);
      if (!Number.isNaN(expiresAt) && expiresAt <= now) {
        return false;
      }
    }

    if (allow.fingerprint && allow.fingerprint !== finding.fingerprint) {
      return false;
    }

    if (allow.ruleId && allow.ruleId !== finding.ruleId) {
      return false;
    }

    if (allow.path) {
      const matchesPath = picomatch.isMatch(finding.filePath, normalizePath(allow.path));
      if (!matchesPath) {
        return false;
      }
    }

    if (allow.key && allow.key !== findingKey(finding)) {
      return false;
    }

    return Boolean(allow.fingerprint || allow.ruleId || allow.path || allow.key);
  });
}

async function resolveTargetFiles(
  targetPath: string,
  cwd: string,
  config: EnvGuardConfig,
  targetFiles?: string[]
): Promise<{ root: string; files: string[] }> {
  if (!targetFiles) {
    throw new Error('targetFiles are required');
  }

  const root = await resolveScanRoot(targetPath, cwd);
  const files: string[] = [];
  const ignore = [...DEFAULT_EXCLUDE_PATTERNS, ...config.exclude].map(normalizePath);
  for (const file of targetFiles) {
    const absolute = path.resolve(cwd, file);
    const relative = normalizePath(path.relative(root, absolute));
    if (!picomatch.isMatch(relative, config.include) || picomatch.isMatch(relative, ignore)) {
      continue;
    }

    const stat = await fs.stat(absolute);
    if (stat.isFile()) {
      files.push(absolute);
    }
  }

  return {
    root,
    files: [...new Set(files)].sort((a, b) => a.localeCompare(b))
  };
}

export async function scan(targetPath: string, options: ScanOptions = {}): Promise<ScanResult> {
  const cwd = options.cwd ?? process.cwd();
  const loaded = await loadConfig(cwd);
  const config = loaded.config ?? DEFAULT_CONFIG;
  const { root, files } = options.targetFiles
    ? await resolveTargetFiles(targetPath, cwd, config, options.targetFiles)
    : await discoverFiles(targetPath, cwd, config);
  const disabledRules = new Set(config.rules.disabled);

  const findings: Finding[] = [];
  const scannedFiles: ScannedFile[] = [];
  let skippedFiles = 0;
  const startedAt = Date.now();
  const timeoutMs = config.scan.timeout_seconds > 0 ? config.scan.timeout_seconds * 1000 : 0;

  for (const filePath of files) {
    if (timeoutMs > 0 && Date.now() - startedAt > timeoutMs) {
      skippedFiles += 1;
      continue;
    }

    const stat = await fs.stat(filePath);
    if (stat.size > config.scan.max_file_mb * 1024 * 1024) {
      skippedFiles += 1;
      continue;
    }

    const content = await fs.readFile(filePath, 'utf8');
    const scannedFile = parseScannedFile(root, filePath, content);
    scannedFiles.push(scannedFile);
    findings.push(
      ...detectFindings(scannedFile, {
        root,
        entropyEnabled: config.entropy.enabled,
        entropyThreshold: config.entropy.threshold,
        maskOutput: config.output.mask,
        disabledRules,
        customRules: config.rules.custom
      })
    );
  }

  findings.push(...detectEnvSchemaDrift(scannedFiles, config, disabledRules));

  const sortedFindings = dedupeFindings(findings)
    .sort(sortFindings)
    .map((finding, index) => ({
      ...finding,
      fingerprint: findingFingerprint(finding),
      id: `ENV-${String(index + 1).padStart(3, '0')}`
    }));

  const allowedFindings = sortedFindings.filter((finding) => !isAllowed(finding, config));
  const baselinePath = options.baselinePath ?? defaultBaselinePath(cwd);
  const baselineFingerprints =
    options.useBaseline === false ? new Set<string>() : await loadBaseline(baselinePath);
  const visibleFindings = applyBaseline(allowedFindings, baselineFingerprints).map(
    (finding, index) => ({
      ...finding,
      id: `ENV-${String(index + 1).padStart(3, '0')}`
    })
  );

  return {
    tool: 'envguard',
    version: VERSION,
    schemaVersion: REPORT_SCHEMA_VERSION,
    targetPath,
    generatedAt: new Date().toISOString(),
    configPath: loaded.configPath,
    summary: summarize(visibleFindings, files.length - skippedFiles, skippedFiles),
    findings: visibleFindings
  };
}

export function shouldFail(result: ScanResult, failOn: Severity): boolean {
  return result.findings.some(
    (finding) => SEVERITY_RANK[finding.severity] >= SEVERITY_RANK[failOn]
  );
}
