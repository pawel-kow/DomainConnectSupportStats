<script lang="ts">
  import { formatFlag, UNKNOWN } from '../format';
  import { links } from '../links';
  import { FEATURES, type Flag, type RegistryEntry } from '../registry/entry';
  import ExternalLink from './ExternalLink.svelte';

  interface Props {
    entry: RegistryEntry;
    /** The entry's file in the registry's repository, when the bundled source is known. */
    fileUrl: string | null;
    /** Set when the entry belongs to a stack of several deployments. */
    stack: { id: string; name: string } | null;
  }

  let { entry, fileUrl, stack }: Props = $props();
  const onboarding = $derived(entry.onboarding);

  const MODES = {
    automatic: 'Automatic: templates merged into the Templates repository are deployed',
    'on-request': 'On request',
  } as const;

  const groups = [...new Set(FEATURES.map(([, , group]) => group))];
</script>

{#snippet flag(value: Flag)}
  <span class="flag">{formatFlag(value)}</span>
{/snippet}

<section class="panel" data-testid="registry">
  <h2>
    {#if stack}
      Registry entry of stack <a href={links.stack(stack.id)}>{stack.name}</a>
    {:else}
      Registry
    {/if}
  </h2>

  <h3>Onboarding</h3>
  <dl class="record" data-testid="registry-onboarding">
    <dt>Mode</dt>
    <dd>{onboarding.mode ? MODES[onboarding.mode] : UNKNOWN}</dd>
    <dt>Through a partner</dt>
    <dd>
      {@render flag(onboarding.usesPartner)}
      {#if onboarding.partner}
        (<ExternalLink url={onboarding.partner.url} text={onboarding.partner.name} />)
      {/if}
    </dd>
    <dt>Charged</dt>
    <dd>{@render flag(onboarding.cost)}</dd>
    <dt>Signed templates only</dt>
    <dd>{@render flag(onboarding.requirements.signedTemplatesOnly)}</dd>
    <dt>warnPhishing rejected</dt>
    <dd>{@render flag(onboarding.requirements.warnPhishingRejected)}</dd>
    <dt>Signing key published</dt>
    <dd>{@render flag(onboarding.requirements.signingKeyPublished)}</dd>
    {#if onboarding.notes}
      <dt>Notes</dt>
      <dd class="verbatim">{onboarding.notes}</dd>
    {/if}
  </dl>

  <h3>Features</h3>
  <div class="table-wrapper">
    <table data-testid="registry-features">
      <caption class="visually-hidden">Features</caption>
      <tbody>
        {#each groups as group (group)}
          <tr class="group"><th colspan="2" scope="colgroup">{group}</th></tr>
          {#each FEATURES.filter(([, , g]) => g === group) as [key, label] (key)}
            <tr>
              <th scope="row">{label}</th>
              <td>{@render flag(entry.features[key])}</td>
            </tr>
          {/each}
        {/each}
      </tbody>
    </table>
  </div>

  {#if entry.notes}
    <h3>Notes</h3>
    <p class="verbatim" data-testid="registry-notes">{entry.notes}</p>
  {/if}

  {#if fileUrl}
    <p class="muted source">
      <a href={fileUrl} target="_blank" rel="noopener">Entry in the registry repository</a>
    </p>
  {/if}
</section>

<style>
  h3 {
    margin-top: var(--spacing-md);
  }

  .verbatim {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  table th[scope='row'] {
    font-weight: normal;
    text-align: left;
  }

  tr.group th {
    text-align: left;
    color: var(--text-secondary);
    padding-top: var(--spacing-sm);
  }

  .source {
    margin: var(--spacing-md) 0 0;
  }
</style>
