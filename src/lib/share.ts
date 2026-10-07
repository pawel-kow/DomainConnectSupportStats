/**
 * Sharing a panel: its link, the post text and the share URL of each target. The targets are
 * opened by the viewer only; the site never requests them.
 */

export const SITE_NAME = 'Domain Connect support statistics';

const INSTANCE_KEY = 'dc-stats.mastodon-instance';

/** The absolute URL of the current page (with its query) pointing at panel `anchor`. */
export function sharedUrl(location: string, anchor: string): string {
  const url = new URL(location);
  url.hash = anchor;
  return url.href;
}

/** A page link with the current anchor kept, for `history.replaceState`. */
export function withHash(link: string, hash: string): string {
  return hash ? link + hash : link;
}

/** `<panel> – <page context> – <site>`; the context is left out when missing or the same. */
export function postText(panel: string, context?: string | null): string {
  const parts = [panel, context]
    .map((s) => s?.replace(/\s+/g, ' ').trim() ?? '')
    .filter((s, i, all) => s && (i === 0 || s !== all[0]));
  return [...parts, SITE_NAME].join(' – ');
}

export function blueskyUrl(text: string, url: string): string {
  return 'https://bsky.app/intent/compose?' + new URLSearchParams({ text: `${text} ${url}` });
}

/** `instance` must come from `parseInstance`. */
export function mastodonUrl(instance: string, text: string, url: string): string {
  return `https://${instance}/share?` + new URLSearchParams({ text: `${text} ${url}` });
}

export function linkedinUrl(url: string): string {
  return 'https://www.linkedin.com/sharing/share-offsite/?' + new URLSearchParams({ url });
}

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;

/**
 * The Mastodon instance's host name from what the viewer typed (`mastodon.social`, or a pasted
 * `https://mastodon.social/@someone`), or null. Only a plain DNS name with a top-level domain
 * passes: no port, credentials, path or IP address.
 */
export function parseInstance(input: string): string | null {
  let host = input.trim().toLowerCase();
  const https = /^https:\/\/([^/?#]*)(?:[/?#].*)?$/.exec(host);
  if (https) host = https[1]!;
  if (host.length > 253) return null;
  const labels = host.split('.');
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l))) return null;
  if (/^[0-9]+$/.test(labels.at(-1)!)) return null;
  return host;
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The Mastodon instance this browser shared to before, or null. */
export function loadInstance(store: Storage | null = storage()): string | null {
  try {
    const value = store?.getItem(INSTANCE_KEY);
    return value ? parseInstance(value) : null;
  } catch {
    return null;
  }
}

/** Remembers the Mastodon instance in this browser; silently skipped when storage is blocked. */
export function saveInstance(instance: string, store: Storage | null = storage()): void {
  try {
    store?.setItem(INSTANCE_KEY, instance);
  } catch {
    // Private mode or blocked site data: the viewer is asked again next time.
  }
}

interface NavigatorLike {
  userAgent: string;
  userAgentData?: { platform?: string };
}

/** macOS, iOS or iPadOS: the share icon is the box with an arrow there. */
export function isApplePlatform(nav: NavigatorLike): boolean {
  const platform = nav.userAgentData?.platform;
  if (platform) return /^(macOS|iOS)$/i.test(platform);
  return /Macintosh|iPhone|iPad|iPod/.test(nav.userAgent);
}
