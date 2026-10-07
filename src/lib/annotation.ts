import { findTable } from './data/tables';
import type { ExportFile, Row } from './data/types';
import { parseTimestamp } from './format';

/**
 * The data annotation at the end of every page: when the domain figures (the domain-share
 * import) and the support figures (the newest sweep the page's data reflects) were measured.
 */

function startedAt(row: Row | undefined): string | null {
  const v = row?.started_at;
  return typeof v === 'string' ? v : null;
}

/** `started_at` of the overview's last `ecosystem` row: lists, stack card, methodology. */
export function ecosystemSweep(overview: ExportFile): string | null {
  return startedAt(findTable(overview, 'ecosystem')?.rows.at(-1));
}

/** The newest `started_at` of rows that interleave several series (one per template). */
function newestStartedAt(rows: readonly Row[]): string | null {
  let newest: { at: string; ms: number } | null = null;
  for (const row of rows) {
    const at = startedAt(row);
    const ms = parseTimestamp(at)?.getTime();
    if (at !== null && ms !== undefined && (newest === null || ms > newest.ms)) newest = { at, ms };
  }
  return newest?.at ?? null;
}

/** The newest sweep a card reflects; null when its sweep table has no rows. */
export function cardSweep(
  kind: 'dns_provider' | 'service_provider' | 'template',
  card: ExportFile,
): string | null {
  switch (kind) {
    case 'dns_provider':
      return startedAt(findTable(card, 'support_history')?.rows.at(-1));
    case 'service_provider':
      return newestStartedAt(findTable(card, 'support_history')?.rows ?? []);
    case 'template':
      return startedAt(findTable(card, 'history')?.rows.at(-1));
  }
}

/** `completed_at` of import `importId` in the overview's `adoption` table; null when unknown. */
export function importCompletedAt(overview: ExportFile, importId: number): string | null {
  const v = findTable(overview, 'adoption')?.rows.find(
    (r) => r.import_id === importId,
  )?.completed_at;
  return typeof v === 'string' ? v : null;
}
