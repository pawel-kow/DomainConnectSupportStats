/**
 * Validate a DNS provider registry checkout against the vendored registry contract.
 * Usage: node scripts/validate-registry.ts [registryDir]   (default: registry/, the dev registry)
 * Exit code 1 on any error, each printed on its own line.
 */
import { resolve } from 'node:path';
import { DEV_REGISTRY_DIR, validateRegistry } from './registry.ts';

const dir = resolve(process.argv[2] ?? DEV_REGISTRY_DIR);
const { entries, errors } = validateRegistry(dir);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  console.error(`${dir}: ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`${dir}: ${entries.length} entry file(s) valid`);
