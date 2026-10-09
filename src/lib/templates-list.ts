import type { TemplatesSupport } from './data/derived';
import type { Row, Table } from './data/types';
import { ofSupporting } from './supporting';

/**
 * The templates list (EXPORT_FORMAT.md "templates.json"): service provider filter and
 * never-probed templates hidden by default. Its `provider_id` is the service provider's id.
 */

/** No probe combination on record yet: every count is 0, every share `null`. */
export function isNeverProbed(row: Row): boolean {
  return row.total === 0;
}

export interface TemplateList {
  /** The rows to show, in export order. */
  table: Table;
  /** Rows of the service provider (or of all) hidden by default. */
  hiddenCount: number;
}

/** The list rows for `?spid=` and the show-all toggle; unknown columns and keys are kept. */
export function templateList(
  source: Table,
  filters: { spid: string | null; showAll: boolean },
): TemplateList {
  const ofProvider = source.rows.filter(
    (r) => filters.spid === null || r.provider_id === filters.spid,
  );
  return {
    table: {
      ...source,
      rows: filters.showAll ? ofProvider : ofProvider.filter((r) => !isNeverProbed(r)),
    },
    hiddenCount: ofProvider.filter(isNeverProbed).length,
  };
}

/**
 * The list with each template's supporting DNS providers (derived) and the rest of the `total`
 * supporting DNS providers, each also as a share of `total`. Unknown when the derived data lacks
 * the template, `total` is unknown, or the rest would be negative.
 */
export function withSupport(
  source: Table,
  support: TemplatesSupport | null,
  total: number | null,
): Table {
  const counts = new Map(
    (support?.templates ?? []).map((t) => [
      JSON.stringify([t.service_provider_id, t.service_id]),
      t.supporting_dns_providers,
    ]),
  );
  return {
    ...source,
    columns: [
      ...source.columns,
      { key: 'supporting_dns_providers', header: 'Supported' },
      { key: 'not_supporting_dns_providers', header: 'Not supported' },
    ],
    rows: source.rows.map((row) => {
      const n = counts.get(JSON.stringify([row.provider_id, row.service_id])) ?? null;
      const rest = n === null || total === null || n > total ? null : total - n;
      return {
        ...row,
        supporting_dns_providers: n,
        supporting_dns_providers_pct: ofSupporting(n, total),
        not_supporting_dns_providers: rest,
        not_supporting_dns_providers_pct: ofSupporting(rest, total),
      };
    }),
  };
}
