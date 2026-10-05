import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import type { Connect, Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { decodeSegment } from './src/lib/data/encode.ts';

const ROOT = import.meta.dirname;
const PAGES_DIR = resolve(ROOT, 'src/pages');
const { version } = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as {
  version: string;
};

// The example export of the vendored contract is the dev data set; DATA_DIR points dev/preview
// at a real release (e.g. a checkout of the data repo) instead.
const DATA_DIR = resolve(ROOT, process.env.DATA_DIR ?? 'contract/export/examples/export');
// The test registry submodule is the dev registry; REGISTRY_DIR points at another registry checkout
// (e2e: the contract's golden copy).
const REGISTRY_DIR = resolve(ROOT, process.env.REGISTRY_DIR ?? 'registry');

const CONTENT_TYPES: Record<string, string> = {
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

/** Every `src/pages/*.html` is one build entry: one HTML file per page, not an SPA. */
function pageEntries(): Record<string, string> {
  return Object.fromEntries(
    readdirSync(PAGES_DIR)
      .filter((f) => f.endsWith('.html'))
      .map((f) => [f.replace(/\.html$/, ''), resolve(PAGES_DIR, f)]),
  );
}

/** `/data/<path>` → DATA_DIR/<path>. */
function exportFile(path: string): string {
  return resolve(DATA_DIR, '.' + path);
}

/**
 * `/registry/<a>/<b>/<encoded name>` → REGISTRY_DIR/providers/<a>/<b>/<name>: the deploy bundles
 * a registry checkout without `providers/` and with encoded file names. `registry.json` (repository
 * and commit, written by the bundle step) is served when REGISTRY_DIR has one.
 */
function registryFile(path: string): string {
  const segments = path.split('/').slice(1);
  if (segments.length !== 3) return resolve(REGISTRY_DIR, '.' + path);
  const [a, b, name] = segments as [string, string, string];
  return resolve(REGISTRY_DIR, 'providers', a, b, decodeSegment(name));
}

/**
 * Serves DATA_DIR under `/data/` and REGISTRY_DIR under `/registry/` in `vite dev` and
 * `vite preview`, the URLs the deployed site uses (the deploy bundles both into `dist/`). Build
 * output never contains data.
 */
function serveInputs(): Plugin {
  const mounts = [
    { prefix: '/data', dir: DATA_DIR, file: exportFile },
    { prefix: '/registry', dir: REGISTRY_DIR, file: registryFile },
  ];
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const mount = mounts.find((m) => url.pathname.startsWith(m.prefix + '/'));
    if (!mount) return next();
    const file = mount.file(decodeURIComponent(url.pathname.slice(mount.prefix.length)));
    if (!file.startsWith(mount.dir + sep) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', CONTENT_TYPES[extname(file)] ?? 'application/octet-stream');
    createReadStream(file).pipe(res);
  };
  return {
    name: 'serve-inputs',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  };
}

export default defineConfig({
  root: PAGES_DIR,
  publicDir: resolve(ROOT, 'public'),
  // Relative base: the same build works on github.io/<repo>/, a custom domain, or any sub-path.
  base: './',
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [svelte({ configFile: resolve(ROOT, 'svelte.config.js') }), serveInputs()],
  // All addresses: `localhost` may resolve to `::1` only, which a devcontainer port forward
  // (IPv4) cannot reach.
  server: { host: true },
  preview: { host: true },
  build: {
    outDir: resolve(ROOT, 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: pageEntries() },
  },
  resolve: {
    // Pages load `../entries/<page>.ts`; the dev server receives it as `/entries/...`, outside root.
    alias: [{ find: /^\/entries\//, replacement: resolve(ROOT, 'src/entries') + '/' }],
    ...(process.env.VITEST ? { conditions: ['browser'] } : {}),
  },
  test: {
    root: ROOT,
    include: ['tests/{unit,contract,component}/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
  },
});
