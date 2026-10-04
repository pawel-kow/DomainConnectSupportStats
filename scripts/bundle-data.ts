/**
 * Copy a validated export release into the built site, at `<distDir>/data/`, the URL the pages
 * read by default. Only the files the manifest reaches are copied, so nothing else in the data
 * repo (README, .git, older releases) is ever published. Refuses an invalid release.
 * Usage: node scripts/bundle-data.ts <releaseDir> [distDir=dist]
 */
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { validateRelease } from './export-release.ts';

const [releaseArg, distArg = 'dist'] = process.argv.slice(2);
if (!releaseArg) {
  console.error('usage: node scripts/bundle-data.ts <releaseDir> [distDir]');
  process.exit(2);
}
const releaseDir = resolve(releaseArg);
const distDir = resolve(distArg);
if (!existsSync(join(distDir, 'index.html'))) {
  console.error(`${distDir} has no index.html: run the build first`);
  process.exit(2);
}

const { files, errors } = validateRelease(releaseDir);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  console.error(`refusing to bundle ${releaseDir}: ${errors.length} error(s)`);
  process.exit(1);
}

const target = join(distDir, 'data');
rmSync(target, { recursive: true, force: true });
for (const rel of files) {
  mkdirSync(dirname(join(target, rel)), { recursive: true });
  copyFileSync(join(releaseDir, rel), join(target, rel));
}
console.log(`bundled ${files.length} file(s) from ${releaseDir} into ${target}`);
