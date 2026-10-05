// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import DataTable from '../../src/lib/components/DataTable.svelte';
import type { Table } from '../../src/lib/data/types';
import { exampleJson } from '../fixtures';

const stacks = () => exampleJson('stacks.json').tables.stacks as Table;

function bodyColumn(index: number): string[] {
  const rows = screen.getAllByRole('row').slice(1);
  return rows.map((r) => within(r).getAllByRole('cell')[index]!.textContent!.trim());
}

describe('DataTable', () => {
  it('renders the headers the file carries and the rows in export order', () => {
    render(DataTable, { table: stacks() });
    expect(screen.getByRole('columnheader', { name: /STACK/ })).toBeInTheDocument();
    expect(bodyColumn(0)).toEqual(['Cloudflare', 'IONOS', 'Plesk', 'Quiet Host']);
  });

  it('never shows internal id columns, also when asked for', () => {
    const table = exampleJson('overview.json').tables.ecosystem as Table;
    render(DataTable, { table, keys: ['sweep_id', 'started_at'] });
    expect(screen.queryByRole('columnheader', { name: /SWEEP/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(1);
  });

  it('formats percentages and counts', () => {
    render(DataTable, { table: stacks(), keys: ['name', 'domains', 'domains_pct'] });
    expect(bodyColumn(1)[0]).toBe('4,000');
    expect(bodyColumn(2)[0]).toBe('33.3%');
  });

  it('sorts on header click, numbers descending first, nulls last, and back to export order', async () => {
    const table = stacks();
    table.rows[1]!.domains = null;
    render(DataTable, { table, keys: ['name', 'domains'] });
    const header = screen.getByRole('button', { name: /DOMAINS/ });
    await fireEvent.click(header);
    expect(bodyColumn(0)).toEqual(['Cloudflare', 'Plesk', 'Quiet Host', 'IONOS']);
    await fireEvent.click(header);
    expect(bodyColumn(0)).toEqual(['Quiet Host', 'Plesk', 'Cloudflare', 'IONOS']);
    await fireEvent.click(header);
    expect(bodyColumn(0)).toEqual(['Cloudflare', 'IONOS', 'Plesk', 'Quiet Host']);
  });

  it('compacts big counts with the exact count as tooltip, and sorts on the raw value', async () => {
    const table = stacks();
    const big = [38531012, 9999, 12345, 1234567];
    table.rows.forEach((row, i) => (row.domains = big[i]!));
    render(DataTable, { table, keys: ['name', 'domains'] });
    expect(bodyColumn(1)).toEqual(['38.5M', '9,999', '12.3K', '1.2M']);
    const cell = within(screen.getAllByRole('row')[1]!).getAllByRole('cell')[1]!;
    expect(cell).toHaveAttribute('title', '38,531,012');
    expect(within(screen.getAllByRole('row')[2]!).getAllByRole('cell')[1]!).not.toHaveAttribute(
      'title',
    );
    await fireEvent.click(screen.getByRole('button', { name: /DOMAINS/ }));
    expect(bodyColumn(1)).toEqual(['38.5M', '1.2M', '12.3K', '9,999']);
  });

  it('marks the columns outside phoneKeys as wide-screen only', () => {
    render(DataTable, {
      table: stacks(),
      keys: ['name', 'deployments', 'domains'],
      phoneKeys: ['name', 'domains'],
    });
    const wideOnly = (cells: HTMLElement[]) => cells.map((c) => c.classList.contains('wide-only'));
    expect(wideOnly(screen.getAllByRole('columnheader'))).toEqual([false, true, false]);
    expect(wideOnly(within(screen.getAllByRole('row')[1]!).getAllByRole('cell'))).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('shows every column on phones without phoneKeys', () => {
    render(DataTable, { table: stacks(), keys: ['name', 'domains'] });
    expect(document.querySelectorAll('.wide-only')).toHaveLength(0);
  });

  it('filters rows by free text', async () => {
    render(DataTable, { table: stacks(), searchable: true });
    await fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'plesk' } });
    expect(bodyColumn(0)).toEqual(['Plesk']);
    expect(screen.getByTestId('row-count')).toHaveTextContent('1 of 4');
  });

  it('shows the empty text for a table without rows', () => {
    render(DataTable, { table: { ...stacks(), rows: [] }, emptyText: 'Nothing here' });
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders the footer row, leaving null cells empty', () => {
    const card = exampleJson('templates/mail.acme.example/mail.json');
    const supporters = Object.entries(card.tables).find(([id]) => id.endsWith('/supporters'))![1];
    const { container } = render(DataTable, { table: supporters });
    const footer = container.querySelector('tfoot tr')!;
    expect(footer.textContent).toContain('TOTAL');
  });

  it('escapes third-party text instead of rendering it as HTML', () => {
    const table = stacks();
    table.rows[0]!.name = '<img src=x onerror=alert(1)>';
    const { container } = render(DataTable, { table });
    expect(container.querySelector('tbody img')).toBeNull();
    expect(bodyColumn(0)[0]).toBe('<img src=x onerror=alert(1)>');
  });
});

/** The example's stacks repeated to 45 rows, named `Stack 1` … `Stack 45` in export order. */
function manyStacks(): Table {
  const table = stacks();
  const rows = Array.from({ length: 45 }, (_, i) => ({
    ...table.rows[i % table.rows.length]!,
    name: `Stack ${i + 1}`,
  }));
  return { ...table, rows };
}

describe('DataTable pagination', () => {
  it('shows the first 20 rows and the range', () => {
    render(DataTable, { table: manyStacks(), keys: ['name'], pageSize: 20 });
    expect(bodyColumn(0)).toHaveLength(20);
    expect(bodyColumn(0)[0]).toBe('Stack 1');
    expect(screen.getByTestId('page-range')).toHaveTextContent('1–20 of 45');
  });

  it('pages forward and back', async () => {
    render(DataTable, { table: manyStacks(), keys: ['name'], pageSize: 20 });
    const prev = screen.getByRole('button', { name: /Previous/ });
    const next = screen.getByRole('button', { name: /Next/ });
    expect(prev).toBeDisabled();
    await fireEvent.click(next);
    await fireEvent.click(next);
    expect(bodyColumn(0)).toEqual(['Stack 41', 'Stack 42', 'Stack 43', 'Stack 44', 'Stack 45']);
    expect(screen.getByTestId('page-range')).toHaveTextContent('41–45 of 45');
    expect(next).toBeDisabled();
    await fireEvent.click(prev);
    expect(bodyColumn(0)[0]).toBe('Stack 21');
  });

  it('changes the page size, All showing every row', async () => {
    render(DataTable, { table: manyStacks(), keys: ['name'], pageSize: 20 });
    const size = screen.getByRole('combobox', { name: /Rows per page/ });
    await fireEvent.change(size, { target: { value: '50' } });
    expect(bodyColumn(0)).toHaveLength(45);
    await fireEvent.change(size, { target: { value: 'all' } });
    expect(bodyColumn(0)).toHaveLength(45);
  });

  it('goes back to the first page when the search or sort changes', async () => {
    render(DataTable, { table: manyStacks(), keys: ['name'], pageSize: 20, searchable: true });
    await fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    await fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'Stack 4' } });
    expect(bodyColumn(0)).toEqual([
      'Stack 4',
      ...Array.from({ length: 6 }, (_, i) => `Stack ${40 + i}`),
    ]);
    await fireEvent.input(screen.getByRole('searchbox'), { target: { value: '' } });
    await fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    await fireEvent.click(
      screen.getByRole('columnheader', { name: /STACK/ }).querySelector('button')!,
    );
    expect(screen.getByTestId('page-range')).toHaveTextContent('1–20 of 45');
  });

  it('shows no pager when every row fits on one page', () => {
    render(DataTable, { table: stacks(), pageSize: 20 });
    expect(screen.queryByTestId('page-range')).not.toBeInTheDocument();
  });

  describe('before scans', () => {
    const dnsProvider = () =>
      exampleJson('dns-providers/1.json').tables.supported_templates as Table;

    it('shows a badge with the tooltip instead of a date before the start date', () => {
      const table = dnsProvider();
      table.rows[0]!.since = '2026-10-01 03:00:00';
      render(DataTable, { table, keys: ['service_name', 'since'] });
      expect(bodyColumn(1)).toEqual(['01-10-2026 03:00 UTC', 'Before scans', 'Before scans']);
      expect(screen.getAllByText('Before scans')[0]).toHaveAttribute(
        'title',
        'Already recorded when scanning began on 20 Sep 2026; the real date is unknown.',
      );
    });

    it('keeps null as a dash', () => {
      const table = dnsProvider();
      table.rows[0]!.since = null;
      render(DataTable, { table, keys: ['service_name', 'since'] });
      expect(bodyColumn(1)[0]).toBe('–');
    });

    it('sorts badge rows before real dates, by their own timestamp', async () => {
      const table = dnsProvider();
      table.rows[0]!.since = '2026-10-01 03:00:00';
      render(DataTable, { table, keys: ['service_name', 'since'] });
      await fireEvent.click(screen.getByRole('button', { name: /SUPPORTED SINCE/ }));
      expect(bodyColumn(1)).toEqual(['Before scans', 'Before scans', '01-10-2026 03:00 UTC']);
      expect(bodyColumn(0)).toEqual(['Example Website', 'Domain Verification', 'Acme Mail']);
    });
  });
});
