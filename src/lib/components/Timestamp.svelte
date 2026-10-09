<script lang="ts">
  import { formatDate, formatDateTime, parseTimestamp } from '../format';

  interface Props {
    /** An export timestamp; `null` is unknown. */
    value: string | null | undefined;
  }

  let { value }: Props = $props();
  const at = $derived(parseTimestamp(value));
</script>

{#if at}<time datetime={at.toISOString()} title={formatDateTime(at)}>{formatDate(at)}</time
  >{:else}{formatDate(at)}{/if}
