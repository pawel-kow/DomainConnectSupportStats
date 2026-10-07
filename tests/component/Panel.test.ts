// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Panel from '../../src/lib/components/Panel.svelte';

const children = createRawSnippet(() => ({ render: () => '<p>panel body</p>' }));
const scrolled = vi.fn();

beforeEach(() => {
  Element.prototype.scrollIntoView = scrolled;
  history.replaceState(null, '', '/stack.html?id=p1');
});

afterEach(() => {
  scrolled.mockReset();
  localStorage.clear();
});

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('Panel', () => {
  it('is a section with the slug id, the title and a # link to it', () => {
    render(Panel, { id: 'coverage', title: 'Coverage', children });
    const section = document.getElementById('coverage')!;
    expect(section.tagName).toBe('SECTION');
    expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent('Coverage');
    expect(screen.getByRole('link', { name: 'Link to this panel: Coverage' })).toHaveAttribute(
      'href',
      '#coverage',
    );
    expect(screen.getByRole('button', { name: 'Share: Coverage' })).toBeInTheDocument();
    expect(screen.getByText('panel body')).toBeInTheDocument();
  });

  it('scrolls to and highlights the panel the URL anchors', async () => {
    history.replaceState(null, '', '#coverage');
    render(Panel, { id: 'coverage', title: 'Coverage', children });
    await settle();
    expect(scrolled).toHaveBeenCalledOnce();
    expect(document.getElementById('coverage')).toHaveClass('highlighted');
  });

  it('waits for its data before it scrolls', async () => {
    history.replaceState(null, '', '#coverage');
    const { rerender } = render(Panel, {
      id: 'coverage',
      title: 'Coverage',
      ready: false,
      children,
    });
    await settle();
    expect(scrolled).not.toHaveBeenCalled();
    await rerender({ ready: true });
    await settle();
    expect(scrolled).toHaveBeenCalledOnce();
  });

  it('leaves the page alone for another or an unknown anchor', async () => {
    history.replaceState(null, '', '#nothing-here');
    render(Panel, { id: 'coverage', title: 'Coverage', children });
    await settle();
    expect(scrolled).not.toHaveBeenCalled();
    expect(document.getElementById('coverage')).not.toHaveClass('highlighted');
  });

  it('highlights the panel when its anchor link is followed on the page', async () => {
    render(Panel, { id: 'coverage', title: 'Coverage', children });
    history.replaceState(null, '', '#coverage');
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    await settle();
    expect(document.getElementById('coverage')).toHaveClass('highlighted');
  });
});
