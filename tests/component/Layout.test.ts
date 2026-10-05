// @vitest-environment jsdom
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import Layout from '../../src/lib/components/Layout.svelte';
import { ExportClient } from '../../src/lib/data/load';
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
  it('shows the release generated_at and domain-share import by its completion time', async () => {
    render(Layout, { current: 'index', manifest: exampleManifest(), client: client(), children });
    expect(screen.getByTestId('generated-at')).toHaveTextContent('01-10-2026 00:00 UTC');
    await expect
      .poll(() => screen.getByTestId('share-import').textContent)
      .toBe('scan completed 01-06-2026 07:00 UTC');
    expect(document.body).not.toHaveTextContent('1780272000');
    expect(screen.getByText(/12K domains scanned/)).toBeInTheDocument();
    expect(screen.getByText('page body')).toBeInTheDocument();
  });

  it('names the latest scan when the completion time cannot be loaded', async () => {
    render(Layout, {
      current: 'index',
      manifest: exampleManifest(),
      client: client({ overview: false }),
      children,
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.getByTestId('share-import')).toHaveTextContent('latest scan');
  });

  it('says so when there is no domain-share import', () => {
    render(Layout, {
      current: 'index',
      manifest: { ...exampleManifest(), share_import: null },
      client: client(),
      children,
    });
    expect(screen.getByTestId('share-import')).toHaveTextContent('No domain-share import');
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
