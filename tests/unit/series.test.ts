import { describe, expect, it } from 'vitest';
import {
  importSeries,
  importTimeMs,
  latestWith,
  needsAdoption,
  sweepSeries,
} from '../../src/lib/series';

const ms = (iso: string) => Date.parse(iso);

describe('importTimeMs', () => {
  const adoption = [
    { import_id: 1, started_at: '2026-01-01 00:00:00', completed_at: null },
    { import_id: 2, started_at: null, completed_at: '2026-03-01 06:00:00' },
    { import_id: 1780272000, started_at: null, completed_at: null },
  ];

  it('prefers the adoption row started_at', () => {
    expect(importTimeMs(1, adoption)).toBe(ms('2026-01-01T00:00:00Z'));
  });

  it('falls back to completed_at, then to the import_id read as Unix seconds', () => {
    expect(importTimeMs(2, adoption)).toBe(ms('2026-03-01T06:00:00Z'));
    expect(importTimeMs(1780272000, adoption)).toBe(1780272000 * 1000);
  });

  it('uses the series row completed_at when the import has no adoption row', () => {
    expect(importTimeMs(7, adoption, '2026-05-01 00:00:00')).toBe(ms('2026-05-01T00:00:00Z'));
  });

  it('gives no date for an import_id that is not a plausible epoch', () => {
    expect(importTimeMs(42, adoption)).toBeNull();
  });
});

describe('series', () => {
  it('skips null values: gaps are not zeros', () => {
    const rows = [
      { import_id: 1, started_at: '2026-01-01 00:00:00', dc_pct: null },
      { import_id: 2, started_at: '2026-02-01 00:00:00', dc_pct: 50 },
    ];
    const points = importSeries(rows, 'dc_pct', rows);
    expect(points.map((p) => p.y)).toEqual([50]);
  });

  it('places sweeps at their started_at', () => {
    const rows = [{ sweep_id: 4, started_at: '2026-06-02 02:00:00', supported_templates: 3 }];
    expect(sweepSeries(rows, 'supported_templates')).toEqual([
      { x: ms('2026-06-02T02:00:00Z'), y: 3, row: rows[0] },
    ]);
  });

  it('finds the latest row that measured a value', () => {
    const rows = [
      { import_id: 1, dc_pct: 40 },
      { import_id: 2, dc_pct: null },
    ];
    expect(latestWith(rows, 'dc_pct')?.import_id).toBe(1);
    expect(latestWith([], 'dc_pct')).toBeUndefined();
  });
});

describe('needsAdoption', () => {
  it('is true when an import row has no completed_at', () => {
    expect(needsAdoption([{ completed_at: '2026-03-01 06:00:00' }, { completed_at: null }])).toBe(
      true,
    );
  });

  it('is false when every row has completed_at, or there are no rows', () => {
    expect(needsAdoption([{ completed_at: '2026-03-01 06:00:00' }])).toBe(false);
    expect(needsAdoption([])).toBe(false);
  });
});
