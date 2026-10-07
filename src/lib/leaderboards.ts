import type { Leaderboards } from './data/derived';
import type { Row } from './data/types';
import { formatCount, formatExact, parseTimestamp } from './format';
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

export const WINDOW_LABELS: Record<ImprovedWindow, string> = {
  sweep: 'Since the previous sweep',
  '90d': 'Over about 90 days',
};

/** The `?window=` parameter: `90d`, else since the previous sweep. */
export function improvedWindow(search: string): ImprovedWindow {
  return new URLSearchParams(search).get('window') === '90d' ? '90d' : 'sweep';
}

export interface StackLink {
  name: string;
  href: string;
}

/** One row of a DNS provider board: a stack, or a DNS provider without one. */
export interface Entrant {
  kind: 'stack' | 'dns_provider';
  name: string;
  /** Second line: a DNS provider's API host, a stack's deployments. */
  detail: string | null;
  href: string;
  /** A DNS provider's stack, when `stacks.json` has it. */
  stack: StackLink | null;
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

function stackLink(id: string | null, stacks: Map<string | null, Row>): StackLink | null {
  const row = id === null ? undefined : stacks.get(id);
  return id === null || !row ? null : { name: text(row, 'name') ?? id, href: links.stack(id) };
}

function stackRows(stacks: Row[]): Map<string | null, Row> {
  return new Map(stacks.map((s) => [text(s, 'provider_id'), s]));
}

function dnsProviderEntrant(row: Row, stacks: Map<string | null, Row>): Entrant[] {
  const id = num(row, 'dns_provider_id');
  if (id === null) return [];
  return [
    {
      kind: 'dns_provider',
      name: text(row, 'name') ?? '?',
      detail: text(row, 'api_host'),
      href: links.dnsProvider(id),
      stack: stackLink(text(row, 'provider_id'), stacks),
      row,
      reachedDomains: reachedDomains([row]),
    },
  ];
}

/** One row per DNS provider, with its stack. */
export function dnsProviderEntrants(dnsProviders: Row[], stacks: Row[]): Entrant[] {
  const byId = stackRows(stacks);
  return dnsProviders.flatMap((r) => dnsProviderEntrant(r, byId));
}

/** Stacks (with their deployments) first, then DNS providers without a stack row. */
export function entrants(dnsProviders: Row[], stacks: Row[]): Entrant[] {
  const byId = stackRows(stacks);
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
        stack: null,
        row: s,
        reachedDomains: reachedDomains(dnsProviders.filter((r) => r.provider_id === id)),
      },
    ];
  });
  const alone = dnsProviders
    .filter((r) => {
      const stack = text(r, 'provider_id');
      return stack === null || !byId.has(stack);
    })
    .flatMap((r) => dnsProviderEntrant(r, byId));
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
  stack: StackLink | null;
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
  const byId = stackRows(stacks);
  return derived.first_support.flatMap((f): NewSupporter[] => {
    const at = parseTimestamp(f.started_at)?.getTime();
    const row = rows.get(f.dns_provider_id);
    if (at === undefined || at < from || at > generated.getTime() || !row) return [];
    if (scannerStart && at < scannerStart.getTime()) return [];
    return [
      {
        dnsProviderId: f.dns_provider_id,
        name: text(row, 'name') ?? '?',
        apiHost: text(row, 'api_host'),
        href: links.dnsProvider(f.dns_provider_id),
        stack: stackLink(text(row, 'provider_id'), byId),
        since: f.started_at,
        supportedTemplates: num(row, 'supported_templates'),
      },
    ];
  });
}

/** A board's table row. */
export interface BoardRow {
  rank: number;
  name: string;
  href: string;
  /** Second line under the name. */
  detail: string | null;
  /** A DNS provider's stack, linked under the name. */
  stack?: StackLink | null;
  value: string;
  /** Hover text of the value: the exact count when shortened. */
  title?: string;
}

/** Display rows of a DNS provider board; a stack says so in its second line. */
export function entrantRows(
  ranked: Ranked<Entrant>[],
  value: 'count' | 'change' = 'count',
): BoardRow[] {
  return ranked.map(({ rank, value: v, entry }) => ({
    rank,
    name: entry.name,
    href: entry.href,
    detail:
      entry.kind === 'stack' ? ['Stack', entry.detail].filter(Boolean).join(' · ') : entry.detail,
    stack: entry.stack,
    value: value === 'change' ? `+${formatExact(v)}` : formatCount(v),
    title: formatExact(v),
  }));
}

/** Whether any entrant has a known change in the window: an empty board then means no gain. */
export function isMeasured(list: Entrant[], window: ImprovedWindow): boolean {
  return list.some((e) => num(e.row, CHANGE_KEY[window]) !== null);
}
