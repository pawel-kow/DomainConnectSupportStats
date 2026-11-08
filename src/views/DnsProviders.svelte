<script lang="ts">
  import Panel from '../lib/components/Panel.svelte';
  import DataTable from '../lib/components/DataTable.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import StatusBadge from '../lib/components/StatusBadge.svelte';
  import { defaultClient } from '../lib/data/load';
  import { findTable } from '../lib/data/tables';
  import type { Column, Manifest, Row } from '../lib/data/types';
  import {
    DNS_PROVIDER_FILTERS,
    dnsProviderFilter,
    dnsProviderList,
    isNeverProbed,
    probeCounts,
    withFirstSeen,
  } from '../lib/dns-providers';
  import { templateCount } from '../lib/supporting';
  import { formatCount, formatExact, formatPct, UNKNOWN } from '../lib/format';
  import { pageTitle } from '../lib/title';
  import { links } from '../lib/links';
  import DomainShare from '../lib/components/DomainShare.svelte';
  import type { Scan } from '../lib/domains';
  import { overviewFacts } from '../lib/overview-facts';
  import { newSupporting } from '../lib/leaderboards';
  import { scannerStart } from '../lib/data/config';
  import { withHash } from '../lib/share';
  import { textParam } from '../lib/params';

  const search = window.location.search;
  const stack = textParam(search, 'stack');
  let query = $state(textParam(search, 'q') ?? '');
  let filter = $state(dnsProviderFilter(search));

  // Keep the view a shareable link while the search and filter change.
  $effect(() => {
    window.history.replaceState(
      null,
      '',
      withHash(links.dnsProviders({ stack, q: query, filter }), location.hash),
    );
  });

  const client = defaultClient();
  let manifest = $state<Manifest | null>(null);
  /** The domain-share import, for the hover text of domain shares. */
  let scan = $state<Scan | null>(null);
  const loading = client.manifest().then((m) => {
    manifest = m;
    void overviewFacts(client, m).then((f) => (scan = f.scan));
    return Promise.all([
      client.file('dns_providers'),
      // The list stands without them: first found is unknown, the new filter unavailable.
      client.dnsProviderFacts().catch(() => null),
      client.leaderboards().catch(() => null),
    ]);
  });

  if (stack) document.title = pageTitle(stack, 'DNS providers');

  const CUSTOM_KEYS = [
    'name',
    'provider_id',
    'settings_status',
    'support_status',
    'supported_count',
    'unsupported_count',
    'undetermined_count',
    'domains',
  ];
  const KEYS = [...CUSTOM_KEYS, 'first_seen_at'];

  function num(row: Row, key: string): number | null {
    const v = row[key];
    return typeof v === 'number' ? v : null;
  }

  function text(row: Row, key: string): string | null {
    const v = row[key];
    return typeof v === 'string' ? v : null;
  }
</script>

{#snippet countPct(count: string, pct: number | null, title?: string)}
  <span class="count" {title}>{count}</span>
  {#if count !== UNKNOWN}<div class="muted">{formatPct(pct)}</div>{/if}
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
  {:else if column.key === 'settings_status'}
    <StatusBadge status={row.settings_status ?? null} />
  {:else if column.key === 'support_status'}
    <StatusBadge status={row.support_status ?? null} detail={probeCounts(row)} />
  {:else if isNeverProbed(row) && column.key === 'supported_count'}
    <span class="muted count">Not probed yet</span>
  {:else if column.key === 'supported_count' || column.key === 'unsupported_count' || column.key === 'undetermined_count'}
    {@render countPct(
      formatCount(num(row, column.key)),
      num(row, column.key.replace(/_count$/, '_pct')),
    )}
  {:else if column.key === 'domains'}
    <DomainShare pct={num(row, 'domains_pct')} domains={num(row, 'domains')} {scan} />
  {/if}
{/snippet}

<Layout current="dns-providers" {manifest}>
  {#await loading}
    <p class="no-data">Loading…</p>
  {:then [file, facts, leaderboards]}
    {@const exported = findTable(file, 'dns_providers')}
    {#if exported}
      {@const source = withFirstSeen(exported, facts?.first_seen ?? null)}
      {@const newSupporters = leaderboards
        ? new Set(
            newSupporting(leaderboards, exported.rows, scannerStart()).map((n) => n.dnsProviderId),
          )
        : null}
      {@const list = dnsProviderList(source, { stack, filter, newSupporters })}
      <Panel
        id="dns-providers"
        title={stack ? `DNS providers of stack ${stack}` : 'DNS providers'}
        context="DNS providers"
      >
        {#if stack}
          <p class="filter" data-testid="stack-filter">
            Deployments of stack <a href={links.stack(stack)}>{stack}</a> ·
            <a href={links.dnsProviders({ q: query, filter })}>All DNS providers</a>
          </p>
        {/if}
        <Notes notes={file.notes} />
        <p class="list-filter">
          <label>
            Show
            <select bind:value={filter} data-testid="list-filter">
              {#each DNS_PROVIDER_FILTERS as option (option.id)}
                {@const unavailable = option.id === 'new' && !newSupporters}
                <option value={option.id} disabled={unavailable}>
                  {option.label} ({unavailable
                    ? 'unavailable'
                    : formatExact(list.counts[option.id])})
                </option>
              {/each}
            </select>
          </label>
          <span class="muted" data-testid="filter-description">
            {DNS_PROVIDER_FILTERS.find((f) => f.id === filter)?.description}
          </span>
        </p>
        <div class="providers">
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
        </div>
        <ul class="caveats" data-testid="caveats">
          <li>
            Supported and not supported: the latest conclusive probe of each template; undetermined:
            no conclusive answer yet (never probed, being retried or failed). Each as a share of
            every template ({formatCount(templateCount(manifest))}), none without a template API (<a
              href={links.methodology('52-support-probe')}>methodology 5.2</a
            >).
          </li>
          <li>
            Domains: share of the scanned domains whose Domain Connect record is attributed to the
            DNS provider. Domains of unidentified providers are not counted (<a
              href={links.methodology('43-attribution-of-domains')}>methodology 4.3</a
            >).
          </li>
          <li>
            Settings and support describe the latest completed run, which may be weeks old; support
            also counts that sweep's answered and failed probes (<a
              href={links.methodology('61-status-values')}>methodology 6.1</a
            >).
          </li>
        </ul>
      </Panel>
    {:else}
      <LoadError error={new Error('The release has no DNS providers table')} />
    {/if}
  {:catch error}
    <LoadError {error} />
  {/await}
</Layout>

<style>
  .filter,
  .list-filter {
    margin-bottom: var(--spacing-sm);
  }

  .list-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs) var(--spacing-sm);
  }

  .list-filter label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    min-width: 0;
    max-width: 100%;
  }

  .list-filter select {
    font: inherit;
    min-width: 0;
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background-color: var(--bg-white);
    color: var(--secondary-navy);
  }

  /* Wide screens: long labels and hosts wrap so the table fits. Phones: the table scrolls. */
  .host,
  .count {
    white-space: nowrap;
  }

  @media (min-width: 769px) {
    .host {
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .providers :global(th),
    .providers :global(td) {
      padding-inline: var(--spacing-xs);
    }
  }

  .caveats {
    margin-top: var(--spacing-md);
    padding-left: var(--spacing-md);
    font-size: 0.8rem;
    color: var(--text-secondary);
  }
</style>
