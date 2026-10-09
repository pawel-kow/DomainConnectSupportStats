import { dataBaseUrl } from './config';
import {
  DERIVED_DIR,
  LEADERBOARDS_FILE,
  TEMPLATES_FILE,
  type Leaderboards,
  type TemplateSupporters,
  type TemplatesSupport,
} from './derived';
import { assertSupportedFormat, filePath } from './manifest';
import type { ExportFile, FileKindName, Manifest } from './types';

/** The requested file does not exist (HTTP 404): a card page shows its "not found" state. */
export class NotFoundError extends Error {
  constructor(readonly url: string) {
    super(`Not found: ${url}`);
    this.name = 'NotFoundError';
  }
}

export class ReleaseMismatchError extends Error {
  constructor(
    readonly url: string,
    readonly manifestGeneratedAt: string,
    readonly fileGeneratedAt: string,
  ) {
    super(`${url} is from release ${fileGeneratedAt}, the manifest from ${manifestGeneratedAt}`);
    this.name = 'ReleaseMismatchError';
  }
}

export type Fetch = (input: string) => Promise<Response>;

async function fetchJson<T>(fetchFn: Fetch, url: string): Promise<T> {
  const response = await fetchFn(url);
  if (response.status === 404) throw new NotFoundError(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return (await response.json()) as T;
}

/** Reads one export release: the manifest first, then files by kind and raw ids. */
export class ExportClient {
  private manifestPromise: Promise<Manifest> | undefined;

  constructor(
    readonly baseUrl: string,
    private readonly fetchFn: Fetch = (input) => fetch(input),
  ) {}

  manifest(): Promise<Manifest> {
    this.manifestPromise ??= fetchJson<Manifest>(
      this.fetchFn,
      new URL('manifest.json', this.baseUrl).href,
    ).then((manifest) => {
      assertSupportedFormat(manifest);
      return manifest;
    });
    return this.manifestPromise;
  }

  /**
   * Fetch one list or card. Files of two releases are never mixed: a file whose `generated_at`
   * differs from the manifest's (a deploy swapped the release mid-visit) is rejected.
   */
  async file(kind: FileKindName, ids: Record<string, string | number> = {}): Promise<ExportFile> {
    const manifest = await this.manifest();
    const url = new URL(filePath(manifest, kind, ids), this.baseUrl).href;
    const file = await fetchJson<ExportFile>(this.fetchFn, url);
    if (file.generated_at !== manifest.generated_at) {
      throw new ReleaseMismatchError(url, manifest.generated_at, file.generated_at);
    }
    return file;
  }

  /** A derived file; rejected like a file when it is of another release. */
  private async derived<T extends { generated_at: string }>(
    path: (manifest: Manifest) => string,
  ): Promise<T> {
    const manifest = await this.manifest();
    const url = new URL(DERIVED_DIR + path(manifest), this.baseUrl).href;
    const file = await fetchJson<T>(this.fetchFn, url);
    if (file.generated_at !== manifest.generated_at) {
      throw new ReleaseMismatchError(url, manifest.generated_at, file.generated_at);
    }
    return file;
  }

  /** The derived `leaderboards.json`. */
  leaderboards(): Promise<Leaderboards> {
    return this.derived(() => LEADERBOARDS_FILE);
  }

  /** The derived `templates.json`: supporting DNS providers per template. */
  templatesSupport(): Promise<TemplatesSupport> {
    return this.derived(() => TEMPLATES_FILE);
  }

  /** A template's derived supporters, at its card's path under `derived/`. */
  templateSupporters(serviceProviderId: string, serviceId: string): Promise<TemplateSupporters> {
    return this.derived((m) =>
      filePath(m, 'template', { service_provider_id: serviceProviderId, service_id: serviceId }),
    );
  }
}

export function defaultClient(): ExportClient {
  return new ExportClient(dataBaseUrl());
}
