import { describe, expect, it } from 'vitest';
import { registryPath } from '../../src/lib/registry/path';

describe('registryPath', () => {
  // The examples of the registry's repository layout.
  it.each([
    ['cloudflare.com', 'c/l/'],
    ['1and1', '1/a/'],
    ['x', 'x/_/'],
  ])('puts %j under %j', (id, path) => {
    expect(registryPath(id)).toBe(path);
  });

  it('lowercases letters', () => {
    expect(registryPath('IONOS')).toBe('i/o/');
  });

  it('turns any other character into _', () => {
    expect(registryPath('.x')).toBe('_/x/');
    expect(registryPath('a-b')).toBe('a/_/');
    expect(registryPath('ä€')).toBe('_/_/');
    expect(registryPath('😀b')).toBe('_/b/');
  });
});
