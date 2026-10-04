/** Client-side pagination of a table's rows. Pages are 1-based; a `null` size shows every row. */

/** Page sizes a viewer can choose; the first is the default, `null` is "All". */
export const PAGE_SIZES: readonly (number | null)[] = [20, 50, 100, null];

/** Pages needed for `total` rows, at least one. */
export function pageCount(total: number, size: number | null): number {
  return size === null ? 1 : Math.max(1, Math.ceil(total / size));
}

/** `page` limited to the existing pages. */
export function clampPage(page: number, total: number, size: number | null): number {
  return Math.min(Math.max(1, page), pageCount(total, size));
}

/** The rows of `page` (clamped). */
export function pageRows<T>(rows: readonly T[], page: number, size: number | null): T[] {
  if (size === null) return [...rows];
  const start = (clampPage(page, rows.length, size) - 1) * size;
  return rows.slice(start, start + size);
}

/** 1-based first and last row number shown on `page`; both 0 without rows. */
export function pageRange(
  total: number,
  page: number,
  size: number | null,
): { first: number; last: number } {
  if (total === 0) return { first: 0, last: 0 };
  if (size === null) return { first: 1, last: total };
  const first = (clampPage(page, total, size) - 1) * size + 1;
  return { first, last: Math.min(total, first + size - 1) };
}
