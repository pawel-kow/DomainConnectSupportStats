<script lang="ts">
  import { domainsTitle, type Scan } from '../domains';
  import { formatPct } from '../format';

  interface Props {
    /** Share of the scanned domains; `null` is unknown. */
    pct: number | null;
    /** The count behind it, shown on hover with the scan. */
    domains: number | null;
    scan: Scan | null;
  }

  let { pct, domains, scan }: Props = $props();
</script>

<span class="domain-share" title={domainsTitle(domains, scan)}>{formatPct(pct)}</span>

<style>
  .domain-share {
    white-space: nowrap;
  }
</style>
