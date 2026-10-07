import { describe, expect, it } from 'vitest';
import type { Row, Table } from '../../src/lib/data/types';
import { isNeverProbed, templateList } from '../../src/lib/templates-list';
import { exampleJson } from '../fixtures';

const templates = () => exampleJson('templates.json').tables.service_templates as Table;
const ids = (rows: Row[]) => rows.map((r) => `${r.provider_id}/${r.service_id}`);

/** The example export has no never-probed template: the last row becomes one. */
function withNeverProbed(): Table {
  const source = templates();
  Object.assign(source.rows.at(-1)!, {
    total: 0,
    supported_count: 0,
    supported_pct: null,
    unsupported_count: 0,
    unsupported_pct: null,
  });
  return source;
}

describe('isNeverProbed', () => {
  it('is a template without probe combinations', () => {
    expect(isNeverProbed({ total: 0 })).toBe(true);
    expect(isNeverProbed({ total: 4 })).toBe(false);
    expect(isNeverProbed({ total: null })).toBe(false);
    expect(isNeverProbed({})).toBe(false);
  });
});

describe('templateList', () => {
  it('shows every probed template in export order', () => {
    const list = templateList(templates(), { spid: null, showAll: false });
    expect(ids(list.table.rows)).toEqual(ids(templates().rows));
    expect(list.table.rows).toHaveLength(5);
    expect(list.hiddenCount).toBe(0);
  });

  it('hides never-probed templates and counts them, unless asked', () => {
    const hidden = templateList(withNeverProbed(), { spid: null, showAll: false });
    expect(ids(hidden.table.rows)).not.toContain('exampleservice.domainconnect.org/template2');
    expect(hidden.hiddenCount).toBe(1);
    const all = templateList(withNeverProbed(), { spid: null, showAll: true });
    expect(ids(all.table.rows)).toContain('exampleservice.domainconnect.org/template2');
    expect(all.hiddenCount).toBe(1);
  });

  it("filters to one service provider's templates before hiding", () => {
    expect(
      ids(templateList(templates(), { spid: 'mail.acme.example', showAll: false }).table.rows),
    ).toEqual(ids(templates().rows.filter((r) => r.provider_id === 'mail.acme.example')));
    const hidden = templateList(withNeverProbed(), {
      spid: 'exampleservice.domainconnect.org',
      showAll: false,
    });
    expect(ids(hidden.table.rows)).toEqual(['exampleservice.domainconnect.org/template1']);
    expect(hidden.hiddenCount).toBe(1);
    expect(templateList(templates(), { spid: 'nope', showAll: true }).table.rows).toEqual([]);
  });

  it('keeps unknown columns and keys', () => {
    const source = templates();
    source.columns.push({ key: 'brand_new', header: 'NEW' });
    source.rows[0]!.brand_new = 'x';
    const { table } = templateList(source, { spid: null, showAll: false });
    expect(table.columns.map((c) => c.key)).toContain('brand_new');
    expect(table.rows[0]!.brand_new).toBe('x');
  });
});
