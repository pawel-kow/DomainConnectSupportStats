<script lang="ts">
  import { BEFORE_SCANS, beforeScansTitle } from '../cells';
  import { scannerStart } from '../data/config';

  const start = scannerStart();
</script>

<span class="badge badge-muted" title={start ? beforeScansTitle(start) : undefined}
  >{BEFORE_SCANS}</span
>
