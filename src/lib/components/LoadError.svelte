<script lang="ts">
  interface Props {
    error: unknown;
  }

  let { error }: Props = $props();
  const message = $derived(error instanceof Error ? error.message : String(error));
</script>

<section class="panel" role="alert" data-testid="load-error">
  <h2>Could not load the data</h2>
  <p class="mono">{message}</p>
  <p class="muted">
    Reload the page; if the data was just updated, the new release is now in place.
  </p>
</section>
