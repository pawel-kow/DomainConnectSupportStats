/**
 * Folder of a DNS provider registry entry: `<a>/<b>/` from the first and second character of the
 * raw `providerId`, lowercased; a character other than `a-z`, `0-9` becomes `_`, and a
 * one-character id has `<b>` = `_`.
 */

const KEPT = /^[a-z0-9]$/;

function folder(char: string | undefined): string {
  const lower = char?.toLowerCase();
  return lower && KEPT.test(lower) ? lower : '_';
}

export function registryPath(providerId: string): string {
  const [a, b] = Array.from(providerId);
  return `${folder(a)}/${folder(b)}/`;
}
