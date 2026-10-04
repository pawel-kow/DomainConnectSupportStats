/**
 * Types of the static export (contract/EXPORT_FORMAT.md). Only what the site reads is typed:
 * new tables, columns and keys may appear without a format version bump and must be ignored.
 */

/** A raw cell value. `null` is "unknown or not applicable", never zero. */
export type CellValue = string | number | boolean | null | number[];

export type Row = Record<string, CellValue>;

export interface Column {
  key: string;
  /** Display text, not contract: may change at any time. */
  header: string;
}

export interface Table<R extends Row = Row> {
  title: string;
  columns: Column[];
  rows: R[];
  footer: R | null;
}

/** Every file except the manifest. */
export interface ExportFile {
  generated_at: string;
  notes: string[];
  tables: Record<string, Table>;
}

export type ImportStatus = 'completed' | 'in_progress' | 'pruned';
export type ShareSource = 'live' | 'snapshot';

export interface ShareImport {
  import_id: number;
  status: ImportStatus | string;
  source: ShareSource | string;
  scanned_domains: number;
}

export interface ListFileKind {
  path: string;
  report: string;
  rows: Record<string, number>;
}

export interface CardFileKind {
  path: string;
  report: string;
  list: string;
  table: string;
  keys: Record<string, string>;
  files: number;
}

export type FileKindName =
  | 'overview'
  | 'dns_providers'
  | 'dns_provider'
  | 'stacks'
  | 'stack'
  | 'service_providers'
  | 'service_provider'
  | 'templates'
  | 'template';

export interface Manifest {
  format_version: number;
  generated_at: string;
  schema_version: number;
  share_import: ShareImport | null;
  id_encoding: string;
  files: Partial<Record<FileKindName, ListFileKind | CardFileKind>> &
    Record<string, ListFileKind | CardFileKind>;
}
