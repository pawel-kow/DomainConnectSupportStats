import type { Row } from './data/types';
import { sweepSeries, type Point } from './series';

/**
 * The service provider card (EXPORT_FORMAT.md "service-providers/…"): its long-format
 * `support_history` as one series per template.
 */

/** Templates drawn by default: the ones with most reach, as many as there are series colours. */
export const CHART_DEFAULT_COUNT = 7;

export interface TemplateSeries {
  serviceId: string;
  /** The template's name from the `templates` table, else its service id. */
  name: string;
  points: Point[];
}

function text(row: Row, key: string): string | null {
  const v = row[key];
  return typeof v === 'string' ? v : null;
}

/**
 * One series per template: in the `templates` table's order (by reach), then templates only in
 * the history, in their first appearance. A template without history has no points.
 */
export function templateSeries(
  templates: readonly Row[],
  history: readonly Row[],
): TemplateSeries[] {
  const names = new Map<string, string>();
  for (const row of templates) {
    const id = text(row, 'service_id');
    if (id !== null && !names.has(id)) names.set(id, text(row, 'name') ?? id);
  }
  for (const row of history) {
    const id = text(row, 'service_id');
    if (id !== null && !names.has(id)) names.set(id, id);
  }
  return [...names].map(([serviceId, name]) => ({
    serviceId,
    name,
    points: sweepSeries(
      history.filter((r) => r.service_id === serviceId),
      'supporting_providers',
    ),
  }));
}

/** The service ids drawn by default: the first `CHART_DEFAULT_COUNT` with points. */
export function defaultShown(series: readonly TemplateSeries[]): string[] {
  return series
    .filter((s) => s.points.length)
    .slice(0, CHART_DEFAULT_COUNT)
    .map((s) => s.serviceId);
}
