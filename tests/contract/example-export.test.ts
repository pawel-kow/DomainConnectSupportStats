import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { exportSchemaId, loadSchemas, validateRelease } from '../../scripts/export-release';
import { SUPPORTED_FORMAT_VERSION } from '../../src/lib/data/manifest';
import { EXAMPLE_DIR, exampleJson, exampleManifest } from '../fixtures';

const ajv = loadSchemas();

describe('vendored example export', () => {
  it('is a valid release: schemas, one generated_at, counts, every card present', () => {
    const { files, errors } = validateRelease(EXAMPLE_DIR, ajv);
    expect(errors).toEqual([]);
    expect(files).toContain('manifest.json');
    expect(files).toContain('templates/mail.acme.example/mail.json');
  });

  it('has the format version the site is written for', () => {
    expect(exampleManifest().format_version).toBe(SUPPORTED_FORMAT_VERSION);
  });

  it('has a schema for every report the manifest names', () => {
    for (const kind of Object.values(exampleManifest().files)) {
      expect(ajv.getSchema(exportSchemaId(kind.report)), kind.report).toBeDefined();
    }
  });
});

describe('validateRelease on a corrupted copy', () => {
  let dir: string;
  const copy = () => {
    dir = mkdtempSync(join(tmpdir(), 'release-'));
    cpSync(EXAMPLE_DIR, dir, { recursive: true });
    return dir;
  };
  const edit = (rel: string, change: (json: Record<string, unknown>) => void) => {
    const json = JSON.parse(readFileSync(join(dir, rel), 'utf8'));
    change(json);
    writeFileSync(join(dir, rel), JSON.stringify(json));
  };
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('reports a missing card', () => {
    rmSync(join(copy(), 'stacks/plesk.com.json'));
    expect(validateRelease(dir, ajv).errors).toContain('stacks/plesk.com.json: missing');
  });

  it('reports a file from another release', () => {
    copy();
    edit('overview.json', (j) => (j.generated_at = '2027-01-01T00:00:00Z'));
    expect(validateRelease(dir, ajv).errors.join('\n')).toMatch(/overview\.json: generated_at/);
  });

  it('reports a schema violation', () => {
    copy();
    edit('stacks.json', (j) => delete j.tables);
    expect(validateRelease(dir, ajv).errors.join('\n')).toMatch(/stacks\.json: .*tables/);
  });

  it('reports a manifest row count that does not match the list', () => {
    copy();
    edit('manifest.json', (j) => ((j.files as Record<string, { rows: Record<string, number> }>).stacks!.rows.stacks = 99));
    expect(validateRelease(dir, ajv).errors.join('\n')).toMatch(/stacks\.json: table stacks has 4 rows, manifest says 99/);
  });
});

describe('every file shape the pages read', () => {
  it('has generated_at, notes and tables with title/columns/rows/footer', () => {
    for (const rel of ['overview.json', 'dns-providers.json', 'stacks/plesk.com.json', 'templates/unnamed.example/x.json']) {
      const file = exampleJson(rel);
      expect(typeof file.generated_at).toBe('string');
      expect(Array.isArray(file.notes)).toBe(true);
      for (const table of Object.values(file.tables)) {
        expect(table).toEqual(
          expect.objectContaining({ title: expect.any(String), columns: expect.any(Array), rows: expect.any(Array) }),
        );
        for (const row of table.rows) expect(Object.keys(row).sort()).toEqual(table.columns.map((c) => c.key).sort());
      }
    }
  });
});
