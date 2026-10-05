<script lang="ts">
  import { FIRST_SCAN, beforeScansTitle } from '../cells';

  interface Props {
    /** The recorded timestamp the badge stands for. */
    value: string;
  }

  let { value }: Props = $props();
</script>

<span class="badge badge-muted" title={beforeScansTitle(value)}>{FIRST_SCAN}</span>
