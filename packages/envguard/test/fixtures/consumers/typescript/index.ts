import { createScanner, type ScanResult } from '@bhargavmahanta/envguard';
import { formatSarifReport } from '@bhargavmahanta/envguard/reporters';
import { scan as scanCore } from '@bhargavmahanta/envguard-core';
import { formatJsonReport } from '@bhargavmahanta/envguard-reporters';
import { createEnvGuardMcpServer } from '@bhargavmahanta/envguard-mcp';

const scanner = createScanner({ useBaseline: false });
const result: ScanResult = await scanner.scan('./sample');
JSON.parse(formatSarifReport(result));
JSON.parse(formatJsonReport(await scanCore('./sample')));
void createEnvGuardMcpServer;
