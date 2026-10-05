/**
 * Where the export release and the DNS provider registry are read from. Precedence: runtime
 * `window.DC_STATS_CONFIG` (set by an optional `config.js` next to the pages, so a deployed build
 * can be re-pointed without rebuilding), then the build-time variable, then the folder the deploy
 * workflow bundles next to the site (`./data/`, `./registry/`).
 */

export const DEFAULT_DATA_BASE_URL = './data/';
export const DEFAULT_REGISTRY_BASE_URL = './registry/';
/** The day scanning began (`YYYY-MM-DD`, UTC): earlier dates only say "already there". */
export const DEFAULT_SCANNER_START_DATE = '2026-09-20';

declare global {
  interface Window {
    DC_STATS_CONFIG?: {
      dataBaseUrl?: string;
      registryBaseUrl?: string;
      scannerStartDate?: string;
    };
  }
}

export function withTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : url + '/';
}

export function resolveBaseUrl(
  runtime: string | undefined,
  buildTime: string | undefined,
  fallback: string,
  pageUrl: string,
): string {
  const configured = runtime || buildTime || fallback;
  return new URL(withTrailingSlash(configured), pageUrl).href;
}

export function resolveDataBaseUrl(
  runtime: string | undefined,
  buildTime: string | undefined,
  pageUrl: string,
): string {
  return resolveBaseUrl(runtime, buildTime, DEFAULT_DATA_BASE_URL, pageUrl);
}

export function dataBaseUrl(): string {
  return resolveDataBaseUrl(
    window.DC_STATS_CONFIG?.dataBaseUrl,
    import.meta.env.VITE_DATA_BASE_URL as string | undefined,
    window.location.href,
  );
}

export function registryBaseUrl(): string {
  return resolveBaseUrl(
    window.DC_STATS_CONFIG?.registryBaseUrl,
    import.meta.env.VITE_REGISTRY_BASE_URL as string | undefined,
    DEFAULT_REGISTRY_BASE_URL,
    window.location.href,
  );
}

/** The configured scanner start date as UTC midnight; an invalid value falls back to the default. */
export function resolveScannerStart(runtime: unknown): Date {
  if (typeof runtime === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(runtime)) {
    const date = new Date(`${runtime}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().startsWith(runtime)) return date;
  }
  return new Date(`${DEFAULT_SCANNER_START_DATE}T00:00:00Z`);
}

export function scannerStart(): Date {
  return resolveScannerStart(window.DC_STATS_CONFIG?.scannerStartDate);
}
