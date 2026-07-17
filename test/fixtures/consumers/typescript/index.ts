import { createScanner, type ScanResult } from '@bhargavmahanta/envguard';
import { formatSarifReport } from '@bhargavmahanta/envguard/reporters';

const scanner = createScanner({ useBaseline: false });
const result: ScanResult = await scanner.scan('./sample');
JSON.parse(formatSarifReport(result));
