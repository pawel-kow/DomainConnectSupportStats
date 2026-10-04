import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { Connect, Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const ROOT = import.meta.dirname;
const PAGES_DIR = resolve(ROOT, 'src/pages');

// The example export of the vendored contract is the dev data set; DATA_DIR points dev/preview
// at a real release (e.g. a checkout of the data repo) instead.
const DATA_DIR = resolve(ROOT, process.env.DATA_DIR ?? 'contract/examples/export');

/** Every `src/pages/*.html` is one build entry: one HTML file per page, not an SPA. */
function pageEntries(): Record<string, string> {
  return Object.fromEntries(
    readdirSync(PAGES_DIR)
      .filter((f) => f.endsWith('.html'))
      .map((f) => [f.replace(/\.html$/, ''), resolve(PAGES_DIR, f)]),
  );
}

/**
 * Serves DATA_DIR under `/data/` in `vite dev` and `vite preview`, the same URL the deployed
 * site uses (the deploy bundles the release into `dist/data/`). Build output never contains data.
 */
function serveExportData(): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (!url.pathname.startsWith('/data/')) return next();
    const file = resolve(DATA_DIR, '.' + decodeURIComponent(url.pathname.slice('/data'.length)));
    if (!file.startsWith(DATA_DIR + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    createReadStream(file).pipe(res);
  };
  return {
    name: 'serve-export-data',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig({
  root: PAGES_DIR,
  publicDir: resolve(ROOT, 'public'),
  // Relative base: the same build works on github.io/<repo>/, a custom domain, or any sub-path.
  base: './',
  plugins: [svelte({ configFile: resolve(ROOT, 'svelte.config.js') }), serveExportData()],
  build: {
    outDir: resolve(ROOT, 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: pageEntries() },
  },
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
  test: {
    root: ROOT,
    include: ['tests/{unit,contract,component}/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
  },
});
