import { describe, expect, it } from 'vitest';
import { clampPage, pageCount, pageRange, pageRows } from '../../src/lib/paging';

const rows = Array.from({ length: 45 }, (_, i) => i + 1);

describe('pageCount', () => {
  it('counts pages, at least one', () => {
    expect(pageCount(45, 20)).toBe(3);
    expect(pageCount(40, 20)).toBe(2);
    expect(pageCount(0, 20)).toBe(1);
  });

  it('is one page when every row is shown', () => {
    expect(pageCount(1000, null)).toBe(1);
  });
});

describe('clampPage', () => {
  it('keeps the page within the pages', () => {
    expect(clampPage(5, 45, 20)).toBe(3);
    expect(clampPage(0, 45, 20)).toBe(1);
    expect(clampPage(2, 45, 20)).toBe(2);
  });
});

describe('pageRows', () => {
  it('returns the rows of a 1-based page', () => {
    expect(pageRows(rows, 1, 20)).toEqual(rows.slice(0, 20));
    expect(pageRows(rows, 3, 20)).toEqual([41, 42, 43, 44, 45]);
  });

  it('clamps a page past the end and returns every row for All', () => {
    expect(pageRows(rows, 9, 20)).toEqual([41, 42, 43, 44, 45]);
    expect(pageRows(rows, 2, null)).toEqual(rows);
  });
});

describe('pageRange', () => {
  it('gives the 1-based first and last row of the page', () => {
    expect(pageRange(45, 2, 20)).toEqual({ first: 21, last: 40 });
    expect(pageRange(45, 3, 20)).toEqual({ first: 41, last: 45 });
    expect(pageRange(45, 1, null)).toEqual({ first: 1, last: 45 });
  });

  it('is empty without rows', () => {
    expect(pageRange(0, 1, 20)).toEqual({ first: 0, last: 0 });
  });
});
