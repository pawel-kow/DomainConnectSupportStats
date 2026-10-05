<script lang="ts">
  import { BEFORE_SCANS, beforeScansTitle } from '../cells';

  interface Props {
    /** The recorded timestamp the badge stands for. */
    value: string;
  }

  let { value }: Props = $props();
</script>

<span class="badge badge-muted" title={beforeScansTitle(value)}>{BEFORE_SCANS}</span>
