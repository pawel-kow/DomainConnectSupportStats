import { describe, expect, it } from 'vitest';
import { supportRange } from '../../src/lib/stacks';

describe('supportRange', () => {
  it('places the span and the median on a 0–100 scale', () => {
    expect(
      supportRange({ min_supported_pct: 0, median_supported_pct: 16.5, max_supported_pct: 33 }),
    ).toEqual({ left: 0, width: 33, median: 16.5 });
  });

  it('has no width when the stack has one measured deployment', () => {
    expect(
      supportRange({ min_supported_pct: 40, median_supported_pct: 40, max_supported_pct: 40 }),
    ).toEqual({ left: 40, width: 0, median: 40 });
  });

  it('is null when no deployment has combinations', () => {
    expect(
      supportRange({
        min_supported_pct: null,
        median_supported_pct: null,
        max_supported_pct: null,
      }),
    ).toBeNull();
    expect(supportRange({})).toBeNull();
  });

  it('keeps values inside the scale', () => {
    expect(
      supportRange({ min_supported_pct: -1, median_supported_pct: 50, max_supported_pct: 101 }),
    ).toEqual({ left: 0, width: 100, median: 50 });
  });
});
