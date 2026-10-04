# Testing Strategy

How the Domain Connect support statistics site is verified: unit, contract, component and
end-to-end tests, and what gates a change.

Read alongside [DEVELOPING.md](DEVELOPING.md) (when tests are written: §3.1) and
[contract/EXPORT_FORMAT.md](contract/EXPORT_FORMAT.md) (what the tests hold the site to).

**The organising constraint:** the site renders data it doesn't own, in a format that grows
without notice (additive changes need no version bump), at a scale the example doesn't reach.
Tests therefore pin the _contract's_ rules and the _meaning_ of what is shown, not the markup.

---

## 1. Principles

### 1.1 No module mocking — dependencies are injected

`vi.mock()` binds a test to import paths and internal call structure; move a function and every
mock breaks even though behaviour is unchanged. Code takes its collaborators as arguments instead:

| Seam                | How it is injected                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTP**            | `new ExportClient(baseUrl, fetchFn)` takes a fetch function; tests pass one that serves the example export from disk (`tests/unit/load.test.ts`). |
| **Configuration**   | `resolveDataBaseUrl(runtime, buildTime, pageUrl)` takes values; only `dataBaseUrl()` reads `window`.                                              |
| **Filesystem**      | `validateRelease(dir, ajv)` takes a directory; tests pass corrupted temp copies.                                                                  |
| **Browser network** | Playwright's `page.route()` substitutes responses (e.g. a failing manifest).                                                                      |

Don't use `vi.mock`, `vi.spyOn` on module exports, or `vi.stubGlobal` for these; add a parameter.

### 1.2 Test behaviour through stable contracts, not internal structure

Assert on what a function returns or what the page _shows_ (text, roles, links), never on which
helper was called or on CSS classes. Component and e2e tests query by role, label, text and
`data-testid`, the way a user (or a screen reader) finds things.

### 1.3 The example export is the fixture

All fixtures come from `contract/examples/export/` (`tests/fixtures.ts`), the Scanner's own
example of every table and edge case (pruned imports, nulls, templates without supporters, a
stack with a dead deployment). A hand-written imitation encodes our assumptions about the format;
the example encodes the Scanner's. Tests that need a variant copy an example file and change the
one field under test.

### 1.4 Real data before review

The example is small. Before a page change goes to review it is run against the current real
release (DEVELOPING.md §3.4a): validation, e2e smoke, and a look at every changed page.

---

## 2. Test pyramid

```
              ┌───────────────────────────┐
              │  E2E (Playwright)         │  ~10 s, built site, desktop + mobile
              ├───────────────────────────┤
              │  Component (jsdom)        │  ~3 s, one Svelte component
              ├───────────────────────────┤
              │  Contract                 │  ~2 s, schemas + example + corrupted copies
              ├───────────────────────────┤
              │  Unit                     │  <1 s, pure functions
              └───────────────────────────┘
```

| Layer     | Directory          | Runner                                         | Real                                          | Substituted                                       |
| --------- | ------------------ | ---------------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| Unit      | `tests/unit/`      | Vitest (node)                                  | pure logic, example files from disk           | fetch (injected)                                  |
| Contract  | `tests/contract/`  | Vitest (node)                                  | vendored schemas, example export, temp copies | nothing                                           |
| Component | `tests/component/` | Vitest (jsdom, `// @vitest-environment jsdom`) | Svelte component, example data                | nothing                                           |
| E2E       | `tests/e2e/`       | Playwright                                     | production build, `vite preview`, Chromium    | network only via `page.route` when a test says so |

---

## 3. Unit tests (`tests/unit/`)

| File               | Pins                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `encode.test.ts`   | Every id-encoding example of EXPORT_FORMAT.md, round-trip, no `/`/`%`/uppercase/leading `.`                          |
| `manifest.test.ts` | Paths come from the manifest's templates, ids are encoded, missing ids and unknown kinds fail, `format_version` gate |
| `tables.test.ts`   | Tables by id, template-card suffix lookup, unknown tables ignored, one-record tables                                 |
| `load.test.ts`     | Manifest fetched once, 404 → `NotFoundError`, unsupported format rejected, files of another release rejected         |
| `config.test.ts`   | Data base URL precedence: runtime → build time → `./data/`                                                           |
| `format.test.ts`   | Timestamps as UTC (all three contract forms), null → `–`, rounding for display, signed pp                            |
| `cells.test.ts`    | Formatting by column key, null last in both sort directions, free-text filter                                        |
| `series.test.ts`   | Import placement fallback (started → completed → epoch → none), gaps not zeros, latest measured value                |
| `links.test.ts`    | Page URLs carry raw ids; `safeUrl` accepts only http(s)                                                              |

## 4. Contract tests (`tests/contract/`)

`example-export.test.ts`:

- The vendored example export is a valid release under `validateRelease` (every file against its
  schema, one `generated_at`, manifest row and card counts, every list row's card present).
- The example's `format_version` is `SUPPORTED_FORMAT_VERSION`; every report the manifest names
  has a vendored schema.
- `validateRelease` catches corruption: a missing card, a file from another release, a schema
  violation, a wrong manifest count. These are what the deploy relies on to refuse a bad release.
- Every file has the generic shape the pages read, and every row has exactly its columns' keys.

When a new copy of the contract arrives (`chore/contract-*`), these tests are the first signal.

## 5. Component tests (`tests/component/`)

| File                | Pins                                                                                                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DataTable.test.ts` | Headers from the file's columns, export order by default, number/percent formatting, sort cycle (numbers descending first, nulls last, back to export order), filter with row count, empty state, footer row, third-party text escaped |
| `Layout.test.ts`    | Header shows `generated_at` and the domain-share import (and says so when there is none), current page marked in the navigation                                                                                                        |

Use `@testing-library/svelte`; query by role/text/test id. `tests/setup.ts` registers jest-dom
matchers and cleanup.

## 6. End-to-end tests (`tests/e2e/`)

Playwright builds the site and serves it with `vite preview`, which serves the data release under
`/data/` like the deployed site (`DATA_DIR`, default: the example export). Two projects: `desktop`
(Desktop Chrome) and `mobile` (Pixel 7). The `consoleErrors` fixture fails any test with a page
error or a console error, unless the test sets `expectErrors`.

| File                 | Pins                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `navigation.spec.ts` | Every page renders the shared header, the release facts and the navigation; navigation links are plain page links                                        |
| `overview.spec.ts`   | Release in the header, headline numbers, chart drawn, every import and sweep listed, no horizontal page scroll, error state when the data is unavailable |

Each built page gets its own spec: what it shows from the example, its links resolving to pages
that render, its not-found state (missing parameter, unknown id), and its filters/sort if any.

Against a real release (DEVELOPING.md §3.4a): `DATA_DIR=<release> npm run test:e2e`. Assertions
on example values will fail there by design; page errors, blank pages and broken links must not.

## 7. Gates

| Gate                                | Command                                 | Where                                  |
| ----------------------------------- | --------------------------------------- | -------------------------------------- |
| Lint + format                       | `npm run lint`                          | CI, `verify`                           |
| Types (svelte-check, warnings fail) | `npm run check`                         | CI, `verify`                           |
| Unit + contract + component         | `npm test`                              | CI, deploy, `verify`                   |
| Example export valid                | `npm run validate:export`               | CI                                     |
| Build                               | `npm run build`                         | CI, deploy, `verify`                   |
| E2E                                 | `npm run test:e2e`                      | CI, `verify`                           |
| Incoming release valid              | `npm run bundle:data -- <release> dist` | deploy (refuses to publish on failure) |
| No `.plan/` files                   | `no-plan-files` job                     | CI on PRs                              |

`npm run verify` runs the local set before a PR. In a fresh container, Playwright needs
`npx playwright install --with-deps chromium` (the devcontainer's postCreate does this).

## 8. Tooling

- Vitest (config in `vite.config.ts`, `test` block), jsdom, `@testing-library/svelte`,
  `@testing-library/jest-dom`.
- Ajv (Draft 2020-12) for schema validation, shared by tests and `scripts/`.
- Playwright (`playwright.config.ts`); reports in `playwright-report/` (uploaded by CI on
  failure).
- No mocking libraries: injection only (§1.1).

## 9. Coverage expectations

| Area                                                                                           | Expectation                                                                             |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/lib/data/`, `format.ts`, `cells.ts`, `series.ts`, `links.ts`, `scripts/export-release.ts` | Every exported function has unit tests, including null and malformed inputs             |
| Shared components                                                                              | A component test per behaviour a page relies on (sort, filter, empty, footer, escaping) |
| Pages                                                                                          | An e2e spec per page: content, links, not-found, mobile                                 |
| Contract rules (CLAUDE.md "export contract")                                                   | Each rule has a named test                                                              |
