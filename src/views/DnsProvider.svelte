<script lang="ts">
  import CardTitle from '../lib/components/CardTitle.svelte';
  import DataTable from '../lib/components/DataTable.svelte';
  import ExternalLink from '../lib/components/ExternalLink.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import NotFound from '../lib/components/NotFound.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import Registry from '../lib/components/Registry.svelte';
  import RegistryContact from '../lib/components/RegistryContact.svelte';
  import StatCard from '../lib/components/StatCard.svelte';
  import TimeChart from '../lib/components/TimeChart.svelte';
  import { parseNameservers } from '../lib/cells';
  import { defaultClient, NotFoundError } from '../lib/data/load';
  import { findTable, oneRecord } from '../lib/data/tables';
  import type { Column, ExportFile, Manifest, Row } from '../lib/data/types';
  import { formatCount, formatDateTime, formatPct, UNKNOWN } from '../lib/format';
  import { links } from '../lib/links';
  import { integerParam } from '../lib/params';
  import { defaultRegistryClient, entryFileUrl } from '../lib/registry/load';
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

  const registry = defaultRegistryClient();
  const registryLoads: Record<string, ReturnType<typeof loadRegistry>> = {};

  /** The registry of stack `providerId`, loaded once for the title, contact and details. */
  function registryOf(providerId: string) {
    return (registryLoads[providerId] ??= loadRegistry(providerId));
  }

  /**
   * The registry entry of stack `providerId`, or null when the stack has none. The stack card is
   * fetched only for an entry: several deployments share it, so the card names the stack; if that
   * fetch fails, it names the stack by its id.
   */
  async function loadRegistry(providerId: string) {
    const entry = await registry.entry(providerId);
    if (!entry) return null;
    const [source, stack] = await Promise.all([
      registry.source(),
      client.file('stack', { provider_id: providerId }).then(
        (f) => {
          const record = oneRecord(findTable(f, 'stack'));
          const deployments = num(record, 'deployments');
          if (deployments !== null && deployments <= 1) return null;
          return { id: providerId, name: text(record, 'name') ?? providerId };
        },
        () => ({ id: providerId, name: providerId }),
      ),
    ]);
    return {
      entry,
      logoUrl: registry.logoUrl(entry),
      fileUrl: source && entryFileUrl(source, providerId),
      stack,
    };
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
        what="This DNS provider"
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
      {@const providerName = text(provider, 'name') ?? 'Unnamed DNS provider'}
      {@const reg = stack ? registryOf(stack) : Promise.resolve(null)}

      <CardTitle
        name={providerName}
        logo={reg.then(
          (r) => (r?.logoUrl ? { url: r.logoUrl, alt: r.entry.name } : null),
          () => null,
        )}
      >
        {#if stack}
          Stack <a href={links.stack(stack)} data-testid="stack-link"
            >{#await reg}{stack}{:then r}{r?.stack
                ? `${r.stack.name} (${stack})`
                : stack}{:catch}{stack}{/await}</a
          >
        {:else}
          No stack (declares no providerId)
        {/if}
      </CardTitle>

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

      {#await reg then r}
        {#if r}<RegistryContact entry={r.entry} stack={r.stack} />{/if}
      {:catch}
        <!-- The registry details section below says the entry could not be loaded. -->
      {/await}

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
          {:else}
            <p class="no-data">Not measured yet</p>
          {/if}
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
          {:else}
            <p class="no-data">Not measured yet</p>
          {/if}
        </section>
      {/if}

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

      {#await reg then r}
        {#if r}<Registry entry={r.entry} fileUrl={r.fileUrl} stack={r.stack} />{/if}
      {:catch}
        <section class="panel" data-testid="registry">
          <h2>Registry</h2>
          <p class="no-data">The registry entry could not be loaded.</p>
        </section>
      {/await}

      <section class="panel">
        <h2>Settings</h2>
        <dl class="record" data-testid="provider-record">
          {#each URL_FIELDS as [key, label] (key)}
            <dt>{label}</dt>
            <dd><ExternalLink url={text(provider, key)} mono /></dd>
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

      {#if file.notes.length}
        <section class="panel">
          <h2>Notes</h2>
          <Notes notes={file.notes} />
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
