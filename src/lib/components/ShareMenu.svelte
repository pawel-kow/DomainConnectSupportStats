<script lang="ts">
  import { tick } from 'svelte';
  import { shareBaseUrl } from '../data/config';
  import {
    blueskyUrl,
    isApplePlatform,
    linkedinUrl,
    loadInstance,
    mastodonUrl,
    parseInstance,
    postText,
    saveInstance,
    sharedUrl,
  } from '../share';
  import { BLUESKY, LINKEDIN, MASTODON, type BrandIcon } from '../share-icons';

  interface Props {
    /** The panel title. */
    title: string;
    /** The entity name on cards, the page name on lists. */
    context?: string | null;
    /** The panel's anchor id. */
    anchor: string;
  }

  let { title, context = null, anchor }: Props = $props();

  const STATUS_MS = 2000;
  const id = $props.id();
  const apple = typeof navigator !== 'undefined' && isApplePlatform(navigator);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  let open = $state(false);
  let asking = $state(false);
  let instance = $state('');
  let input = $state('');
  let invalid = $state(false);
  let status = $state('');
  let url = $state('');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let root: HTMLElement;
  let button: HTMLButtonElement;
  let popup = $state<HTMLElement>();
  let field = $state<HTMLInputElement>();
  const text = $derived(postText(title, context));

  /** The menu's rows; a row's secondary item (Mastodon instance) is reached with ArrowRight. */
  function items(): HTMLElement[] {
    return [
      ...(popup?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([data-secondary])') ?? []),
    ];
  }

  async function show() {
    url = sharedUrl(location.href, anchor, shareBaseUrl());
    instance = loadInstance();
    asking = false;
    open = true;
    await tick();
    items()[0]?.focus();
  }

  function close(refocus = true) {
    open = false;
    asking = false;
    invalid = false;
    if (refocus) button.focus();
  }

  function onMenuKey(e: KeyboardEvent) {
    const all = items();
    const active = document.activeElement as HTMLElement | null;
    const secondary = active?.hasAttribute('data-secondary') ?? false;
    const row = secondary ? (active!.previousElementSibling as HTMLElement) : active;
    const at = all.indexOf(row!);
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = (at + 1) % all.length;
    else if (e.key === 'ArrowUp') next = (at - 1 + all.length) % all.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = all.length - 1;
    else if (e.key === 'ArrowRight' && !secondary) {
      const side = active?.nextElementSibling;
      if (side instanceof HTMLElement && side.hasAttribute('data-secondary')) side.focus();
    } else if (e.key === 'ArrowLeft' && secondary) row?.focus();
    else if (e.key === 'Escape') close();
    else return;
    e.preventDefault();
    if (next !== null) all[next]?.focus();
  }

  function onFormKey(e: KeyboardEvent) {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    close();
  }

  async function askInstance() {
    input = instance;
    invalid = false;
    asking = true;
    await tick();
    field?.focus();
  }

  function shareToMastodon(e: SubmitEvent) {
    e.preventDefault();
    const host = parseInstance(input);
    if (!host) {
      invalid = true;
      field?.focus();
      return;
    }
    saveInstance(host);
    instance = host;
    window.open(mastodonUrl(host, text, url), '_blank', 'noopener,noreferrer');
    close();
  }

  function say(message: string) {
    status = message;
    clearTimeout(timer);
    timer = setTimeout(() => (status = ''), STATUS_MS);
  }

  async function copy() {
    close();
    try {
      await navigator.clipboard.writeText(url);
      say('Link copied');
    } catch {
      say('Link not copied');
    }
  }

  function more() {
    close();
    navigator.share({ title: text, text, url }).catch(() => undefined);
  }

  function onOutside(e: PointerEvent) {
    if (open && !root.contains(e.target as Node)) close(false);
  }

  function onFocusOut(e: FocusEvent) {
    if (open && e.relatedTarget instanceof Node && !root.contains(e.relatedTarget)) close(false);
  }
</script>

{#snippet brand(icon: BrandIcon)}
  <svg viewBox="0 0 24 24" aria-hidden="true" class="icon" style:fill={icon.color}>
    <path d={icon.path} />
  </svg>
{/snippet}

{#snippet shareIcon(cls: string)}
  {#if apple}
    <svg viewBox="0 0 24 24" aria-hidden="true" class={cls} data-icon="apple">
      <path d="M12 3v12M8 7l4-4 4 4M7 11H5v10h14V11h-2" />
    </svg>
  {:else}
    <svg viewBox="0 0 24 24" aria-hidden="true" class={cls} data-icon="nodes">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" />
    </svg>
  {/if}
{/snippet}

<svelte:window onpointerdown={onOutside} />

<div class="share" bind:this={root} onfocusout={onFocusOut}>
  <span class="status" role="status">{status}</span>
  <button
    bind:this={button}
    type="button"
    class="toggle"
    aria-label="Share: {title}"
    aria-haspopup="menu"
    aria-expanded={open}
    aria-controls={open ? `${id}-popup` : undefined}
    onclick={() => (open ? close() : show())}
  >
    {@render shareIcon('line')}
  </button>

  {#if open}
    <div id="{id}-popup" class="popup" bind:this={popup}>
      {#if asking}
        <form aria-label="Share to Mastodon" novalidate onsubmit={shareToMastodon}>
          <label for="{id}-instance">Mastodon instance</label>
          <input
            id="{id}-instance"
            bind:this={field}
            bind:value={input}
            type="text"
            inputmode="url"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            placeholder="mastodon.social"
            onkeydown={onFormKey}
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : undefined}
          />
          {#if invalid}
            <p id="{id}-error" class="error">Enter a host name such as mastodon.social</p>
          {/if}
          <div class="actions">
            <button type="submit">Share</button>
            <button type="button" onclick={() => close()}>Cancel</button>
          </div>
        </form>
      {:else}
        <ul role="menu" aria-label="Share: {title}" onkeydown={onMenuKey}>
          <li role="none" class="row">
            <a
              role="menuitem"
              tabindex="-1"
              href={blueskyUrl(text, url)}
              target="_blank"
              rel="noopener noreferrer"
              onclick={() => close()}
            >
              {@render brand(BLUESKY)}Bluesky
            </a>
          </li>
          <li role="none" class="row">
            <a
              role="menuitem"
              tabindex="-1"
              href={mastodonUrl(instance, text, url)}
              target="_blank"
              rel="noopener noreferrer"
              onclick={() => close()}
            >
              {@render brand(MASTODON)}<span
                >Mastodon <span class="instance muted">({instance})</span></span
              >
            </a>
            <button
              role="menuitem"
              tabindex="-1"
              type="button"
              class="edit"
              data-secondary
              aria-label="Change Mastodon instance ({instance})"
              title="Change Mastodon instance"
              onclick={askInstance}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" class="line">
                <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
              </svg>
            </button>
          </li>
          <li role="none" class="row">
            <a
              role="menuitem"
              tabindex="-1"
              href={linkedinUrl(text, url)}
              target="_blank"
              rel="noopener noreferrer"
              onclick={() => close()}
            >
              {@render brand(LINKEDIN)}LinkedIn
            </a>
          </li>
          <li role="none" class="row">
            <button role="menuitem" tabindex="-1" type="button" onclick={copy}>
              <svg viewBox="0 0 24 24" aria-hidden="true" class="line icon">
                <path
                  d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"
                />
              </svg>Copy link
            </button>
          </li>
          {#if canShare}
            <li role="none" class="row">
              <button role="menuitem" tabindex="-1" type="button" onclick={more}>
                {@render shareIcon('line icon')}More…
              </button>
            </li>
          {/if}
        </ul>
      {/if}
    </div>
  {/if}
</div>

<style>
  .share {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .status {
    font-size: 0.8rem;
    color: var(--text-secondary);
    white-space: nowrap;
  }

  .toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--medium-teal);
    cursor: pointer;
    transition: background-color var(--transition-fast);
  }

  .toggle:hover,
  .toggle[aria-expanded='true'] {
    background-color: var(--bg-light-gray);
    border-color: var(--border-color);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .line {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .icon {
    width: 1.1rem;
    height: 1.1rem;
  }

  .line.icon {
    color: var(--medium-teal);
  }

  .popup {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 10;
    min-width: 14rem;
    max-width: calc(100vw - 2 * var(--spacing-sm));
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 16px var(--shadow-medium);
    font-size: 0.95rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: var(--spacing-xs) 0;
  }

  .row {
    display: flex;
  }

  [role='menuitem'] {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex: 1;
    min-width: 0;
    padding: var(--spacing-xs) var(--spacing-sm);
    border: none;
    background: none;
    font: inherit;
    text-align: left;
    color: var(--text-primary);
    text-decoration: none;
    cursor: pointer;
    overflow-wrap: anywhere;
  }

  [role='menuitem']:hover,
  [role='menuitem']:focus {
    background-color: var(--bg-light-gray);
    outline: none;
  }

  [role='menuitem']:focus-visible {
    outline: 2px solid var(--accent-cyan);
    outline-offset: -2px;
  }

  .instance {
    display: block;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  [role='menuitem'].edit {
    flex: 0 0 auto;
    padding: var(--spacing-xs) 0.75rem;
    color: var(--text-secondary);
  }

  .edit svg {
    width: 1rem;
    height: 1rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm);
  }

  label {
    font-weight: var(--font-weight-semibold);
    font-size: 0.85rem;
  }

  input {
    font: inherit;
    padding: 0.4rem 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
  }

  input[aria-invalid='true'] {
    border-color: var(--status-error);
  }

  .error {
    margin: 0;
    font-size: 0.8rem;
    color: var(--status-error);
  }

  .actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .actions button {
    font: inherit;
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--medium-teal);
    border-radius: var(--radius-sm);
    background: var(--bg-white);
    color: var(--medium-teal);
    cursor: pointer;
  }

  .actions button[type='submit'] {
    background: var(--medium-teal);
    color: var(--bg-white);
  }
</style>
