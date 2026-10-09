import { describe, expect, it } from 'vitest';
import type { Row, Table } from '../../src/lib/data/types';
import {
  dnsProviderList,
  isHiddenByDefault,
  NOT_SUPPORTED_KEY,
  statusBadge,
  SUPPORTED_PCT_KEY,
  templateSupport,
} from '../../src/lib/dns-providers';
import { exampleJson } from '../fixtures';

const providers = () => exampleJson('dns-providers.json').tables.dns_providers as Table;
const ids = (rows: Row[]) => rows.map((r) => r.dns_provider_id);

describe('templateSupport', () => {
  it('is supported and the rest as shares of every template', () => {
    expect(templateSupport(1, 4)).toEqual({
      supportedPct: 25,
      notSupported: 3,
      notSupportedPct: 75,
    });
  });

  it('is unknown when a count is unknown, or supported exceeds the templates', () => {
    const unknown = { supportedPct: null, notSupported: null, notSupportedPct: null };
    expect(templateSupport(null, 4)).toEqual(unknown);
    expect(templateSupport(1, null)).toEqual(unknown);
    expect(templateSupport(0, 0)).toEqual(unknown);
    expect(templateSupport(5, 4)).toEqual(unknown);
  });
});

describe('isHiddenByDefault', () => {
  const visible: Row = { settings_status: 'ok', support_status: 'ok', domains: 10 };

  it('hides given-up, never-probed and zero-domain providers', () => {
    expect(isHiddenByDefault(visible)).toBe(false);
    expect(isHiddenByDefault({ ...visible, settings_status: 'dead' })).toBe(true);
    expect(isHiddenByDefault({ ...visible, support_status: 'dead' })).toBe(true);
    expect(isHiddenByDefault({ ...visible, support_status: null })).toBe(true);
    expect(isHiddenByDefault({ ...visible, domains: 0 })).toBe(true);
  });

  it('keeps unmeasured domains and failing probes visible', () => {
    expect(isHiddenByDefault({ ...visible, domains: null })).toBe(false);
    expect(isHiddenByDefault({ ...visible, settings_status: 'connection_error' })).toBe(false);
    expect(isHiddenByDefault({ ...visible, support_status: 'error' })).toBe(false);
  });
});

describe('dnsProviderList', () => {
  it('hides the default-hidden rows and counts them, keeping export order', () => {
    const list = dnsProviderList(providers(), { stack: null, showAll: false });
    expect(ids(list.table.rows)).toEqual([1, 5, 2]);
    expect(list.hiddenCount).toBe(3);
  });

  it('shows every row when asked', () => {
    const list = dnsProviderList(providers(), { stack: null, showAll: true });
    expect(ids(list.table.rows)).toEqual([1, 5, 2, 3, 4, 6]);
    expect(list.hiddenCount).toBe(3);
  });

  it("filters to one stack's deployments before hiding", () => {
    expect(
      ids(dnsProviderList(providers(), { stack: 'plesk.com', showAll: true }).table.rows),
    ).toEqual([2, 3]);
    const hidden = dnsProviderList(providers(), { stack: 'plesk.com', showAll: false });
    expect(ids(hidden.table.rows)).toEqual([2]);
    expect(hidden.hiddenCount).toBe(1);
    expect(dnsProviderList(providers(), { stack: 'nope', showAll: true }).table.rows).toEqual([]);
  });

  it('adds template support out of every template after supported_templates', () => {
    const { table } = dnsProviderList(providers(), { stack: null, showAll: true }, 5);
    const keys = table.columns.map((c) => c.key);
    expect(keys.indexOf(SUPPORTED_PCT_KEY)).toBe(keys.indexOf('supported_templates') + 1);
    expect(table.rows.map((r) => r[NOT_SUPPORTED_KEY])).toEqual([2, 3, 3, 5, null, 5]);
    expect(table.rows[0]![SUPPORTED_PCT_KEY]).toBe(60);
  });

  it('keeps unknown columns and keys', () => {
    const source = providers();
    source.columns.push({ key: 'brand_new', header: 'NEW' });
    source.rows[0]!.brand_new = 'x';
    const { table } = dnsProviderList(source, { stack: null, showAll: false });
    expect(table.columns.map((c) => c.key)).toContain('brand_new');
    expect(table.rows[0]!.brand_new).toBe('x');
  });
});

describe('statusBadge', () => {
  it('labels statuses in plain words with a tone', () => {
    expect(statusBadge('ok')).toMatchObject({ label: 'OK', tone: 'ok' });
    expect(statusBadge('http_error')).toMatchObject({ label: 'HTTP error', tone: 'warn' });
    expect(statusBadge('error')).toMatchObject({ label: 'HTTP error', tone: 'warn' });
    expect(statusBadge('connection_error')).toMatchObject({
      label: 'Connection error',
      tone: 'warn',
    });
    expect(statusBadge('dead')).toMatchObject({ label: 'Given up', tone: 'muted' });
    expect(statusBadge(null)).toMatchObject({ label: 'Not checked yet', tone: 'muted' });
  });

  it('carries the raw value in the hover text', () => {
    expect(statusBadge('connection_error').title).toContain('connection_error');
    expect(statusBadge(null).title).toContain('null');
  });

  it('shows an unknown status as is', () => {
    expect(statusBadge('brand_new')).toMatchObject({ label: 'brand_new', tone: 'muted' });
  });
});
