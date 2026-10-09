import type { StacksSupport } from './data/derived';
import type { Row } from './data/types';
import { formatPct } from './format';

export interface SupportRange {
  /** Start of the span, 0–100. */
  left: number;
  /** Length of the span, 0–100. */
  width: number;
}

const clamp = (v: number) => Math.min(100, Math.max(0, v));

/**
 * A stack's template support distribution (derived `*_templates_pct`) as bar geometry; null when
 * unknown.
 */
export function supportRange(row: Row): SupportRange | null {
  const { min_templates_pct: min, max_templates_pct: max } = row;
  if (typeof min !== 'number' || typeof max !== 'number') return null;
  const left = clamp(min);
  return { left, width: clamp(max) - left };
}

/** "min – max", or one value when both ends display the same. */
export function supportLabel(row: Row): string {
  const min = formatPct(typeof row.min_templates_pct === 'number' ? row.min_templates_pct : null);
  const max = formatPct(typeof row.max_templates_pct === 'number' ? row.max_templates_pct : null);
  return min === max ? min : `${min} – ${max}`;
}

/** The stacks list rows with their derived template support distribution (unknown without it). */
export function withStackSupport(rows: Row[], support: StacksSupport | null): Row[] {
  const byId = new Map((support?.stacks ?? []).map((s) => [s.provider_id, s]));
  return rows.map((row) => {
    const s = byId.get(row.provider_id as string);
    return {
      ...row,
      min_templates_pct: s?.min_templates_pct ?? null,
      median_templates_pct: s?.median_templates_pct ?? null,
      max_templates_pct: s?.max_templates_pct ?? null,
    };
  });
}
