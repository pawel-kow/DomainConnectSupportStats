/**
 * Validation of one export release against the vendored contract (contract/), shared by
 * `validate-export.ts`, `bundle-data.ts` and the contract tests. Run by Node's type stripping:
 * import only extension-qualified, dependency-free modules from `src/`.
 */
import { Ajv2020 } from 'ajv/dist/2020.js';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { encodeSegment } from '../src/lib/data/encode.ts';

export const CONTRACT_DIR = resolve(import.meta.dirname, '../contract');
export const SCHEMA_DIR = join(CONTRACT_DIR, 'schemas');
export const EXAMPLE_EXPORT_DIR = join(CONTRACT_DIR, 'examples/export');

const EXPORT_SCHEMA_BASE = 'https://github.com/pawel-kow/DomainConnectScanner/docs/schemas/export/';
const MANIFEST_SCHEMA_ID = EXPORT_SCHEMA_BASE + 'manifest.schema.json';
const PLACEHOLDER = /\{([a-z_]+)\}/g;

interface FileKind {
  path: string;
  report: string;
  rows?: Record<string, number>;
  list?: string;
  table?: string;
  keys?: Record<string, string>;
  files?: number;
}

interface Manifest {
  format_version: number;
  generated_at: string;
  files: Record<string, FileKind>;
}

interface DataFile {
  generated_at: string;
  tables: Record<string, { rows: Record<string, unknown>[] }>;
}

export interface ReleaseReport {
  /** Release-relative paths of every file the manifest reaches (manifest included). */
  files: string[];
  errors: string[];
}

function jsonFilesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return jsonFilesUnder(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

/** An Ajv instance holding every vendored schema, addressed by its `$id`. */
export function loadSchemas(schemaDir = SCHEMA_DIR): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const file of jsonFilesUnder(schemaDir))
    ajv.addSchema(JSON.parse(readFileSync(file, 'utf8')));
  return ajv;
}

export function exportSchemaId(report: string): string {
  return EXPORT_SCHEMA_BASE + report + '.schema.json';
}

function cardPath(kind: FileKind, row: Record<string, unknown>): string | string[] {
  const missing: string[] = [];
  const path = kind.path.replace(PLACEHOLDER, (_, name: string) => {
    const id = row[kind.keys?.[name] ?? name];
    if (id === null || id === undefined || id === '') {
      missing.push(name);
      return '';
    }
    return encodeSegment(id as string | number);
  });
  return missing.length ? missing : path;
}

/**
 * Validate a release directory: the manifest and every list and card it reaches against their
 * schemas, one `generated_at` throughout, row and card counts as the manifest states, and every
 * list row's card present. Returns the reachable files, so a deploy publishes exactly those.
 */
export function validateRelease(dir: string, ajv = loadSchemas()): ReleaseReport {
  const errors: string[] = [];
  const files: string[] = [];
  const read = (rel: string): unknown => {
    const full = join(dir, rel);
    if (!existsSync(full)) {
      errors.push(`${rel}: missing`);
      return undefined;
    }
    files.push(rel);
    try {
      return JSON.parse(readFileSync(full, 'utf8'));
    } catch (e) {
      errors.push(`${rel}: invalid JSON (${(e as Error).message})`);
      return undefined;
    }
  };
  const check = (rel: string, schemaId: string, data: unknown): boolean => {
    const validate = ajv.getSchema(schemaId);
    if (!validate) {
      errors.push(`${rel}: no schema ${schemaId} in the vendored contract`);
      return false;
    }
    if (validate(data)) return true;
    for (const err of validate.errors ?? [])
      errors.push(`${rel}: ${err.instancePath || '/'} ${err.message}`);
    return false;
  };

  const manifest = read('manifest.json') as Manifest | undefined;
  if (!manifest || !check('manifest.json', MANIFEST_SCHEMA_ID, manifest)) return { files, errors };

  const lists = new Map<string, DataFile>();
  const checkData = (rel: string, kind: FileKind): DataFile | undefined => {
    const data = read(rel) as DataFile | undefined;
    if (!data) return undefined;
    check(rel, exportSchemaId(kind.report), data);
    if (data.generated_at !== manifest.generated_at) {
      errors.push(
        `${rel}: generated_at ${data.generated_at} is not the manifest's ${manifest.generated_at}`,
      );
    }
    return data;
  };

  for (const [name, kind] of Object.entries(manifest.files)) {
    if (kind.list) continue;
    const data = checkData(kind.path, kind);
    if (!data) continue;
    lists.set(name, data);
    for (const [table, count] of Object.entries(kind.rows ?? {})) {
      const actual = data.tables?.[table]?.rows?.length;
      if (actual !== count)
        errors.push(`${kind.path}: table ${table} has ${actual} rows, manifest says ${count}`);
    }
  }

  for (const [name, kind] of Object.entries(manifest.files)) {
    if (!kind.list) continue;
    const rows = lists.get(kind.list)?.tables?.[kind.table ?? '']?.rows;
    if (!rows) {
      errors.push(`manifest files.${name}: list ${kind.list} table ${kind.table} not found`);
      continue;
    }
    if (kind.files !== rows.length) {
      errors.push(`manifest files.${name}: ${kind.files} cards for ${rows.length} list rows`);
    }
    for (const row of rows) {
      const path = cardPath(kind, row);
      if (Array.isArray(path))
        errors.push(`${name}: a ${kind.list} row has no id for {${path.join('}, {')}}`);
      else checkData(path, kind);
    }
  }

  return { files, errors };
}
