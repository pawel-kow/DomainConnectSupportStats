import { describe, expect, it } from 'vitest';
import { supportLabel, supportRange, withStackSupport } from '../../src/lib/stacks';

describe('supportRange', () => {
  it('places the span on a 0–100 scale', () => {
    expect(supportRange({ min_templates_pct: 0, max_templates_pct: 33 })).toEqual({
      left: 0,
      width: 33,
    });
  });

  it('has no width when the stack has one measured deployment', () => {
    expect(supportRange({ min_templates_pct: 40, max_templates_pct: 40 })).toEqual({
      left: 40,
      width: 0,
    });
  });

  it('is null when no deployment has combinations', () => {
    expect(
      supportRange({
        min_templates_pct: null,
        max_templates_pct: null,
      }),
    ).toBeNull();
    expect(supportRange({})).toBeNull();
  });

  it('keeps values inside the scale', () => {
    expect(supportRange({ min_templates_pct: -1, max_templates_pct: 101 })).toEqual({
      left: 0,
      width: 100,
    });
  });
});

describe('supportLabel', () => {
  it('shows min and max', () => {
    expect(supportLabel({ min_templates_pct: 0, max_templates_pct: 33.33 })).toBe('0.0% – 33.3%');
  });

  it('shows one value when the ends are equal as displayed', () => {
    expect(supportLabel({ min_templates_pct: 9.41, max_templates_pct: 9.41 })).toBe('9.4%');
    expect(supportLabel({ min_templates_pct: 9.41, max_templates_pct: 9.44 })).toBe('9.4%');
  });

  it('shows a dash when unknown', () => {
    expect(supportLabel({})).toBe('–');
  });
});

describe('withStackSupport', () => {
  it('adds the derived distribution by provider_id, unknown when missing', () => {
    const support = {
      generated_at: '2026-10-01T00:00:00Z',
      stacks: [
        { provider_id: 'a', min_templates_pct: 1, median_templates_pct: 2, max_templates_pct: 3 },
      ],
    };
    expect(withStackSupport([{ provider_id: 'a' }, { provider_id: 'b' }], support)).toEqual([
      { provider_id: 'a', min_templates_pct: 1, median_templates_pct: 2, max_templates_pct: 3 },
      {
        provider_id: 'b',
        min_templates_pct: null,
        median_templates_pct: null,
        max_templates_pct: null,
      },
    ]);
    expect(withStackSupport([{ provider_id: 'a' }], null)[0]!.min_templates_pct).toBeNull();
  });
});
