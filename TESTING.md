# Testing

Test layers, conventions and gates.

Related: [DEVELOPING.md](DEVELOPING.md) §3.2 (when tests are written),
[contract/EXPORT_FORMAT.md](contract/EXPORT_FORMAT.md) (what the tests hold the site to).

Tests pin the contract's rules and the meaning of what is shown, not the markup.

---

## 1. Principles

### 1.1 Injection, no module mocking

Collaborators are arguments:

| Seam                | Injected as                                                                                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP**            | `new ExportClient(baseUrl, fetchFn)`, `new RegistryClient(baseUrl, fetchFn)`; tests serve the examples from disk (`tests/unit/load.test.ts`, `registry-load.test.ts`) |
| **Configuration**   | `resolveDataBaseUrl(runtime, buildTime, pageUrl)`; only `dataBaseUrl()` reads `window`                                                                                |
| **Filesystem**      | `validateRelease(dir, ajv)`, `validateRegistry(dir)`; tests pass corrupted temp copies                                                                                |
| **Browser network** | Playwright `page.route()` (e.g. a failing manifest)                                                                                                                   |

No `vi.mock`, `vi.spyOn` on module exports or `vi.stubGlobal` for these; add a parameter.

### 1.2 Behaviour, not structure

Assert on return values and on what the page shows (text, roles, links). Query by role, label,
text and `data-testid`; never by CSS class or by which helper was called.

### 1.3 The example export is the fixture

Fixtures come from `contract/examples/export/` (`tests/fixtures.ts`) and `registry/examples/`.
Variants copy an example file and change the one field under test.

### 1.4 Real data before review

Page changes are run against the current real release before review (DEVELOPING.md §3.6).

---

## 2. Layers

| Layer     | Directory          | Runner                                         | Real                                          | Substituted                         |
| --------- | ------------------ | ---------------------------------------------- | --------------------------------------------- | ----------------------------------- |
| Unit      | `tests/unit/`      | Vitest (node)                                  | pure logic, example files from disk           | fetch (injected)                    |
| Contract  | `tests/contract/`  | Vitest (node)                                  | vendored schemas, example export, temp copies | nothing                             |
| Component | `tests/component/` | Vitest (jsdom, `// @vitest-environment jsdom`) | Svelte component, example data                | nothing                             |
| E2E       | `tests/e2e/`       | Playwright                                     | production build, `vite preview`, Chromium    | network via `page.route` when asked |

---

## 3. Unit tests (`tests/unit/`)

| File                     | Pins                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `encode.test.ts`         | Every id-encoding example of EXPORT_FORMAT.md, round-trip, no `/`/`%`/uppercase/leading `.`                                                                       |
| `manifest.test.ts`       | Paths come from the manifest's templates, ids are encoded, missing ids and unknown kinds fail, `format_version` gate                                              |
| `tables.test.ts`         | Tables by id, template-card suffix lookup, unknown tables ignored, one-record tables                                                                              |
| `load.test.ts`           | Manifest fetched once, 404 → `NotFoundError`, unsupported format rejected, files of another release rejected                                                      |
| `config.test.ts`         | Data and registry base URL precedence: runtime → build time → `./data/`, `./registry/`                                                                            |
| `format.test.ts`         | Timestamps as UTC (all three contract forms), null → `–`, rounding for display, signed pp, flags yes/no/unknown                                                   |
| `cells.test.ts`          | Formatting by column key, null last in both sort directions, free-text filter, nameserver lists, internal ids hidden                                              |
| `series.test.ts`         | Import placement fallback (started → completed → epoch → none), gaps not zeros, latest measured value, when the overview is needed                                |
| `links.test.ts`          | Page URLs carry raw ids; `safeUrl` accepts only http(s), `safeMailto` only plain addresses                                                                        |
| `params.test.ts`         | Query parameters: raw text, blank as missing, non-negative integers only                                                                                          |
| `registry-path.test.ts`  | Registry folder `<a>/<b>` from a `providerId`                                                                                                                     |
| `registry-entry.test.ts` | Entry fields read, unknown keys ignored, absent or invalid values unknown, entries without `providerId`/`name` rejected; `registry.json`                          |
| `registry-load.test.ts`  | Entry URL from the encoded `providerId`, logo URL next to it, 404 → `null`, other failures thrown, `registry.json` fetched once, entry link at the bundled commit |
| `changelog.test.ts`      | CHANGELOG section lookup by version, version check (missing section, invalid SemVer)                                                                              |

## 4. Contract tests (`tests/contract/`)

`example-export.test.ts`:

- The example export is a valid release under `validateRelease` (schemas, one `generated_at`,
  manifest counts, every list row's card present).
- Its `format_version` is `SUPPORTED_FORMAT_VERSION`; every report the manifest names has a
  vendored schema.
- `validateRelease` catches a missing card, a file from another release, a schema violation, a
  wrong manifest count.
- Every file has the generic shape the pages read; every row has exactly its columns' keys.

`example-registry.test.ts`:

- The example registry is valid under `validateRegistry` (schema, entry path, logo).
- The schema: `providerId` and `name` required, unknown keys allowed, tri-state flags, onboarding
  modes, contacts, http(s) URLs, logo file names.
- `validateRegistry` catches a missing `providers/` folder, an entry at the wrong path, a missing
  logo, a schema violation, invalid JSON.
- `bundleRegistry` publishes entries and logos at `<a>/<b>/<encoded name>` with `registry.json`,
  replacing an earlier bundle.

## 5. Component tests (`tests/component/`)

| File                | Pins                                                                                                                                                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DataTable.test.ts` | Headers from the file's columns, export order by default, number/percent formatting, sort cycle (numbers descending first, nulls last, back to export order), filter with row count, empty state, footer row, third-party text escaped, internal id columns never shown |
| `Layout.test.ts`    | Header shows `generated_at` and the domain-share import by its scan's completion time (or that there is none), current page marked in the navigation, footer shows the site version and the registry commit (or none)                                                   |
| `Registry.test.ts`  | Card title with logo; contact block and registry details: links only through `safeUrl`/`safeMailto`, unknown rows left out, empty blocks not shown, the stack named for several deployments, HTML in notes as text                                                      |

`@testing-library/svelte`; `tests/setup.ts` registers jest-dom matchers and cleanup.

## 6. End-to-end tests (`tests/e2e/`)

Playwright builds the site and serves it with `vite preview`, with the release under `/data/`
(`DATA_DIR`, default: the example export) and the registry under `/registry/` (`REGISTRY_DIR`,
default: `registry/examples`). Projects: `desktop` (Desktop Chrome), `mobile`
(Pixel 7). The `consoleErrors` fixture fails a test on any page or console error unless it sets
`expectErrors`.

| File                    | Pins                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `navigation.spec.ts`    | Every page renders the header, the release facts and the navigation; navigation links are plain page links                                                                                                                                                                                                           |
| `overview.spec.ts`      | Release in the header, headline numbers, chart drawn without data tables, no internal id, no horizontal page scroll, error state when the data is unavailable                                                                                                                                                        |
| `dns-providers.spec.ts` | Visible rows, combined cells, caveats; badges with raw hover text; show-all toggle in the URL; stack filter and its way back; empty stack; `?q=` pre-fill and URL sync; sort; phone columns; card and stack links; no stack link without a stack; error state; no horizontal page scroll                             |
| `dns-provider.spec.ts`  | Provider, stack link and support; template links; both charts without data tables; card order; registry logo, contact and details, sparse entries, no entry, entry 404 and failure, missing `registry.json`; unranked as unknown; not-found for missing, blank, malformed and unknown ids; no horizontal page scroll |

Each built page has its own spec: content from the example, links resolving to rendering pages,
not-found state (missing parameter, unknown id), filters and sort.

Against a real release: `DATA_DIR=<release> REGISTRY_DIR=<registry> npm run test:e2e`.

## 7. Gates

| Gate                                | Command                                                 | Where                                  |
| ----------------------------------- | ------------------------------------------------------- | -------------------------------------- |
| Lint + format                       | `npm run lint`                                          | CI, `verify`                           |
| Types (svelte-check, warnings fail) | `npm run check`                                         | CI, `verify`                           |
| Unit + contract + component         | `npm test`                                              | CI, deploy, `verify`                   |
| Example export valid                | `npm run validate:export`                               | CI                                     |
| Example registry valid              | `npm run validate:registry`                             | CI                                     |
| Version has a CHANGELOG section     | `npm run check:version`                                 | CI, `verify`                           |
| Build                               | `npm run build`                                         | CI, deploy, `verify`                   |
| E2E                                 | `npm run test:e2e`                                      | CI, `verify`                           |
| Incoming release valid              | `npm run bundle:data -- <release> dist`                 | deploy (refuses to publish on failure) |
| Incoming registry valid             | `npm run bundle:registry -- <dir> dist <repo> <commit>` | deploy (refuses to publish on failure) |
| No `.plan/` files                   | `no-plan-files` job                                     | CI on PRs                              |

A fresh container needs `npx playwright install --with-deps chromium` (the devcontainer's
postCreate runs it).

## 8. Tooling

- Vitest (`test` block in `vite.config.ts`), jsdom, `@testing-library/svelte`,
  `@testing-library/jest-dom`.
- Ajv (Draft 2020-12), shared by tests and `scripts/`.
- Playwright (`playwright.config.ts`); reports in `playwright-report/`, uploaded by CI on failure.

## 9. Coverage

| Area                                                                                                            | Expectation                                                              |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `src/lib/data/`, `src/lib/registry/`, `format.ts`, `cells.ts`, `series.ts`, `links.ts`, `params.ts`, `scripts/` | Every exported function unit-tested, including null and malformed inputs |
| Shared components                                                                                               | A component test per behaviour a page relies on                          |
| Pages                                                                                                           | An e2e spec per page: content, links, not-found, mobile                  |
| Contract rules ([CLAUDE.md](CLAUDE.md) "The one external input")                                                | A named test per rule                                                    |
