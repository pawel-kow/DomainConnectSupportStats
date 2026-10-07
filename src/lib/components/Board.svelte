<script lang="ts">
  import type { BoardRow } from '../leaderboards';

  interface Props {
    caption: string;
    nameHeader: string;
    valueHeader: string;
    rows: BoardRow[];
    emptyText: string;
    testid?: string;
  }

  let { caption, nameHeader, valueHeader, rows, emptyText, testid }: Props = $props();
</script>

<div class="table-wrapper">
  <table data-testid={testid}>
    <caption class="visually-hidden">{caption}</caption>
    <thead>
      <tr>
        <th scope="col" class="num rank">#</th>
        <th scope="col">{nameHeader}</th>
        <th scope="col" class="num">{valueHeader}</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.href)}
        <tr>
          <td class="num rank">{row.rank}</td>
          <td>
            <a class="name" href={row.href}>{row.name}</a>
            {#if row.detail}<div class="muted detail">{row.detail}</div>{/if}
            {#if row.stack}<div class="muted detail">
                Stack <a href={row.stack.href}>{row.stack.name}</a>
              </div>{/if}
          </td>
          <td class="num value" title={row.title}>{row.value}</td>
        </tr>
      {:else}
        <tr><td colspan="3" class="no-data">{emptyText}</td></tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .rank {
    width: 2.5rem;
  }

  .name,
  .detail {
    overflow-wrap: anywhere;
  }

  .detail {
    font-size: 0.8rem;
  }

  .value {
    white-space: nowrap;
    font-weight: var(--font-weight-semibold);
  }

  .no-data {
    padding: var(--spacing-md);
  }
</style>
