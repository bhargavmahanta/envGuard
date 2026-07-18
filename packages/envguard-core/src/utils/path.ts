import path from 'node:path';

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function relativeNormalized(root: string, absolutePath: string): string {
  return normalizePath(path.relative(root, absolutePath));
}

export function isPathInside(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
  );
}

export function isExampleTemplatePath(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  return (
    normalized.endsWith('.env.example') ||
    normalized.endsWith('.env.sample') ||
    normalized.endsWith('.env.template') ||
    normalized.includes('/fixtures/')
  );
}

export function isProductionPath(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  return (
    normalized.includes('production') ||
    normalized.includes('prod') ||
    normalized.endsWith('.env')
  );
}

export function lineNumberForIndex(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

export function isDockerfilePath(filePath: string): boolean {
  const base = path.posix.basename(normalizePath(filePath));
  return base === 'Dockerfile' || base.startsWith('Dockerfile.');
}

export function isComposePath(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  return /(^|\/)docker-compose[^/]*\.ya?ml$/.test(normalized);
}

export function isGithubWorkflowPath(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  return normalized.includes('.github/workflows/') && /\.(ya?ml)$/.test(normalized);
}

export function isGitlabCiPath(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  return normalized.endsWith('.gitlab-ci.yml') || normalized.endsWith('.gitlab-ci.yaml');
}

export function isCircleCiPath(filePath: string): boolean {
  const normalized = normalizePath(filePath).toLowerCase();
  return normalized.endsWith('.circleci/config.yml') || normalized.endsWith('.circleci/config.yaml');
}

export function isHelmValuesPath(filePath: string): boolean {
  const base = path.posix.basename(normalizePath(filePath)).toLowerCase();
  return /^values(?:[.-][^/]*)?\.ya?ml$/.test(base);
}
