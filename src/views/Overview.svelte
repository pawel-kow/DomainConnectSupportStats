<script lang="ts">
  import DataTable from '../lib/components/DataTable.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import StatCard from '../lib/components/StatCard.svelte';
  import TimeChart, { type Series } from '../lib/components/TimeChart.svelte';
  import { defaultClient } from '../lib/data/load';
  import { findTable } from '../lib/data/tables';
  import type { ExportFile, Manifest, Row } from '../lib/data/types';
  import { formatCount, formatDate, formatPct, UNKNOWN } from '../lib/format';
  import { importSeries, latestWith, sweepSeries } from '../lib/series';

  const client = defaultClient();
  let manifest = $state<Manifest | null>(null);
  const loading: Promise<ExportFile> = client.manifest().then((m) => {
    manifest = m;
    return client.file('overview');
  });

  function num(row: Row | undefined, key: string): number | null {
    const v = row?.[key];
    return typeof v === 'number' ? v : null;
  }

  function ofTotal(row: Row | undefined, key: string): string | undefined {
    const total = num(row, key);
    return total === null ? undefined : `of ${formatCount(total)}`;
  }

  /** When the import's scan ran, e.g. "scan of 01-06-2026". */
  function scanDate(row: Row | undefined): string | undefined {
    const at = row?.started_at ?? row?.completed_at;
    return typeof at === 'string' ? `scan of ${formatDate(at)}` : undefined;
  }

  function chartSeries(adoption: Row[], ecosystem: Row[]): Series[] {
    return [
      {
        label: 'DC adoption (% of scanned domains)',
        points: importSeries(adoption, 'dc_pct', adoption),
        tooltip: (p) =>
          `DC adoption: ${formatPct(p.y)} (${formatCount(num(p.row, 'dc_domains'))} of ` +
          `${formatCount(num(p.row, 'scanned_domains'))} domains)`,
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
        value={formatCount(num(latestImport, 'dns_providers'))}
        label="DNS providers with domains"
        detail={scanDate(latestImport)}
      />
      <StatCard
        value={formatCount(num(latestSweep, 'supporting_dns_providers'))}
        label="Supporting DNS providers"
        detail={ofTotal(latestSweep, 'known_dns_providers')}
      />
      <StatCard
        value={formatCount(num(latestSweep, 'supporting_stacks'))}
        label="Supporting stacks"
      />
      <StatCard
        value={formatCount(num(latestSweep, 'supported_templates'))}
        label="Supported templates"
        detail={ofTotal(latestSweep, 'published_templates')}
      />
      <StatCard
        value={formatCount(num(latestSweep, 'supported_combinations'))}
        label="Supported pairs"
        detail={latestSweep ? `sweep of ${formatDate(latestSweep.started_at as string)}` : UNKNOWN}
      />
    </section>

    <section class="panel">
      <h2>Domain Connect support over time</h2>
      {#if adoptionRows.length || ecosystemRows.length}
        <TimeChart
          label="Domain Connect adoption per import and support per full sweep over time"
          series={chartSeries(adoptionRows, ecosystemRows)}
          leftTitle="% of scanned domains"
          rightTitle="Count"
          formatLeft={(v) => formatPct(v, 0)}
        />
        <p class="muted chart-note">
          Adoption is measured per zone scan (import), support per full support sweep: two clocks on
          one date axis. Missing points are not measured, not zero.
        </p>
      {:else}
        <p class="no-data">No data available</p>
      {/if}
    </section>

    {#if adoption}
      <section class="panel">
        <h2>{adoption.title}</h2>
        <DataTable table={adoption} emptyText="No import has data yet" />
      </section>
    {/if}

    {#if ecosystem}
      <section class="panel">
        <h2>{ecosystem.title}</h2>
        <DataTable table={ecosystem} emptyText="No full support sweep has recorded support yet" />
      </section>
    {/if}

    <section class="panel caveats">
      <h2>About these numbers</h2>
      <ul>
        <li>
          <strong>Attributed domains only.</strong> Domain counts include only domains whose Domain
          Connect record points to an identified DNS provider; <em>DC total</em> counts every domain with
          a record.
        </li>
        <li>
          <strong>Sampled scans.</strong> A scan may cover a random sample of a zone: percentages are
          of the scanned domains, an estimate for the zone.
        </li>
        <li>
          <strong>One zone set.</strong> The numbers describe the scanned zones, not the whole Internet.
        </li>
        <li>
          <strong>Current stacks.</strong> Stack counts use each DNS provider's current stack, also for
          past sweeps and scans.
        </li>
      </ul>
    </section>
  {:catch error}
    <LoadError {error} />
  {/await}
</Layout>

<style>
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
