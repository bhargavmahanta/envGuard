const assert = require('node:assert/strict');
const { scan } = require('@bhargavmahanta/envguard');
const { formatMarkdownReport } = require('@bhargavmahanta/envguard/reporters');

(async () => {
  const result = await scan({ target: './sample', cwd: process.cwd(), useBaseline: false });
  assert.ok(Array.isArray(result.findings));
  assert.match(formatMarkdownReport(result), /^# EnvGuard Report/);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
