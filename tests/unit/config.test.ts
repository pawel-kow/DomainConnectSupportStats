import { describe, expect, it } from 'vitest';
import { resolveDataBaseUrl } from '../../src/lib/data/config';

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
