import type { Row } from './data/types';
import { formatPct } from './format';

export interface SupportRange {
  /** Start of the span, 0–100. */
  left: number;
  /** Length of the span, 0–100. */
  width: number;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/** A stack's support distribution as bar geometry; null when no deployment has combinations. */
export function supportRange(row: Row): SupportRange | null {
  const { min_supported_pct: min, max_supported_pct: max } = row;
  if (typeof min !== 'number' || typeof max !== 'number') return null;
  const left = clamp(min);
  return { left, width: clamp(max) - left };
}

/** "min – max", or one value when both ends display the same. */
export function supportLabel(row: Row): string {
  const min = formatPct(typeof row.min_supported_pct === 'number' ? row.min_supported_pct : null);
  const max = formatPct(typeof row.max_supported_pct === 'number' ? row.max_supported_pct : null);
  return min === max ? min : `${min} – ${max}`;
}
