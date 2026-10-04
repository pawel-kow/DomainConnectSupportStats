/**
 * Path-segment encoding of export ids (EXPORT_FORMAT.md "Id encoding").
 *
 * Ids come from third parties (the Templates repository, DNS providers' settings responses), so
 * the Scanner encodes each into exactly one safe path segment. Page URLs carry the raw id; only
 * file paths use this encoding.
 */

const TILDE_ESCAPE = /~([0-9a-f]{2})/g;

function isKeptByte(byte: number, index: number): boolean {
  const isLower = byte >= 0x61 && byte <= 0x7a;
  const isDigit = byte >= 0x30 && byte <= 0x39;
  const isUnderscoreOrDash = byte === 0x5f || byte === 0x2d;
  // A leading '.' is escaped so a segment is never '.', '..' or a hidden file.
  const isInnerDot = byte === 0x2e && index > 0;
  return isLower || isDigit || isUnderscoreOrDash || isInnerDot;
}

/** Encode one id (numeric ids from their decimal text) into a file path segment. */
export function encodeSegment(id: string | number): string {
  const bytes = new TextEncoder().encode(String(id));
  let out = '';
  bytes.forEach((byte, i) => {
    out += isKeptByte(byte, i)
      ? String.fromCharCode(byte)
      : '~' + byte.toString(16).padStart(2, '0');
  });
  return out;
}

/** Inverse of {@link encodeSegment}. */
export function decodeSegment(segment: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < segment.length;) {
    TILDE_ESCAPE.lastIndex = i;
    const match = TILDE_ESCAPE.exec(segment);
    if (match && match.index === i) {
      bytes.push(parseInt(match[1]!, 16));
      i += 3;
    } else {
      bytes.push(segment.charCodeAt(i));
      i += 1;
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}
