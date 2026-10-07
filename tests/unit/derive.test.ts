import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { deriveLeaderboards } from '../../scripts/derive';
import { EXAMPLE_DIR } from '../fixtures';

describe('deriveLeaderboards on the example export', () => {
  const derived = deriveLeaderboards(EXAMPLE_DIR);

  it("carries the release's generated_at", () => {
    expect(derived.generated_at).toBe('2026-10-01T00:00:00Z');
  });

  it("names the export's first sweep", () => {
    expect(derived.first_sweep).toEqual({ sweep_id: 1, started_at: '2026-03-02 02:00:00' });
  });

  it('lists the first sweep with support per DNS provider, newest first', () => {
    expect(derived.first_support).toEqual([
      {
        dns_provider_id: 5,
        sweep_id: 4,
        started_at: '2026-06-02 02:00:00',
        supported_templates: 1,
      },
      {
        dns_provider_id: 3,
        sweep_id: 2,
        started_at: '2026-03-10 02:00:00',
        supported_templates: 1,
      },
    ]);
  });
});

describe('deriveLeaderboards on an edited copy', () => {
  let dir: string;
  const copy = () => {
    dir = mkdtempSync(join(tmpdir(), 'release-'));
    cpSync(EXAMPLE_DIR, dir, { recursive: true });
  };
  const history = (rel: string, rows: Record<string, unknown>[] | undefined) => {
    const json = JSON.parse(readFileSync(join(dir, rel), 'utf8'));
    if (rows) json.tables.support_history.rows = rows;
    else delete json.tables.support_history;
    writeFileSync(join(dir, rel), JSON.stringify(json));
  };
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('skips a card without support_history', () => {
    copy();
    history('dns-providers/5.json', undefined);
    expect(deriveLeaderboards(dir).first_support.map((r) => r.dns_provider_id)).toEqual([3]);
  });

  it('orders ties by dns_provider_id and ignores rows after the first support', () => {
    copy();
    const rows = [
      { sweep_id: 1, started_at: '2026-03-02 02:00:00', supported_templates: 0, change: 0 },
      { sweep_id: 4, started_at: '2026-06-02 02:00:00', supported_templates: 2, change: 2 },
      { sweep_id: 6, started_at: '2026-09-02 02:00:00', supported_templates: 0, change: -2 },
    ];
    history('dns-providers/5.json', rows);
    history('dns-providers/4.json', rows);
    expect(
      deriveLeaderboards(dir).first_support.map((r) => [r.dns_provider_id, r.sweep_id]),
    ).toEqual([
      [4, 4],
      [5, 4],
      [3, 2],
    ]);
  });

  it('has no first sweep and no rows when no card has history', () => {
    copy();
    for (const id of [1, 2, 3, 4, 5, 6]) history(`dns-providers/${id}.json`, []);
    expect(deriveLeaderboards(dir)).toMatchObject({ first_sweep: null, first_support: [] });
  });

  it('refuses a release whose card has another generated_at', () => {
    copy();
    const rel = 'dns-providers/3.json';
    const json = JSON.parse(readFileSync(join(dir, rel), 'utf8'));
    json.generated_at = '2026-09-01T00:00:00Z';
    writeFileSync(join(dir, rel), JSON.stringify(json));
    expect(() => deriveLeaderboards(dir)).toThrow(/dns-providers\/3\.json: generated_at/);
  });
});
