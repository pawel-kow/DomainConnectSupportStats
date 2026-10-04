/**
 * Validate an export release against the vendored contract.
 * Usage: node scripts/validate-export.ts [releaseDir]   (default: the contract's example export)
 * Exit code 1 on any error, each printed on its own line.
 */
import { resolve } from 'node:path';
import { EXAMPLE_EXPORT_DIR, validateRelease } from './export-release.ts';

const dir = resolve(process.argv[2] ?? EXAMPLE_EXPORT_DIR);
const { files, errors } = validateRelease(dir);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  console.error(`${dir}: ${errors.length} error(s) in ${files.length} file(s)`);
  process.exit(1);
}
console.log(`${dir}: ${files.length} file(s) valid`);
