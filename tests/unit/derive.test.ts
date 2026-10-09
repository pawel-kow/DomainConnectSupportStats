import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { deriveLeaderboards, deriveStacks, deriveTemplates } from '../../scripts/derive';
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

describe('deriveTemplates on the example export', () => {
  const derived = deriveTemplates(EXAMPLE_DIR);

  it('counts the supporting DNS providers of every template, in list order', () => {
    expect(derived.list).toEqual({
      generated_at: '2026-10-01T00:00:00Z',
      templates: [
        {
          service_provider_id: 'exampleservice.domainconnect.org',
          service_id: 'template1',
          supporting_dns_providers: 3,
        },
        {
          service_provider_id: 'mail.acme.example',
          service_id: 'verify',
          supporting_dns_providers: 2,
        },
        {
          service_provider_id: 'mail.acme.example',
          service_id: 'mail',
          supporting_dns_providers: 2,
        },
        { service_provider_id: 'unnamed.example', service_id: 'x', supporting_dns_providers: 0 },
        {
          service_provider_id: 'exampleservice.domainconnect.org',
          service_id: 'template2',
          supporting_dns_providers: 0,
        },
      ],
    });
  });

  it("writes each template's supporters with since at the template card's path", () => {
    expect([...derived.cards.keys()]).toEqual([
      'templates/exampleservice.domainconnect.org/template1.json',
      'templates/mail.acme.example/verify.json',
      'templates/mail.acme.example/mail.json',
      'templates/unnamed.example/x.json',
      'templates/exampleservice.domainconnect.org/template2.json',
    ]);
    expect(derived.cards.get('templates/mail.acme.example/verify.json')).toEqual({
      generated_at: '2026-10-01T00:00:00Z',
      supporters: [
        { dns_provider_id: 1, since: '2026-04-01 03:00:00' },
        { dns_provider_id: 5, since: '2026-09-02 03:00:00' },
      ],
    });
    expect(derived.cards.get('templates/unnamed.example/x.json')?.supporters).toEqual([]);
  });
});

describe('deriveTemplates on an edited copy', () => {
  let dir: string;
  afterEach(() => rmSync(dir, { recursive: true, force: true }));
  const edit = (rel: string, change: (json: { tables: Record<string, unknown> }) => void) => {
    const json = JSON.parse(readFileSync(join(dir, rel), 'utf8'));
    change(json);
    writeFileSync(join(dir, rel), JSON.stringify(json));
  };

  it('keeps an unrecorded since as null and skips a card without supported_templates', () => {
    dir = mkdtempSync(join(tmpdir(), 'release-'));
    cpSync(EXAMPLE_DIR, dir, { recursive: true });
    edit('dns-providers/1.json', (j) => {
      const rows = (j.tables.supported_templates as { rows: Record<string, unknown>[] }).rows;
      for (const r of rows) r.since = null;
    });
    edit('dns-providers/5.json', (j) => delete j.tables.supported_templates);
    const derived = deriveTemplates(dir);
    expect(derived.cards.get('templates/mail.acme.example/verify.json')?.supporters).toEqual([
      { dns_provider_id: 1, since: null },
    ]);
    expect(derived.list.templates[0]?.supporting_dns_providers).toBe(2);
  });

  it('refuses a release whose card has another generated_at', () => {
    dir = mkdtempSync(join(tmpdir(), 'release-'));
    cpSync(EXAMPLE_DIR, dir, { recursive: true });
    edit('dns-providers/2.json', (j) => Object.assign(j, { generated_at: '2026-09-01T00:00:00Z' }));
    expect(() => deriveTemplates(dir)).toThrow(/dns-providers\/2\.json: generated_at/);
  });
});

describe('deriveStacks on the example export', () => {
  it("gives each stack its deployments' supported templates as shares of every template", () => {
    const derived = deriveStacks(EXAMPLE_DIR);
    expect(derived.generated_at).toBe('2026-10-01T00:00:00Z');
    expect(derived.stacks).toEqual([
      {
        provider_id: 'cloudflare.com',
        min_templates_pct: 60,
        median_templates_pct: 60,
        max_templates_pct: 60,
      },
      {
        provider_id: 'ionos.com',
        min_templates_pct: 40,
        median_templates_pct: 40,
        max_templates_pct: 40,
      },
      {
        provider_id: 'plesk.com',
        min_templates_pct: 40,
        median_templates_pct: 40,
        max_templates_pct: 40,
      },
      {
        provider_id: 'quiet-host.example',
        min_templates_pct: 0,
        median_templates_pct: 0,
        max_templates_pct: 0,
      },
    ]);
  });
});
