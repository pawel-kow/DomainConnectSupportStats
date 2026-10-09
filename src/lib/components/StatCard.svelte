<script lang="ts">
  import { formatExact, isCompact } from '../format';

  interface Props {
    value: string;
    label: string;
    /** Context for the value, e.g. its denominator or the date it was measured. */
    detail?: string;
    /** The count behind `value`; shown as a tooltip when `value` is compacted. */
    exact?: number | null;
    /** Hover text of the value; replaces the exact count. */
    title?: string;
  }

  let { value, label, detail, exact, title }: Props = $props();
</script>

<div class="stat-card">
  <div class="stat-value" title={title ?? (isCompact(exact) ? formatExact(exact) : undefined)}>
    {value}
  </div>
  <div class="stat-label">{label}</div>
  {#if detail}<div class="stat-detail">{detail}</div>{/if}
</div>

<style>
  .stat-card {
    background-color: var(--bg-white);
    padding: var(--spacing-md);
    border-radius: var(--radius-lg);
    text-align: center;
    box-shadow: 0 2px 8px var(--shadow-light);
    transition:
      transform var(--transition-normal),
      box-shadow var(--transition-normal);
  }

  .stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px var(--shadow-medium);
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: var(--font-weight-bold);
    color: var(--primary-navy);
    line-height: 1.2;
    margin-bottom: var(--spacing-xs);
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: var(--font-weight-semibold);
  }

  .stat-detail {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  @media (max-width: 768px) {
    .stat-value {
      font-size: 2rem;
    }
  }

  @media (max-width: 480px) {
    .stat-value {
      font-size: 1.75rem;
    }
  }
</style>
