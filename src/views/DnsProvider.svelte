<script lang="ts">
  import DataTable from '../lib/components/DataTable.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import NotFound from '../lib/components/NotFound.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import StatCard from '../lib/components/StatCard.svelte';
  import TimeChart from '../lib/components/TimeChart.svelte';
  import { parseNameservers } from '../lib/cells';
  import { defaultClient, NotFoundError } from '../lib/data/load';
  import { findTable, oneRecord } from '../lib/data/tables';
  import type { Column, ExportFile, Manifest, Row } from '../lib/data/types';
  import { formatCount, formatDateTime, formatPct, UNKNOWN } from '../lib/format';
  import { links, safeUrl } from '../lib/links';
  import { integerParam } from '../lib/params';
  import { importSeries, needsAdoption, sweepSeries } from '../lib/series';

  const id = integerParam(window.location.search, 'id');
  const client = defaultClient();
  let manifest = $state<Manifest | null>(null);

  /** The card, or null when the id is missing, malformed or has no card (404). */
  const loading: Promise<ExportFile | null> = client.manifest().then((m) => {
    manifest = m;
    if (id === null) return null;
    return client.file('dns_provider', { dns_provider_id: id }).then(
      (file) => {
        const name = text(oneRecord(findTable(file, 'provider')), 'name');
        if (name) document.title = `${name} - DNS provider - Domain Connect Support Statistics`;
        return file;
      },
      (e: unknown) => {
        if (e instanceof NotFoundError) return null;
        throw e;
      },
    );
  });

  /** The overview's `adoption` rows, fetched only when an import lacks `completed_at`. */
  function adoptionFor(shareHistory: Row[]): Promise<Row[]> {
    if (!needsAdoption(shareHistory)) return Promise.resolve([]);
    return client
      .file('overview')
      .then((f) => findTable(f, 'adoption')?.rows ?? [])
      .catch(() => []);
  }

  function num(row: Row | undefined, key: string): number | null {
    const v = row?.[key];
    return typeof v === 'number' ? v : null;
  }

  function text(row: Row | undefined, key: string): string | null {
    const v = row?.[key];
    return typeof v === 'string' ? v : null;
  }

  /** `total - supported - unsupported`: never probed, being retried or failed. */
  function undetermined(support: Row | undefined): number | null {
    const total = num(support, 'total');
    const yes = num(support, 'supported_count');
    const no = num(support, 'unsupported_count');
    return total === null || yes === null || no === null ? null : total - yes - no;
  }

  const URL_FIELDS = [
    ['api_url', 'API URL'],
    ['sync_url', 'Synchronous flow URL'],
    ['async_url', 'Asynchronous flow URL'],
    ['control_panel_url', 'Control panel URL'],
    ['domain_connect_url', 'First Domain Connect URL'],
  ] as const;
</script>

{#snippet externalUrl(value: string | null)}
  {@const href = safeUrl(value)}
  {#if href}
    <a class="mono break" {href} target="_blank" rel="nofollow noopener noreferrer">{value}</a>
  {:else}
    <span class="mono break">{value ?? UNKNOWN}</span>
  {/if}
{/snippet}

{#snippet templateCell(column: Column, row: Row)}
  {@const spid = text(row, 'service_provider_id')}
  {@const sid = text(row, 'service_id')}
  {#if column.key === 'service_provider_name' && spid}
    <a href={links.serviceProvider(spid)}>{row.service_provider_name ?? spid}</a>
  {:else if column.key === 'service_name' && spid && sid}
    <a href={links.template(spid, sid)}>{row.service_name ?? sid}</a>
  {/if}
{/snippet}

<Layout current="dns-provider" {manifest}>
  {#await loading}
    <p class="no-data">Loading…</p>
  {:then file}
    {#if !file}
      <NotFound
        what={id === null ? 'This DNS provider' : `DNS provider ${id}`}
        backHref={links.dnsProviders()}
        backLabel="DNS providers"
      />
    {:else}
      {@const provider = oneRecord(findTable(file, 'provider'))}
      {@const support = oneRecord(findTable(file, 'support'))}
      {@const share = oneRecord(findTable(file, 'share'))}
      {@const urls = findTable(file, 'urls')}
      {@const templates = findTable(file, 'supported_templates')}
      {@const supportHistory = findTable(file, 'support_history')}
      {@const shareHistory = findTable(file, 'share_history')}
      {@const stack = text(provider, 'provider_id')}
      {@const nameservers = parseNameservers(text(provider, 'nameservers'))}

      <section class="panel card-title" data-testid="card-title">
        <h2>{text(provider, 'name') ?? `DNS provider ${id}`}</h2>
        <p class="muted">
          DNS provider {id} ·
          {#if stack}
            Stack <a href={links.stack(stack)} data-testid="stack-link">{stack}</a>
          {:else}
            No stack (declares no providerId)
          {/if}
        </p>
      </section>

      <Notes notes={file.notes} />

      <section class="summary-stats" aria-label="Support and domain share" data-testid="headline">
        <StatCard
          value={formatCount(num(support, 'supported_count'))}
          label="Supported"
          detail={`of ${formatCount(num(support, 'total'))} template versions (${formatPct(num(support, 'supported_pct'))})`}
        />
        <StatCard
          value={formatCount(num(support, 'unsupported_count'))}
          label="Not supported"
          detail={formatPct(num(support, 'unsupported_pct'))}
        />
        <StatCard
          value={formatCount(undetermined(support))}
          label="Not yet determined"
          detail="never probed, retried or failed"
        />
        <StatCard
          value={formatCount(num(share, 'domains'))}
          label="Domains"
          detail={share
            ? `${formatPct(num(share, 'share_pct'))} of ${formatCount(num(share, 'scanned_domains'))} scanned domains`
            : 'no domain-share import'}
        />
        <StatCard
          value={num(share, 'rank') === null ? UNKNOWN : `#${num(share, 'rank')}`}
          label="Rank by domains"
          detail={share
            ? `of ${formatCount(num(share, 'providers'))} DNS providers with domains`
            : undefined}
        />
      </section>

      <section class="panel">
        <h2>Settings</h2>
        <dl class="record" data-testid="provider-record">
          {#each URL_FIELDS as [key, label] (key)}
            <dt>{label}</dt>
            <dd>{@render externalUrl(text(provider, key))}</dd>
          {/each}
          <dt>Name servers</dt>
          <dd>
            {#if nameservers?.length}
              <ul class="plain mono">
                {#each nameservers as ns, i (i)}<li>{ns}</li>{/each}
              </ul>
            {:else}
              {nameservers ? 'none' : (text(provider, 'nameservers') ?? UNKNOWN)}
            {/if}
          </dd>
          <dt>First seen</dt>
          <dd>{formatDateTime(text(provider, 'first_seen_at'))}</dd>
        </dl>
      </section>

      {#if templates}
        <section class="panel">
          <h2>{templates.title}</h2>
          <DataTable
            table={templates}
            keys={['service_provider_name', 'service_name', 'versions', 'since']}
            customKeys={['service_provider_name', 'service_name']}
            cell={templateCell}
            emptyText="No template supported in the latest probes"
          />
        </section>
      {/if}

      {#if supportHistory}
        <section class="panel">
          <h2>Supported templates over time</h2>
          {#if supportHistory.rows.length}
            <TimeChart
              label="Supported templates over time"
              series={[
                {
                  label: 'Supported templates',
                  points: sweepSeries(supportHistory.rows, 'supported_templates'),
                  stepped: true,
                  tooltip: (p) => `Supported templates: ${p.y}`,
                },
              ]}
              leftTitle="Templates"
              formatLeft={(v) => (Number.isInteger(v) ? formatCount(v) : '')}
            />
          {/if}
          <DataTable table={supportHistory} emptyText="Not measured yet" />
        </section>
      {/if}

      {#if shareHistory}
        <section class="panel">
          <h2>Domain share over time</h2>
          {#if shareHistory.rows.length}
            {#await adoptionFor(shareHistory.rows) then adoption}
              <TimeChart
                label="Domain share over time"
                series={[
                  {
                    label: 'Share of scanned domains',
                    points: importSeries(shareHistory.rows, 'share_pct', adoption),
                    tooltip: (p) =>
                      `Share: ${formatPct(p.y, 2)} (${formatCount(num(p.row, 'domains'))} of ` +
                      `${formatCount(num(p.row, 'scanned_domains'))} scanned domains)`,
                  },
                ]}
                leftTitle="% of scanned domains"
                formatLeft={(v) => `${Number(v.toFixed(2))}%`}
              />
            {/await}
          {/if}
          <DataTable
            table={shareHistory}
            keys={[
              'import_id',
              'completed_at',
              'status',
              'domains',
              'scanned_domains',
              'share_pct',
              'change_pct',
              'rank',
              'providers',
            ]}
            emptyText="Not measured yet"
          />
        </section>
      {/if}

      {#if urls}
        <section class="panel">
          <h2>{urls.title}</h2>
          <DataTable table={urls} emptyText="No Domain Connect URL is attributed to it" />
        </section>
      {/if}
    {/if}
  {:catch error}
    <LoadError {error} />
  {/await}
</Layout>

<style>
  .card-title h2 {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: var(--spacing-xs);
  }

  .card-title p {
    margin: 0;
  }

  .record {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--spacing-xs) var(--spacing-md);
  }

  .record dt {
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
  }

  .record dd {
    margin: 0;
    min-width: 0;
  }

  .plain {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .break {
    overflow-wrap: anywhere;
  }

  @media (max-width: 480px) {
    .record {
      grid-template-columns: 1fr;
    }

    .record dd {
      margin-bottom: var(--spacing-sm);
    }
  }
</style>
