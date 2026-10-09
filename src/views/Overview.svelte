<script lang="ts">
  import Panel from '../lib/components/Panel.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import StatCard from '../lib/components/StatCard.svelte';
  import { scannerStart } from '../lib/data/config';
  import TimeChart, { type Series } from '../lib/components/TimeChart.svelte';
  import { defaultClient } from '../lib/data/load';
  import { findTable } from '../lib/data/tables';
  import type { ExportFile, Manifest, Row } from '../lib/data/types';
  import { formatAxisPct, formatCount, formatDate, formatPct, UNKNOWN } from '../lib/format';
  import { links } from '../lib/links';
  import { ofScanned, scanLabel } from '../lib/domains';
  import { importSeries, latestWith, sweepSeries } from '../lib/series';
  import Board from '../lib/components/Board.svelte';
  import NewSupporters from '../lib/components/NewSupporters.svelte';
  import Unavailable from '../lib/components/Unavailable.svelte';
  import {
    entrantRows,
    entrants,
    mostImproved,
    NEW_SUPPORT_DAYS,
    newSupporting,
  } from '../lib/leaderboards';

  const client = defaultClient();
  let manifest = $state<Manifest | null>(null);
  const loading: Promise<ExportFile> = client.manifest().then((m) => {
    manifest = m;
    return client.file('overview');
  });
  const lists = client
    .file('dns_providers')
    .then((file) => ({ dnsProviders: findTable(file, 'dns_providers')?.rows ?? [] }));
  const derived = client.leaderboards();
  // Shown by their own {#await}, which may render only after they settle.
  derived.catch(() => undefined);
  lists.catch(() => undefined);
  // An anchored link scrolls once the boards' height is final.
  let boardsReady = $state(false);
  void Promise.allSettled([lists, derived]).then(() => (boardsReady = true));

  const IMPROVED_SIZE = 5;

  function num(row: Row | undefined, key: string): number | null {
    const v = row?.[key];
    return typeof v === 'number' ? v : null;
  }

  function ofTotal(row: Row | undefined, key: string): string | undefined {
    const total = num(row, key);
    return total === null ? undefined : `of ${formatCount(total)}`;
  }

  /** Every DNS provider of the list: discovered through a Domain Connect record. */
  function discovered(m: Manifest | null): number | null {
    const kind = m?.files.dns_providers;
    const n = kind && 'rows' in kind ? kind.rows.dns_providers : undefined;
    return typeof n === 'number' ? n : null;
  }

  function chartSeries(adoption: Row[], ecosystem: Row[]): Series[] {
    return [
      {
        label: 'DC adoption (% of scanned domains)',
        points: importSeries(adoption, 'dc_pct', adoption),
        tooltip: (p) =>
          `DC adoption: ${formatPct(p.y)} (${ofScanned(num(p.row, 'dc_domains'), num(p.row, 'scanned_domains'), scanLabel(p.row)) ?? UNKNOWN})`,
      },
      {
        label: 'Supporting DNS providers',
        points: sweepSeries(ecosystem, 'supporting_dns_providers'),
        axis: 'right',
        stepped: true,
        tooltip: (p) =>
          `Supporting DNS providers: ${p.y} of ${formatCount(num(p.row, 'known_dns_providers'))} known`,
      },
      {
        label: 'Supporting stacks',
        points: sweepSeries(ecosystem, 'supporting_stacks'),
        axis: 'right',
        stepped: true,
        dashed: true,
      },
      {
        label: 'Supported templates',
        points: sweepSeries(ecosystem, 'supported_templates'),
        axis: 'right',
        stepped: true,
        tooltip: (p) =>
          `Supported templates: ${p.y} of ${formatCount(num(p.row, 'published_templates'))} published`,
      },
    ];
  }
</script>

<Layout current="index" {manifest}>
  {#await loading}
    <p class="no-data">Loading…</p>
  {:then file}
    {@const adoption = findTable(file, 'adoption')}
    {@const ecosystem = findTable(file, 'ecosystem')}
    {@const adoptionRows = adoption?.rows ?? []}
    {@const ecosystemRows = ecosystem?.rows ?? []}
    {@const latestImport = latestWith(adoptionRows, 'dc_pct')}
    {@const latestSweep = ecosystemRows.at(-1)}

    <Notes notes={file.notes} />

    <section class="summary-stats" aria-label="Latest values" data-testid="headline">
      <StatCard
        value={formatPct(num(latestImport, 'dc_pct'))}
        label="DC adoption"
        detail={latestImport
          ? `${formatCount(num(latestImport, 'dc_domains'))} of ${formatCount(num(latestImport, 'scanned_domains'))} scanned domains`
          : undefined}
      />
      <StatCard
        value={formatCount(discovered(manifest))}
        exact={discovered(manifest)}
        label="Discovered DNS providers"
        detail="with DC TXT record"
      />
      <StatCard
        value={formatCount(num(latestSweep, 'supporting_dns_providers'))}
        exact={num(latestSweep, 'supporting_dns_providers')}
        label="Supporting DNS providers"
        detail="with at least 1 template"
      />
      <StatCard
        value={formatCount(num(latestSweep, 'supporting_stacks'))}
        exact={num(latestSweep, 'supporting_stacks')}
        label="Supporting stacks"
      />
      <StatCard
        value={formatCount(num(latestSweep, 'supported_templates'))}
        exact={num(latestSweep, 'supported_templates')}
        label="Supported templates"
        detail={ofTotal(latestSweep, 'published_templates')}
      />
      <StatCard
        value={formatCount(num(latestSweep, 'supported_combinations'))}
        exact={num(latestSweep, 'supported_combinations')}
        label="Supported pairs"
        detail={latestSweep ? `sweep of ${formatDate(latestSweep.started_at as string)}` : UNKNOWN}
      />
    </section>

    <Panel id="support-history" title="Domain Connect support over time" context="Overview">
      {#if adoptionRows.length || ecosystemRows.length}
        <TimeChart
          beforeScans={scannerStart()}
          label="Domain Connect adoption per import and support per full sweep over time"
          series={chartSeries(adoptionRows, ecosystemRows)}
          leftTitle="% of scanned domains"
          rightTitle="Count"
          formatLeft={formatAxisPct}
          formatRight={(v) => formatCount(v)}
        />
        <p class="muted chart-note">
          Adoption is measured per zone scan (import), support per full support sweep: two clocks on
          one date axis. Missing points are not measured, not zero.
        </p>
      {:else}
        <p class="no-data">No data available</p>
      {/if}
    </Panel>

    <div class="boards">
      <Panel
        id="new-supporting"
        title="New supporting DNS providers"
        context="Overview"
        ready={boardsReady}
        testid="overview-new"
      >
        <p class="muted about">
          First supported template found in the last {NEW_SUPPORT_DAYS} days, newest first.
        </p>
        {#await Promise.all([lists, derived])}
          <p class="no-data">Loading…</p>
        {:then [{ dnsProviders }, leaderboards]}
          <NewSupporters rows={newSupporting(leaderboards, dnsProviders, scannerStart())} />
        {:catch}
          <Unavailable />
        {/await}
      </Panel>

      <Panel
        id="most-improved"
        title="Most improved"
        context="Overview"
        ready={boardsReady}
        testid="overview-improved"
      >
        <p class="muted about">Templates gained over the latest sweep; top {IMPROVED_SIZE}.</p>
        {#await lists}
          <p class="no-data">Loading…</p>
        {:then { dnsProviders }}
          <Board
            caption="DNS providers by templates gained since the previous sweep"
            nameHeader="DNS provider"
            valueHeader="Gained"
            rows={entrantRows(
              mostImproved(entrants(dnsProviders), 'sweep', IMPROVED_SIZE),
              'change',
            )}
            emptyText="No DNS provider gained templates over the latest sweep"
          />
        {:catch}
          <Unavailable />
        {/await}
        <p class="more"><a href={links.leaderboards()}>All leaderboards</a></p>
      </Panel>
    </div>

    <section class="panel caveats">
      <h2>About these numbers</h2>
      <ul>
        <li>
          <strong>Attributed domains only.</strong> Domain counts include only domains whose Domain
          Connect record points to an identified DNS provider; <em>DC total</em> counts every domain
          with a record (<a href={links.methodology('43-attribution-of-domains')}>methodology 4.3</a
          >).
        </li>
        <li>
          <strong>Sampled scans.</strong> A scan may cover a random sample of a zone: percentages
          are of the scanned domains, an estimate for the zone (<a
            href={links.methodology('22-census-and-probability-sample')}>methodology 2.2</a
          >).
        </li>
        <li>
          <strong>One zone set.</strong> The numbers describe the scanned zones, not the whole
          Internet (<a href={links.methodology('21-zone-files')}>methodology 2.1</a>).
        </li>
        <li>
          <strong>Current stacks.</strong> Stack counts use each DNS provider's current stack, also
          for past sweeps and scans (<a
            href={links.methodology('42-deployments-providers-and-stacks')}>methodology 4.2</a
          >).
        </li>
      </ul>
    </section>
  {:catch error}
    <LoadError {error} />
  {/await}
</Layout>

<style>
  .boards {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 var(--spacing-lg);
  }

  @media (max-width: 900px) {
    .boards {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .about {
    font-size: 0.85rem;
    margin: var(--spacing-sm) 0;
  }

  .more {
    margin-top: var(--spacing-sm);
    text-align: right;
  }

  .chart-note {
    font-size: 0.8rem;
    margin-top: var(--spacing-sm);
  }

  .caveats ul {
    padding-left: var(--spacing-md);
    font-size: 0.9rem;
  }

  .caveats li {
    margin-bottom: var(--spacing-xs);
  }
</style>
