import { describe, expect, it } from 'vitest';
import {
  formatAxisPct,
  formatCount,
  formatExact,
  formatDate,
  formatDateTime,
  formatFlag,
  formatPct,
  formatPp,
  isCompact,
  parseTimestamp,
  UNKNOWN,
} from '../../src/lib/format';

describe('parseTimestamp', () => {
  it('reads the export timestamp as UTC', () => {
    expect(parseTimestamp('2026-03-02 02:00:00')?.toISOString()).toBe('2026-03-02T02:00:00.000Z');
  });

  it('reads generated_at and older ISO values by their first 19 characters', () => {
    expect(parseTimestamp('2026-10-01T00:00:00Z')?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(parseTimestamp('2026-01-05T10:20:30+02:00')?.toISOString()).toBe(
      '2026-01-05T10:20:30.000Z',
    );
  });

  it('returns null for null, empty or malformed values', () => {
    expect(parseTimestamp(null)).toBeNull();
    expect(parseTimestamp('')).toBeNull();
    expect(parseTimestamp('yesterday')).toBeNull();
  });
});

describe('number formatting', () => {
  it('shows null as unknown, never as zero', () => {
    expect(formatCount(null)).toBe(UNKNOWN);
    expect(formatPct(null)).toBe(UNKNOWN);
    expect(formatPp(undefined)).toBe(UNKNOWN);
    expect(formatCount(0)).toBe('0');
  });

  it('rounds unrounded percentages for display only', () => {
    expect(formatPct(33.33333333333333)).toBe('33.3%');
    expect(formatPct(9.583333333333334, 2)).toBe('9.58%');
  });

  it('signs percentage-point changes', () => {
    expect(formatPp(-1.1111111111111107)).toBe('-1.11 pp');
    expect(formatPp(0.5)).toBe('+0.50 pp');
  });

  it('groups thousands in exact counts', () => {
    expect(formatExact(1234567)).toBe('1,234,567');
    expect(formatExact(null)).toBe(UNKNOWN);
  });

  it('keeps counts below 10,000 exact', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(9999)).toBe('9,999');
  });

  it('compacts counts from 10,000 to K, M and B with one decimal', () => {
    expect(formatCount(10000)).toBe('10K');
    expect(formatCount(12345)).toBe('12.3K');
    expect(formatCount(38531012)).toBe('38.5M');
    expect(formatCount(1234567890)).toBe('1.2B');
    expect(formatCount(190619029)).toBe('190.6M');
  });

  it('moves to the next unit when rounding reaches 1000', () => {
    expect(formatCount(999949)).toBe('999.9K');
    expect(formatCount(999950)).toBe('1M');
  });

  it('shows compact counts as unknown for null', () => {
    expect(formatCount(null)).toBe(UNKNOWN);
    expect(formatCount(undefined)).toBe(UNKNOWN);
  });

  it('knows whether a count is compacted', () => {
    expect(isCompact(9999)).toBe(false);
    expect(isCompact(10000)).toBe(true);
    expect(isCompact(null)).toBe(false);
  });
});

describe('adaptive percentages', () => {
  it('keeps two significant digits below 1%', () => {
    expect(formatPct(20.2)).toBe('20.2%');
    expect(formatPct(0.012345)).toBe('0.012%');
    expect(formatPct(0.00031415)).toBe('0.00031%');
    expect(formatPct(0.5)).toBe('0.50%');
  });

  it('floors tiny shares and keeps zero', () => {
    expect(formatPct(0.00004)).toBe('<0.0001%');
    expect(formatPct(0)).toBe('0.0%');
  });

  it('formats axis ticks with the decimals their step needs', () => {
    expect(formatAxisPct(20, 10)).toBe('20%');
    expect(formatAxisPct(0.0002, 0.0001)).toBe('0.0002%');
    expect(formatAxisPct(0.25, 0.25)).toBe('0.25%');
    expect(formatAxisPct(0.0003, undefined)).toBe('0.00030%');
  });
});

describe('date formatting', () => {
  it('uses DD-MM-YYYY like stats.domainconnect.org, in UTC', () => {
    expect(formatDate('2026-03-02 23:30:00')).toBe('02-03-2026');
    expect(formatDateTime('2026-10-01T00:00:00Z')).toBe('01-10-2026 00:00 UTC');
    expect(formatDate(null)).toBe(UNKNOWN);
  });
});

describe('formatFlag', () => {
  it('shows yes, no and unknown', () => {
    expect(formatFlag(true)).toBe('yes');
    expect(formatFlag(false)).toBe('no');
    expect(formatFlag(null)).toBe('–');
  });
});
