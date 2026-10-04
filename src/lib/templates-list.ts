import type { Row, Table } from './data/types';

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
