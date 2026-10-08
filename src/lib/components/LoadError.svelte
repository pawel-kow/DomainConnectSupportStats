<script lang="ts">
  import { ReleaseMismatchError } from '../data/load';

  interface Props {
    error: unknown;
  }

  let { error }: Props = $props();
  const updated = $derived(error instanceof ReleaseMismatchError);

  // The technical message is for diagnosis only, never for visitors.
  $effect(() => console.warn(error));
</script>

<section class="panel" role="alert" data-testid="load-error">
  {#if updated}
    <h2>The data was just updated</h2>
    <p>Reload the page.</p>
  {:else}
    <h2>Could not load the data</h2>
    <p>The data is not available at the moment. Try again later.</p>
  {/if}
</section>
