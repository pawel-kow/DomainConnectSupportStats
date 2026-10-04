import type { CellValue, Row, Table } from './data/types';

/**
 * The DNS providers list (EXPORT_FORMAT.md "dns-providers.json"): stack filter, rows hidden by
 * default, the derived not-yet-determined column and status badges.
 */

/** Key of the derived column `total - supported_count - unsupported_count`. */
export const UNDETERMINED_KEY = 'undetermined_count';

function num(row: Row | undefined, key: string): number | null {
  const v = row?.[key];
  return typeof v === 'number' ? v : null;
}

/** Template versions neither supported nor not supported: never probed, being retried or failed. */
export function undeterminedCount(row: Row | undefined): number | null {
  const total = num(row, 'total');
  const supported = num(row, 'supported_count');
  const unsupported = num(row, 'unsupported_count');
  return total === null || supported === null || unsupported === null
    ? null
    : total - supported - unsupported;
}

/** Given up, never probed, or no domains in the domain-share import (`null` domains is unknown). */
export function isHiddenByDefault(row: Row): boolean {
  return (
    row.settings_status === 'dead' ||
    row.support_status === 'dead' ||
    row.support_status === null ||
    row.domains === 0
  );
}

export interface DnsProviderList {
  /** The rows to show, in export order, with the derived column. */
  table: Table;
  /** Rows of the stack (or of all) hidden by default. */
  hiddenCount: number;
}

/** The list rows for `?stack=` and the show-all toggle; unknown columns and keys are kept. */
export function dnsProviderList(
  source: Table,
  filters: { stack: string | null; showAll: boolean },
): DnsProviderList {
  const inStack = source.rows.filter(
    (r) => filters.stack === null || r.provider_id === filters.stack,
  );
  const shown = filters.showAll ? inStack : inStack.filter((r) => !isHiddenByDefault(r));
  const columns = [...source.columns];
  const at = columns.findIndex((c) => c.key === 'unsupported_pct');
  columns.splice(at === -1 ? columns.length : at + 1, 0, {
    key: UNDETERMINED_KEY,
    header: 'Undetermined',
  });
  return {
    table: {
      ...source,
      columns,
      rows: shown.map((r) => ({ ...r, [UNDETERMINED_KEY]: undeterminedCount(r) })),
    },
    hiddenCount: inStack.filter(isHiddenByDefault).length,
  };
}

export type BadgeTone = 'ok' | 'warn' | 'muted';

const STATUS_LABELS: Record<string, [string, BadgeTone]> = {
  ok: ['OK', 'ok'],
  http_error: ['HTTP error', 'warn'],
  error: ['HTTP error', 'warn'],
  connection_error: ['Connection error', 'warn'],
  dead: ['Given up', 'muted'],
};

/** Badge of a `settings_status` or `support_status`; the hover text carries the raw value. */
export function statusBadge(status: CellValue): { label: string; tone: BadgeTone; title: string } {
  if (status === null || status === undefined) {
    return { label: 'Not checked yet', tone: 'muted', title: 'null: no attempt yet' };
  }
  const raw = String(status);
  const [label, tone] = STATUS_LABELS[raw] ?? [raw, 'muted'];
  return { label, tone, title: `${raw}: last attempt, may be days old` };
}
