import { parseTimestamp } from './format';
import type { Row } from './data/types';

/**
 * Time series on the export's two clocks (EXPORT_FORMAT.md "Time series"): import-based series
 * are placed at the import's start, sweep-based ones at the sweep's `started_at`. A missing row or
 * a `null` value is "not measured", never 0, so it produces no point.
 */

export interface Point {
  /** Milliseconds since the epoch, UTC. */
  x: number;
  y: number;
  row: Row;
}

/** Unix seconds that read as a date between 2000 and 2100 are accepted as a last resort. */
const PLAUSIBLE_EPOCH_SECONDS = { min: 946_684_800, max: 4_102_444_800 };

function epochSecondsAsMs(importId: number): number | null {
  return importId >= PLAUSIBLE_EPOCH_SECONDS.min && importId <= PLAUSIBLE_EPOCH_SECONDS.max
    ? importId * 1000
    : null;
}

/**
 * Where an import sits on a date axis: its `started_at` from the overview's `adoption` table,
 * else its `completed_at`, else the `import_id` read as Unix seconds. `null` when none is usable.
 */
export function importTimeMs(
  importId: number,
  adoptionRows: readonly Row[],
  fallbackCompletedAt?: string | null,
): number | null {
  const adoption = adoptionRows.find((r) => r.import_id === importId);
  const started = parseTimestamp(adoption?.started_at as string | null | undefined);
  if (started) return started.getTime();
  const completed = parseTimestamp(
    (adoption?.completed_at as string | null | undefined) ?? fallbackCompletedAt,
  );
  if (completed) return completed.getTime();
  return epochSecondsAsMs(importId);
}

/** Points of one import-based series, skipping rows without a date or without a value. */
export function importSeries(
  rows: readonly Row[],
  valueKey: string,
  adoptionRows: readonly Row[],
): Point[] {
  return rows.flatMap((row) => {
    const y = row[valueKey];
    const x = importTimeMs(
      row.import_id as number,
      adoptionRows,
      row.completed_at as string | null,
    );
    return typeof y === 'number' && x !== null ? [{ x, y, row }] : [];
  });
}

/** Points of one sweep-based series (placed at the sweep's `started_at`). */
export function sweepSeries(rows: readonly Row[], valueKey: string): Point[] {
  return rows.flatMap((row) => {
    const y = row[valueKey];
    const x = parseTimestamp(row.started_at as string | null)?.getTime() ?? null;
    return typeof y === 'number' && x !== null ? [{ x, y, row }] : [];
  });
}

/** The last row of a table that has a non-null value for `key`, for headline numbers. */
export function latestWith(rows: readonly Row[], key: string): Row | undefined {
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i]!;
    if (row[key] !== null && row[key] !== undefined) return row;
  }
  return undefined;
}
