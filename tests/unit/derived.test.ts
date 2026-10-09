import { describe, expect, it } from 'vitest';
import { templateShares } from '../../src/lib/data/derived';

const deployment = (supported: number, answers = 1) => ({
  supported_templates: supported,
  supported_count: supported,
  unsupported_count: answers,
});

describe('templateShares', () => {
  it('is min, median and max of supported templates as shares of every template', () => {
    expect(templateShares([deployment(1), deployment(3), deployment(2)], 4)).toEqual({
      min_templates_pct: 25,
      median_templates_pct: 50,
      max_templates_pct: 75,
    });
  });

  it('takes the mean of the middle two for an even count', () => {
    expect(templateShares([deployment(1), deployment(2)], 4).median_templates_pct).toBe(37.5);
  });

  it('leaves out deployments without a probe answer', () => {
    const unanswered = { supported_templates: 0, supported_count: 0, unsupported_count: 0 };
    expect(templateShares([deployment(2), unanswered], 4).min_templates_pct).toBe(50);
  });

  it('is unknown without an answered deployment or templates', () => {
    const unknown = {
      min_templates_pct: null,
      median_templates_pct: null,
      max_templates_pct: null,
    };
    expect(templateShares([], 4)).toEqual(unknown);
    expect(templateShares([deployment(1)], null)).toEqual(unknown);
  });
});
