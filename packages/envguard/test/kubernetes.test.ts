import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scan } from '../src/index.js';

describe('Kubernetes and Helm detection', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'envguard-k8s-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('detects structured workload and Secret risks with masked output', async () => {
    const manifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: unsafe
spec:
  template:
    spec:
      hostNetwork: true
      securityContext:
        runAsUser: 0
      containers:
        - name: app
          image: nginx:latest
          securityContext:
            privileged: true
            capabilities:
              add: [SYS_ADMIN]
          env:
            - name: DATABASE_PASSWORD
              value: literal-kubernetes-password
            - name: LOG_LEVEL
              value: info
      volumes:
        - name: host
          hostPath:
            path: /etc
---
apiVersion: v1
kind: Secret
metadata:
  name: literal
stringData:
  API_TOKEN: literal-secret-token-value
`;
    await fs.writeFile(path.join(tmpDir, 'deployment.yaml'), manifest, 'utf8');

    const result = await scan({ cwd: tmpDir, useBaseline: false });
    const ruleIds = new Set(result.findings.map((finding) => finding.ruleId));

    for (const expected of [
      'k8s-privileged',
      'k8s-host-network',
      'k8s-host-path',
      'k8s-run-as-root',
      'k8s-dangerous-capability',
      'k8s-unpinned-image',
      'k8s-literal-secret'
    ]) {
      expect(ruleIds.has(expected)).toBe(true);
    }
    expect(JSON.stringify(result)).not.toContain('literal-kubernetes-password');
    expect(JSON.stringify(result)).not.toContain('literal-secret-token-value');
    expect(result.findings.some((finding) => finding.preview.includes('LOG_LEVEL'))).toBe(false);
  });

  it('does not flag a hardened workload or secret references', async () => {
    const manifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: safe
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      containers:
        - name: app
          image: nginx@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
          securityContext:
            privileged: false
            capabilities:
              drop: [ALL]
          env:
            - name: DATABASE_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app
                  key: password
`;
    await fs.writeFile(path.join(tmpDir, 'deployment.yaml'), manifest, 'utf8');

    const result = await scan({ cwd: tmpDir, useBaseline: false });
    expect(result.findings.filter((finding) => finding.category === 'kubernetes')).toHaveLength(0);
  });

  it('understands pinned and floating Helm image values', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'values.yaml'),
      ['image:', '  repository: nginx', '  tag: "1.29.0"', 'apiToken: replace-me'].join('\n'),
      'utf8'
    );
    const pinned = await scan({ cwd: tmpDir, useBaseline: false });
    expect(pinned.findings.some((finding) => finding.ruleId === 'k8s-unpinned-image')).toBe(false);

    await fs.writeFile(
      path.join(tmpDir, 'values.yaml'),
      ['image:', '  repository: nginx', '  tag: latest', 'apiToken: helm-literal-secret-value'].join('\n'),
      'utf8'
    );
    const floating = await scan({ cwd: tmpDir, useBaseline: false });
    expect(floating.findings.some((finding) => finding.ruleId === 'k8s-unpinned-image')).toBe(true);
    expect(floating.findings.some((finding) => finding.ruleId === 'k8s-literal-secret')).toBe(true);
    expect(JSON.stringify(floating)).not.toContain('helm-literal-secret-value');
  });

  it('parses multi-document YAML and keeps malformed YAML recoverable', async () => {
    await fs.writeFile(path.join(tmpDir, 'valid.yaml'), 'apiVersion: v1\nkind: ConfigMap\n---\napiVersion: v1\nkind: Service\n', 'utf8');
    await fs.writeFile(path.join(tmpDir, 'broken.yaml'), 'apiVersion: [broken', 'utf8');

    const result = await scan({ cwd: tmpDir, useBaseline: false });
    expect(result.errors).toContainEqual(expect.objectContaining({ code: 'MALFORMED_YAML', recoverable: true }));
  });
});
