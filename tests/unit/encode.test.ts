import { describe, expect, it } from 'vitest';
import { decodeSegment, encodeSegment } from '../../src/lib/data/encode';

// Every example of EXPORT_FORMAT.md "Id encoding", plus the manifest's own `id_encoding` example.
const CONTRACT_EXAMPLES: [string | number, string][] = [
  ['example.com', 'example.com'],
  [42, '42'],
  ['Example.com', '~45xample.com'],
  ['a/b', 'a~2fb'],
  ['100%', '100~25'],
  ['..', '~2e.'],
  ['.hidden', '~2ehidden'],
  ['münchen.de', 'm~c3~bcnchen.de'],
  ['UPPER case', '~55~50~50~45~52~20case'],
  ['Example.com/A b', '~45xample.com~2f~41~20b'],
];

describe('encodeSegment', () => {
  it.each(CONTRACT_EXAMPLES)('encodes %j as %j', (id, encoded) => {
    expect(encodeSegment(id)).toBe(encoded);
  });

  it('keeps an inner dot but escapes a leading one', () => {
    expect(encodeSegment('a.b')).toBe('a.b');
    expect(encodeSegment('.')).toBe('~2e');
  });

  it('never yields a path separator, percent sign or uppercase letter', () => {
    for (const id of ['A/B%C', '../../etc/passwd', 'ÄÖÜ', 'x\\y']) {
      expect(encodeSegment(id)).toMatch(/^[a-z0-9._~-]+$/);
      expect(encodeSegment(id).startsWith('.')).toBe(false);
    }
  });
});

describe('decodeSegment', () => {
  it.each(CONTRACT_EXAMPLES)('round-trips %j', (id, encoded) => {
    expect(decodeSegment(encoded)).toBe(String(id));
  });
});
