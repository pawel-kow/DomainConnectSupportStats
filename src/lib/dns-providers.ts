import type { CellValue, Row, Table } from './data/types';
import { formatExact } from './format';
import { NEW_SUPPORT_DAYS } from './leaderboards';
import { flagParam, textParam } from './params';

/**
 * The DNS providers list (EXPORT_FORMAT.md "dns-providers.json"): stack filter, predefined
 * filters, first found, status badges and probe counts.
 */

function num(row: Row | undefined, key: string): number | null {
  const v = row?.[key];
  return typeof v === 'number' ? v : null;
}

/** Never probed: no completed support sweep yet. */
export function isNeverProbed(row: Row): boolean {
  return row.support_status === null;
}

const hasSupport = (row: Row): boolean => (num(row, 'supported_count') ?? 0) > 0;

/** Answered with something else than OK; `null` is unknown, not a failure. */
const isFailed = (status: CellValue | undefined): boolean =>
  status !== null && status !== undefined && status !== 'ok';

/** The list's predefined filters, in display order. */
export const DNS_PROVIDER_FILTERS = [
  {
    id: 'supporting',
    label: 'At least one template',
    description: 'DNS providers supporting at least one template, whatever their latest run.',
  },
  {
    id: 'responding',
    label: 'Responding OK',
    description: 'Settings and support both OK in the latest completed runs.',
  },
  {
    id: 'no-settings',
    label: 'No settings response',
    description: 'Settings failed in the latest completed run.',
  },
  {
    id: 'no-support',
    label: 'No support response',
    description: 'Settings OK, support failed or partly failed in the latest completed sweep.',
  },
  {
    id: 'errors',
    label: 'Supporting, with errors',
    description: 'Supporting at least one template, settings or support not OK.',
  },
  {
    id: 'new',
    label: `New supporting (${NEW_SUPPORT_DAYS} days)`,
    description: `First supported a template within ${NEW_SUPPORT_DAYS} days of this release, as on the overview.`,
  },
  { id: 'all', label: 'All', description: 'Every known DNS provider.' },
] as const;

export type DnsProviderFilter = (typeof DNS_PROVIDER_FILTERS)[number]['id'];

export const DEFAULT_FILTER: DnsProviderFilter = 'supporting';

const MATCHES: Record<
  DnsProviderFilter,
  (row: Row, newSupporters: ReadonlySet<number> | null) => boolean
> = {
  supporting: hasSupport,
  responding: (r) => r.settings_status === 'ok' && r.support_status === 'ok',
  'no-settings': (r) => isFailed(r.settings_status),
  'no-support': (r) => r.settings_status === 'ok' && isFailed(r.support_status),
  errors: (r) => hasSupport(r) && (isFailed(r.settings_status) || isFailed(r.support_status)),
  new: (r, newSupporters) => newSupporters?.has(num(r, 'dns_provider_id') ?? NaN) ?? false,
  all: () => true,
};

/** The filter of a page's query: `filter=`, else `all=1`, else the default. */
export function dnsProviderFilter(search: string): DnsProviderFilter {
  const value = textParam(search, 'filter');
  const known = DNS_PROVIDER_FILTERS.find((f) => f.id === value);
  if (known) return known.id;
  return flagParam(search, 'all') ? 'all' : DEFAULT_FILTER;
}

/** `table` with the derived `first_seen_at` of each row, `null` when unknown. */
export function withFirstSeen(
  table: Table,
  firstSeen: Record<string, string | null> | null,
): Table {
  return {
    ...table,
    columns: [...table.columns, { key: 'first_seen_at', header: 'FIRST FOUND' }],
    rows: table.rows.map((r) => ({
      ...r,
      first_seen_at: firstSeen?.[String(r.dns_provider_id)] ?? null,
    })),
  };
}

export interface DnsProviderList {
  /** The rows to show, in export order. */
  table: Table;
  /** Rows of the stack (or of all) per filter. */
  counts: Record<DnsProviderFilter, number>;
}

/** The list rows for `?stack=` and the filter; unknown columns and keys are kept. */
export function dnsProviderList(
  source: Table,
  options: {
    stack: string | null;
    filter: DnsProviderFilter;
    /** `dns_provider_id`s of the new supporting DNS providers (`newSupporting()`); null when unknown. */
    newSupporters: ReadonlySet<number> | null;
  },
): DnsProviderList {
  const { stack, filter, newSupporters } = options;
  const inStack = source.rows.filter((r) => stack === null || r.provider_id === stack);
  const matching = (id: DnsProviderFilter) => inStack.filter((r) => MATCHES[id](r, newSupporters));
  const counts = Object.fromEntries(
    DNS_PROVIDER_FILTERS.map((f) => [f.id, matching(f.id).length]),
  ) as Record<DnsProviderFilter, number>;
  return { table: { ...source, rows: matching(filter) }, counts };
}

export type BadgeTone = 'ok' | 'warn' | 'muted';

const STATUS_LABELS: Record<string, [string, BadgeTone]> = {
  ok: ['OK', 'ok'],
  partial: ['Partly failed', 'warn'],
  error: ['Failed', 'warn'],
  failed: ['Failed', 'warn'],
  dead: ['Given up', 'muted'],
};

/**
 * Badge of a `settings_status` or `support_status`, with the settings `settings_error_kind` when
 * known; the hover text carries the raw values.
 */
export function statusBadge(
  status: CellValue,
  errorKind: CellValue = null,
): { label: string; tone: BadgeTone; title: string } {
  if (status === null || status === undefined) {
    return { label: 'Not checked yet', tone: 'muted', title: 'null: no completed run yet' };
  }
  const raw =
    errorKind === null || errorKind === undefined
      ? String(status)
      : `${String(status)} (${String(errorKind)})`;
  const [label, tone] = STATUS_LABELS[errorKind === 'dead' ? 'dead' : String(status)] ?? [
    String(status),
    'muted',
  ];
  return { label, tone, title: `${raw}: latest completed run, may be weeks old` };
}

/** Answered and failed probes of the latest completed sweep; failed left out at 0. */
export function probeCounts(row: Row | undefined): string | null {
  const answered = num(row, 'support_answered');
  if (answered === null) return null;
  const failed = num(row, 'support_failed');
  const text = `${formatExact(answered)} answered`;
  return failed ? `${text}, ${formatExact(failed)} failed` : text;
}
