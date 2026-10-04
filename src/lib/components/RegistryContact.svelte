<script lang="ts">
  import { UNKNOWN } from '../format';
  import { links } from '../links';
  import type { RegistryEntry } from '../registry/entry';
  import ContactList from './ContactList.svelte';
  import ExternalLink from './ExternalLink.svelte';

  interface Props {
    entry: RegistryEntry;
    /** Set when the entry belongs to a stack of several deployments. */
    stack: { id: string; name: string } | null;
  }

  let { entry, stack }: Props = $props();
</script>

<section class="panel" data-testid="registry-contact">
  <h2>
    {#if stack}
      Contact of stack <a href={links.stack(stack.id)}>{stack.name}</a>
    {:else}
      Contact
    {/if}
  </h2>
  <dl class="record">
    <dt>Website</dt>
    <dd><ExternalLink url={entry.url} /></dd>
    <dt>Documentation</dt>
    <dd>
      {#if entry.documentation.length}
        <ul class="plain">
          {#each entry.documentation as doc, i (i)}
            <li><ExternalLink url={doc.url} text={doc.title} /></li>
          {/each}
        </ul>
      {:else}
        {UNKNOWN}
      {/if}
    </dd>
    <dt>Technical contact</dt>
    <dd><ContactList contacts={entry.technicalContacts} /></dd>
    <dt>Onboarding contact</dt>
    <dd><ContactList contacts={entry.onboarding.contacts} /></dd>
    <dt>Onboarding request form</dt>
    <dd><ExternalLink url={entry.onboarding.formUrl} /></dd>
    <dt>Onboarding process</dt>
    <dd><ExternalLink url={entry.onboarding.documentationUrl} /></dd>
  </dl>
</section>
