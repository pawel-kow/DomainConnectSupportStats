<script lang="ts">
  import Layout from '../lib/components/Layout.svelte';
  import LoadError from '../lib/components/LoadError.svelte';
  import { defaultClient } from '../lib/data/load';
  import type { Manifest } from '../lib/data/types';
  import { links } from '../lib/links';

  interface Props {
    /** Page name, file name without `.html`. */
    page: string;
    title: string;
  }

  let { page, title }: Props = $props();

  let manifest = $state<Manifest | null>(null);
  const loading = defaultClient()
    .manifest()
    .then((m) => (manifest = m));
</script>

<Layout current={page} {manifest}>
  {#await loading then}
    <section class="panel" data-testid="placeholder">
      <h2>{title}</h2>
      <p>This page is not built yet.</p>
      <p><a href={links.overview()}>← Back to the overview</a></p>
    </section>
  {:catch error}
    <LoadError {error} />
  {/await}
</Layout>
