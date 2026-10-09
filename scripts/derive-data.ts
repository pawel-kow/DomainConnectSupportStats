/**
 * Write the derived data of an export release into `<outDir>/`: `leaderboards.json`,
 * `stacks.json`, `templates.json` and one file per template at its card's path.
 * Usage: node scripts/derive-data.ts [releaseDir] [outDir]
 * releaseDir defaults to DATA_DIR, else the contract's example export; outDir to DERIVED_DIR, else
 * `.derived`. The deploy writes into
 * `dist/data/derived/` after bundling the release; `vite dev`/`preview` serve `.derived/` there.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  LEADERBOARDS_FILE,
  STACKS_FILE,
  TEMPLATES_FILE,
  deriveLeaderboards,
  deriveStacks,
  deriveTemplates,
} from './derive.ts';
import { EXAMPLE_EXPORT_DIR } from './export-release.ts';

const [
  releaseArg = process.env.DATA_DIR ?? EXAMPLE_EXPORT_DIR,
  outArg = process.env.DERIVED_DIR ?? '.derived',
] = process.argv.slice(2);
const releaseDir = resolve(releaseArg);
const outDir = resolve(outArg);

const write = (rel: string, data: unknown) => {
  const path = join(outDir, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data));
};

const leaderboards = deriveLeaderboards(releaseDir);
write(LEADERBOARDS_FILE, leaderboards);
const templates = deriveTemplates(releaseDir);
write(TEMPLATES_FILE, templates.list);
for (const [path, card] of templates.cards) write(path, card);
write(STACKS_FILE, deriveStacks(releaseDir));
console.log(
  `derived ${LEADERBOARDS_FILE}, ${STACKS_FILE}, ${TEMPLATES_FILE} and ${templates.cards.size} template file(s) ` +
    `from ${releaseDir} into ${outDir}: ` +
    `${leaderboards.first_support.length} DNS provider(s) with a first support`,
);
