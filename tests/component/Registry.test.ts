// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import Registry from '../../src/lib/components/Registry.svelte';
import { parseEntry } from '../../src/lib/registry/entry';

const EXAMPLES = resolve(import.meta.dirname, '../../registry/examples/providers');
const example = (path: string) =>
  parseEntry(JSON.parse(readFileSync(resolve(EXAMPLES, path), 'utf8')));

function feature(label: string): string | null {
  const row = within(screen.getByTestId('registry-features')).getByText(label).closest('tr');
  return row?.querySelector('td')?.textContent?.trim() ?? null;
}

describe('Registry', () => {
  it('shows a full entry: logo, links, contacts, flags', () => {
    render(Registry, {
      entry: example('c/l/cloudflare.com.json'),
      logoUrl: './registry/c/l/cloudflare.com.svg',
      fileUrl: 'https://github.com/o/r/blob/abc1234/providers/c/l/cloudflare.com.json',
      stack: null,
    });
    expect(screen.getByRole('heading', { name: 'Registry' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cloudflare' })).toHaveAttribute(
      'src',
      './registry/c/l/cloudflare.com.svg',
    );
    expect(screen.getByRole('link', { name: 'https://www.cloudflare.example' })).toHaveAttribute(
      'rel',
      'nofollow noopener noreferrer',
    );
    expect(screen.getByRole('link', { name: 'domain-connect@cloudflare.example' })).toHaveAttribute(
      'href',
      'mailto:domain-connect@cloudflare.example',
    );
    expect(screen.getByRole('link', { name: 'Community forum' })).toHaveAttribute(
      'href',
      'https://community.cloudflare.example/c/dns',
    );
    expect(feature('Synchronous flow')).toBe('yes');
    expect(feature('Asynchronous flow (OAuth)')).toBe('no');
    expect(feature('Revert in the asynchronous flow')).toBe('–');
    expect(screen.getByRole('link', { name: 'Entry in the registry repository' })).toHaveAttribute(
      'href',
      'https://github.com/o/r/blob/abc1234/providers/c/l/cloudflare.com.json',
    );
  });

  it('shows HTML in notes as text', () => {
    const { container } = render(Registry, {
      entry: example('c/l/cloudflare.com.json'),
      logoUrl: null,
      fileUrl: null,
      stack: null,
    });
    expect(screen.getByTestId('registry-notes')).toHaveTextContent('<script>alert(1)</script>');
    expect(screen.getByText(/Templates must <b>not<\/b> overwrite/)).toBeInTheDocument();
    expect(container.querySelector('script, b')).toBeNull();
  });

  it('never links a URL or address that is not plain http(s) or e-mail', () => {
    render(Registry, {
      entry: parseEntry({
        providerId: 'x',
        name: 'X',
        url: 'javascript:alert(1)',
        onboarding: { contacts: [{ type: 'email', value: 'a@b?x=<y>' }] },
      }),
      logoUrl: null,
      fileUrl: null,
      stack: null,
    });
    expect(screen.getByText('javascript:alert(1)').closest('a')).toBeNull();
    expect(screen.getByText('a@b?x=<y>').closest('a')).toBeNull();
  });

  it('names and links the stack of several deployments; unknown values as –', () => {
    render(Registry, {
      entry: example('p/l/plesk.com.json'),
      logoUrl: null,
      fileUrl: null,
      stack: { id: 'plesk.com', name: 'Plesk' },
    });
    expect(
      screen.getByRole('heading', { name: 'Registry entry of stack Plesk' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Plesk' })).toHaveAttribute(
      'href',
      './stack.html?id=plesk.com',
    );
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('link', { name: /registry repository/ })).toBeNull();
    expect(screen.getByTestId('registry-onboarding')).toHaveTextContent(/Automatic/);
    expect(feature('SPFM')).toBe('–');
  });
});
