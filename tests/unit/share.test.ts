import { describe, expect, it } from 'vitest';
import {
  blueskyUrl,
  isApplePlatform,
  linkedinUrl,
  loadInstance,
  mastodonUrl,
  parseInstance,
  postText,
  saveInstance,
  sharedUrl,
  withHash,
} from '../../src/lib/share';

describe('sharedUrl', () => {
  it('keeps the page and its query, sets the panel anchor', () => {
    expect(sharedUrl('https://stats.example/site/dns-provider.html?id=42', 'support-history')).toBe(
      'https://stats.example/site/dns-provider.html?id=42#support-history',
    );
  });

  it('replaces an existing anchor', () => {
    expect(
      sharedUrl('https://stats.example/leaderboards.html?window=90d#most-domains', 'most-improved'),
    ).toBe('https://stats.example/leaderboards.html?window=90d#most-improved');
  });

  it('keeps raw ids URL-encoded', () => {
    expect(
      sharedUrl(
        'https://stats.example/template.html?spid=Acme.example&sid=Mail+%26+more',
        'records',
      ),
    ).toBe('https://stats.example/template.html?spid=Acme.example&sid=Mail+%26+more#records');
  });
});

describe('sharedUrl with a share base URL', () => {
  const BASE = 'https://stats.example/site/';

  it('puts the page, its query and the anchor under the share base URL', () => {
    expect(
      sharedUrl('http://localhost:5173/stack.html?id=plesk.com#coverage', 'deployments', BASE),
    ).toBe('https://stats.example/site/stack.html?id=plesk.com#deployments');
  });

  it('keeps the page when the site is served from a sub-path or from its root', () => {
    expect(sharedUrl('http://localhost:4173/a/b/templates.html?q=x', 'templates', BASE)).toBe(
      'https://stats.example/site/templates.html?q=x#templates',
    );
    expect(sharedUrl('http://localhost:4173/', 'support-history', BASE)).toBe(
      'https://stats.example/site/#support-history',
    );
  });

  it('adds the missing trailing slash', () => {
    expect(sharedUrl('http://localhost/stacks.html', 'stacks', 'https://stats.example/site')).toBe(
      'https://stats.example/site/stacks.html#stacks',
    );
  });

  it('uses the page URL without one', () => {
    expect(sharedUrl('http://localhost/stacks.html', 'stacks', null)).toBe(
      'http://localhost/stacks.html#stacks',
    );
  });
});

describe('withHash', () => {
  it('appends the current anchor to a page link', () => {
    expect(withHash('./dns-providers.html?q=plesk', '#dns-providers')).toBe(
      './dns-providers.html?q=plesk#dns-providers',
    );
    expect(withHash('./dns-providers.html', '')).toBe('./dns-providers.html');
  });
});

describe('postText', () => {
  it('names the panel, the page context and the site', () => {
    expect(postText('Most improved', 'Leaderboards')).toBe(
      'Most improved – Leaderboards – Domain Connect support statistics',
    );
  });

  it('drops a missing context or one equal to the panel title', () => {
    expect(postText('Stacks', 'Stacks')).toBe('Stacks – Domain Connect support statistics');
    expect(postText('Stacks', null)).toBe('Stacks – Domain Connect support statistics');
  });

  it('keeps names from the data as plain text on one line', () => {
    expect(postText('Records', ' <b>Acme</b>\n & co ')).toBe(
      'Records – <b>Acme</b> & co – Domain Connect support statistics',
    );
  });
});

describe('targets', () => {
  const url = 'https://stats.example/stack.html?id=a&b#coverage';
  const text = 'Coverage – A & B – Domain Connect support statistics';

  it('Bluesky composes the text followed by the link', () => {
    const u = new URL(blueskyUrl(text, url));
    expect(u.origin + u.pathname).toBe('https://bsky.app/intent/compose');
    expect(u.searchParams.get('text')).toBe(`${text} ${url}`);
  });

  it('Mastodon shares on the chosen instance', () => {
    const u = new URL(mastodonUrl('mastodon.social', text, url));
    expect(u.origin + u.pathname).toBe('https://mastodon.social/share');
    expect(u.searchParams.get('text')).toBe(`${text} ${url}`);
  });

  it('LinkedIn shares the link only', () => {
    const u = new URL(linkedinUrl(url));
    expect(u.origin + u.pathname).toBe('https://www.linkedin.com/sharing/share-offsite/');
    expect([...u.searchParams.keys()]).toEqual(['url']);
    expect(u.searchParams.get('url')).toBe(url);
  });
});

describe('parseInstance', () => {
  it('accepts a host name, lower-cased', () => {
    expect(parseInstance('mastodon.social')).toBe('mastodon.social');
    expect(parseInstance('  Fosstodon.ORG ')).toBe('fosstodon.org');
    expect(parseInstance('social.xn--bcher-kva.example')).toBe('social.xn--bcher-kva.example');
  });

  it('accepts a pasted instance URL', () => {
    expect(parseInstance('https://mastodon.social/')).toBe('mastodon.social');
    expect(parseInstance('https://mastodon.social/@someone')).toBe('mastodon.social');
  });

  it('rejects anything that is not a host name', () => {
    for (const bad of [
      '',
      'localhost',
      'mastodon',
      'mastodon..social',
      '-mastodon.social',
      'mastodon.social:8080',
      'user@mastodon.social',
      'evil.example/share?x=',
      'javascript:alert(1)',
      'http://mastodon.social',
      '127.0.0.1',
      'a'.repeat(64) + '.social',
    ])
      expect(parseInstance(bad), bad).toBeNull();
  });
});

describe('instance storage', () => {
  function memory(): Storage {
    const m = new Map<string, string>();
    return {
      getItem: (k) => m.get(k) ?? null,
      setItem: (k, v) => void m.set(k, v),
      removeItem: (k) => void m.delete(k),
      clear: () => m.clear(),
      key: () => null,
      get length() {
        return m.size;
      },
    };
  }

  it('round-trips a valid instance', () => {
    const s = memory();
    expect(loadInstance(s)).toBeNull();
    saveInstance('mastodon.social', s);
    expect(loadInstance(s)).toBe('mastodon.social');
  });

  it('ignores a stored value that is not a host name', () => {
    const s = memory();
    s.setItem('dc-stats.mastodon-instance', 'javascript:alert(1)');
    expect(loadInstance(s)).toBeNull();
  });

  it('survives storage that throws or is missing', () => {
    const broken = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    } as unknown as Storage;
    expect(loadInstance(broken)).toBeNull();
    expect(() => saveInstance('mastodon.social', broken)).not.toThrow();
    expect(loadInstance(null)).toBeNull();
  });
});

describe('isApplePlatform', () => {
  it('is true on macOS, iOS and iPadOS', () => {
    expect(isApplePlatform({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)' })).toBe(
      true,
    );
    expect(
      isApplePlatform({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)' }),
    ).toBe(true);
    expect(isApplePlatform({ userAgent: 'x', userAgentData: { platform: 'macOS' } })).toBe(true);
  });

  it('is false elsewhere', () => {
    expect(isApplePlatform({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })).toBe(false);
    expect(isApplePlatform({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7)' })).toBe(false);
    expect(isApplePlatform({ userAgent: 'x', userAgentData: { platform: 'Windows' } })).toBe(false);
  });
});
