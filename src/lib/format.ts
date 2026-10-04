/**
 * Display formatting. Raw values come unrounded (EXPORT_FORMAT.md "Values"); `null` means unknown
 * and is shown as {@link UNKNOWN}, never as 0.
 */

export const UNKNOWN = '–';

const COUNT = new Intl.NumberFormat('en-US');

export function formatCount(value: number | null | undefined): string {
  return value === null || value === undefined ? UNKNOWN : COUNT.format(value);
}

/** A 0–100 percentage, rounded for display only. */
export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return UNKNOWN;
  return `${value.toFixed(digits)}%`;
}

/** A change in percentage points, signed. */
export function formatPp(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return UNKNOWN;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)} pp`;
}

const TIMESTAMP = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/;

/**
 * Parse an export timestamp as UTC. Values are `YYYY-MM-DD HH:MM:SS`; a few older ones are ISO
 * 8601 with a `T` and an offset, and `generated_at` is `...T...Z`: the first 19 characters are
 * read in every case, as the contract says.
 */
export function parseTimestamp(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = TIMESTAMP.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  return new Date(Date.UTC(y, mo - 1, d, h, mi, s));
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `DD-MM-YYYY`, UTC: the date style of stats.domainconnect.org. */
export function formatDate(value: Date | string | null | undefined): string {
  const date = typeof value === 'string' ? parseTimestamp(value) : value;
  if (!date) return UNKNOWN;
  return `${pad(date.getUTCDate())}-${pad(date.getUTCMonth() + 1)}-${date.getUTCFullYear()}`;
}

/** `DD-MM-YYYY HH:MM UTC`. */
export function formatDateTime(value: Date | string | null | undefined): string {
  const date = typeof value === 'string' ? parseTimestamp(value) : value;
  if (!date) return UNKNOWN;
  return `${formatDate(date)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}
