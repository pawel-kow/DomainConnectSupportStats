/**
 * Write the derived data of an export release into `<outDir>/leaderboards.json`.
 * Usage: node scripts/derive-data.ts [releaseDir] [outDir=.derived]
 * releaseDir defaults to DATA_DIR, else the contract's example export. The deploy writes into
 * `dist/data/derived/` after bundling the release; `vite dev`/`preview` serve `.derived/` there.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LEADERBOARDS_FILE, deriveLeaderboards } from './derive.ts';
import { EXAMPLE_EXPORT_DIR } from './export-release.ts';

const [releaseArg = process.env.DATA_DIR ?? EXAMPLE_EXPORT_DIR, outArg = '.derived'] =
  process.argv.slice(2);
const releaseDir = resolve(releaseArg);
const outDir = resolve(outArg);

const leaderboards = deriveLeaderboards(releaseDir);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, LEADERBOARDS_FILE), JSON.stringify(leaderboards));
console.log(
  `derived ${LEADERBOARDS_FILE} from ${releaseDir} into ${outDir}: ` +
    `${leaderboards.first_support.length} DNS provider(s) with a first support`,
);
