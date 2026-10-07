<script lang="ts">
  import { formatDate, formatExact } from '../format';
  import { NEW_SUPPORT_DAYS, type NewSupporter } from '../leaderboards';

  interface Props {
    rows: NewSupporter[];
  }

  let { rows }: Props = $props();
</script>

<div class="table-wrapper">
  <table data-testid="new-supporters">
    <caption class="visually-hidden"
      >DNS providers supporting Domain Connect for the first time, last {NEW_SUPPORT_DAYS} days</caption
    >
    <thead>
      <tr>
        <th scope="col">DNS provider</th>
        <th scope="col">First found</th>
        <th scope="col" class="num">Templates</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row.dnsProviderId)}
        <tr>
          <td>
            <a class="name" href={row.href}>{row.name}</a>
            {#if row.apiHost}<div class="muted detail">{row.apiHost}</div>{/if}
          </td>
          <td class="date">{formatDate(row.since)}</td>
          <td class="num">{formatExact(row.supportedTemplates)}</td>
        </tr>
      {:else}
        <tr>
          <td colspan="3" class="no-data"
            >No DNS provider started supporting Domain Connect in the last {NEW_SUPPORT_DAYS} days</td
          >
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .name,
  .detail {
    overflow-wrap: anywhere;
  }

  .detail {
    font-size: 0.8rem;
  }

  .date {
    white-space: nowrap;
  }

  .no-data {
    padding: var(--spacing-md);
  }
</style>
