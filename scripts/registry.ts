/**
 * Validation of a DNS provider registry checkout against the schema in registry/schema/, shared by
 * `validate-registry.ts` and the contract tests. Run by Node's type stripping: import only
 * extension-qualified, dependency-free modules from `src/`.
 */
import { Ajv2020 } from 'ajv/dist/2020.js';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { registryPath } from '../src/lib/registry/path.ts';

export const REGISTRY_DIR = resolve(import.meta.dirname, '../registry');
export const REGISTRY_SCHEMA = join(REGISTRY_DIR, 'schema/provider.schema.json');
export const EXAMPLE_REGISTRY_DIR = join(REGISTRY_DIR, 'examples');

export interface RegistryEntryFile {
  providerId: string;
  /** Registry-relative path of the entry. */
  file: string;
  /** Registry-relative path of its logo, if it names one. */
  logo?: string;
}

export interface RegistryReport {
  entries: RegistryEntryFile[];
  errors: string[];
}

function jsonFilesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return jsonFilesUnder(full);
    return entry.name.endsWith('.json') ? [full] : [];
  });
}

export function loadRegistrySchema(schemaFile = REGISTRY_SCHEMA) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  return ajv.compile(JSON.parse(readFileSync(schemaFile, 'utf8')));
}

/** Registry-relative path of the entry of `providerId`. */
export function entryPath(providerId: string): string {
  return `providers/${registryPath(providerId)}${providerId}.json`;
}

/**
 * Validate a registry directory: every `providers/**.json` against the schema, at the path its
 * `providerId` determines, with its logo present next to it.
 */
export function validateRegistry(dir: string, validate = loadRegistrySchema()): RegistryReport {
  const errors: string[] = [];
  const entries: RegistryEntryFile[] = [];
  const providers = join(dir, 'providers');
  if (!existsSync(providers)) return { entries, errors: ['providers/: missing'] };

  for (const full of jsonFilesUnder(providers)) {
    const rel = relative(dir, full).split(sep).join('/');
    let entry: { providerId: string; logo?: string };
    try {
      entry = JSON.parse(readFileSync(full, 'utf8'));
    } catch (e) {
      errors.push(`${rel}: invalid JSON (${(e as Error).message})`);
      continue;
    }
    if (!validate(entry)) {
      for (const err of validate.errors ?? [])
        errors.push(`${rel}: ${err.instancePath || '/'} ${err.message}`);
      continue;
    }
    const expected = entryPath(entry.providerId);
    if (rel !== expected) {
      errors.push(`${rel}: providerId ${entry.providerId} belongs at ${expected}`);
      continue;
    }
    const logo = entry.logo && rel.slice(0, rel.lastIndexOf('/') + 1) + entry.logo;
    if (logo && !existsSync(join(dir, logo))) errors.push(`${rel}: logo ${logo} missing`);
    entries.push({ providerId: entry.providerId, file: rel, ...(logo ? { logo } : {}) });
  }
  return { entries, errors };
}
