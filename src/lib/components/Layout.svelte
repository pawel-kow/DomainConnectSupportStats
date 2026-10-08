<script lang="ts">
  import type { Snippet } from 'svelte';
  import { shareBaseUrl } from '../data/config';
  import { defaultClient, type ExportClient } from '../data/load';
  import { findTable } from '../data/tables';
  import type { Manifest } from '../data/types';
  import { formatCount, formatDateTime } from '../format';
  import { links, NAV } from '../links';
  import { defaultRegistryClient, type RegistryClient } from '../registry/load';
  import { absoluteOgImage } from '../share';

  interface Props {
    /** Page name (file name without `.html`), to mark the current navigation entry. */
    current: string;
    /** The release's manifest once loaded; the header shows its facts on every page. */
    manifest?: Manifest | null;
    /** Reads the domain-share import's completion time from `overview.json`. */
    client?: ExportClient;
    /** Reads the repository and commit of the bundled DNS provider registry for the footer. */
    registry?: RegistryClient;
    children: Snippet;
  }

  let {
    current,
    manifest = null,
    client = defaultClient(),
    registry = defaultRegistryClient(),
    children,
  }: Props = $props();
  const registrySource = $derived(registry.source());
  absoluteOgImage(document, location.href, shareBaseUrl());
  const share = $derived(manifest?.share_import ?? null);

  /** The import's `completed_at` from the overview's `adoption` table; null when unknown. */
  const completedAt = $derived(
    share
      ? client
          .file('overview')
          .then((f) => {
            const row = findTable(f, 'adoption')?.rows.find((r) => r.import_id === share.import_id);
            return typeof row?.completed_at === 'string' ? row.completed_at : null;
          })
          .catch(() => null)
      : Promise.resolve(null),
  );
  const version = `v${__APP_VERSION__}`;
</script>

<header class="site-header">
  <div class="container">
    <div class="header-content">
      <a href="https://www.domainconnect.org/">
        <img src="./assets/DomainConnectBlackSmall.png" alt="Domain Connect" class="logo" />
      </a>
      <h1>Domain Connect Support</h1>
    </div>
    <p class="subtitle">Statistics Dashboard</p>
    <nav aria-label="Main">
      <ul>
        {#each NAV as item (item.page)}
          <li>
            <a href={item.href} aria-current={item.page === current ? 'page' : undefined}>
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </div>
</header>

<main class="container">
  <section class="last-updated" aria-label="Data release">
    {#if manifest}
      <p>
        Data generated: <span data-testid="generated-at"
          >{formatDateTime(manifest.generated_at)}</span
        >
        {#if share}
          · Domain share: <span data-testid="share-import"
            >{#await completedAt}latest scan{:then at}{at
                ? `scan completed ${formatDateTime(at)}`
                : 'latest scan'}{/await}</span
          >
          ({share.status}, {share.source}), {formatCount(share.scanned_domains)} domains scanned
        {:else}
          · <span data-testid="share-import">No domain-share import</span>: domain and reach figures
          are unknown
        {/if}
      </p>
    {:else}
      <p>Loading data release…</p>
    {/if}
  </section>

  {@render children()}
</main>

<footer class="site-footer">
  <div class="container">
    <p>
      &copy; {new Date().getFullYear()} Domain Connect. Visit
      <a href="https://www.domainconnect.org/" target="_blank" rel="noopener">domainconnect.org</a>
    </p>
    <p>
      <a href={links.methodology()} data-testid="methodology-link">Methodology</a>
      ·
      <a href="https://stats.domainconnect.org/" target="_blank" rel="noopener"
        >Templates statistics</a
      >
      ·
      <a
        href="https://github.com/pawel-kow/DomainConnectSupportStats"
        target="_blank"
        rel="noopener">View on GitHub</a
      >
      ·
      <a
        href="https://github.com/pawel-kow/DomainConnectSupportStats/releases/tag/{version}"
        target="_blank"
        rel="noopener">{version}</a
      >
      {#await registrySource then source}
        {#if source}
          ·
          <a
            href="https://github.com/{source.repository}/tree/{source.commit}"
            target="_blank"
            rel="noopener"
            data-testid="registry-commit">Registry {source.commit.slice(0, 7)}</a
          >
        {/if}
      {/await}
    </p>
  </div>
</footer>

<style>
  .site-header {
    background-color: var(--bg-white);
    padding: var(--spacing-lg) 0 0;
    box-shadow: 0 2px 8px var(--shadow-light);
    margin-bottom: var(--spacing-xl);
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-xs);
  }

  .logo {
    height: 40px;
    width: auto;
  }

  h1 {
    margin-bottom: 0;
    color: var(--primary-navy);
  }

  .subtitle {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin-left: 56px;
  }

  nav ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs) var(--spacing-md);
    list-style: none;
    margin-top: var(--spacing-md);
  }

  nav a {
    display: inline-block;
    padding: var(--spacing-xs) 0;
    color: var(--secondary-navy);
    font-weight: var(--font-weight-semibold);
    border-bottom: 3px solid transparent;
  }

  nav a:hover {
    color: var(--accent-cyan);
    text-decoration: none;
  }

  nav a[aria-current='page'] {
    border-bottom-color: var(--accent-cyan);
    color: var(--primary-navy);
  }

  .last-updated {
    background-color: var(--bg-white);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-lg);
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.875rem;
    box-shadow: 0 2px 4px var(--shadow-light);
  }

  .last-updated span {
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }

  .site-footer {
    background-color: var(--primary-navy);
    color: var(--bg-white);
    padding: var(--spacing-lg) 0;
    margin-top: var(--spacing-xl);
    text-align: center;
  }

  .site-footer a {
    color: var(--accent-cyan);
  }

  .site-footer a:hover {
    color: var(--light-blue-gray);
  }

  .site-footer p {
    margin-bottom: var(--spacing-xs);
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      text-align: center;
    }

    .subtitle {
      margin-left: 0;
      text-align: center;
    }

    nav ul {
      justify-content: center;
    }
  }

  @media (max-width: 480px) {
    .site-header {
      padding-top: var(--spacing-md);
    }

    .logo {
      height: 32px;
    }
  }
</style>
