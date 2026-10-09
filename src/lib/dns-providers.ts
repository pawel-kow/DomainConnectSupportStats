import type { CellValue, Column, Row, Table } from './data/types';

/**
 * The DNS providers list (EXPORT_FORMAT.md "dns-providers.json"): stack filter, rows hidden by
 * default, template support out of every template, and status badges.
 */

/** Keys of the derived columns: supported templates as a share, and the rest of the templates. */
export const SUPPORTED_PCT_KEY = 'supported_templates_pct';
export const NOT_SUPPORTED_KEY = 'not_supported_templates';
export const NOT_SUPPORTED_PCT_KEY = 'not_supported_templates_pct';

function num(row: Row | undefined, key: string): number | null {
  const v = row?.[key];
  return typeof v === 'number' ? v : null;
}

/** Never probed: no support probe attempted yet. */
export function isNeverProbed(row: Row): boolean {
  return row.support_status === null;
}

export interface TemplateSupport {
  supportedPct: number | null;
  /** Templates not supported, not yet determined included. */
  notSupported: number | null;
  notSupportedPct: number | null;
}

/** `supported` of `templates` templates, and the rest; unknown when either is or it exceeds. */
export function templateSupport(
  supported: number | null,
  templates: number | null,
): TemplateSupport {
  if (supported === null || templates === null || templates === 0 || supported > templates)
    return { supportedPct: null, notSupported: null, notSupportedPct: null };
  return {
    supportedPct: (supported / templates) * 100,
    notSupported: templates - supported,
    notSupportedPct: ((templates - supported) / templates) * 100,
  };
}

/** A row with its template support columns; unknown for a DNS provider never probed. */
export function withTemplateSupport(row: Row, templates: number | null): Row {
  const t = isNeverProbed(row)
    ? templateSupport(null, null)
    : templateSupport(num(row, 'supported_templates'), templates);
  return {
    ...row,
    [SUPPORTED_PCT_KEY]: t.supportedPct,
    [NOT_SUPPORTED_KEY]: t.notSupported,
    [NOT_SUPPORTED_PCT_KEY]: t.notSupportedPct,
  };
}

/** The columns with the template support columns after `supported_templates`. */
export function withTemplateSupportColumns(columns: Column[]): Column[] {
  const out = columns.map((c) =>
    c.key === 'supported_templates' ? { ...c, header: 'SUPPORTED' } : c,
  );
  const at = out.findIndex((c) => c.key === 'supported_templates');
  out.splice(
    at === -1 ? out.length : at + 1,
    0,
    { key: SUPPORTED_PCT_KEY, header: 'SUPPORTED %' },
    { key: NOT_SUPPORTED_KEY, header: 'NOT SUPP.' },
    { key: NOT_SUPPORTED_PCT_KEY, header: 'NOT SUPP. %' },
  );
  return out;
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

/**
 * The list rows for `?stack=` and the show-all toggle, with template support out of `templates`
 * templates; unknown columns and keys are kept.
 */
export function dnsProviderList(
  source: Table,
  filters: { stack: string | null; showAll: boolean },
  templates: number | null = null,
): DnsProviderList {
  const inStack = source.rows.filter(
    (r) => filters.stack === null || r.provider_id === filters.stack,
  );
  const shown = filters.showAll ? inStack : inStack.filter((r) => !isHiddenByDefault(r));
  return {
    table: {
      ...source,
      columns: withTemplateSupportColumns(source.columns),
      rows: shown.map((r) => withTemplateSupport(r, templates)),
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
