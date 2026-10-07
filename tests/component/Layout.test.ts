// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import Layout from '../../src/lib/components/Layout.svelte';
import { ExportClient } from '../../src/lib/data/load';
import { links } from '../../src/lib/links';
import { RegistryClient } from '../../src/lib/registry/load';
import { exampleJson, exampleManifest } from '../fixtures';

/** A client over the example export; `overview: false` makes overview.json fail. */
function client({ overview = true } = {}) {
  return new ExportClient('https://data.example/', (url) => {
    const rel = url.replace('https://data.example/', '');
    if (rel === 'overview.json' && !overview)
      return Promise.resolve(new Response('', { status: 500 }));
    return Promise.resolve(Response.json(exampleJson(rel)));
  });
}

/** A registry whose `registry.json` holds `source`; 404 without one. */
function registry(source?: unknown) {
  return new RegistryClient('https://stats.example/registry/', () =>
    Promise.resolve(source ? Response.json(source) : new Response('', { status: 404 })),
  );
}

const children = createRawSnippet(() => ({ render: () => '<p>page body</p>' }));

describe('Layout', () => {
  it('annotates the end of the page: release, domain figures, support figures, methodology', async () => {
    render(Layout, { current: 'index', manifest: exampleManifest(), client: client(), children });
    const note = screen.getByTestId('data-annotation');
    expect(screen.getByText('page body').compareDocumentPosition(note)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByTestId('generated-at')).toHaveTextContent('01-10-2026 00:00 UTC');
    await expect
      .poll(() => screen.getByTestId('share-import').textContent)
      .toBe('scan completed 01-06-2026 07:00 UTC (12K domains scanned)');
    await expect
      .poll(() => screen.getByTestId('support-sweep').textContent)
      .toBe('sweep started 02-09-2026 02:00 UTC');
    expect(note).toHaveTextContent(/^Data generated 01-10-2026 00:00 UTC · Domain figures: /);
    expect(within(note).getByRole('link', { name: 'Methodology' })).toHaveAttribute(
      'href',
      links.methodology(),
    );
    expect(document.body).not.toHaveTextContent('1780272000');
    expect(note).not.toHaveTextContent(/live|completed,/);
  });

  it('shows the sweep the page passes instead of the ecosystem sweep', async () => {
    render(Layout, {
      current: 'template',
      manifest: exampleManifest(),
      sweep: Promise.resolve('2026-07-01 02:00:00'),
      client: client(),
      children,
    });
    await expect
      .poll(() => screen.getByTestId('support-sweep').textContent)
      .toBe('sweep started 01-07-2026 02:00 UTC');
  });

  it('shows – when the page has no sweep or its data fails', async () => {
    const { unmount } = render(Layout, {
      current: 'dns-provider',
      manifest: exampleManifest(),
      sweep: Promise.resolve(null),
      client: client(),
      children,
    });
    await expect.poll(() => screen.getByTestId('support-sweep').textContent).toBe('–');
    unmount();
    render(Layout, {
      current: 'dns-provider',
      manifest: exampleManifest(),
      sweep: Promise.reject(new Error('down')),
      client: client(),
      children,
    });
    await expect.poll(() => screen.getByTestId('support-sweep').textContent).toBe('–');
  });

  it('shows – for times it cannot load from the overview', async () => {
    render(Layout, {
      current: 'index',
      manifest: exampleManifest(),
      client: client({ overview: false }),
      children,
    });
    await expect
      .poll(() => screen.getByTestId('share-import').textContent)
      .toBe('scan completed – (12K domains scanned)');
    await expect.poll(() => screen.getByTestId('support-sweep').textContent).toBe('–');
  });

  it('says so when there is no domain-share import', () => {
    render(Layout, {
      current: 'index',
      manifest: { ...exampleManifest(), share_import: null },
      client: client(),
      children,
    });
    expect(screen.getByTestId('share-import')).toHaveTextContent('no domain-share import');
  });

  it('leaves the annotation out when the page is not annotated', () => {
    render(Layout, {
      current: 'methodology',
      manifest: exampleManifest(),
      annotated: false,
      client: client(),
      children,
    });
    expect(screen.queryByTestId('data-annotation')).toBeNull();
    expect(screen.getByText('page body')).toBeInTheDocument();
  });

  it('marks the current page in the navigation', () => {
    render(Layout, { current: 'stacks', manifest: null, client: client(), children });
    expect(screen.getByRole('link', { name: 'Stacks' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText(/Loading data release/)).toBeInTheDocument();
  });

  it('shows the site version in the footer, linked to its release', () => {
    render(Layout, { current: 'index', manifest: null, client: client(), children });
    const link = screen.getByRole('link', { name: `v${pkg.version}` });
    expect(link).toHaveAttribute(
      'href',
      `https://github.com/pawel-kow/DomainConnectSupportStats/releases/tag/v${pkg.version}`,
    );
  });

  it('shows the bundled registry commit in the footer, linked to the repository', async () => {
    const commit = '0123456789abcdef0123456789abcdef01234567';
    render(Layout, {
      current: 'index',
      manifest: null,
      client: client(),
      registry: registry({ repository: 'Domain-Connect/DnsProviders', commit }),
      children,
    });
    const link = await screen.findByRole('link', { name: 'Registry 0123456' });
    expect(link).toHaveAttribute(
      'href',
      `https://github.com/Domain-Connect/DnsProviders/tree/${commit}`,
    );
  });

  it('shows no registry commit when registry.json is missing', async () => {
    render(Layout, {
      current: 'index',
      manifest: null,
      client: client(),
      registry: registry(),
      children,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId('registry-commit')).toBeNull();
  });
});
