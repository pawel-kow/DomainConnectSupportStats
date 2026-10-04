import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  EXAMPLE_REGISTRY_DIR,
  entryPath,
  loadRegistrySchema,
  validateRegistry,
} from '../../scripts/registry';

const validate = loadRegistrySchema();

describe('example registry', () => {
  it('is valid: schema, paths, logos', () => {
    const { entries, errors } = validateRegistry(EXAMPLE_REGISTRY_DIR, validate);
    expect(errors).toEqual([]);
    expect(entries).toEqual(
      expect.arrayContaining([
        {
          providerId: 'cloudflare.com',
          file: 'providers/c/l/cloudflare.com.json',
          logo: 'providers/c/l/cloudflare.com.svg',
        },
        {
          providerId: 'ionos.com',
          file: 'providers/i/o/ionos.com.json',
          logo: 'providers/i/o/ionos.com.svg',
        },
        { providerId: 'plesk.com', file: 'providers/p/l/plesk.com.json' },
      ]),
    );
    expect(entries).toHaveLength(3);
  });
});

describe('registry schema', () => {
  const entry = (extra: Record<string, unknown>) => ({ providerId: 'x', name: 'X', ...extra });

  it('needs providerId and name only, and ignores unknown keys', () => {
    expect(validate({ providerId: 'x', name: 'X', futureKey: 1 })).toBe(true);
    expect(validate({ providerId: 'x' })).toBe(false);
    expect(validate({ name: 'X' })).toBe(false);
  });

  it('takes true, false and null as booleans', () => {
    for (const value of [true, false, null])
      expect(validate(entry({ features: { syncFlow: value } }))).toBe(true);
    expect(validate(entry({ features: { syncFlow: 'yes' } }))).toBe(false);
  });

  it('rejects an unknown onboarding mode, a bad contact and a non-http URL', () => {
    expect(validate(entry({ onboarding: { mode: 'sometimes' } }))).toBe(false);
    expect(validate(entry({ onboarding: { contacts: [{ type: 'email', value: 'x' }] } }))).toBe(
      false,
    );
    expect(validate(entry({ url: 'javascript:alert(1)' }))).toBe(false);
  });

  it('takes a logo file name only', () => {
    expect(validate(entry({ logo: 'x.svg' }))).toBe(true);
    expect(validate(entry({ logo: '../x.svg' }))).toBe(false);
  });
});

describe('validateRegistry on a corrupted copy', () => {
  let dir: string;
  const copy = () => {
    dir = mkdtempSync(join(tmpdir(), 'registry-'));
    cpSync(EXAMPLE_REGISTRY_DIR, dir, { recursive: true });
    return dir;
  };
  const write = (rel: string, json: unknown) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), JSON.stringify(json));
  };
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('reports a missing providers folder', () => {
    rmSync(join(copy(), 'providers'), { recursive: true });
    expect(validateRegistry(dir, validate).errors).toEqual(['providers/: missing']);
  });

  it('reports an entry at the wrong path', () => {
    copy();
    write('providers/c/f/cloudflare.com.json', { providerId: 'cloudflare.com', name: 'C' });
    write('providers/1/a/1And1.json', { providerId: '1and1', name: '1&1' });
    expect(validateRegistry(dir, validate).errors).toEqual(
      expect.arrayContaining([
        'providers/c/f/cloudflare.com.json: providerId cloudflare.com belongs at providers/c/l/cloudflare.com.json',
        'providers/1/a/1And1.json: providerId 1and1 belongs at providers/1/a/1and1.json',
      ]),
    );
  });

  it('accepts an entry at the path of its providerId', () => {
    copy();
    write(entryPath('X'), { providerId: 'X', name: 'X' });
    expect(validateRegistry(dir, validate).errors).toEqual([]);
  });

  it('reports a missing logo', () => {
    rmSync(join(copy(), 'providers/i/o/ionos.com.svg'));
    expect(validateRegistry(dir, validate).errors).toEqual([
      'providers/i/o/ionos.com.json: logo providers/i/o/ionos.com.svg missing',
    ]);
  });

  it('reports a schema violation and invalid JSON', () => {
    copy();
    const rel = 'providers/p/l/plesk.com.json';
    const json = JSON.parse(readFileSync(join(dir, rel), 'utf8'));
    delete json.name;
    write(rel, json);
    writeFileSync(join(dir, 'providers/i/o/ionos.com.json'), '{');
    const errors = validateRegistry(dir, validate).errors.join('\n');
    expect(errors).toMatch(/plesk\.com\.json: \/ must have required property 'name'/);
    expect(errors).toMatch(/ionos\.com\.json: invalid JSON/);
  });
});
