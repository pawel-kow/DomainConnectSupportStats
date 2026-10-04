# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Domain Connect Support Statistics is a **static, stateless statistics site** about how far
[Domain Connect](https://www.domainconnect.org/) is supported across the DNS providers that host
real domains. It renders the static JSON export of the Domain Connect Scanner
(pawel-kow/DomainConnectScanner, `export.py`, issue #211) and is published on GitHub Pages. Its
look and feel follow the Templates statistics dashboard at https://stats.domainconnect.org.

There is no backend and no write path: every page is a static HTML file that fetches the export's
JSON files and renders them in the browser.

## The one external input: the export contract

[contract/](contract/) is a verbatim copy of the Scanner's published export contract:
[contract/EXPORT_FORMAT.md](contract/EXPORT_FORMAT.md) (the human description of every file,
table and column, **the reference for any page work**), `contract/schemas/` (JSON Schemas) and
`contract/examples/export/` (a complete example release, the dev data set and test fixture).

- **Never read, copy or depend on DomainConnectScanner source code.** The contract is the whole
  interface. If something can't be built from it, that is a question for the maintainer (or an
  issue on the Scanner), not a reason to look at Scanner code.
- **Never edit `contract/` by hand.** It is replaced by a PR when the Scanner's format changes
  ([contract/README.md](contract/README.md)).
- Rules the contract imposes on every page (details in EXPORT_FORMAT.md):
  - read `manifest.json` first and build every file URL from `manifest.files.<kind>.path` and the
    id encoding (`src/lib/data/manifest.ts`, `encode.ts`); never hard-code paths;
  - find tables by **id**, never position or title (template cards: suffix after the last `/`,
    `findTable`);
  - **ignore unknown** files, tables, columns and keys; never depend on key order;
  - `null` is "unknown", **never zero**: show `–`, draw a gap, sort it last;
  - percentages arrive unrounded, round for display only;
  - text values come from third parties: never render them as HTML (`{@html}` is a lint error);
  - show `notes` verbatim; show `generated_at` and the domain-share import on every page;
  - import series and sweep series run on two clocks (`src/lib/series.ts`).

## Architecture

```
src/pages/<page>.html      one HTML entry per page (Vite multi-page build, no SPA)
src/entries/<page>.ts      mounts the page's view into #app
src/views/*.svelte         one view per page (Overview, Placeholder, ...)
src/lib/components/        shared UI: Layout (header/nav/footer), DataTable, TimeChart, StatCard,
                           NotFound, LoadError, Notes
src/lib/data/              the contract in code: types, id encoding, manifest paths, loader
                           (ExportClient), table lookup, data base URL config
src/lib/*.ts               pure helpers: format (numbers, dates), cells (column formatting,
                           sort, filter), series (two clocks), links (page URLs)
src/lib/styles.css         global styles and brand tokens (from stats.domainconnect.org)
public/                    copied as is: brand assets, config.js (runtime config)
scripts/                   Node scripts (run with Node's TS type stripping): release validation
                           and bundling for the deploy
contract/                  vendored export contract (see above)
tests/                     unit/, contract/, component/ (Vitest), e2e/ (Playwright)
```

Pages and their data (EXPORT_FORMAT.md "Pages"). Query parameters carry raw ids and filters only;
every view is a plain shareable link:

| Page                                    | Data                                                | State       |
| --------------------------------------- | --------------------------------------------------- | ----------- |
| `index.html`                            | `overview.json`                                     | built       |
| `dns-providers.html` (`?stack=`, `&q=`) | `dns-providers.json`                                | placeholder |
| `stacks.html`                           | `stacks.json`                                       | placeholder |
| `service-providers.html`                | `service-providers.json`                            | placeholder |
| `templates.html` (`?spid=`)             | `templates.json`                                    | placeholder |
| `dns-provider.html?id=`                 | `dns-providers/{dns_provider_id}.json`              | placeholder |
| `stack.html?id=`                        | `stacks/{provider_id}.json`                         | placeholder |
| `service-provider.html?id=`             | `service-providers/{service_provider_id}.json`      | placeholder |
| `template.html?spid=&sid=`              | `templates/{service_provider_id}/{service_id}.json` | placeholder |

A card page with a missing parameter or a 404 shows `NotFound` linking back to its list, never a
blank page. Any other load failure shows `LoadError`.

**Data location.** Pages read the release from `./data/` by default. Override at build time with
`VITE_DATA_BASE_URL`, or at runtime with `window.DC_STATS_CONFIG.dataBaseUrl` in `config.js`
(`src/lib/data/config.ts`). In `vite dev`/`vite preview`, `/data/` is served from `DATA_DIR`
(default: the contract's example export).

**Deployment.** The Scanner pushes each release to a separate data repo and sends a
`repository_dispatch` (`export-published`); `.github/workflows/deploy.yml` builds the site,
validates the release against `contract/schemas/export/`, bundles it into `dist/data/` and
publishes both as one GitHub Pages artifact. See [DEPLOYMENT.md](DEPLOYMENT.md).

## Development Commands

```bash
npm ci                                   # install (devcontainer postCreate does this)
npm run dev                              # dev server on :5173 with the example export
DATA_DIR=../data-repo npm run dev        # ... against a real release
npm run build                            # dist/ (site only, no data)
npm run preview                          # serve dist/ on :4173 with DATA_DIR under /data/

npm test                                 # Vitest: unit + contract + component
npm run test:e2e                         # Playwright: builds, previews, desktop + mobile
npm run lint                             # ESLint + Prettier check (npm run format to fix)
npm run check                            # svelte-check / TypeScript, warnings fail
npm run verify                           # all of the above, the pre-PR gate

npm run validate:export -- <releaseDir>  # validate a release against the vendored contract
npm run bundle:data -- <releaseDir> dist # validate + copy a release into dist/data/
```

## Working on This Repository (agents)

Before anything else — before even the plan file below — claim the branch mutex
(`.agent-sync.yml`, repo root): if it exists, another agent session is mid-iteration; stop and
poll every 15 minutes until it's gone. Otherwise create it atomically (fail if it already
exists) with `timestamp`/`branch`/`issue`, then sync `main` with `origin` before branching.
Remove it once the iteration is fully finished and you're back on `main`. The file is never
committed. Full rules: [DEVELOPING.md](DEVELOPING.md) §3.0.

Before changing code, write an iteration plan to `.plan/<branch-or-topic>.md` with a task
list, findings (with evidence), and decisions. **Commit and push it** — plans are tracked in
git on the feature branch so they synchronise between team members and sessions. Keep it
updated as you work — mark exactly one task `[~]` in progress, record course corrections
including your own errors, and put anything needing a human answer under "Open questions"
rather than assuming.

Before the final merge: promote durable findings to the right place (a defect found but
not fixed → file a GitHub issue with label `bug` or `refactoring` plus a `severity: *`
label; a behavioural decision or constraint → REQUIREMENTS.md; rationale → the commit
message), then `git rm -r .plan` in its own commit. CI fails any PR that still tracks
`.plan/` files.

**Open defects and follow-up work are tracked as GitHub issues, not in markdown.**

**The export contract is an input, not ours to change** ([DEVELOPING.md](DEVELOPING.md) §3.6b):
updates arrive as a verbatim copy in a `chore/contract-*` PR; a page that needs data the contract
doesn't have is a question for the maintainer, not a workaround.

**Git in the devcontainer:** `origin` is an SSH URL and no SSH key is available; push and pull
over HTTPS with the `gh` credentials, e.g.
`git -c url.https://github.com/.insteadOf=git@github.com: -c credential.helper= -c 'credential.helper=!gh auth git-credential' push`.
Pushing changes under `.github/workflows/` needs a token with the `workflow` scope.

Full rules: [DEVELOPING.md](DEVELOPING.md) §3.8. Conventions for code, tests, review and
deployment: [DEVELOPING.md](DEVELOPING.md), [TESTING.md](TESTING.md),
[DEPLOYMENT.md](DEPLOYMENT.md). What the site must do: [REQUIREMENTS.md](REQUIREMENTS.md).

## File Reference

- `src/lib/data/encode.ts`: the contract's id ↔ path-segment encoding
- `src/lib/data/manifest.ts`: `SUPPORTED_FORMAT_VERSION`, `filePath()` from manifest path templates
- `src/lib/data/load.ts`: `ExportClient` (manifest once, files by kind + raw ids, `NotFoundError`, `ReleaseMismatchError`)
- `src/lib/data/config.ts`: data base URL precedence (runtime → build time → `./data/`)
- `src/lib/data/tables.ts`: `findTable()` by id (template-card suffix), `oneRecord()`
- `src/lib/data/types.ts`: types of the export (only what the site reads)
- `src/lib/format.ts`, `cells.ts`, `series.ts`, `links.ts`: pure display/series/URL helpers (`safeUrl` for URLs from the data)
- `src/lib/components/`: shared Svelte components
- `src/lib/styles.css`: global styles; brand tokens shared with stats.domainconnect.org
- `src/views/`: page views; `src/pages/`: HTML entries; `src/entries/`: mount scripts
- `public/config.js`: optional runtime config (`window.DC_STATS_CONFIG`)
- `scripts/export-release.ts`: `validateRelease()` (schemas, one `generated_at`, counts, card presence)
- `scripts/validate-export.ts`, `scripts/bundle-data.ts`: CLIs over it, used by CI and deploy
- `vite.config.ts`: multi-page inputs, relative base, `/data/` dev/preview middleware, Vitest config
- `playwright.config.ts`: e2e against `vite preview`, desktop + mobile projects
- `.github/workflows/ci.yml`: PR/push gates and the `.plan/` merge gate
- `.github/workflows/deploy.yml`: Pages deploy (push, `repository_dispatch`, daily, manual)
- `contract/`: vendored export contract ([contract/README.md](contract/README.md))
- `README.md`: overview for users and contributors
- `REQUIREMENTS.md`: what the site must do, and the constraints that bind it
- `DEVELOPING.md`: code and process conventions, including the agentic workflow rules
- `TESTING.md`: test strategy and layers
- `DEPLOYMENT.md`: hosting, data repo, publish contract, operations
