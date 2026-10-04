<script lang="ts">
  import DataTable from '../lib/components/DataTable.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import { defaultClient } from '../lib/data/load';
  import { findTable } from '../lib/data/tables';
  import type { Column, Manifest, Row } from '../lib/data/types';
  import { dnsProviderList, statusBadge, UNDETERMINED_KEY } from '../lib/dns-providers';
  import { formatCount, formatPct, UNKNOWN } from '../lib/format';
  import { links } from '../lib/links';
  import { flagParam, textParam } from '../lib/params';

  const search = window.location.search;
  const stack = textParam(search, 'stack');
  let query = $state(textParam(search, 'q') ?? '');
  let showAll = $state(flagParam(search, 'all'));

  // Keep the view a shareable link while the search and toggle change.
  $effect(() => {
    window.history.replaceState(null, '', links.dnsProviders({ stack, q: query, all: showAll }));
  });

  const client = defaultClient();
  let manifest = $state<Manifest | null>(null);
  const loading = client.manifest().then((m) => {
    manifest = m;
    return client.file('dns_providers');
  });

  if (stack) document.title = `${stack} - DNS providers - Domain Connect Support Statistics`;

  const KEYS = [
    'name',
    'provider_id',
    'settings_status',
    'support_status',
    'supported_count',
    'unsupported_count',
    UNDETERMINED_KEY,
    'domains',
  ];
  const CUSTOM_KEYS = [
    'name',
    'provider_id',
    'settings_status',
    'support_status',
    'supported_count',
    'unsupported_count',
    'domains',
  ];

  function num(row: Row, key: string): number | null {
    const v = row[key];
    return typeof v === 'number' ? v : null;
  }

  function text(row: Row, key: string): string | null {
    const v = row[key];
    return typeof v === 'string' ? v : null;
  }
</script>

{#snippet countPct(count: string, pct: number | null)}
  <span class="count">{count}</span>
  {#if count !== UNKNOWN}<div class="muted">{formatPct(pct)}</div>{/if}
{/snippet}

{#snippet badge(status: Row[string])}
  {@const b = statusBadge(status)}
  <span class="badge badge-{b.tone}" title={b.title}>{b.label}</span>
{/snippet}

{#snippet providerCell(column: Column, row: Row)}
  {@const id = num(row, 'dns_provider_id')}
  {#if column.key === 'name'}
    {#if id !== null}<a href={links.dnsProvider(id)}>{row.name ?? UNKNOWN}</a>{:else}{row.name ??
        UNKNOWN}{/if}
    <div class="mono muted host">{text(row, 'api_host') ?? UNKNOWN}</div>
  {:else if column.key === 'provider_id'}
    {@const s = text(row, 'provider_id')}
    {#if s}<a href={links.stack(s)}>{s}</a>{:else}{UNKNOWN}{/if}
  {:else if column.key === 'settings_status' || column.key === 'support_status'}
    {@render badge(row[column.key] ?? null)}
  {:else if column.key === 'supported_count'}
    {@const n = num(row, 'supported_count')}
    {@render countPct(
      n === null ? UNKNOWN : `${formatCount(n)} of ${formatCount(num(row, 'total'))}`,
      num(row, 'supported_pct'),
    )}
  {:else if column.key === 'unsupported_count' || column.key === 'domains'}
    {@render countPct(
      formatCount(num(row, column.key)),
      num(row, column.key === 'domains' ? 'domains_pct' : 'unsupported_pct'),
    )}
  {/if}
{/snippet}

<Layout current="dns-providers" {manifest}>
  {#await loading}
    <p class="no-data">Loading…</p>
  {:then file}
    {@const source = findTable(file, 'dns_providers')}
    {#if source}
      {@const list = dnsProviderList(source, { stack, showAll })}
      <section class="panel">
        <h2>{stack ? `DNS providers of stack ${stack}` : 'DNS providers'}</h2>
        {#if stack}
          <p class="filter" data-testid="stack-filter">
            Deployments of stack <a href={links.stack(stack)}>{stack}</a> ·
            <a href={links.dnsProviders({ q: query, all: showAll })}>All DNS providers</a>
          </p>
        {/if}
        <Notes notes={file.notes} />
        <p class="toggle">
          <label>
            <input type="checkbox" bind:checked={showAll} data-testid="show-all" />
            Show all ({list.hiddenCount} hidden: given up, never probed or no domains)
          </label>
        </p>
        <DataTable
          table={list.table}
          keys={KEYS}
          customKeys={CUSTOM_KEYS}
          phoneKeys={['name', 'supported_count', 'domains']}
          cell={providerCell}
          searchable
          pageSize={20}
          bind:query
          caption="DNS providers"
          emptyText={stack
            ? `No DNS provider of stack ${stack} to show`
            : 'No DNS provider to show'}
        />
        <ul class="caveats" data-testid="caveats">
          <li>
            Support counts template versions by the latest probe. Undetermined: not yet determined
            (never probed, being retried or failed).
          </li>
          <li>
            A DNS provider without template versions on record shows a total of 1, with nothing
            supported or not supported.
          </li>
          <li>
            Domains: scanned domains whose Domain Connect record is attributed to the DNS provider,
            as a share of the scanned domains. Domains of unidentified providers are not counted.
          </li>
          <li>Settings and support describe the last attempt, which may be days old.</li>
        </ul>
      </section>
    {:else}
      <LoadError error={new Error('The release has no DNS providers table')} />
    {/if}
  {:catch error}
    <LoadError {error} />
  {/await}
</Layout>

<style>
  .filter,
  .toggle {
    margin-bottom: var(--spacing-sm);
  }

  .toggle input {
    margin-right: var(--spacing-xs);
  }

  /* Wide screens: long labels and hosts wrap so the table fits. Phones: the table scrolls. */
  .badge,
  .host,
  .count {
    white-space: nowrap;
  }

  @media (min-width: 769px) {
    .badge {
      white-space: normal;
    }

    .host {
      white-space: normal;
      overflow-wrap: anywhere;
    }
  }

  .caveats {
    margin-top: var(--spacing-md);
    padding-left: var(--spacing-md);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
</style>
