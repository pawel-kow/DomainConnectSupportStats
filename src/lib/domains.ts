import { findTable } from './data/tables';
import type { ExportFile, Manifest, Row } from './data/types';
import { formatCount, formatDate } from './format';

/**
 * Domain figures show as shares of the scanned domains; the counts behind them go into hover text
 * that names the scan: "80M of 190.6M scanned domains in the partial scan of 05-09-2026".
 */

/** The scan behind domain figures: its scanned domains and how to name it. */
export interface Scan {
  scannedDomains: number | null;
  /** E.g. "partial scan of 01-06-2026". */
  label: string;
}

type ScanRow = Partial<Pick<Row, 'sample_percent' | 'started_at' | 'completed_at'>>;

/** "full scan" for a census, "partial scan" for a sample, "scan" when unknown; dated when known. */
export function scanLabel(row: ScanRow | undefined): string {
  const pct = row?.sample_percent;
  const kind = pct === 100 ? 'full scan' : typeof pct === 'number' ? 'partial scan' : 'scan';
  const at = row?.started_at ?? row?.completed_at;
  return typeof at === 'string' ? `${kind} of ${formatDate(at)}` : kind;
}

/** An import's scan named from the overview's `adoption` rows; "scan" when it is not there. */
export function importScanLabel(adoption: Row[], importId: unknown): string {
  return scanLabel(importId === null ? undefined : adoption.find((r) => r.import_id === importId));
}

/** The domain-share import as a scan; null without one. Dated from the overview's `adoption`. */
export function shareScan(manifest: Manifest, overview: ExportFile | null): Scan | null {
  const share = manifest.share_import;
  if (!share) return null;
  const row = overview
    ? findTable(overview, 'adoption')?.rows.find((r) => r.import_id === share.import_id)
    : undefined;
  return {
    scannedDomains: share.scanned_domains,
    label: scanLabel({
      sample_percent: share.sample_percent ?? null,
      started_at: row?.started_at ?? null,
      completed_at: row?.completed_at ?? null,
    }),
  };
}

/** "<domains> of <scanned> scanned domains in the <label>"; undefined when `domains` is unknown. */
export function ofScanned(
  domains: number | null | undefined,
  scanned: number | null | undefined,
  label: string,
): string | undefined {
  if (domains === null || domains === undefined) return undefined;
  return `${formatCount(domains)} of ${formatCount(scanned)} scanned domains in the ${label}`;
}

/** Hover text of a domain share of the domain-share import. */
export function domainsTitle(
  domains: number | null | undefined,
  scan: Scan | null,
): string | undefined {
  return scan ? ofScanned(domains, scan.scannedDomains, scan.label) : undefined;
}
