<script lang="ts">
  import Panel from '../lib/components/Panel.svelte';
  import CardTitle from '../lib/components/CardTitle.svelte';
  import DataTable from '../lib/components/DataTable.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import NotFound from '../lib/components/NotFound.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import StatCard from '../lib/components/StatCard.svelte';
  import { scannerStart } from '../lib/data/config';
  import TimeChart, { SERIES_COLORS } from '../lib/components/TimeChart.svelte';
  import { defaultClient, NotFoundError } from '../lib/data/load';
  import { findTable, oneRecord } from '../lib/data/tables';
  import type { Column, ExportFile, Manifest, Row } from '../lib/data/types';
  import { formatCount, formatDateTime, formatPct, UNKNOWN } from '../lib/format';
  import { links } from '../lib/links';
  import { textParam } from '../lib/params';
  import { defaultShown, templateSeries, type TemplateSeries } from '../lib/service-providers';

  const id = textParam(window.location.search, 'id');
  const client = defaultClient();
  let manifest = $state<Manifest | null>(null);
  /** Service ids whose line is drawn; set once the card has loaded. */
  let shown = $state<string[]>([]);

  /** The card, or null when the parameter is missing or the service provider has no card (404). */
  const loading: Promise<ExportFile | null> = client.manifest().then((m) => {
    manifest = m;
    if (id === null) return null;
    return client.file('service_provider', { service_provider_id: id }).then(
      (file) => {
        const name = text(oneRecord(findTable(file, 'service_provider')), 'name');
        document.title = `${name ?? id} - Service provider - Domain Connect Support Statistics`;
        shown = defaultShown(seriesOf(file));
        return file;
      },
      (e: unknown) => {
        if (e instanceof NotFoundError) return null;
        throw e;
      },
    );
  });

  function seriesOf(file: ExportFile): TemplateSeries[] {
    return templateSeries(
      findTable(file, 'templates')?.rows ?? [],
      findTable(file, 'support_history')?.rows ?? [],
    );
  }

  function num(row: Row | null | undefined, key: string): number | null {
    const v = row?.[key];
    return typeof v === 'number' ? v : null;
  }

  function text(row: Row | undefined, key: string): string | null {
    const v = row?.[key];
    return typeof v === 'string' ? v : null;
  }

  // A template keeps its colour when lines are turned on or off; past the palette, lines dash.
  const colorOf = (i: number) => SERIES_COLORS[i % SERIES_COLORS.length]!;
  const dashedAt = (i: number) => Math.floor(i / SERIES_COLORS.length) % 2 === 1;
</script>

{#snippet templateCell(column: Column, row: Row)}
  {@const sid = text(row, 'service_id')}
  {#if column.key === 'name'}
    {#if sid && id}<a href={links.template(id, sid)}>{row.name ?? sid}</a>{:else}{row.name ??
        UNKNOWN}{/if}
    <div class="mono muted id">{sid ?? UNKNOWN}</div>
  {/if}
{/snippet}

<Layout current="service-provider" {manifest}>
  {#await loading}
    <p class="no-data">Loading…</p>
  {:then file}
    {#if !file}
      <NotFound
        what="This service provider"
        backHref={links.serviceProviders()}
        backLabel="Service providers"
      />
    {:else}
      {@const record = oneRecord(findTable(file, 'service_provider'))}
      {@const support = oneRecord(findTable(file, 'support'))}
      {@const templates = findTable(file, 'templates')}
      {@const history = findTable(file, 'support_history')}
      {@const serviceProviderId = text(record, 'service_provider_id') ?? id!}
      {@const series = seriesOf(file)}
      {@const drawable = series.filter((s) => s.points.length)}

      <CardTitle name={text(record, 'name') ?? serviceProviderId}>
        <span class="mono">{serviceProviderId}</span>
        ·
        <a href={links.templates({ spid: serviceProviderId })} data-testid="templates-link"
          >Its templates in the templates list</a
        >
      </CardTitle>

      <section class="summary-stats" aria-label="Templates and reach" data-testid="headline">
        <StatCard
          value={formatCount(num(support, 'templates'))}
          exact={num(support, 'templates')}
          label="Templates"
          detail={`${formatCount(num(support, 'supported_templates'))} supported by a DNS provider`}
        />
        <StatCard
          value={formatCount(num(support, 'supporting_dns_providers'))}
          exact={num(support, 'supporting_dns_providers')}
          label="Supporting DNS providers"
          detail="of any of its templates, in the latest probes"
        />
        <StatCard
          value={formatCount(num(support, 'reach_domains'))}
          exact={num(support, 'reach_domains')}
          label="Domains reached"
          detail={num(support, 'reach_domains') === null
            ? 'no domain-share import'
            : `${formatPct(num(support, 'reach_pct'))} of ${formatCount(manifest?.share_import?.scanned_domains ?? null)} scanned domains`}
        />
      </section>

      {#if history}
        <Panel
          id="support-history"
          title="Supporting DNS providers per template over time"
          context={text(record, 'name') ?? serviceProviderId}
        >
          {#if drawable.length}
            {@const lines = series.flatMap((s, i) =>
              shown.includes(s.serviceId) && s.points.length
                ? [
                    {
                      label: s.name,
                      points: s.points,
                      stepped: true,
                      color: colorOf(i),
                      dashed: dashedAt(i),
                      tooltip: (p: { y: number }) => `${s.name}: ${p.y}`,
                    },
                  ]
                : [],
            )}
            {#if lines.length}
              <TimeChart
                label="Supporting DNS providers per template over time"
                beforeScans={scannerStart()}
                series={lines}
                legend={drawable.length === 1}
                leftTitle="DNS providers"
                formatLeft={(v) => (Number.isInteger(v) ? formatCount(v) : '')}
              />
            {:else}
              <p class="no-data">No template chosen</p>
            {/if}
            {#if drawable.length > 1}
              <fieldset class="picker" data-testid="template-picker">
                <legend>Templates shown ({shown.length} of {drawable.length})</legend>
                <div class="choices">
                  {#each series as s, i (s.serviceId)}
                    {#if s.points.length}
                      <label>
                        <input type="checkbox" bind:group={shown} value={s.serviceId} />
                        <span class="swatch" style:background-color={colorOf(i)}></span>
                        {s.name}
                      </label>
                    {/if}
                  {/each}
                </div>
              </fieldset>
            {/if}
          {:else}
            <p class="no-data">Not measured yet</p>
          {/if}
        </Panel>
      {/if}

      {#if templates}
        <Panel
          id="templates"
          title={templates.title}
          context={text(record, 'name') ?? serviceProviderId}
        >
          <DataTable
            table={templates}
            keys={[
              'name',
              'version',
              'added_at',
              'updated_at',
              'supporting_providers',
              'reach_domains',
              'reach_pct',
            ]}
            customKeys={['name']}
            phoneKeys={['name', 'supporting_providers', 'reach_pct']}
            searchable
            pageSize={20}
            cell={templateCell}
            emptyText="No templates"
          />
        </Panel>
      {/if}

      <section class="panel">
        <h2>Details</h2>
        <dl class="record" data-testid="service-provider-record">
          <dt>First added</dt>
          <dd>{formatDateTime(text(record, 'first_added_at'))}</dd>
          <dt>Last updated</dt>
          <dd>{formatDateTime(text(record, 'last_updated_at'))}</dd>
        </dl>
      </section>

      {#if file.notes.length}
        <section class="panel">
          <h2>Notes</h2>
          <Notes notes={file.notes} />
        </section>
      {/if}
    {/if}
  {:catch error}
    <LoadError {error} />
  {/await}
</Layout>

<style>
  .id {
    font-size: 0.8rem;
    overflow-wrap: anywhere;
  }

  .picker {
    margin: var(--spacing-md) 0 0;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    min-width: 0;
  }

  .picker legend {
    font-size: 0.85rem;
    color: var(--text-secondary);
    padding: 0 var(--spacing-xs);
  }

  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs) var(--spacing-md);
    max-height: 12rem;
    overflow-y: auto;
  }

  .choices label {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.9rem;
    overflow-wrap: anywhere;
    min-width: 0;
  }

  .swatch {
    display: inline-block;
    flex-shrink: 0;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 2px;
  }
</style>
