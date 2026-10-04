<script lang="ts">
  import { formatFlag, UNKNOWN } from '../format';
  import { links, safeMailto, safeUrl } from '../links';
  import { FEATURES, type Contact, type Flag, type RegistryEntry } from '../registry/entry';

  interface Props {
    entry: RegistryEntry;
    logoUrl: string | null;
    /** The entry's file in the registry's repository, when the bundled source is known. */
    fileUrl: string | null;
    /** Set when the entry belongs to a stack of several deployments. */
    stack: { id: string; name: string } | null;
  }

  let { entry, logoUrl, fileUrl, stack }: Props = $props();
  const onboarding = $derived(entry.onboarding);

  const MODES = {
    automatic: 'Automatic: templates merged into the Templates repository are deployed',
    'on-request': 'On request',
  } as const;

  const groups = [...new Set(FEATURES.map(([, , group]) => group))];
</script>

{#snippet link(value: string | null, text?: string)}
  {@const href = safeUrl(value)}
  {#if href}
    <a class="break" {href} target="_blank" rel="nofollow noopener noreferrer">{text ?? value}</a>
  {:else}
    <span class="break">{value ?? UNKNOWN}</span>
  {/if}
{/snippet}

{#snippet contact(c: Contact)}
  {@const href =
    c.type === 'email' ? safeMailto(c.value) : c.type === 'url' ? safeUrl(c.value) : null}
  {#if href}
    <a class="break" {href} target="_blank" rel="nofollow noopener noreferrer"
      >{c.label ?? c.value}</a
    >
  {:else}
    <span class="break">{c.label ? `${c.label}: ${c.value}` : c.value}</span>
  {/if}
{/snippet}

{#snippet contacts(list: Contact[])}
  {#if list.length}
    <ul class="plain">
      {#each list as c, i (i)}<li>{@render contact(c)}</li>{/each}
    </ul>
  {:else}
    {UNKNOWN}
  {/if}
{/snippet}

{#snippet flag(value: Flag)}
  <span class="flag" data-flag={String(value)}>{formatFlag(value)}</span>
{/snippet}

<section class="panel registry" data-testid="registry">
  <h2>
    {#if stack}
      Registry entry of stack <a href={links.stack(stack.id)}>{stack.name}</a>
    {:else}
      Registry
    {/if}
  </h2>

  <div class="identity">
    {#if logoUrl}
      <img class="logo" src={logoUrl} alt={entry.name} />
    {/if}
    <div>
      <p class="name">{entry.name}</p>
      {#if entry.url}<p>{@render link(entry.url)}</p>{/if}
    </div>
  </div>

  <dl class="record">
    <dt>Documentation</dt>
    <dd>
      {#if entry.documentation.length}
        <ul class="plain">
          {#each entry.documentation as doc, i (i)}<li>
              {@render link(doc.url, doc.title)}
            </li>{/each}
        </ul>
      {:else}
        {UNKNOWN}
      {/if}
    </dd>
    <dt>Technical contact</dt>
    <dd>{@render contacts(entry.technicalContacts)}</dd>
  </dl>

  <h3>Onboarding</h3>
  <dl class="record" data-testid="registry-onboarding">
    <dt>Mode</dt>
    <dd>{onboarding.mode ? MODES[onboarding.mode] : UNKNOWN}</dd>
    <dt>Contact</dt>
    <dd>{@render contacts(onboarding.contacts)}</dd>
    <dt>Request form</dt>
    <dd>{@render link(onboarding.formUrl)}</dd>
    <dt>Process documentation</dt>
    <dd>{@render link(onboarding.documentationUrl)}</dd>
    <dt>Through a partner</dt>
    <dd>
      {@render flag(onboarding.usesPartner)}
      {#if onboarding.partner}
        ({@render link(onboarding.partner.url, onboarding.partner.name)})
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
  .identity {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .identity p {
    margin: 0;
  }

  .logo {
    max-height: 48px;
    max-width: 160px;
  }

  .name {
    font-weight: var(--font-weight-semibold);
    font-size: 1.1rem;
  }

  .record {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--spacing-xs) var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .record dt {
    font-weight: var(--font-weight-semibold);
    color: var(--text-secondary);
  }

  .record dd {
    margin: 0;
    min-width: 0;
  }

  .plain {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .break {
    overflow-wrap: anywhere;
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

  @media (max-width: 480px) {
    .record {
      grid-template-columns: 1fr;
    }

    .record dd {
      margin-bottom: var(--spacing-sm);
    }
  }
</style>
