import { describe, expect, it } from 'vitest';
import { domainsTitle, ofScanned, scanLabel, shareScan } from '../../src/lib/domains';
import type { Manifest } from '../../src/lib/data/types';
import { exampleJson, exampleManifest } from '../fixtures';

describe('scanLabel', () => {
  it('is a full scan for a census, a partial one for a sample', () => {
    expect(scanLabel({ sample_percent: 100, started_at: '2026-06-01 00:00:00' })).toBe(
      'full scan of 01-06-2026',
    );
    expect(scanLabel({ sample_percent: 5, started_at: '2026-06-01 00:00:00' })).toBe(
      'partial scan of 01-06-2026',
    );
  });

  it('says only scan when the sampling is unknown', () => {
    expect(scanLabel({ sample_percent: null, started_at: '2026-06-01 00:00:00' })).toBe(
      'scan of 01-06-2026',
    );
  });

  it('dates by completed_at without started_at, and leaves an unknown date out', () => {
    expect(scanLabel({ sample_percent: 100, completed_at: '2026-06-02 07:00:00' })).toBe(
      'full scan of 02-06-2026',
    );
    expect(scanLabel({ sample_percent: 100 })).toBe('full scan');
    expect(scanLabel(undefined)).toBe('scan');
  });
});

describe('shareScan', () => {
  it("is the domain-share import's scanned domains and its scan", () => {
    expect(shareScan(exampleManifest(), exampleJson('overview.json'))).toEqual({
      scannedDomains: 12000,
      label: 'partial scan of 01-06-2026',
    });
  });

  it('takes the sampling from the manifest when the overview lacks the import', () => {
    expect(shareScan(exampleManifest(), null)).toEqual({
      scannedDomains: 12000,
      label: 'partial scan',
    });
  });

  it('is null without a domain-share import', () => {
    const manifest: Manifest = { ...exampleManifest(), share_import: null };
    expect(shareScan(manifest, exampleJson('overview.json'))).toBeNull();
  });
});

describe('ofScanned', () => {
  it('relates domains to the scanned domains of a scan', () => {
    expect(ofScanned(80_000_000, 190_600_000, 'full scan of 05-09-2026')).toBe(
      '80M of 190.6M scanned domains in the full scan of 05-09-2026',
    );
  });

  it('is undefined when the domains are unknown', () => {
    expect(ofScanned(null, 12000, 'scan')).toBeUndefined();
  });
});

describe('domainsTitle', () => {
  it('relates domains to the domain-share import', () => {
    expect(domainsTitle(7210, { scannedDomains: 12000, label: 'partial scan of 01-06-2026' })).toBe(
      '7,210 of 12K scanned domains in the partial scan of 01-06-2026',
    );
  });

  it('is undefined without domains or without a domain-share import', () => {
    expect(domainsTitle(null, { scannedDomains: 12000, label: 'scan' })).toBeUndefined();
    expect(domainsTitle(7210, null)).toBeUndefined();
  });
});
