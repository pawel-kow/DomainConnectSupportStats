<script lang="ts">
  import DataTable from '../lib/components/DataTable.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import { defaultClient } from '../lib/data/load';
  import { findTable } from '../lib/data/tables';
  import type { Column, Manifest, Row } from '../lib/data/types';
  import { formatCount, formatPct, UNKNOWN } from '../lib/format';
  import { links } from '../lib/links';
  import { supportRange } from '../lib/stacks';

  const client = defaultClient();
  let manifest = $state<Manifest | null>(null);
  const loading = client.manifest().then((m) => {
    manifest = m;
    return client.file('stacks');
  });

  const KEYS = [
    'name',
    'deployments',
    'min_supported_pct',
    'median_supported_pct',
    'max_supported_pct',
    'domains',
  ];
  const CUSTOM_KEYS = ['name', 'deployments', 'median_supported_pct', 'domains'];

  function num(row: Row, key: string): number | null {
    const v = row[key];
    return typeof v === 'number' ? v : null;
  }

  function text(row: Row, key: string): string | null {
    const v = row[key];
    return typeof v === 'string' ? v : null;
  }
</script>

{#snippet stackCell(column: Column, row: Row)}
  {@const id = text(row, 'provider_id')}
  {#if column.key === 'name'}
    {@const name = text(row, 'name') ?? id}
    {#if id}<a class="name" href={links.stack(id)}>{name}</a>{:else}{name ?? UNKNOWN}{/if}
    <!-- A stack without a name is listed by its id: no second line. -->
    {#if id !== name}<div class="mono muted id">{id ?? UNKNOWN}</div>{/if}
  {:else if column.key === 'deployments'}
    {@const n = num(row, 'deployments')}
    {#if id && n}<a href={links.dnsProviders({ stack: id })}>{formatCount(n)}</a
      >{:else}{formatCount(n)}{/if}
  {:else if column.key === 'median_supported_pct'}
    {@const range = supportRange(row)}
    <span class="count">{formatPct(num(row, 'median_supported_pct'))}</span>
    {#if range}
      <!-- Span from the lowest to the highest deployment; the tick marks the median. -->
      <div class="range" data-testid="range-bar" aria-hidden="true">
        <span class="span" style="left: {range.left}%; width: {range.width}%"></span>
        <span class="median" style="left: {range.median}%"></span>
      </div>
    {/if}
  {:else if column.key === 'domains'}
    {@const n = num(row, 'domains')}
    <span class="count">{formatCount(n)}</span>
    {#if n !== null}<div class="muted">{formatPct(num(row, 'domains_pct'))}</div>{/if}
  {/if}
{/snippet}

<Layout current="stacks" {manifest}>
  {#await loading}
    <p class="no-data">Loading…</p>
  {:then file}
    {@const source = findTable(file, 'stacks')}
    {#if source}
      <section class="panel">
        <h2>Stacks</h2>
        <Notes notes={file.notes} />
        <DataTable
          table={source}
          keys={KEYS}
          customKeys={CUSTOM_KEYS}
          phoneKeys={['name', 'deployments', 'median_supported_pct', 'domains']}
          cell={stackCell}
          searchable
          pageSize={20}
          caption="Stacks"
          emptyText="No stack to show"
        />
        <ul class="caveats" data-testid="caveats">
          <li>
            Support: the share of supported template versions of each deployment with probe
            combinations; lowest, median and highest across the stack. The bar spans lowest to
            highest, the tick marks the median.
          </li>
          <li>
            Deployments: DNS providers running the stack, probed or not. DNS providers without a
            stack are not listed.
          </li>
          <li>
            Domains: scanned domains behind the stack's DNS providers, as a share of the scanned
            domains.
          </li>
        </ul>
      </section>
    {:else}
      <LoadError error={new Error('The release has no stacks table')} />
    {/if}
  {:catch error}
    <LoadError {error} />
  {/await}
</Layout>

<style>
  .count {
    white-space: nowrap;
  }

  .name,
  .id {
    overflow-wrap: anywhere;
  }

  /* The id repeats the name closely; at phone width the name column stays narrow. */
  @media (max-width: 480px) {
    .id {
      display: none;
    }
  }

  .range {
    position: relative;
    height: 0.4rem;
    min-width: 5rem;
    margin-top: 0.25rem;
    border-radius: 0.2rem;
    background-color: var(--border-color);
  }

  .span {
    position: absolute;
    top: 0;
    bottom: 0;
    min-width: 2px;
    border-radius: 0.2rem;
    background-color: var(--accent-cyan);
    opacity: 0.6;
  }

  .median {
    position: absolute;
    top: -0.15rem;
    bottom: -0.15rem;
    width: 2px;
    margin-left: -1px;
    background-color: var(--secondary-navy);
  }

  .caveats {
    margin-top: var(--spacing-md);
    padding-left: var(--spacing-md);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
</style>
