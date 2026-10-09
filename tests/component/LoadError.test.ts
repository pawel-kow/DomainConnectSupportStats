// @vitest-environment jsdom
import { render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoadError from '../../src/lib/components/LoadError.svelte';
import { ReleaseMismatchError } from '../../src/lib/data/load';

const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => warn.mockClear());

describe('LoadError', () => {
  it('asks for a reload when the data was just updated', () => {
    const error = new ReleaseMismatchError(
      'https://example.org/data/overview.json',
      '2026-10-07T15:10:05Z',
      '2026-10-06T15:10:05Z',
    );
    render(LoadError, { error });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('The data was just updated');
    expect(alert).toHaveTextContent('Reload the page.');
    expect(alert).not.toHaveTextContent('overview.json');
    expect(alert).not.toHaveTextContent('2026');
    expect(warn).toHaveBeenCalledWith(error);
  });

  it('shows a plain message for any other failure', () => {
    const error = new Error('HTTP 503 for https://example.org/data/manifest.json');
    render(LoadError, { error });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Could not load the data');
    expect(alert).toHaveTextContent('The data is not available at the moment. Try again later.');
    expect(alert).not.toHaveTextContent('503');
    expect(alert).not.toHaveTextContent('manifest.json');
    expect(warn).toHaveBeenCalledWith(error);
  });
});
