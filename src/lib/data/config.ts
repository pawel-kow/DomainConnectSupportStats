/**
 * Where the export release is read from. Precedence: runtime `window.DC_STATS_CONFIG.dataBaseUrl`
 * (set by an optional `config.js` next to the pages, so a deployed build can be re-pointed without
 * rebuilding), then build-time `VITE_DATA_BASE_URL`, then `./data/` (the release bundled by the
 * deploy workflow).
 */

export const DEFAULT_DATA_BASE_URL = './data/';

declare global {
  interface Window {
    DC_STATS_CONFIG?: { dataBaseUrl?: string };
  }
}

export function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : url + '/';
}

export function resolveDataBaseUrl(
  runtime: string | undefined,
  buildTime: string | undefined,
  pageUrl: string,
): string {
  const configured = runtime || buildTime || DEFAULT_DATA_BASE_URL;
  return new URL(withTrailingSlash(configured), pageUrl).href;
}

export function dataBaseUrl(): string {
  return resolveDataBaseUrl(
    window.DC_STATS_CONFIG?.dataBaseUrl,
    import.meta.env.VITE_DATA_BASE_URL as string | undefined,
    window.location.href,
  );
}
