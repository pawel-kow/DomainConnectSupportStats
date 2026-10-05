<script lang="ts">
  import { BEFORE_SCANS, beforeScansTitle } from '../cells';
  import { scannerStart } from '../data/config';
</script>

<span class="badge badge-muted" title={beforeScansTitle(scannerStart())}>{BEFORE_SCANS}</span>
