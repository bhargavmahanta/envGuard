import assert from 'node:assert/strict';
import { scan } from '@bhargavmahanta/envguard';
import { formatJsonReport } from '@bhargavmahanta/envguard/reporters';

const result = await scan({ target: './sample', cwd: process.cwd(), useBaseline: false });
assert.ok(Array.isArray(result.findings));
assert.equal(JSON.parse(formatJsonReport(result)).tool, 'envguard');
