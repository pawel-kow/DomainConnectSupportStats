/**
 * Print the CHANGELOG.md section of a version (default: package.json's).
 * Usage: node scripts/release-notes.ts [version]
 */
import { readFileSync } from 'node:fs';
import { releaseNotes } from './changelog.ts';

const version =
  process.argv[2] ??
  (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version;
const notes = releaseNotes(readFileSync('CHANGELOG.md', 'utf8'), version);
if (!notes) {
  console.error(`error: CHANGELOG.md has no notes for ${version}`);
  process.exit(1);
}
console.log(notes);
