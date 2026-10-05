import type { Row } from './data/types';

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
