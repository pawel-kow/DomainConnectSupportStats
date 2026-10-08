import { describe, expect, it } from 'vitest';
import { cardSweep, ecosystemSweep, importCompletedAt } from '../../src/lib/annotation';
import type { ExportFile, Row } from '../../src/lib/data/types';
import { exampleJson } from '../fixtures';

/** `file` with table `id` (matched by suffix) holding `rows`. */
function withRows(file: ExportFile, id: string, rows: Row[]): ExportFile {
  const key = Object.keys(file.tables).find((k) => k.slice(k.lastIndexOf('/') + 1) === id)!;
  return { ...file, tables: { ...file.tables, [key]: { ...file.tables[key]!, rows } } };
}

describe('ecosystemSweep', () => {
  it('is the last ecosystem row of the overview', () => {
    const overview = exampleJson('overview.json');
    const file = withRows(overview, 'ecosystem', [
      { sweep_id: 2, started_at: '2026-06-02 02:00:00' },
      { sweep_id: 1, started_at: '2026-03-02 02:00:00' },
    ]);
    expect(ecosystemSweep(file)).toBe('2026-03-02 02:00:00');
    expect(ecosystemSweep(overview)).toBe('2026-09-02 02:00:00');
  });

  it('is null without rows or without the table', () => {
    const overview = exampleJson('overview.json');
    expect(ecosystemSweep(withRows(overview, 'ecosystem', []))).toBeNull();
    expect(ecosystemSweep({ ...overview, tables: {} })).toBeNull();
  });
});

describe('cardSweep', () => {
  it('is the last support_history row of a DNS provider card', () => {
    const card = withRows(exampleJson('dns-providers/3.json'), 'support_history', [
      { sweep_id: 1, started_at: '2026-03-02 02:00:00' },
      { sweep_id: 2, started_at: '2026-03-10 02:00:00' },
    ]);
    expect(cardSweep('dns_provider', card)).toBe('2026-03-10 02:00:00');
  });

  it('is the newest support_history started_at of a service provider card', () => {
    const card = withRows(
      exampleJson('service-providers/mail.acme.example.json'),
      'support_history',
      [
        { service_id: 'a', started_at: '2026-07-01 02:00:00' },
        { service_id: 'b', started_at: '2026-09-02 02:00:00' },
        { service_id: 'a', started_at: '2026-04-01 02:00:00' },
      ],
    );
    expect(cardSweep('service_provider', card)).toBe('2026-09-02 02:00:00');
  });

  it('is the last history row of a template card', () => {
    const card = withRows(exampleJson('templates/mail.acme.example/mail.json'), 'history', [
      { sweep_id: 1, started_at: '2026-03-02 02:00:00' },
      { sweep_id: 2, started_at: '2026-07-01 02:00:00' },
    ]);
    expect(cardSweep('template', card)).toBe('2026-07-01 02:00:00');
    expect(cardSweep('template', exampleJson('templates/mail.acme.example/mail.json'))).toBe(
      '2026-09-02 02:00:00',
    );
  });

  it('is null when the table has no rows', () => {
    expect(
      cardSweep(
        'dns_provider',
        withRows(exampleJson('dns-providers/1.json'), 'support_history', []),
      ),
    ).toBeNull();
    expect(
      cardSweep(
        'service_provider',
        withRows(exampleJson('service-providers/unnamed.example.json'), 'support_history', []),
      ),
    ).toBeNull();
    expect(
      cardSweep(
        'template',
        withRows(exampleJson('templates/unnamed.example/x.json'), 'history', []),
      ),
    ).toBeNull();
  });

  it('skips rows without a started_at', () => {
    const card = withRows(
      exampleJson('service-providers/unnamed.example.json'),
      'support_history',
      [{ service_id: 'x', started_at: null }],
    );
    expect(cardSweep('service_provider', card)).toBeNull();
  });
});

describe('importCompletedAt', () => {
  it('is the completed_at of the import in the overview adoption table', () => {
    expect(importCompletedAt(exampleJson('overview.json'), 1780272000)).toBe('2026-06-01 07:00:00');
  });

  it('is null for an unknown import or a null completed_at', () => {
    const overview = exampleJson('overview.json');
    expect(importCompletedAt(overview, 1)).toBeNull();
    const pruned = withRows(overview, 'adoption', [{ import_id: 5, completed_at: null }]);
    expect(importCompletedAt(pruned, 5)).toBeNull();
  });
});
