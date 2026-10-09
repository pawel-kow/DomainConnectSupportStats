/**
 * Derived data: facts the export has only spread over its cards, collected into one file the
 * pages read next to the export (`<data>/derived/`). Run by Node's type stripping: import only
 * extension-qualified, dependency-free modules.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  templateShares,
  type FirstSupport,
  type Leaderboards,
  type StacksSupport,
  type SupporterSince,
  type Sweep,
  type TemplateSupporters,
  type TemplatesSupport,
} from '../src/lib/data/derived.ts';
import { cardPath, type DataFile, type FileKind, type Manifest } from './export-release.ts';

export { LEADERBOARDS_FILE, STACKS_FILE, TEMPLATES_FILE } from '../src/lib/data/derived.ts';

interface HistoryRow extends Sweep {
  supported_templates: number | null;
}

const earlier = (a: Sweep, b: Sweep): boolean =>
  a.started_at < b.started_at || (a.started_at === b.started_at && a.sweep_id < b.sweep_id);

type Row = Record<string, unknown>;

/** A release directory: its manifest, and files that must carry the manifest's `generated_at`. */
function release(dir: string) {
  const read = <T>(rel: string): T => JSON.parse(readFileSync(join(dir, rel), 'utf8')) as T;
  const manifest = read<Manifest>('manifest.json');
  const file = (rel: string): DataFile => {
    const data = read<DataFile>(rel);
    if (data.generated_at !== manifest.generated_at)
      throw new Error(`${rel}: generated_at ${data.generated_at} is not ${manifest.generated_at}`);
    return data;
  };
  /** A card kind and the rows of the list table naming its cards. */
  const cards = (kind: string): { card: FileKind; rows: Row[] } => {
    const card = manifest.files[kind];
    const list = card?.list ? manifest.files[card.list] : undefined;
    if (!card || !list) throw new Error(`manifest.json: no ${kind} card kind with its list`);
    return { card, rows: file(list.path).tables[card.table ?? '']?.rows ?? [] };
  };
  /** The rows of list `kind`'s table `table`. */
  const list = (kind: string, table: string): Row[] => {
    const path = manifest.files[kind]?.path;
    if (!path) throw new Error(`manifest.json: no ${kind} list`);
    return file(path).tables[table]?.rows ?? [];
  };
  return { manifest, file, cards, list };
}

/** Derive `leaderboards.json` from a release directory. Throws on a file of another release. */
export function deriveLeaderboards(dir: string): Leaderboards {
  const { manifest, file, cards } = release(dir);
  const { card, rows } = cards('dns_provider');

  let firstSweep: Sweep | null = null;
  const firstSupport: FirstSupport[] = [];
  for (const row of rows) {
    const path = cardPath(card, row);
    if (Array.isArray(path)) continue;
    const history = (file(path).tables.support_history?.rows ?? []) as unknown as HistoryRow[];
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

export interface DerivedTemplates {
  /** `templates.json`. */
  list: TemplatesSupport;
  /** Per template, by its card's release-relative path. */
  cards: Map<string, TemplateSupporters>;
}

/**
 * Derive each template's supporting DNS providers and since when they support it from the DNS
 * provider cards' `supported_templates`. Throws on a file of another release.
 */
export function deriveTemplates(dir: string): DerivedTemplates {
  const { manifest, file, cards } = release(dir);
  const providers = cards('dns_provider');
  const templates = cards('template');

  const key = (spid: unknown, sid: unknown) => JSON.stringify([spid, sid]);
  const since = new Map<string, SupporterSince[]>();
  for (const row of providers.rows) {
    const path = cardPath(providers.card, row);
    if (Array.isArray(path)) continue;
    for (const t of file(path).tables.supported_templates?.rows ?? []) {
      const k = key(t.service_provider_id, t.service_id);
      const supporter = {
        dns_provider_id: row.dns_provider_id as number,
        since: typeof t.since === 'string' ? t.since : null,
      };
      since.set(k, [...(since.get(k) ?? []), supporter]);
    }
  }

  const keys = templates.card.keys ?? {};
  const list: TemplatesSupport = { generated_at: manifest.generated_at, templates: [] };
  const cardFiles = new Map<string, TemplateSupporters>();
  for (const row of templates.rows) {
    const spid = row[keys.service_provider_id ?? 'service_provider_id'] as string;
    const sid = row[keys.service_id ?? 'service_id'] as string;
    const supporters = (since.get(key(spid, sid)) ?? []).sort(
      (a, b) => a.dns_provider_id - b.dns_provider_id,
    );
    list.templates.push({
      service_provider_id: spid,
      service_id: sid,
      supporting_dns_providers: supporters.length,
    });
    const path = cardPath(templates.card, row);
    if (!Array.isArray(path))
      cardFiles.set(path, { generated_at: manifest.generated_at, supporters });
  }
  return { list, cards: cardFiles };
}

/**
 * Derive each stack's template support distribution from its deployments in the DNS providers list,
 * as shares of every template (the templates list's rows). Throws on a file of another release.
 */
export function deriveStacks(dir: string): StacksSupport {
  const { manifest, list } = release(dir);
  const templates = manifest.files.templates?.rows?.service_templates ?? null;
  const byStack = new Map<unknown, Row[]>();
  for (const row of list('dns_providers', 'dns_providers'))
    byStack.set(row.provider_id, [...(byStack.get(row.provider_id) ?? []), row]);
  return {
    generated_at: manifest.generated_at,
    stacks: list('stacks', 'stacks').map((stack) => ({
      provider_id: stack.provider_id as string,
      ...templateShares(byStack.get(stack.provider_id) ?? [], templates),
    })),
  };
}
