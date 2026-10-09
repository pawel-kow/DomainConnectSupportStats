import type { ExportClient } from './data/load';
import type { Manifest } from './data/types';
import { shareScan, type Scan } from './domains';
import { supportingDnsProviders } from './supporting';

/** What pages other than the overview take from `overview.json`. */
export interface OverviewFacts {
  /** The domain-share import, for the hover text of domain shares. */
  scan: Scan | null;
  /** DNS providers supporting at least one template: the denominator of a template's support. */
  supportingDnsProviders: number | null;
}

export const NO_FACTS: OverviewFacts = { scan: null, supportingDnsProviders: null };

/** The overview's facts; without `overview.json`, the scan undated and the denominator unknown. */
export function overviewFacts(client: ExportClient, manifest: Manifest): Promise<OverviewFacts> {
  return client.file('overview').then(
    (o) => ({ scan: shareScan(manifest, o), supportingDnsProviders: supportingDnsProviders(o) }),
    () => ({ scan: shareScan(manifest, null), supportingDnsProviders: null }),
  );
}
