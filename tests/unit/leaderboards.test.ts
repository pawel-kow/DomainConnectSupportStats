import { describe, expect, it } from 'vitest';
import type { Leaderboards } from '../../src/lib/data/derived';
import type { Row, Table } from '../../src/lib/data/types';
import {
  entrants,
  improvedWindow,
  mostImproved,
  newSupporting,
  topByDomains,
  topByTemplates,
  topReach,
  type Entrant,
  type Ranked,
} from '../../src/lib/leaderboards';
import { exampleJson } from '../fixtures';

const dnsProviders = () => (exampleJson('dns-providers.json').tables.dns_providers as Table).rows;
const stacks = () => (exampleJson('stacks.json').tables.stacks as Table).rows;
const templates = () => (exampleJson('templates.json').tables.service_templates as Table).rows;
const serviceProviders = () =>
  (exampleJson('service-providers.json').tables.service_providers as Table).rows;

const board = (ranked: Ranked<Entrant>[]) =>
  ranked.map((r) => [r.rank, r.entry.kind, r.entry.name, r.value]);

function provider(id: number, values: Row): Row {
  return {
    name: `DNS ${id}`,
    dns_provider_id: id,
    provider_id: null,
    api_host: `dc.dns${id}.example`,
    supported_templates: 0,
    supported_templates_change: 0,
    supported_templates_change_90d: null,
    domains: 0,
    ...values,
  };
}

describe('entrants', () => {
  it('folds DNS providers of a stack into one row per stack', () => {
    const list = entrants(dnsProviders(), stacks());
    expect(list.map((e) => [e.kind, e.name])).toEqual([
      ['stack', 'Cloudflare'],
      ['stack', 'IONOS'],
      ['stack', 'Plesk'],
      ['stack', 'Quiet Host'],
      ['dns_provider', 'Small Registrar'],
    ]);
    expect(list.map((e) => e.href)).toEqual([
      './stack.html?id=cloudflare.com',
      './stack.html?id=ionos.com',
      './stack.html?id=plesk.com',
      './stack.html?id=quiet-host.example',
      './dns-provider.html?id=4',
    ]);
  });

  it('keeps a DNS provider whose stack has no row', () => {
    const list = entrants([provider(7, { provider_id: 'gone.example' })], stacks());
    expect(list.find((e) => e.kind === 'dns_provider')?.name).toBe('DNS 7');
  });

  it('describes a DNS provider by its API host and a stack by its deployments', () => {
    const list = entrants(dnsProviders(), stacks());
    expect(list.find((e) => e.name === 'Plesk')?.detail).toBe('2 deployments');
    expect(list.find((e) => e.name === 'IONOS')?.detail).toBe('1 deployment');
    expect(list.find((e) => e.name === 'Small Registrar')?.detail).toBeNull();
    expect(entrants([provider(7, {})], [])[0]?.detail).toBe('dc.dns7.example');
  });

  it('counts the domains reached by supporting deployments only', () => {
    const list = entrants(dnsProviders(), stacks());
    // Plesk: deployment 2 (900 domains) supports, deployment 3 (250) does not.
    expect(list.find((e) => e.name === 'Plesk')?.reachedDomains).toBe(900);
    expect(list.find((e) => e.name === 'Small Registrar')?.reachedDomains).toBe(0);
  });

  it('has unknown reach when no supporting deployment is measured', () => {
    const rows = [provider(1, { supported_templates: 3, domains: null })];
    expect(entrants(rows, [])[0]?.reachedDomains).toBeNull();
    expect(
      entrants([provider(1, { supported_templates: null, domains: 5 })], [])[0]?.reachedDomains,
    ).toBeNull();
  });
});

describe('topByTemplates', () => {
  it('ranks by supported templates, positive only, ties by domains', () => {
    // IONOS (2000 domains) before Plesk (1150) at 2 templates each.
    expect(board(topByTemplates(entrants(dnsProviders(), stacks())))).toEqual([
      [1, 'stack', 'Cloudflare', 3],
      [2, 'stack', 'IONOS', 2],
      [3, 'stack', 'Plesk', 2],
    ]);
  });

  it('breaks ties of equal domains by name, ignoring case, and puts unknown domains last', () => {
    const rows = [
      provider(1, { name: 'beta', supported_templates: 1, domains: 10 }),
      provider(2, { name: 'Alpha', supported_templates: 1, domains: 10 }),
      provider(3, { name: 'Aaa', supported_templates: 1, domains: null }),
      provider(4, { name: 'Zed', supported_templates: 1, domains: 20 }),
    ];
    expect(board(topByTemplates(entrants(rows, [])))).toEqual([
      [1, 'dns_provider', 'Zed', 1],
      [2, 'dns_provider', 'Alpha', 1],
      [3, 'dns_provider', 'beta', 1],
      [4, 'dns_provider', 'Aaa', 1],
    ]);
  });

  it('keeps the top 10 and leaves out unknown values', () => {
    const rows = Array.from({ length: 12 }, (_, i) =>
      provider(i + 1, { supported_templates: i + 1 }),
    );
    rows.push(provider(99, { supported_templates: null }));
    const ranked = topByTemplates(entrants(rows, []));
    expect(ranked).toHaveLength(10);
    expect(ranked[0]?.value).toBe(12);
    expect(ranked.at(-1)).toMatchObject({ rank: 10, value: 3 });
  });
});

describe('topByDomains', () => {
  it('ranks by the domains of supporting deployments', () => {
    expect(board(topByDomains(entrants(dnsProviders(), stacks())))).toEqual([
      [1, 'stack', 'Cloudflare', 4000],
      [2, 'stack', 'IONOS', 2000],
      [3, 'stack', 'Plesk', 900],
    ]);
  });
});

describe('mostImproved', () => {
  it('ranks by the change since the previous sweep, positive only', () => {
    expect(board(mostImproved(entrants(dnsProviders(), stacks()), 'sweep'))).toEqual([
      [1, 'stack', 'IONOS', 1],
    ]);
  });

  it('ranks by the change over about 90 days', () => {
    const rows = [
      provider(1, { supported_templates_change: 5, supported_templates_change_90d: 2 }),
      provider(2, { supported_templates_change: 0, supported_templates_change_90d: 4 }),
      provider(3, { supported_templates_change: -1, supported_templates_change_90d: null }),
    ];
    expect(board(mostImproved(entrants(rows, []), '90d'))).toEqual([
      [1, 'dns_provider', 'DNS 2', 4],
      [2, 'dns_provider', 'DNS 1', 2],
    ]);
  });

  it('takes a smaller size', () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      provider(i + 1, { supported_templates_change: i + 1 }),
    );
    expect(mostImproved(entrants(rows, []), 'sweep', 5)).toHaveLength(5);
  });
});

describe('improvedWindow', () => {
  it('reads ?window=90d, else since the previous sweep', () => {
    expect(improvedWindow('?window=90d')).toBe('90d');
    expect(improvedWindow('?window=sweep')).toBe('sweep');
    expect(improvedWindow('?window=x')).toBe('sweep');
    expect(improvedWindow('')).toBe('sweep');
  });
});

describe('topReach', () => {
  it('ranks templates by reach, positive only, ties by name', () => {
    const ranked = topReach(templates(), (r) => String(r.service_name));
    expect(ranked.map((r) => [r.rank, r.entry.service_name, r.value])).toEqual([
      [1, 'Example Website', 6900],
      [2, 'Domain Verification', 6000],
      [3, 'Acme Mail', 4900],
    ]);
  });

  it('ranks service providers by reach, ties by name', () => {
    const ranked = topReach(serviceProviders(), (r) => String(r.name));
    expect(ranked.map((r) => [r.rank, r.entry.name, r.value])).toEqual([
      [1, 'Acme Mail Inc.', 6900],
      [2, 'Example Service', 6900],
    ]);
  });

  it('is empty without a domain-share import', () => {
    const rows = serviceProviders().map((r) => ({ ...r, reach_domains: null }));
    expect(topReach(rows, (r) => String(r.name))).toEqual([]);
  });
});

describe('newSupporting', () => {
  const GENERATED = '2026-10-01T00:00:00Z';
  const derived = (rows: [number, string][]): Leaderboards => ({
    generated_at: GENERATED,
    first_sweep: { sweep_id: 1, started_at: '2026-03-02 02:00:00' },
    first_support: rows.map(([id, at], i) => ({
      dns_provider_id: id,
      sweep_id: 10 - i,
      started_at: at,
      supported_templates: 1,
    })),
  });

  it('lists DNS providers first supporting within 30 days, newest first, with their stack', () => {
    const list = newSupporting(
      derived([
        [5, '2026-09-30 02:00:00'],
        [4, '2026-09-01 00:00:00'],
        [3, '2026-08-31 23:59:59'],
      ]),
      dnsProviders(),
      stacks(),
      null,
    );
    expect(list).toEqual([
      {
        dnsProviderId: 5,
        name: 'IONOS',
        apiHost: 'domainconnect.ionos.example',
        href: './dns-provider.html?id=5',
        stack: { name: 'IONOS', href: './stack.html?id=ionos.com' },
        since: '2026-09-30 02:00:00',
        supportedTemplates: 2,
      },
      {
        dnsProviderId: 4,
        name: 'Small Registrar',
        apiHost: null,
        href: './dns-provider.html?id=4',
        stack: null,
        since: '2026-09-01 00:00:00',
        supportedTemplates: 0,
      },
    ]);
  });

  it('leaves out first support before the scanner start', () => {
    const list = newSupporting(
      derived([
        [5, '2026-09-30 02:00:00'],
        [4, '2026-09-21 02:00:00'],
      ]),
      dnsProviders(),
      stacks(),
      new Date('2026-09-22T00:00:00Z'),
    );
    expect(list.map((r) => r.dnsProviderId)).toEqual([5]);
  });

  it('leaves out a DNS provider missing from the list', () => {
    const list = newSupporting(derived([[99, '2026-09-30 02:00:00']]), dnsProviders(), [], null);
    expect(list).toEqual([]);
  });

  it('is empty in the example export: its first supports are older', () => {
    const example: Leaderboards = {
      generated_at: GENERATED,
      first_sweep: { sweep_id: 1, started_at: '2026-03-02 02:00:00' },
      first_support: [
        {
          dns_provider_id: 5,
          sweep_id: 4,
          started_at: '2026-06-02 02:00:00',
          supported_templates: 1,
        },
      ],
    };
    expect(newSupporting(example, dnsProviders(), stacks(), null)).toEqual([]);
  });
});
