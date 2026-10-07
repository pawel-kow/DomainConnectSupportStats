// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ShareMenu from '../../src/lib/components/ShareMenu.svelte';

const PAGE = 'http://localhost:3000/dns-provider.html?id=example';
const LINK = `${PAGE}#support-history`;
const TEXT = 'Support history – Example DNS – Domain Connect support statistics';

function renderMenu() {
  return render(ShareMenu, {
    props: { title: 'Support history', context: 'Example DNS', anchor: 'support-history' },
  });
}

const toggle = () => screen.getByRole('button', { name: 'Share: Support history' });

async function openMenu() {
  await fireEvent.click(toggle());
  return screen.getByRole('menu');
}

const item = (name: string | RegExp) => screen.getByRole('menuitem', { name });

beforeEach(() => {
  history.replaceState(null, '', '/dns-provider.html?id=example');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('ShareMenu', () => {
  it('opens a menu with the targets and focuses its first item', async () => {
    renderMenu();
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    await openMenu();
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('menuitem').map((e) => e.textContent!.trim())).toEqual([
      'Bluesky',
      'Mastodon…',
      'LinkedIn',
      'Copy link',
    ]);
    expect(item('Bluesky')).toHaveFocus();
  });

  it('links the targets to the page URL with its query and the panel anchor', async () => {
    renderMenu();
    await openMenu();
    const bluesky = new URL(item('Bluesky').getAttribute('href')!);
    expect(bluesky.searchParams.get('text')).toBe(`${TEXT} ${LINK}`);
    const linkedin = new URL(item('LinkedIn').getAttribute('href')!);
    expect(linkedin.searchParams.get('url')).toBe(LINK);
    for (const name of ['Bluesky', 'LinkedIn']) {
      expect(item(name)).toHaveAttribute('target', '_blank');
      expect(item(name)).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('moves through the items with the arrow keys and closes on Escape', async () => {
    renderMenu();
    const menu = await openMenu();
    await fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(item('Mastodon…')).toHaveFocus();
    await fireEvent.keyDown(menu, { key: 'End' });
    expect(item('Copy link')).toHaveFocus();
    await fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(item('Bluesky')).toHaveFocus();
    await fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(item('Copy link')).toHaveFocus();
    await fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(toggle()).toHaveFocus();
  });

  it('closes on a click outside', async () => {
    renderMenu();
    await openMenu();
    await fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('copies the link and says so for two seconds', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderMenu();
    await openMenu();
    vi.useFakeTimers();
    await fireEvent.click(item('Copy link'));
    await vi.advanceTimersByTimeAsync(0);
    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(screen.getByRole('status')).toHaveTextContent('Link copied');
    await vi.advanceTimersByTimeAsync(2000);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('says when the link could not be copied', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('denied')));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderMenu();
    await openMenu();
    await fireEvent.click(item('Copy link'));
    await expect.poll(() => screen.getByRole('status').textContent).toBe('Link not copied');
  });

  it('asks for the Mastodon instance, rejects a bad one, then stores it and opens the share page', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    renderMenu();
    await openMenu();
    await fireEvent.click(item('Mastodon…'));
    const input = screen.getByLabelText('Mastodon instance');
    expect(input).toHaveFocus();
    await fireEvent.input(input, { target: { value: 'not a host' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/host name/);
    expect(open).not.toHaveBeenCalled();

    await fireEvent.input(input, { target: { value: 'https://Mastodon.Social/@someone' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Share' }));
    expect(open).toHaveBeenCalledOnce();
    const [href, target, features] = open.mock.calls[0]!;
    expect(new URL(href).origin).toBe('https://mastodon.social');
    expect(new URL(href).searchParams.get('text')).toBe(`${TEXT} ${LINK}`);
    expect([target, features]).toEqual(['_blank', 'noopener,noreferrer']);
    expect(screen.queryByLabelText('Mastodon instance')).not.toBeInTheDocument();
    expect(toggle()).toHaveFocus();

    await openMenu();
    expect(item(/Mastodon \(mastodon.social\)/)).toHaveAttribute(
      'href',
      expect.stringMatching(/^https:\/\/mastodon\.social\/share\?/),
    );
    await fireEvent.click(item('Change Mastodon instance'));
    expect(screen.getByLabelText('Mastodon instance')).toHaveValue('mastodon.social');
  });

  it('offers the OS share sheet where the browser has one', async () => {
    const share = vi.fn(() => Promise.reject(new DOMException('', 'AbortError')));
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    renderMenu();
    await openMenu();
    await fireEvent.click(item('More…'));
    expect(share).toHaveBeenCalledWith({ title: TEXT, text: TEXT, url: LINK });
  });

  it('shows the box-with-arrow icon on Apple platforms and the nodes elsewhere', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)',
    });
    const apple = renderMenu();
    expect(apple.container.querySelector('svg')).toHaveAttribute('data-icon', 'apple');
    apple.unmount();
    vi.unstubAllGlobals();
    vi.stubGlobal('navigator', { ...navigator, userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' });
    expect(renderMenu().container.querySelector('svg')).toHaveAttribute('data-icon', 'nodes');
  });
});
