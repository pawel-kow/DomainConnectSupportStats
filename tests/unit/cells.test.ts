import { describe, expect, it } from 'vitest';
import { cellKind, compareCells, formatCell, rowMatches } from '../../src/lib/cells';

describe('formatCell', () => {
  it('formats by column key', () => {
    expect(formatCell('domains_pct', 33.33333333333333)).toBe('33.3%');
    expect(formatCell('change_pct', -0.4166666666666661)).toBe('-0.42 pp');
    expect(formatCell('domains', 12000)).toBe('12,000');
    expect(formatCell('import_id', 1780272000)).toBe('1780272000');
    expect(formatCell('completed_at', '2026-06-01 07:00:00')).toBe('01-06-2026 07:00 UTC');
    expect(formatCell('versions', [1, 2])).toBe('1, 2');
    expect(formatCell('name', 'Plesk')).toBe('Plesk');
  });

  it('shows null as unknown in every kind of column', () => {
    for (const key of ['domains', 'domains_pct', 'completed_at', 'name'])
      expect(formatCell(key, null)).toBe('–');
  });

  it('treats an unknown column as text or count', () => {
    expect(cellKind('brand_new_column', 'x')).toBe('text');
    expect(cellKind('brand_new_count', 3)).toBe('count');
  });
});

describe('compareCells', () => {
  it('sorts nulls last in both directions', () => {
    const values = [3, null, 1, 2];
    expect([...values].sort((a, b) => compareCells(a, b, 1))).toEqual([1, 2, 3, null]);
    expect([...values].sort((a, b) => compareCells(a, b, -1))).toEqual([3, 2, 1, null]);
  });

  it('sorts text case-insensitively and numerically', () => {
    expect(['b', 'A', 'a10', 'a9'].sort((a, b) => compareCells(a, b, 1))).toEqual([
      'A',
      'a9',
      'a10',
      'b',
    ]);
  });
});

describe('rowMatches', () => {
  it('matches text and ids, case-insensitively', () => {
    const row = { name: 'Plesk', api_host: 'domainconnect.plesk.com', dns_provider_id: 2 };
    expect(rowMatches(row, 'PLESK')).toBe(true);
    expect(rowMatches(row, 'cloudflare')).toBe(false);
    expect(rowMatches(row, '  ')).toBe(true);
  });
});
