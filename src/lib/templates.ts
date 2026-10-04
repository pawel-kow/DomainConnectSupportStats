import type { CellValue, Column, Row, Table } from './data/types';

/**
 * The template card (EXPORT_FORMAT.md "templates/…"): its records, whose columns vary per
 * template, and the history caveat.
 */

/** Key of the derived column holding every record field but type and host. */
export const RECORD_DETAILS_KEY = 'record_details';

const LEAD_KEYS = ['type', 'host'];

/** A record value as written in the template file: numbers without separators. */
function verbatim(value: CellValue): string {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

/** The record's declared fields other than type and host, in column order; unknown ones left out. */
export function recordDetails(columns: Column[], row: Row): { key: string; value: string }[] {
  return columns
    .filter((c) => !LEAD_KEYS.includes(c.key))
    .flatMap((c) => {
      const value = row[c.key];
      return value === null || value === undefined ? [] : [{ key: c.key, value: verbatim(value) }];
    });
}

/**
 * The records as type, host and one details column, so a template's varying fields fit any
 * screen. Rows keep their own fields for rendering; the details column holds their text for sort
 * and filter.
 */
export function recordsTable(source: Table): Table {
  const lead = source.columns.filter((c) => LEAD_KEYS.includes(c.key));
  return {
    title: source.title,
    columns: [...lead, { key: RECORD_DETAILS_KEY, header: 'Details' }],
    rows: source.rows.map((row) => ({
      ...row,
      [RECORD_DETAILS_KEY]: recordDetails(source.columns, row)
        .map((d) => `${d.key}: ${d.value}`)
        .join('\n'),
    })),
    footer: null,
  };
}

/**
 * Whether the latest history point differs from the current supporter count: history replays
 * recorded changes, so a provider whose latest probe failed still counts there (EXPORT_FORMAT.md
 * "Caveats").
 */
export function historyDiffers(history: Row[], supporters: number): boolean {
  const latest = history.at(-1)?.supporting_providers;
  return typeof latest === 'number' && latest !== supporters;
}

/** A card table's title without its `<service_provider_id>/<service_id> - ` prefix. */
export function tableTitle(title: string, serviceProviderId: string, serviceId: string): string {
  const prefix = `${serviceProviderId}/${serviceId} - `;
  return title.startsWith(prefix) ? title.slice(prefix.length) : title;
}
