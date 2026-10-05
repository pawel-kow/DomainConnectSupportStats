import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { InvalidEntryError, parseEntry, parseSource } from '../../src/lib/registry/entry';

const EXAMPLES = resolve(import.meta.dirname, '../../contract/registry/examples/providers');
const example = (path: string): unknown =>
  JSON.parse(readFileSync(resolve(EXAMPLES, path), 'utf8'));

describe('parseEntry', () => {
  it('reads every field of a full entry and ignores unknown keys', () => {
    const entry = parseEntry(example('c/l/cloudflare.com.json'));
    expect(entry.name).toBe('Cloudflare');
    expect(entry.logo).toBe('cloudflare.com.svg');
    expect(entry.documentation).toHaveLength(1);
    expect(entry.technicalContacts[0]).toEqual({
      type: 'email',
      value: 'dc-tech@cloudflare.example',
      label: null,
    });
    expect(entry.onboarding.contacts[1]?.label).toBe('Community forum');
    expect(entry.onboarding.requirements.signedTemplatesOnly).toBe(true);
    expect(entry.features.syncFlow).toBe(true);
    expect(entry.features.asyncFlow).toBe(false);
    expect(entry.features.asyncRevert).toBeNull();
    expect(entry.features['nonStandard.cnameFlattening']).toBe(true);
    expect(entry).not.toHaveProperty('unknownTopLevelKey');
    expect(entry.features).not.toHaveProperty('futureFeature');
  });

  it('reads an absent flag as unknown', () => {
    const entry = parseEntry(example('i/o/ionos.com.json'));
    expect(entry.onboarding.mode).toBe('on-request');
    expect(entry.onboarding.cost).toBeNull();
    expect(Object.values(entry.features).every((f) => f === null)).toBe(true);
    expect(entry.documentation).toEqual([]);
  });

  it('reads a flag that is not a boolean, and an unknown mode, as unknown', () => {
    const entry = parseEntry({
      providerId: 'x',
      name: 'X',
      onboarding: { mode: 'sometimes', cost: 'yes' },
      features: { syncFlow: 1, templates: 'all' },
    });
    expect(entry.onboarding.mode).toBeNull();
    expect(entry.onboarding.cost).toBeNull();
    expect(entry.features.syncFlow).toBeNull();
    expect(entry.features['templates.multiInstance']).toBeNull();
  });

  it('drops contacts and links without a value', () => {
    const entry = parseEntry({
      providerId: 'x',
      name: 'X',
      documentation: [{ title: 'No URL' }, 'text', { url: 'https://d.example' }],
      contacts: { technical: [{ type: 'email' }, { type: 'fax', value: '123' }] },
    });
    expect(entry.documentation).toEqual([{ title: 'https://d.example', url: 'https://d.example' }]);
    expect(entry.technicalContacts).toEqual([{ type: 'other', value: '123', label: null }]);
  });

  it('rejects an entry without providerId or name', () => {
    expect(() => parseEntry({ providerId: 'x' })).toThrow(InvalidEntryError);
    expect(() => parseEntry([])).toThrow(InvalidEntryError);
  });
});

describe('parseSource', () => {
  it('reads repository and commit', () => {
    expect(parseSource({ repository: 'Domain-Connect/DnsProviders', commit: 'abc1234' })).toEqual({
      repository: 'Domain-Connect/DnsProviders',
      commit: 'abc1234',
    });
  });

  it.each([
    {},
    { repository: 'a/b/c', commit: 'abc1234' },
    { repository: 'a/b', commit: 'main' },
    { repository: 'a/b"><script>', commit: 'abc1234' },
  ])('rejects %j', (json) => {
    expect(parseSource(json)).toBeNull();
  });
});
