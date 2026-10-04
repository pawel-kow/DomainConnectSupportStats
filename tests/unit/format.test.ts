import { describe, expect, it } from 'vitest';
import {
  formatCount,
  formatDate,
  formatDateTime,
  formatPct,
  formatPp,
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

  it('groups thousands', () => {
    expect(formatCount(1234567)).toBe('1,234,567');
  });
});

describe('date formatting', () => {
  it('uses DD-MM-YYYY like stats.domainconnect.org, in UTC', () => {
    expect(formatDate('2026-03-02 23:30:00')).toBe('02-03-2026');
    expect(formatDateTime('2026-10-01T00:00:00Z')).toBe('01-10-2026 00:00 UTC');
    expect(formatDate(null)).toBe(UNKNOWN);
  });
});
