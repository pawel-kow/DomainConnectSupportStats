/**
 * Validation of a DNS provider registry checkout against the vendored registry contract
 * (contract/registry/), shared by
 * `validate-registry.ts` and the contract tests. Run by Node's type stripping: import only
 * extension-qualified, dependency-free modules from `src/`.
 */
import { Ajv2020 } from 'ajv/dist/2020.js';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { encodeSegment } from '../src/lib/data/encode.ts';
import { entryPath, registryPath } from '../src/lib/registry/path.ts';

export { entryPath };

export const CONTRACT_DIR = resolve(import.meta.dirname, '../contract/registry');
export const REGISTRY_SCHEMA = join(CONTRACT_DIR, 'schema/provider.schema.json');
/** The golden copy of the test registry: the fixture of every test layer. */
export const EXAMPLE_REGISTRY_DIR = join(CONTRACT_DIR, 'examples');
/** The dev registry: the test registry repository as git submodule. */
export const DEV_REGISTRY_DIR = resolve(import.meta.dirname, '../registry');

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

/** Where the registry was checked out from, written to `registry.json` for the site. */
export interface RegistrySource {
  repository: string;
  commit: string;
}

/**
 * Copy the validated entries and logos of `dir` into `<distDir>/registry/` at the paths the site
 * reads: `<a>/<b>/<encoded file name>`, plus `registry.json` with `source`. Returns the published
 * paths; nothing else in the checkout is published.
 */
export function bundleRegistry(
  dir: string,
  entries: RegistryEntryFile[],
  distDir: string,
  source: RegistrySource,
): string[] {
  const target = join(distDir, 'registry');
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  const published: string[] = [];
  for (const { providerId, file, logo } of entries) {
    for (const rel of logo ? [file, logo] : [file]) {
      const out = registryPath(providerId) + encodeSegment(rel.slice(rel.lastIndexOf('/') + 1));
      mkdirSync(dirname(join(target, out)), { recursive: true });
      copyFileSync(join(dir, rel), join(target, out));
      published.push(out);
    }
  }
  writeFileSync(join(target, 'registry.json'), JSON.stringify(source) + '\n');
  published.push('registry.json');
  return published;
}
