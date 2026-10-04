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
