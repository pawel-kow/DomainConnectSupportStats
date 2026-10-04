import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ExportFile, Manifest } from '../src/lib/data/types';

/** The vendored example export (contract/examples/export): the fixture data set of every layer. */
export const EXAMPLE_DIR = resolve(import.meta.dirname, '../contract/examples/export');

export function exampleJson<T = ExportFile>(rel: string): T {
  return JSON.parse(readFileSync(join(EXAMPLE_DIR, rel), 'utf8')) as T;
}

export const exampleManifest = (): Manifest => exampleJson<Manifest>('manifest.json');
