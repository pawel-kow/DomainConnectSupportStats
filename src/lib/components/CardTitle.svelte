<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    name: string;
    /** Registry logo, once loaded; `alt` names whose logo it is (a stack's on a deployment). */
    logo?: Promise<{ url: string; alt: string } | null>;
    /** The small line under the name: id, stack. */
    children: Snippet;
  }

  let { name, logo = Promise.resolve(null), children }: Props = $props();
  let broken = $state(false);
</script>

<section class="panel card-title" data-testid="card-title">
  {#await logo then l}
    {#if l && !broken}
      <img
        class="logo"
        src={l.url}
        alt={l.alt}
        referrerpolicy="no-referrer"
        onerror={() => (broken = true)}
      />
    {/if}
  {/await}
  <div class="text">
    <h2>{name}</h2>
    <p class="muted small">{@render children()}</p>
  </div>
</section>

<style>
  .card-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .logo {
    max-height: 64px;
    max-width: 200px;
    flex-shrink: 0;
  }

  .text {
    min-width: 0;
  }

  h2 {
    border-bottom: none;
    padding-bottom: 0;
    margin: 0 0 var(--spacing-xs);
    font-size: 2rem;
    overflow-wrap: anywhere;
  }

  .small {
    margin: 0;
    font-size: 0.85rem;
  }

  @media (max-width: 480px) {
    .card-title {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--spacing-sm);
    }

    .logo {
      max-height: 48px;
    }

    h2 {
      font-size: 1.5rem;
    }
  }
</style>
