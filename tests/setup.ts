import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// Vitest runs without globals, so @testing-library's automatic cleanup is not registered.
afterEach(async () => {
  if (typeof document === 'undefined') return;
  const { cleanup } = await import('@testing-library/svelte');
  cleanup();
});
