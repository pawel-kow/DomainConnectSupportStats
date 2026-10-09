import { findTable } from './data/tables';
import type { ExportFile, Manifest } from './data/types';

/**
 * Template support as a share of the DNS providers supporting at least one template: the
 * overview's latest `ecosystem` count, the number its headline shows.
 */

/** DNS providers supporting at least one template after the latest full sweep; null when unknown. */
export function supportingDnsProviders(overview: ExportFile | null): number | null {
  const v = overview
    ? findTable(overview, 'ecosystem')?.rows.at(-1)?.supporting_dns_providers
    : null;
  return typeof v === 'number' ? v : null;
}

/** `count` as a percentage of `total` supporting DNS providers; null when unknown or `total` is 0. */
export function ofSupporting(count: number | null, total: number | null): number | null {
  return count === null || total === null || total === 0 ? null : (count / total) * 100;
}

/** Every template of the release: the rows of the templates list; null when unknown. */
export function templateCount(manifest: Manifest | null): number | null {
  const kind = manifest?.files.templates;
  const n = kind && 'rows' in kind ? kind.rows.service_templates : undefined;
  return typeof n === 'number' ? n : null;
}
