import { describe, expect, it } from 'vitest';
import type { Row, Table } from '../../src/lib/data/types';
import {
  DEFAULT_FILTER,
  dnsProviderFilter,
  dnsProviderList,
  probeCounts,
  statusBadge,
  withFirstSeen,
  type DnsProviderFilter,
} from '../../src/lib/dns-providers';
import { exampleJson } from '../fixtures';

const providers = () => exampleJson('dns-providers.json').tables.dns_providers as Table;
const ids = (rows: Row[]) => rows.map((r) => r.dns_provider_id);

const list = (
  filter: DnsProviderFilter,
  stack: string | null = null,
  source = providers(),
  newSupporters: ReadonlySet<number> | null = new Set(),
) => dnsProviderList(source, { stack, filter, newSupporters });

describe('dnsProviderList', () => {
  it('shows the DNS providers supporting a template by default, whatever their status', () => {
    expect(DEFAULT_FILTER).toBe('supporting');
    expect(ids(list('supporting').table.rows)).toEqual([1, 5, 2, 3]);
  });

  it('keeps a supporting DNS provider that was given up or has no domains', () => {
    const source = providers();
    source.rows = [
      { ...source.rows[0]!, support_status: 'dead' },
      { ...source.rows[1]!, domains: 0 },
    ];
    expect(ids(list('supporting', null, source).table.rows)).toEqual([1, 5]);
  });

  it('shows DNS providers with settings and support OK', () => {
    expect(ids(list('responding').table.rows)).toEqual([1, 2]);
  });

  it('shows DNS providers with failed settings', () => {
    expect(ids(list('no-settings').table.rows)).toEqual([3]);
  });

  it('shows DNS providers with OK settings and failed support, never-probed ones left out', () => {
    expect(ids(list('no-support').table.rows)).toEqual([5]);
  });

  it('shows supporting DNS providers with failed settings or support', () => {
    expect(ids(list('errors').table.rows)).toEqual([5, 3]);
  });

  it('leaves unknown statuses out of the failure filters', () => {
    const source = providers();
    source.rows = [{ ...source.rows[0]!, settings_status: null, support_status: null }];
    expect(list('no-settings', null, source).table.rows).toEqual([]);
    expect(list('no-support', null, source).table.rows).toEqual([]);
    expect(list('errors', null, source).table.rows).toEqual([]);
    expect(list('responding', null, source).table.rows).toEqual([]);
  });

  it('shows the new supporting DNS providers, in export order', () => {
    expect(ids(list('new', null, providers(), new Set([2, 5])).table.rows)).toEqual([5, 2]);
    expect(list('new', null, providers(), new Set([2, 5])).counts.new).toBe(2);
  });

  it('shows no new supporting DNS provider when they are unknown', () => {
    expect(list('new', null, providers(), null).table.rows).toEqual([]);
  });

  it('shows every row when asked', () => {
    expect(ids(list('all').table.rows)).toEqual([1, 5, 2, 3, 4, 6]);
  });

  it('counts the rows of every filter', () => {
    expect(list('supporting').counts).toEqual({
      supporting: 4,
      responding: 2,
      'no-settings': 1,
      'no-support': 1,
      errors: 2,
      new: 0,
      all: 6,
    });
  });

  it("filters to one stack's deployments first", () => {
    expect(ids(list('all', 'plesk.com').table.rows)).toEqual([2, 3]);
    const failing = list('no-settings', 'plesk.com');
    expect(ids(failing.table.rows)).toEqual([3]);
    expect(failing.counts.all).toBe(2);
    expect(list('all', 'nope').table.rows).toEqual([]);
  });

  it('keeps the counts and shares of the template answers as exported', () => {
    const { table } = list('all');
    expect(table.columns).toEqual(providers().columns);
    expect(table.rows).toEqual(providers().rows);
  });

  it('keeps unknown columns and keys', () => {
    const source = providers();
    source.columns.push({ key: 'brand_new', header: 'NEW' });
    source.rows[0]!.brand_new = 'x';
    const { table } = list('supporting', null, source);
    expect(table.columns.map((c) => c.key)).toContain('brand_new');
    expect(table.rows[0]!.brand_new).toBe('x');
  });
});

describe('dnsProviderFilter', () => {
  it('reads a known filter', () => {
    expect(dnsProviderFilter('?filter=errors')).toBe('errors');
  });

  it('falls back to the default', () => {
    expect(dnsProviderFilter('')).toBe(DEFAULT_FILTER);
    expect(dnsProviderFilter('?filter=nope')).toBe(DEFAULT_FILTER);
  });

  it('reads all=1 as the all filter', () => {
    expect(dnsProviderFilter('?all=1')).toBe('all');
    expect(dnsProviderFilter('?all=1&filter=new')).toBe('new');
  });
});

describe('withFirstSeen', () => {
  it('adds the first found column and each date', () => {
    const table = withFirstSeen(providers(), { '1': '2025-12-01 10:00:00' });
    expect(table.columns.at(-1)).toEqual({ key: 'first_seen_at', header: 'FIRST FOUND' });
    expect(table.rows[0]!.first_seen_at).toBe('2025-12-01 10:00:00');
  });

  it('leaves a date it does not know null', () => {
    expect(withFirstSeen(providers(), {}).rows[0]!.first_seen_at).toBeNull();
    expect(withFirstSeen(providers(), null).rows[0]!.first_seen_at).toBeNull();
  });
});

describe('statusBadge', () => {
  it('labels statuses in plain words with a tone', () => {
    expect(statusBadge('ok')).toMatchObject({ label: 'OK', tone: 'ok' });
    expect(statusBadge('partial')).toMatchObject({ label: 'Partly failed', tone: 'warn' });
    expect(statusBadge('error')).toMatchObject({ label: 'Failed', tone: 'warn' });
    expect(statusBadge('failed')).toMatchObject({ label: 'Failed', tone: 'warn' });
    expect(statusBadge('dead')).toMatchObject({ label: 'Given up', tone: 'muted' });
    expect(statusBadge(null)).toMatchObject({ label: 'Not checked yet', tone: 'muted' });
  });

  it('labels a settings failure by its kind', () => {
    expect(statusBadge('failed', 'dead')).toMatchObject({ label: 'Given up', tone: 'muted' });
    expect(statusBadge('failed', 'http_error')).toMatchObject({ label: 'Failed', tone: 'warn' });
    expect(statusBadge('failed', 'http_error').title).toContain('http_error');
  });

  it('carries the raw value and the completed run in the hover text', () => {
    expect(statusBadge('partial').title).toBe('partial: latest completed run, may be weeks old');
    expect(statusBadge(null).title).toContain('null');
  });

  it('shows an unknown status as is', () => {
    expect(statusBadge('brand_new')).toMatchObject({ label: 'brand_new', tone: 'muted' });
  });
});

describe('probeCounts', () => {
  it('counts the answered and failed probes of the latest completed sweep', () => {
    expect(probeCounts({ support_answered: 1, support_failed: 1 })).toBe('1 answered, 1 failed');
    expect(probeCounts({ support_answered: 1200, support_failed: 0 })).toBe('1,200 answered');
    expect(probeCounts({ support_answered: 0, support_failed: 6 })).toBe('0 answered, 6 failed');
  });

  it('is null without a completed sweep', () => {
    expect(probeCounts({ support_answered: null, support_failed: null })).toBeNull();
    expect(probeCounts({})).toBeNull();
    expect(probeCounts(undefined)).toBeNull();
  });
});
