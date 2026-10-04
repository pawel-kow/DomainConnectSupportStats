<script lang="ts">
  interface Props {
    /** What was looked for, e.g. "DNS provider 42". */
    what: string;
    backHref: string;
    backLabel: string;
  }

  let { what, backHref, backLabel }: Props = $props();
</script>

<section class="panel not-found" data-testid="not-found">
  <h2>Not found</h2>
  <p>{what} is not in this data release.</p>
  <p><a href={backHref}>← Back to {backLabel}</a></p>
</section>
