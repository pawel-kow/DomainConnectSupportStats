<script lang="ts">
  import { UNKNOWN } from '../format';
  import { safeUrl } from '../links';

  interface Props {
    /** A URL from third-party data: a link only through `safeUrl`, else shown as text. */
    url: string | null;
    text?: string;
    mono?: boolean;
  }

  let { url, text, mono = false }: Props = $props();
  const href = $derived(safeUrl(url));
</script>

{#if href}
  <a class="break" class:mono {href} target="_blank" rel="nofollow noopener noreferrer"
    >{text ?? url}</a
  >
{:else}
  <span class="break" class:mono>{url ?? UNKNOWN}</span>
{/if}

<style>
  .break {
    overflow-wrap: anywhere;
  }
</style>
