/**
 * Derived data: facts the export has only spread over its cards, collected by
 * `scripts/derive.ts` into files next to the export (`<data>/derived/`). Dependency-free: the
 * script imports it under Node's type stripping.
 */

/** Folder of the derived files, relative to the data base URL. */
export const DERIVED_DIR = 'derived/';
export const LEADERBOARDS_FILE = 'leaderboards.json';

export interface Sweep {
  sweep_id: number;
  started_at: string;
}

export interface FirstSupport extends Sweep {
  dns_provider_id: number;
  /** Templates supported once that sweep had run. */
  supported_templates: number;
}

export interface Leaderboards {
  /** The release's `generated_at`: the site rejects the file for any other release. */
  generated_at: string;
  /** The earliest sweep in any DNS provider card's `support_history`; `null` without one. */
  first_sweep: Sweep | null;
  /**
   * Per DNS provider, its first `support_history` row with `supported_templates` > 0, unless that
   * row is the export's first sweep. Newest first, then by `dns_provider_id`.
   */
  first_support: FirstSupport[];
}
