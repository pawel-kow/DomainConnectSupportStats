import { formatCount, formatDateTime, formatPct, formatPp, UNKNOWN } from './format';
import type { CellValue } from './data/types';

/**
 * Default display of a raw cell, chosen by its column key (the contract's key naming is stable;
 * headers are display text and are not used). Pages override cells that need links or badges.
 */

/** Integer keys that are identifiers or ranks, shown without thousands separators. */
const PLAIN_NUMBER_KEYS = new Set([
  'import_id',
  'sweep_id',
  'dns_provider_id',
  'id',
  'version',
  'rank',
]);

/** Internal ids of the Scanner's database: used in URLs and lookups, never shown. */
const NON_PUBLIC_KEYS = new Set(['id', 'dns_provider_id', 'import_id', 'sweep_id']);

/** Whether a column may be shown (internal ids are not). */
export function isPublicKey(key: string): boolean {
  return !NON_PUBLIC_KEYS.has(key);
}

export type CellKind = 'pct' | 'pp' | 'count' | 'plain' | 'timestamp' | 'versions' | 'text';

export function cellKind(key: string, value: CellValue): CellKind {
  if (Array.isArray(value) || key === 'versions') return 'versions';
  if (key === 'change_pct') return 'pp';
  if (key.endsWith('_pct')) return 'pct';
  if (key.endsWith('_at') || key === 'since') return 'timestamp';
  if (PLAIN_NUMBER_KEYS.has(key)) return 'plain';
  if (typeof value === 'number') return 'count';
  return 'text';
}

/** Whether a column is right-aligned (numbers). */
export function isNumericKind(kind: CellKind): boolean {
  return kind === 'pct' || kind === 'pp' || kind === 'count' || kind === 'plain';
}

export function formatCell(key: string, value: CellValue): string {
  if (value === null || value === undefined) return UNKNOWN;
  switch (cellKind(key, value)) {
    case 'versions':
      return Array.isArray(value) ? value.join(', ') : String(value);
    case 'pp':
      return formatPp(value as number);
    case 'pct':
      return formatPct(value as number);
    case 'timestamp':
      return formatDateTime(String(value));
    case 'count':
      return formatCount(value as number);
    default:
      return String(value);
  }
}

/**
 * Sort comparator over raw values: numbers numerically, strings case-insensitively, and unknown
 * (`null`) always last regardless of direction, so "not measured" never ranks as smallest.
 */
export function compareCells(a: CellValue, b: CellValue, direction: 1 | -1): number {
  const aNull = a === null || a === undefined;
  const bNull = b === null || b === undefined;
  if (aNull || bNull) return aNull === bNull ? 0 : aNull ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * direction;
  const aText = Array.isArray(a) ? a.join(',') : String(a);
  const bText = Array.isArray(b) ? b.join(',') : String(b);
  return aText.localeCompare(bText, 'en', { sensitivity: 'base', numeric: true }) * direction;
}

/** Whether a row matches a free-text search over its text and id cells. */
export function rowMatches(row: Record<string, CellValue>, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return Object.values(row).some(
    (v) =>
      (typeof v === 'string' || typeof v === 'number') && String(v).toLowerCase().includes(needle),
  );
}

/**
 * A DNS provider's `nameservers`: a JSON array encoded inside a string, parsed a second time.
 * Null when absent or not an array of strings.
 */
export function parseNameservers(value: string | null | undefined): string[] | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((v) => typeof v === 'string') ? parsed : null;
  } catch {
    return null;
  }
}
