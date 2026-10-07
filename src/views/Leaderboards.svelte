<script lang="ts">
  import Board from '../lib/components/Board.svelte';
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import NewSupporters from '../lib/components/NewSupporters.svelte';
  import Notes from '../lib/components/Notes.svelte';
  import { scannerStart } from '../lib/data/config';
  import { defaultClient } from '../lib/data/load';
  import { findTable } from '../lib/data/tables';
  import type { ExportFile, Manifest, Row } from '../lib/data/types';
  import { formatCount, formatDate, formatExact } from '../lib/format';
  import {
    BOARD_SIZE,
    entrantRows,
    entrants,
    improvedWindow,
    isMeasured,
    mostImproved,
    NEW_SUPPORT_DAYS,
    newSupporting,
    topByDomains,
    topByTemplates,
    topReach,
    WINDOW_LABELS,
    type BoardRow,
    type ImprovedWindow,
    type Ranked,
  } from '../lib/leaderboards';
  import { links } from '../lib/links';

  const client = defaultClient();
  const window_ = improvedWindow(window.location.search);
  let manifest = $state<Manifest | null>(null);
  const loading = client.manifest().then(async (m) => {
    manifest = m;
    const [dnsProviders, stacks, templates, serviceProviders] = await Promise.all([
      client.file('dns_providers'),
      client.file('stacks'),
      client.file('templates'),
      client.file('service_providers'),
    ]);
    return { dnsProviders, stacks, templates, serviceProviders };
  });
  const derived = client.leaderboards();
  // Shown by its own {#await}, which may render only after it settles.
  derived.catch(() => undefined);

  const rowsOf = (file: ExportFile, id: string): Row[] => findTable(file, id)?.rows ?? [];
  const text = (row: Row, key: string): string | null =>
    typeof row[key] === 'string' ? (row[key] as string) : null;

  /** Every file's notes once, verbatim. */
  function notes(files: ExportFile[]): string[] {
    return [...new Set(files.flatMap((f) => f.notes))];
  }

  function reachRows(ranked: Ranked<Row>[], kind: 'template' | 'service_provider'): BoardRow[] {
    return ranked.map(({ rank, value, entry }) => {
      const spid =
        kind === 'template' ? text(entry, 'provider_id') : text(entry, 'service_provider_id');
      const sid = text(entry, 'service_id') ?? '';
      return {
        rank,
        name:
          kind === 'template'
            ? (text(entry, 'service_name') ?? sid)
            : (text(entry, 'name') ?? spid ?? '?'),
        href:
          kind === 'template' ? links.template(spid ?? '', sid) : links.serviceProvider(spid ?? ''),
        detail: kind === 'template' ? text(entry, 'provider_name') : null,
        value: formatCount(value),
        title: formatExact(value),
      };
    });
  }

  const templateName = (r: Row) =>
    `${text(r, 'service_name') ?? ''} ${text(r, 'provider_name') ?? ''}`;
  const serviceProviderName = (r: Row) => text(r, 'name') ?? '';

  function improvedEmpty(measured: boolean, w: ImprovedWindow): string {
    if (!measured) {
      return w === '90d'
        ? 'Not measured yet: the history does not reach back about 90 days'
        : 'Not measured yet: there is no previous sweep';
    }
    return 'No DNS provider or stack gained templates in this window';
  }
</script>

<Layout current="leaderboards" {manifest}>
  {#await loading}
    <p class="no-data">Loading…</p>
  {:then files}
    {@const dnsProviders = rowsOf(files.dnsProviders, 'dns_providers')}
    {@const stacks = rowsOf(files.stacks, 'stacks')}
    {@const list = entrants(dnsProviders, stacks)}
    {@const measured = isMeasured(list, window_)}

    <section class="panel intro">
      <h2>Leaderboards</h2>
      <Notes
        notes={notes([files.dnsProviders, files.stacks, files.templates, files.serviceProviders])}
      />
      <p>
        Who leads Domain Connect adoption in the release of
        <strong>{formatDate(manifest?.generated_at)}</strong>: the top {BOARD_SIZE} of each board, positive
        values only. The DNS providers of a stack are ranked together as one row; DNS providers without
        a stack on their own. Ties go to more domains, then by name.
      </p>
    </section>

    <div class="boards">
      <section class="panel" data-testid="board-templates">
        <h2>Most templates supported</h2>
        <p class="muted about">
          Templates supported now, each counted once whatever its versions. A stack counts the
          templates any of its deployments supports.
        </p>
        <Board
          caption="DNS providers and stacks by templates supported"
          nameHeader="DNS provider or stack"
          valueHeader="Templates"
          rows={entrantRows(topByTemplates(list))}
          emptyText="No DNS provider supports a template"
        />
      </section>

      <section class="panel" data-testid="board-domains">
        <h2>Most domains reached</h2>
        <p class="muted about">
          Scanned domains of the DNS providers supporting at least one template. A stack counts its
          supporting deployments only.
        </p>
        <Board
          caption="DNS providers and stacks by domains reached"
          nameHeader="DNS provider or stack"
          valueHeader="Domains"
          rows={entrantRows(topByDomains(list))}
          emptyText="No domains measured for supporting DNS providers"
        />
      </section>

      <section class="panel" data-testid="board-improved">
        <h2>Most improved</h2>
        <nav class="windows" aria-label="Most improved window">
          {#each ['sweep', '90d'] as const as w (w)}
            <a
              href={links.leaderboards({ window: w === 'sweep' ? null : w })}
              aria-current={w === window_ ? 'page' : undefined}>{WINDOW_LABELS[w]}</a
            >
          {/each}
        </nav>
        <p class="muted about">
          Templates gained {window_ === 'sweep'
            ? 'over the latest sweep (a stack: since its previous full sweep)'
            : 'over about 90 days'}.
        </p>
        <Board
          caption="DNS providers and stacks by templates gained, {WINDOW_LABELS[
            window_
          ].toLowerCase()}"
          nameHeader="DNS provider or stack"
          valueHeader="Gained"
          rows={entrantRows(mostImproved(list, window_), 'change')}
          emptyText={improvedEmpty(measured, window_)}
        />
      </section>

      <section class="panel" data-testid="board-new">
        <h2>New supporting DNS providers</h2>
        <p class="muted about">
          DNS providers whose first supported template was found in the last {NEW_SUPPORT_DAYS} days,
          newest first; the date is the start of that sweep. Each deployment of a stack is listed.
        </p>
        {#await derived}
          <p class="no-data">Loading…</p>
        {:then leaderboards}
          <NewSupporters rows={newSupporting(leaderboards, dnsProviders, stacks, scannerStart())} />
        {:catch error}
          <LoadError {error} />
        {/await}
      </section>

      <section class="panel" data-testid="board-template-reach">
        <h2>Templates with the biggest reach</h2>
        <p class="muted about">Scanned domains behind the DNS providers supporting the template.</p>
        <Board
          caption="Templates by domains reached"
          nameHeader="Template"
          valueHeader="Domains"
          rows={reachRows(
            topReach(rowsOf(files.templates, 'service_templates'), templateName),
            'template',
          )}
          emptyText="No reach measured"
        />
      </section>

      <section class="panel" data-testid="board-service-provider-reach">
        <h2>Service providers with the biggest reach</h2>
        <p class="muted about">
          Scanned domains behind the DNS providers supporting at least one of its templates, each
          counted once.
        </p>
        <Board
          caption="Service providers by domains reached"
          nameHeader="Service provider"
          valueHeader="Domains"
          rows={reachRows(
            topReach(rowsOf(files.serviceProviders, 'service_providers'), serviceProviderName),
            'service_provider',
          )}
          emptyText="No reach measured"
        />
      </section>
    </div>
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

  .windows {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-sm);
  }

  .windows a {
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--light-blue-gray);
    border-radius: var(--radius-lg);
    font-size: 0.85rem;
  }

  .windows a[aria-current='page'] {
    background-color: var(--primary-navy);
    border-color: var(--primary-navy);
    color: var(--bg-white);
  }
</style>
