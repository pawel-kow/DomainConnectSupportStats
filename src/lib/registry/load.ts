import { registryBaseUrl } from '../data/config';
import { encodeSegment } from '../data/encode';
import type { Fetch } from '../data/load';
import { entryPath, registryPath } from './path';
import { parseEntry, parseSource, type RegistryEntry, type RegistrySource } from './entry';

/**
 * Reads the DNS provider registry bundled by the deploy: `<a>/<b>/<encoded providerId>.json`,
 * logos next to them, and `registry.json` naming the repository and commit.
 */
export class RegistryClient {
  private sourceLoad: Promise<RegistrySource | null> | null = null;

  constructor(
    readonly baseUrl: string,
    private readonly fetchFn: Fetch = (input) => fetch(input),
  ) {}

  private url(providerId: string, fileName: string): string {
    return new URL(registryPath(providerId) + encodeSegment(fileName), this.baseUrl).href;
  }

  /** The entry of `providerId`, or null when it has none (404). Any other failure throws. */
  async entry(providerId: string): Promise<RegistryEntry | null> {
    const url = this.url(providerId, `${providerId}.json`);
    const response = await this.fetchFn(url);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return parseEntry(await response.json());
  }

  /** URL of the entry's logo, or null when it names none. */
  logoUrl(entry: RegistryEntry): string | null {
    return entry.logo ? this.url(entry.providerId, entry.logo) : null;
  }

  /** The repository and commit the registry was bundled from, or null when unknown. Fetched once. */
  source(): Promise<RegistrySource | null> {
    return (this.sourceLoad ??= this.loadSource());
  }

  private async loadSource(): Promise<RegistrySource | null> {
    try {
      const response = await this.fetchFn(new URL('registry.json', this.baseUrl).href);
      return response.ok ? parseSource(await response.json()) : null;
    } catch {
      return null;
    }
  }
}

/** Link to the entry's file in the registry's repository at the bundled commit. */
export function entryFileUrl(source: RegistrySource, providerId: string): string {
  const path = entryPath(providerId).split('/').map(encodeURIComponent).join('/');
  return `https://github.com/${source.repository}/blob/${source.commit}/${path}`;
}

export function defaultRegistryClient(): RegistryClient {
  return new RegistryClient(registryBaseUrl());
}
