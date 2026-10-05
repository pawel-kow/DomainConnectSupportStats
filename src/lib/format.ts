/**
 * Display formatting. Raw values come unrounded (EXPORT_FORMAT.md "Values"); `null` means unknown
 * and is shown as {@link UNKNOWN}, never as 0.
 */

export const UNKNOWN = '–';

const EXACT = new Intl.NumberFormat('en-US');

/** The full count with thousands separators. */
export function formatExact(value: number | null | undefined): string {
  return value === null || value === undefined ? UNKNOWN : EXACT.format(value);
}

const COMPACT_FROM = 10_000;
const UNITS = ['K', 'M', 'B'] as const;

/** Whether {@link formatCount} shortens the value (the exact count then belongs in a tooltip). */
export function isCompact(value: number | null | undefined): boolean {
  return typeof value === 'number' && Math.abs(value) >= COMPACT_FROM;
}

/** A count: exact below 10,000, else `12.3K`, `38.5M`, `1.2B` (one decimal, `.0` dropped). */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return UNKNOWN;
  if (!isCompact(value)) return EXACT.format(value);
  let unit = 0;
  let scaled = value / 1000;
  while (unit < UNITS.length - 1 && Math.abs(Number(scaled.toFixed(1))) >= 1000) {
    scaled /= 1000;
    unit++;
  }
  return `${Number(scaled.toFixed(1))}${UNITS[unit]}`;
}

/**
 * A 0–100 percentage, rounded for display only: `digits` decimals, and below 1% two significant
 * digits so small shares stay distinguishable; below 0.0001% `<0.0001%`.
 */
export function formatPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined) return UNKNOWN;
  if (value > 0 && value < 0.0001) return '<0.0001%';
  const decimals =
    value > 0 && value < 1 ? Math.max(digits, Math.floor(-Math.log10(value)) + 2) : digits;
  return `${value.toFixed(decimals)}%`;
}

/** Decimals that print `step` exactly (0.25 needs 2). */
function stepDecimals(step: number): number {
  for (let d = 0; d < 8; d++) {
    if (Math.abs(step * 10 ** d - Math.round(step * 10 ** d)) < 1e-6) return d;
  }
  return 8;
}

/** A percentage axis tick with the decimals its step needs; without a step, {@link formatPct}. */
export function formatAxisPct(value: number, step: number | undefined): string {
  return step && step > 0 ? `${value.toFixed(stepDecimals(step))}%` : formatPct(value);
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

/** A tri-state flag: yes, no, or unknown. */
export function formatFlag(value: boolean | null | undefined): string {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return UNKNOWN;
}
