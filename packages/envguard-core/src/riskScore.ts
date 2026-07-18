import { CONFIDENCE_RANK, SEVERITY_RANK, type Confidence, type Severity } from './types.js';
import { isExampleTemplatePath, isGithubWorkflowPath, isProductionPath } from './utils/path.js';

const SEVERITY_BASE: Record<Severity, number> = {
  info: 5,
  low: 20,
  medium: 45,
  high: 70,
  critical: 85
};

export function calculateRiskScore(input: {
  severity: Severity;
  confidence: Confidence;
  filePath: string;
  ruleId: string;
}): number {
  let score = SEVERITY_BASE[input.severity];

  score += CONFIDENCE_RANK[input.confidence] * 5;

  if (input.filePath.includes('.env')) {
    score += 8;
  }

  if (isGithubWorkflowPath(input.filePath)) {
    score += 5;
  }

  if (isProductionPath(input.filePath)) {
    score += 7;
  }

  if (input.ruleId.includes('private-key') || input.ruleId.includes('database-url')) {
    score += 8;
  }

  if (isExampleTemplatePath(input.filePath)) {
    score -= 20;
  }

  if (SEVERITY_RANK[input.severity] <= SEVERITY_RANK.low) {
    score = Math.min(score, 39);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
