import type { Leaderboards } from './data/derived';
import type { Row } from './data/types';
import { parseTimestamp } from './format';
import { links } from './links';

/**
 * Leaderboards (REQUIREMENTS.md F-4): positive rankings of the list files and the derived
 * `leaderboards.json`. DNS providers of a stack are folded into one row per stack.
 */

export const BOARD_SIZE = 10;
export const NEW_SUPPORT_DAYS = 30;

/** Most improved window: since the previous sweep, or over about 90 days. */
export type ImprovedWindow = 'sweep' | '90d';

const CHANGE_KEY: Record<ImprovedWindow, string> = {
  sweep: 'supported_templates_change',
  '90d': 'supported_templates_change_90d',
};

/** The `?window=` parameter: `90d`, else since the previous sweep. */
export function improvedWindow(search: string): ImprovedWindow {
  return new URLSearchParams(search).get('window') === '90d' ? '90d' : 'sweep';
}

/** One row of a DNS provider board: a stack, or a DNS provider without one. */
export interface Entrant {
  kind: 'stack' | 'dns_provider';
  name: string;
  /** Second line: a DNS provider's API host, a stack's deployments. */
  detail: string | null;
  href: string;
  /** Its row of `stacks.json` or `dns-providers.json`. */
  row: Row;
  /** Domains of its deployments supporting at least one template; `null` when unmeasured. */
  reachedDomains: number | null;
}

export interface Ranked<T> {
  rank: number;
  value: number;
  entry: T;
}

function num(row: Row | undefined, key: string): number | null {
  const v = row?.[key];
  return typeof v === 'number' ? v : null;
}

function text(row: Row | undefined, key: string): string | null {
  const v = row?.[key];
  return typeof v === 'string' ? v : null;
}

/** Domains of the supporting ones among DNS provider rows: 0 when none supports. */
function reachedDomains(members: Row[]): number | null {
  const supporting = members.filter((r) => (num(r, 'supported_templates') ?? 0) > 0);
  if (!supporting.length) {
    return members.every((r) => num(r, 'supported_templates') === 0) ? 0 : null;
  }
  const measured = supporting.map((r) => num(r, 'domains')).filter((d) => d !== null);
  return measured.length ? measured.reduce((a, b) => a + b, 0) : null;
}

/** Stacks (with their deployments) first, then DNS providers without a stack row. */
export function entrants(dnsProviders: Row[], stacks: Row[]): Entrant[] {
  const stackIds = new Set(stacks.map((s) => text(s, 'provider_id')).filter((id) => id !== null));
  const folded = stacks.flatMap((s): Entrant[] => {
    const id = text(s, 'provider_id');
    if (id === null) return [];
    const deployments = num(s, 'deployments');
    return [
      {
        kind: 'stack',
        name: text(s, 'name') ?? id,
        detail:
          deployments === null ? null : `${deployments} deployment${deployments === 1 ? '' : 's'}`,
        href: links.stack(id),
        row: s,
        reachedDomains: reachedDomains(dnsProviders.filter((r) => r.provider_id === id)),
      },
    ];
  });
  const alone = dnsProviders.flatMap((r): Entrant[] => {
    const id = num(r, 'dns_provider_id');
    const stack = text(r, 'provider_id');
    if (id === null || (stack !== null && stackIds.has(stack))) return [];
    return [
      {
        kind: 'dns_provider',
        name: text(r, 'name') ?? '?',
        detail: text(r, 'api_host'),
        href: links.dnsProvider(id),
        row: r,
        reachedDomains: reachedDomains([r]),
      },
    ];
  });
  return [...folded, ...alone];
}

const byName = new Intl.Collator('en', { sensitivity: 'base' });

/** Top `size` by a positive value; ties by domains (unknown last), then name ignoring case. */
function rank<T>(
  items: T[],
  value: (item: T) => number | null,
  domains: (item: T) => number | null,
  name: (item: T) => string,
  size: number,
): Ranked<T>[] {
  return items
    .map((entry) => ({ entry, value: value(entry) }))
    .filter((r): r is { entry: T; value: number } => r.value !== null && r.value > 0)
    .sort(
      (a, b) =>
        b.value - a.value ||
        (domains(b.entry) ?? -1) - (domains(a.entry) ?? -1) ||
        byName.compare(name(a.entry), name(b.entry)),
    )
    .slice(0, size)
    .map((r, i) => ({ rank: i + 1, ...r }));
}

const entrantDomains = (e: Entrant) => num(e.row, 'domains');
const entrantName = (e: Entrant) => e.name;

export function topByTemplates(list: Entrant[], size = BOARD_SIZE): Ranked<Entrant>[] {
  return rank(list, (e) => num(e.row, 'supported_templates'), entrantDomains, entrantName, size);
}

export function topByDomains(list: Entrant[], size = BOARD_SIZE): Ranked<Entrant>[] {
  return rank(
    list,
    (e) => e.reachedDomains,
    (e) => e.reachedDomains,
    entrantName,
    size,
  );
}

export function mostImproved(
  list: Entrant[],
  window: ImprovedWindow,
  size = BOARD_SIZE,
): Ranked<Entrant>[] {
  return rank(list, (e) => num(e.row, CHANGE_KEY[window]), entrantDomains, entrantName, size);
}

/** Rows of `templates.json` or `service-providers.json` by `reach_domains`; ties by name. */
export function topReach(
  rows: Row[],
  name: (row: Row) => string,
  size = BOARD_SIZE,
): Ranked<Row>[] {
  return rank(
    rows,
    (r) => num(r, 'reach_domains'),
    () => null,
    name,
    size,
  );
}

export interface NewSupporter {
  dnsProviderId: number;
  name: string;
  apiHost: string | null;
  href: string;
  stack: { name: string; href: string } | null;
  /** When the sweep that found its first support started. */
  since: string;
  /** Templates it supports now. */
  supportedTemplates: number | null;
}

const DAY_MS = 86_400_000;

/**
 * DNS providers whose first support was found within `days` before the release, newest first.
 * Left out: a first support before the scanner start (it was already there).
 */
export function newSupporting(
  derived: Leaderboards,
  dnsProviders: Row[],
  stacks: Row[],
  scannerStart: Date | null,
  days = NEW_SUPPORT_DAYS,
): NewSupporter[] {
  const generated = parseTimestamp(derived.generated_at);
  if (!generated) return [];
  const from = generated.getTime() - days * DAY_MS;
  const rows = new Map(dnsProviders.map((r) => [num(r, 'dns_provider_id'), r]));
  const stackRows = new Map(stacks.map((s) => [text(s, 'provider_id'), s]));
  return derived.first_support.flatMap((f): NewSupporter[] => {
    const at = parseTimestamp(f.started_at)?.getTime();
    const row = rows.get(f.dns_provider_id);
    if (at === undefined || at < from || at > generated.getTime() || !row) return [];
    if (scannerStart && at < scannerStart.getTime()) return [];
    const stackId = text(row, 'provider_id');
    const stackRow = stackId === null ? undefined : stackRows.get(stackId);
    return [
      {
        dnsProviderId: f.dns_provider_id,
        name: text(row, 'name') ?? '?',
        apiHost: text(row, 'api_host'),
        href: links.dnsProvider(f.dns_provider_id),
        stack:
          stackId === null || !stackRow
            ? null
            : { name: text(stackRow, 'name') ?? stackId, href: links.stack(stackId) },
        since: f.started_at,
        supportedTemplates: num(row, 'supported_templates'),
      },
    ];
  });
}
