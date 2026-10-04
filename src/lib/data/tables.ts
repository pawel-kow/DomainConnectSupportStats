import type { ExportFile, Row, Table } from './types';

/**
 * Find a table by its id, never by position or title. Template cards prefix their table ids
 * with the raw `<service_provider_id>/<service_id>/`, so a bare id also matches the suffix
 * after the last `/`.
 */
export function findTable<R extends Row = Row>(file: ExportFile, id: string): Table<R> | undefined {
  const exact = file.tables[id];
  if (exact) return exact as Table<R>;
  const key = Object.keys(file.tables).find((k) => k.slice(k.lastIndexOf('/') + 1) === id);
  return key ? (file.tables[key] as Table<R>) : undefined;
}

/** The one record of a single-row table (shown transposed), or undefined when it has none. */
export function oneRecord<R extends Row = Row>(table: Table<R> | undefined): R | undefined {
  return table?.rows[0];
}
