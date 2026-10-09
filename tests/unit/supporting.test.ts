import { describe, expect, it } from 'vitest';
import type { ExportFile } from '../../src/lib/data/types';
import { ofSupporting, supportingDnsProviders, templateCount } from '../../src/lib/supporting';
import { exampleManifest } from '../fixtures';
import { exampleJson } from '../fixtures';

describe('supportingDnsProviders', () => {
  it("is the overview's latest ecosystem count", () => {
    expect(supportingDnsProviders(exampleJson('overview.json'))).toBe(4);
  });

  it('is null without ecosystem rows or without the overview', () => {
    const overview = exampleJson('overview.json');
    const empty: ExportFile = { ...overview, tables: {} };
    expect(supportingDnsProviders(empty)).toBeNull();
    expect(supportingDnsProviders(null)).toBeNull();
  });
});

describe('ofSupporting', () => {
  it('is a percentage of the supporting DNS providers', () => {
    expect(ofSupporting(1, 4)).toBe(25);
    expect(ofSupporting(0, 4)).toBe(0);
  });

  it('is null when either is unknown or there is no supporting DNS provider', () => {
    expect(ofSupporting(null, 4)).toBeNull();
    expect(ofSupporting(1, null)).toBeNull();
    expect(ofSupporting(0, 0)).toBeNull();
  });
});

describe('templateCount', () => {
  it('is the row count of the templates list', () => {
    expect(templateCount(exampleManifest())).toBe(5);
  });

  it('is null without a manifest', () => {
    expect(templateCount(null)).toBeNull();
  });
});
