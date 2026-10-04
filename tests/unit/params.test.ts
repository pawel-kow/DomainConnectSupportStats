import { describe, expect, it } from 'vitest';
import { flagParam, integerParam, textParam } from '../../src/lib/params';

describe('textParam', () => {
  it('returns the raw value, decoded', () => {
    expect(textParam('?id=Acme.example', 'id')).toBe('Acme.example');
    expect(textParam('?sid=Mail+%26+more', 'sid')).toBe('Mail & more');
  });

  it('is null when missing or blank', () => {
    expect(textParam('', 'id')).toBeNull();
    expect(textParam('?id=', 'id')).toBeNull();
    expect(textParam('?id=%20', 'id')).toBeNull();
  });
});

describe('integerParam', () => {
  it('reads a non-negative decimal integer', () => {
    expect(integerParam('?id=42', 'id')).toBe(42);
    expect(integerParam('?id=0', 'id')).toBe(0);
  });

  it('is null for anything else', () => {
    for (const search of ['', '?id=', '?id=abc', '?id=1.5', '?id=-1', '?id=1e3', '?id=0x10']) {
      expect(integerParam(search, 'id')).toBeNull();
    }
  });
});

describe('flagParam', () => {
  it('is on only for 1', () => {
    expect(flagParam('?all=1', 'all')).toBe(true);
    for (const search of ['', '?all=', '?all=0', '?all=true']) {
      expect(flagParam(search, 'all')).toBe(false);
    }
  });
});
