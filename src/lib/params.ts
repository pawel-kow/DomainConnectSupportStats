/**
 * Page query parameters. They carry raw ids (EXPORT_FORMAT.md "Pages"); a missing or malformed
 * one is `null`, and the card shows its "not found" state.
 */

/** A raw text id, or null when missing or blank. */
export function textParam(search: string, name: string): string | null {
  const value = new URLSearchParams(search).get(name);
  return value && value.trim() ? value : null;
}

const DECIMAL = /^\d+$/;

/** A numeric id (`dns_provider_id`): a non-negative decimal integer, or null. */
export function integerParam(search: string, name: string): number | null {
  const value = textParam(search, name);
  return value !== null && DECIMAL.test(value) ? Number(value) : null;
}

/** A toggle: on only for `1`. */
export function flagParam(search: string, name: string): boolean {
  return new URLSearchParams(search).get(name) === '1';
}
