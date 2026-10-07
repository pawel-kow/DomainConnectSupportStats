<script lang="ts">
  import { onMount, tick, type Snippet } from 'svelte';
  import ShareMenu from './ShareMenu.svelte';

  interface Props {
    /** Stable English slug, unique per page; never derived from the title. */
    id: string;
    title: string;
    /** The entity name on cards, the page name on lists (post text). */
    context?: string | null;
    /** False while the panel's own data loads: an anchored link scrolls once it is true. */
    ready?: boolean;
    testid?: string;
    children: Snippet;
  }

  let { id, title, context = null, ready = true, testid, children }: Props = $props();

  const HIGHLIGHT_MS = 2000;
  let section: HTMLElement;
  let highlighted = $state(false);
  let revealed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function linked(): boolean {
    try {
      return decodeURIComponent(location.hash.slice(1)) === id;
    } catch {
      return false;
    }
  }

  function reveal() {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    section.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    highlighted = false;
    clearTimeout(timer);
    void tick().then(() => {
      highlighted = true;
      timer = setTimeout(() => (highlighted = false), HIGHLIGHT_MS);
    });
  }

  // The browser scrolled before the panel existed: scroll once its data is in place.
  $effect(() => {
    if (!ready || revealed) return;
    revealed = true;
    if (linked()) void tick().then(reveal);
  });

  onMount(() => {
    const onHash = () => linked() && reveal();
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      clearTimeout(timer);
    };
  });
</script>

<section class="panel" class:highlighted {id} data-testid={testid} bind:this={section}>
  <div class="title-row">
    <h2>{title}</h2>
    <a class="anchor" href="#{id}" aria-label="Link to this panel: {title}">#</a>
    <ShareMenu {title} {context} anchor={id} />
  </div>
  {@render children()}
</section>

<style>
  .title-row {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-xs);
    border-bottom: 2px solid var(--light-blue-gray);
    margin-bottom: var(--spacing-md);
  }

  .title-row h2 {
    min-width: 0;
    margin: 0;
    border-bottom: none;
    overflow-wrap: anywhere;
  }

  .anchor {
    margin-right: auto;
    font-size: 1.75rem;
    line-height: 1.3;
    color: var(--text-secondary);
    font-weight: var(--font-weight-normal);
    text-decoration: none;
    opacity: 0;
    transition: opacity var(--transition-fast);
  }

  .title-row:hover .anchor,
  .anchor:focus-visible {
    opacity: 1;
  }

  @media (max-width: 480px) {
    .anchor {
      font-size: 1.25rem;
    }
  }

  .highlighted {
    animation: highlight 2s ease-out;
  }

  @keyframes highlight {
    from {
      box-shadow: 0 0 0 4px var(--accent-cyan);
    }
    to {
      box-shadow: 0 2px 8px var(--shadow-light);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .highlighted {
      animation: none;
      box-shadow: 0 0 0 3px var(--accent-cyan);
    }
  }
</style>
