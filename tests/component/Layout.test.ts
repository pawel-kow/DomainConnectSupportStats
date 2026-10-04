// @vitest-environment jsdom
import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import pkg from '../../package.json';
import Layout from '../../src/lib/components/Layout.svelte';
import { exampleManifest } from '../fixtures';

const children = createRawSnippet(() => ({ render: () => '<p>page body</p>' }));

describe('Layout', () => {
  it('shows the release generated_at and domain-share import from the manifest', () => {
    render(Layout, { current: 'index', manifest: exampleManifest(), children });
    expect(screen.getByTestId('generated-at')).toHaveTextContent('01-10-2026 00:00 UTC');
    expect(screen.getByTestId('share-import')).toHaveTextContent('1780272000');
    expect(screen.getByText(/12,000 domains scanned/)).toBeInTheDocument();
    expect(screen.getByText('page body')).toBeInTheDocument();
  });

  it('says so when there is no domain-share import', () => {
    render(Layout, {
      current: 'index',
      manifest: { ...exampleManifest(), share_import: null },
      children,
    });
    expect(screen.getByTestId('share-import')).toHaveTextContent('No domain-share import');
  });

  it('marks the current page in the navigation', () => {
    render(Layout, { current: 'stacks', manifest: null, children });
    expect(screen.getByRole('link', { name: 'Stacks' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
    expect(screen.getByText(/Loading data release/)).toBeInTheDocument();
  });

  it('shows the site version in the footer, linked to its release', () => {
    render(Layout, { current: 'index', manifest: null, children });
    const link = screen.getByRole('link', { name: `v${pkg.version}` });
    expect(link).toHaveAttribute(
      'href',
      `https://github.com/pawel-kow/DomainConnectSupportStats/releases/tag/v${pkg.version}`,
    );
  });
});
