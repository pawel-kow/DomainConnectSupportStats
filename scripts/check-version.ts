/**
 * Check that the package.json version is SemVer and has a CHANGELOG.md section.
 * Usage: node scripts/check-version.ts
 */
import { readFileSync } from 'node:fs';
import { versionErrors } from './changelog.ts';

const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };
const errors = versionErrors(readFileSync('CHANGELOG.md', 'utf8'), version);
for (const error of errors) console.error(`error: ${error}`);
if (errors.length) process.exit(1);
console.log(`version ${version}: CHANGELOG section present`);
