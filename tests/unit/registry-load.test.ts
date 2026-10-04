import { describe, expect, it } from 'vitest';
import type { Fetch } from '../../src/lib/data/load';
import { entryFileUrl, RegistryClient } from '../../src/lib/registry/load';

const BASE = 'https://stats.example/registry/';

function client(responses: Record<string, Response>, requested: string[] = []) {
  const fetchFn: Fetch = (url) => {
    requested.push(url);
    return Promise.resolve(responses[url] ?? new Response('', { status: 404 }));
  };
  return new RegistryClient(BASE, fetchFn);
}

const json = (body: unknown) => new Response(JSON.stringify(body));

describe('RegistryClient', () => {
  it('requests <a>/<b>/<encoded providerId>.json', async () => {
    const requested: string[] = [];
    await client({}, requested).entry('My Host');
    expect(requested).toEqual([`${BASE}m/y/~4dy~20~48ost.json`]);
  });

  it('parses an entry and builds its logo URL in the same folder', async () => {
    const c = client({
      [`${BASE}c/l/cloudflare.com.json`]: json({
        providerId: 'cloudflare.com',
        name: 'Cloudflare',
        logo: 'Logo.svg',
      }),
    });
    const entry = await c.entry('cloudflare.com');
    expect(entry?.name).toBe('Cloudflare');
    expect(c.logoUrl(entry!)).toBe(`${BASE}c/l/~4cogo.svg`);
  });

  it('returns null for a 404 and throws on any other failure', async () => {
    await expect(client({}).entry('quiet-host.example')).resolves.toBeNull();
    await expect(
      client({ [`${BASE}x/_/x.json`]: new Response('', { status: 500 }) }).entry('x'),
    ).rejects.toThrow('HTTP 500');
    await expect(client({ [`${BASE}x/_/x.json`]: json({}) }).entry('x')).rejects.toThrow();
  });

  it('reads the source, or null when it is missing or invalid', async () => {
    const source = { repository: 'Domain-Connect/DnsProviders', commit: 'abc1234' };
    await expect(client({ [`${BASE}registry.json`]: json(source) }).source()).resolves.toEqual(
      source,
    );
    await expect(client({}).source()).resolves.toBeNull();
    await expect(
      client({ [`${BASE}registry.json`]: new Response('not json') }).source(),
    ).resolves.toBeNull();
  });

  it('fetches the source once', async () => {
    const requested: string[] = [];
    const c = client({}, requested);
    await Promise.all([c.source(), c.source()]);
    expect(requested).toEqual([`${BASE}registry.json`]);
  });
});

describe('entryFileUrl', () => {
  it('links the entry at the bundled commit', () => {
    expect(
      entryFileUrl({ repository: 'Domain-Connect/DnsProviders', commit: 'abc1234' }, 'plesk.com'),
    ).toBe(
      'https://github.com/Domain-Connect/DnsProviders/blob/abc1234/providers/p/l/plesk.com.json',
    );
  });
});
