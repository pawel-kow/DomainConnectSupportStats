<script lang="ts" generics="R extends Row">
  import { untrack, type Snippet } from 'svelte';
  import {
    cellKind,
    cellTitle,
    compareCells,
    formatCell,
    isBeforeScans,
    isNumericKind,
    isPublicKey,
    rowMatches,
  } from '../cells';
  import BeforeScansBadge from './BeforeScansBadge.svelte';
  import { scannerStart } from '../data/config';
  import type { Column, Row, Table } from '../data/types';
  import { formatExact } from '../format';
  import { clampPage, PAGE_SIZES, pageCount, pageRange, pageRows } from '../paging';

  interface Props {
    table: Table<R>;
    /** Column keys to show, in order; default: every column of the table, in its order. Internal ids are never shown. */
    keys?: string[];
    /** Per-cell override, e.g. a link or a badge. Return nothing to use the default rendering. */
    cell?: Snippet<[Column, R]>;
    /** Keys the `cell` snippet renders; other keys use the default formatting. */
    customKeys?: string[];
    /** Column keys shown at phone width; default: every column. */
    phoneKeys?: string[];
    /** Show a free-text filter over the rows. */
    searchable?: boolean;
    /** Initial search text (e.g. from the page's `?q=`). */
    query?: string;
    /** Paginate: initial rows per page, `null` for all; default: no pagination. */
    pageSize?: number | null;
    /** Text shown when the table has no rows. */
    emptyText?: string;
    caption?: string;
  }

  let {
    table,
    keys,
    cell,
    customKeys = [],
    phoneKeys,
    searchable = false,
    query = $bindable(''),
    pageSize,
    emptyText = 'No data available',
    caption,
  }: Props = $props();

  const columns = $derived(
    (keys ? keys.flatMap((k) => table.columns.filter((c) => c.key === k)) : table.columns).filter(
      (c) => isPublicKey(c.key),
    ),
  );

  const start = scannerStart();

  // `null` sort key = the export's own order, which is the meaningful default (by domains/reach).
  let sortKey = $state<string | null>(null);
  let sortDirection = $state<1 | -1>(1);

  const filtered = $derived(table.rows.filter((r) => rowMatches(r, query)));
  const rows = $derived(
    sortKey === null
      ? filtered
      : [...filtered].sort((a, b) =>
          compareCells(a[sortKey!] ?? null, b[sortKey!] ?? null, sortDirection),
        ),
  );

  const paged = $derived(pageSize !== undefined);
  // The viewer changes the size from here on; `pageSize` is only the initial one.
  let size = $state(untrack(() => pageSize ?? null));
  let page = $state(1);
  // Back to the first page whenever the rows or their order change.
  $effect(() => {
    void [table, query, sortKey, sortDirection, size];
    page = 1;
  });
  const shownPage = $derived(clampPage(page, rows.length, size));
  const shownRows = $derived(paged ? pageRows(rows, shownPage, size) : rows);
  const range = $derived(pageRange(rows.length, shownPage, size));
  const pages = $derived(pageCount(rows.length, size));
  const smallestPage = PAGE_SIZES[0] ?? 20;

  function sizeLabel(value: number | null): string {
    return value === null ? 'all' : String(value);
  }

  function setSize(value: string) {
    size = value === 'all' ? null : Number(value);
  }

  function sampleValue(key: string) {
    return table.rows.find((r) => r[key] !== null && r[key] !== undefined)?.[key] ?? null;
  }

  /** Alignment is per column (from its first known value), so `null` cells line up too. */
  function isNumeric(key: string): boolean {
    return isNumericKind(cellKind(key, sampleValue(key)));
  }

  function isWideOnly(key: string): boolean {
    return phoneKeys !== undefined && !phoneKeys.includes(key);
  }

  function isTimestamp(key: string): boolean {
    return cellKind(key, sampleValue(key)) === 'timestamp';
  }

  /** Cycle: ascending (descending for numbers, the useful first look) → reversed → export order. */
  function toggleSort(key: string) {
    const firstDirection: 1 | -1 = isNumeric(key) ? -1 : 1;
    if (sortKey !== key) {
      sortKey = key;
      sortDirection = firstDirection;
    } else if (sortDirection === firstDirection) {
      sortDirection = firstDirection === 1 ? -1 : 1;
    } else {
      sortKey = null;
    }
  }

  function ariaSort(key: string): 'ascending' | 'descending' | 'none' {
    if (sortKey !== key) return 'none';
    return sortDirection === 1 ? 'ascending' : 'descending';
  }
</script>

{#if searchable}
  <div class="table-tools">
    <label>
      <span class="visually-hidden">Filter {table.title}</span>
      <input type="search" placeholder="Filter…" bind:value={query} />
    </label>
    <span class="muted" data-testid="row-count"
      >{formatExact(rows.length)} of {formatExact(table.rows.length)}</span
    >
  </div>
{/if}

<div class="table-wrapper">
  <table>
    {#if caption}<caption class="visually-hidden">{caption}</caption>{/if}
    <thead>
      <tr>
        {#each columns as column (column.key)}
          <th
            class:num={isNumeric(column.key)}
            class:wide-only={isWideOnly(column.key)}
            aria-sort={ariaSort(column.key)}
            scope="col"
          >
            <button type="button" onclick={() => toggleSort(column.key)}>
              {column.header}
              <span aria-hidden="true" class="sort-mark"
                >{sortKey === column.key ? (sortDirection === 1 ? '▲' : '▼') : ''}</span
              >
            </button>
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each shownRows as row, i (i)}
        <tr>
          {#each columns as column (column.key)}
            {@const value = row[column.key] ?? null}
            {@const custom = cell !== undefined && customKeys.includes(column.key)}
            {@const badge = !custom && isBeforeScans(column.key, value, start)}
            <td
              title={custom || badge ? undefined : cellTitle(column.key, value)}
              class:num={isNumeric(column.key)}
              class:nowrap={isTimestamp(column.key)}
              class:wide-only={isWideOnly(column.key)}
            >
              {#if custom}
                {@render cell!(column, row)}
              {:else if badge}
                <BeforeScansBadge value={String(value)} />
              {:else}
                {formatCell(column.key, value)}
              {/if}
            </td>
          {/each}
        </tr>
      {:else}
        <tr><td colspan={columns.length} class="no-data">{emptyText}</td></tr>
      {/each}
    </tbody>
    {#if table.footer}
      <tfoot>
        <tr>
          {#each columns as column (column.key)}
            {@const value = table.footer[column.key] ?? null}
            <td
              title={cellTitle(column.key, value)}
              class:num={isNumeric(column.key)}
              class:nowrap={isTimestamp(column.key)}
              class:wide-only={isWideOnly(column.key)}
            >
              {value === null ? '' : formatCell(column.key, value)}
            </td>
          {/each}
        </tr>
      </tfoot>
    {/if}
  </table>
</div>

{#if paged && rows.length > smallestPage}
  <nav class="pager" aria-label="Pages of {caption ?? table.title}">
    <span class="muted" data-testid="page-range"
      >{formatExact(range.first)}–{formatExact(range.last)} of {formatExact(rows.length)}</span
    >
    <button type="button" disabled={shownPage <= 1} onclick={() => (page = shownPage - 1)}
      >‹ Previous</button
    >
    <span>Page {shownPage} of {pages}</span>
    <button type="button" disabled={shownPage >= pages} onclick={() => (page = shownPage + 1)}
      >Next ›</button
    >
    <label>
      Rows per page
      <select value={sizeLabel(size)} onchange={(e) => setSize(e.currentTarget.value)}>
        {#each PAGE_SIZES as option (sizeLabel(option))}
          <option value={sizeLabel(option)}>{option === null ? 'All' : option}</option>
        {/each}
      </select>
    </label>
  </nav>
{/if}

<style>
  .table-tools {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }

  input[type='search'] {
    font: inherit;
    padding: 0.4rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    min-width: 16rem;
  }

  .pager {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--spacing-xs) var(--spacing-sm);
    margin-top: var(--spacing-sm);
    font-size: 0.875rem;
  }

  .pager button,
  .pager select {
    font: inherit;
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background-color: var(--bg-white);
    color: var(--secondary-navy);
    cursor: pointer;
  }

  .pager button:disabled {
    color: var(--text-secondary);
    cursor: default;
  }

  th button {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    gap: 0.25rem;
    align-items: center;
  }

  .nowrap {
    white-space: nowrap;
  }

  .sort-mark {
    font-size: 0.6rem;
    min-width: 0.6rem;
  }

  @media (max-width: 480px) {
    input[type='search'] {
      min-width: 0;
      width: 100%;
    }
  }
</style>
