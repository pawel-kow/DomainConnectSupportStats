import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REGISTRY_BASE_URL,
  resolveBaseUrl,
  resolveDataBaseUrl,
  resolveScannerStart,
} from '../../src/lib/data/config';

const PAGE = 'https://example.github.io/DomainConnectSupportStats/stack.html?id=plesk.com';

describe('resolveDataBaseUrl', () => {
  it('defaults to ./data/ next to the page', () => {
    expect(resolveDataBaseUrl(undefined, undefined, PAGE)).toBe(
      'https://example.github.io/DomainConnectSupportStats/data/',
    );
  });

  it('prefers runtime over build-time configuration', () => {
    expect(resolveDataBaseUrl('https://data.example/current', 'https://build.example/', PAGE)).toBe(
      'https://data.example/current/',
    );
    expect(resolveDataBaseUrl(undefined, '/export/', PAGE)).toBe(
      'https://example.github.io/export/',
    );
  });
});

describe('resolveBaseUrl', () => {
  it('defaults the registry to ./registry/ next to the page', () => {
    expect(resolveBaseUrl(undefined, undefined, DEFAULT_REGISTRY_BASE_URL, PAGE)).toBe(
      'https://example.github.io/DomainConnectSupportStats/registry/',
    );
  });

  it('prefers runtime over build-time configuration', () => {
    expect(
      resolveBaseUrl('https://reg.example/x', '/build/', DEFAULT_REGISTRY_BASE_URL, PAGE),
    ).toBe('https://reg.example/x/');
    expect(resolveBaseUrl(undefined, '/build', DEFAULT_REGISTRY_BASE_URL, PAGE)).toBe(
      'https://example.github.io/build/',
    );
  });
});

describe('resolveScannerStart', () => {
  it('is null when unset', () => {
    expect(resolveScannerStart(undefined)).toBeNull();
  });

  it('reads a configured date as UTC midnight', () => {
    expect(resolveScannerStart('2026-01-31')?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  it.each(['', 'yesterday', '2026-9-1', '2026-02-30', '2026-13-01', 20260920, null])(
    'is null for %j',
    (value) => {
      expect(resolveScannerStart(value)).toBeNull();
    },
  );
});
