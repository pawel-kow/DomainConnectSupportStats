<script lang="ts">
  interface Props {
    /** A file's `notes`, shown verbatim (never parsed) as the contract asks. */
    notes: readonly string[];
  }

  let { notes }: Props = $props();
</script>

{#if notes.length}
  <ul class="notes">
    {#each notes as note, i (i)}<li>{note}</li>{/each}
  </ul>
{/if}

<style>
  .notes {
    list-style: none;
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: var(--spacing-sm);
  }
</style>
