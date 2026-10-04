<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Manifest } from '../data/types';
  import { formatCount, formatDateTime } from '../format';
  import { NAV } from '../links';

  interface Props {
    /** Page name (file name without `.html`), to mark the current navigation entry. */
    current: string;
    /** The release's manifest once loaded; the header shows its facts on every page. */
    manifest?: Manifest | null;
    children: Snippet;
  }

  let { current, manifest = null, children }: Props = $props();
  const share = $derived(manifest?.share_import ?? null);
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
          · Domain share: import <span data-testid="share-import">{share.import_id}</span>
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
      <a href="https://stats.domainconnect.org/" target="_blank" rel="noopener"
        >Templates statistics</a
      >
      ·
      <a
        href="https://github.com/pawel-kow/DomainConnectSupportStats"
        target="_blank"
        rel="noopener">View on GitHub</a
      >
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
