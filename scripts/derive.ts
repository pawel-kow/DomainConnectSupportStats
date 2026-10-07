/**
 * Derived data: facts the export has only spread over its cards, collected into one file the
 * pages read next to the export (`<data>/derived/`). Run by Node's type stripping: import only
 * extension-qualified, dependency-free modules.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FirstSupport, Leaderboards, Sweep } from '../src/lib/data/derived.ts';
import { cardPath, type DataFile, type Manifest } from './export-release.ts';

export { LEADERBOARDS_FILE } from '../src/lib/data/derived.ts';

interface HistoryRow extends Sweep {
  supported_templates: number | null;
}

const earlier = (a: Sweep, b: Sweep): boolean =>
  a.started_at < b.started_at || (a.started_at === b.started_at && a.sweep_id < b.sweep_id);

/** Derive `leaderboards.json` from a release directory. Throws on a file of another release. */
export function deriveLeaderboards(dir: string): Leaderboards {
  const read = <T>(rel: string): T => JSON.parse(readFileSync(join(dir, rel), 'utf8')) as T;
  const manifest = read<Manifest>('manifest.json');
  const card = manifest.files.dns_provider;
  const list = card?.list ? manifest.files[card.list] : undefined;
  if (!card || !list) throw new Error('manifest.json: no dns_provider card kind with its list');

  const releaseFile = (rel: string): DataFile => {
    const data = read<DataFile>(rel);
    if (data.generated_at !== manifest.generated_at)
      throw new Error(`${rel}: generated_at ${data.generated_at} is not ${manifest.generated_at}`);
    return data;
  };

  let firstSweep: Sweep | null = null;
  const firstSupport: FirstSupport[] = [];
  for (const row of releaseFile(list.path).tables[card.table ?? '']?.rows ?? []) {
    const path = cardPath(card, row);
    if (Array.isArray(path)) continue;
    const history = (releaseFile(path).tables.support_history?.rows ??
      []) as unknown as HistoryRow[];
    for (const h of history) {
      if (!firstSweep || earlier(h, firstSweep))
        firstSweep = { sweep_id: h.sweep_id, started_at: h.started_at };
    }
    const first = history.find((h) => (h.supported_templates ?? 0) > 0);
    if (first) {
      firstSupport.push({
        dns_provider_id: row.dns_provider_id as number,
        sweep_id: first.sweep_id,
        started_at: first.started_at,
        supported_templates: first.supported_templates as number,
      });
    }
  }

  return {
    generated_at: manifest.generated_at,
    first_sweep: firstSweep,
    first_support: firstSupport
      .filter((r) => r.sweep_id !== firstSweep?.sweep_id)
      .sort((a, b) =>
        a.started_at === b.started_at
          ? a.dns_provider_id - b.dns_provider_id
          : a.started_at < b.started_at
            ? 1
            : -1,
      ),
  };
}
