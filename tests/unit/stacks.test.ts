import { describe, expect, it } from 'vitest';
import { supportRange } from '../../src/lib/stacks';

describe('supportRange', () => {
  it('places the span on a 0–100 scale', () => {
    expect(supportRange({ min_supported_pct: 0, max_supported_pct: 33 })).toEqual({
      left: 0,
      width: 33,
    });
  });

  it('has no width when the stack has one measured deployment', () => {
    expect(supportRange({ min_supported_pct: 40, max_supported_pct: 40 })).toEqual({
      left: 40,
      width: 0,
    });
  });

  it('is null when no deployment has combinations', () => {
    expect(
      supportRange({
        min_supported_pct: null,
        max_supported_pct: null,
      }),
    ).toBeNull();
    expect(supportRange({})).toBeNull();
  });

  it('keeps values inside the scale', () => {
    expect(supportRange({ min_supported_pct: -1, max_supported_pct: 101 })).toEqual({
      left: 0,
      width: 100,
    });
  });
});
