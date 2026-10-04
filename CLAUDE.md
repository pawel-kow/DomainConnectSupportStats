# CLAUDE.md

Guidance for Claude Code (claude.ai/code) in this repository.

## Project Overview

**Static, stateless statistics site** on [Domain Connect](https://www.domainconnect.org/) support
across the DNS providers hosting real domains. It renders the static JSON export of the Domain
Connect Scanner (pawel-kow/DomainConnectScanner, `export.py`) and is published on GitHub Pages.
Look and feel: the Templates statistics dashboard at https://stats.domainconnect.org.

No backend, no write path: every page is a static HTML file that fetches the export's JSON files.

## Writing

All text (docs, comments, commits, PRs, issues, UI) is concise: facts in short words; rationale
only when far from obvious; never alternatives or justification by contrast; current state only,
no references to issues, requirement ids, dates or history. History: [CHANGELOG.md](CHANGELOG.md).
Details: [DEVELOPING.md](DEVELOPING.md) §1.

## The one external input: the export contract

[contract/](contract/) is a verbatim copy of the Scanner's export contract:
[contract/EXPORT_FORMAT.md](contract/EXPORT_FORMAT.md) (every file, table and column; **the
reference for page work**), `contract/schemas/` (JSON Schemas), `contract/examples/export/`
(complete example release; dev data set and test fixture).

- **Never read, copy or depend on DomainConnectScanner source code.** What the contract doesn't
  say is a question for the maintainer or a Scanner issue.
- **Never edit `contract/` by hand.** It is replaced by a PR ([contract/README.md](contract/README.md)).
- Rules for every page (details in EXPORT_FORMAT.md):
  - read `manifest.json` first; build every file URL from `manifest.files.<kind>.path` and the id
    encoding (`src/lib/data/manifest.ts`, `encode.ts`); never hard-code paths;
  - find tables by **id**, never position or title (template cards: suffix after the last `/`,
    `findTable`);
  - **ignore unknown** files, tables, columns and keys; never depend on key order;
  - `null` is "unknown", **never zero**: show `–`, draw a gap, sort it last;
  - percentages arrive unrounded; round for display only;
  - text values come from third parties: never render them as HTML (`{@html}` is a lint error);
  - show `notes` verbatim; show `generated_at` and the domain-share import on every page;
  - import series and sweep series run on two clocks (`src/lib/series.ts`).

## Architecture

```
src/pages/<page>.html      one HTML entry per page (Vite multi-page build)
src/entries/<page>.ts      mounts the page's view into #app
src/views/*.svelte         one view per page (Overview, Placeholder, ...)
src/lib/components/        shared UI: Layout (header/nav/footer), DataTable, TimeChart, StatCard,
                           NotFound, LoadError, Notes
src/lib/data/              the contract in code: types, id encoding, manifest paths, loader
                           (ExportClient), table lookup, data base URL config
src/lib/*.ts               pure helpers: format (numbers, dates), cells (column formatting,
                           sort, filter), series (two clocks), links (page URLs)
src/lib/styles.css         global styles, brand tokens (from stats.domainconnect.org)
public/                    copied as is: brand assets, config.js (runtime config)
scripts/                   Node scripts (Node TS type stripping): release validation and
                           bundling, version/CHANGELOG check, release notes
contract/                  vendored export contract
tests/                     unit/, contract/, component/ (Vitest), e2e/ (Playwright)
```

Pages and their data (EXPORT_FORMAT.md "Pages"). Query parameters carry raw ids and filters only;
every view is a shareable link:

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

A card page with a missing parameter or a 404 shows `NotFound` linking to its list; any other load
failure shows `LoadError`. Never a blank page.

**Data location.** Default `./data/`. Build time: `VITE_DATA_BASE_URL`. Runtime:
`window.DC_STATS_CONFIG.dataBaseUrl` in `config.js` (`src/lib/data/config.ts`). `vite dev` and
`vite preview` serve `/data/` from `DATA_DIR` (default: the contract's example export).

**Version.** `package.json` `version`, injected at build time as `__APP_VERSION__`, shown in the
footer.

**Deployment.** Merging a new version to `main` tags `v<version>`, waits for approval in
environment `release`, then deploys. Data releases (`repository_dispatch` `export-published`,
daily, manual) redeploy the latest GitHub Release with the current data. `deploy.yml` validates
the release against `contract/schemas/export/` and bundles it into `dist/data/`.
[DEPLOYMENT.md](DEPLOYMENT.md).

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
npm run check:version                    # package.json version has a CHANGELOG section
npm run verify                           # all of the above, the pre-PR gate

npm run validate:export -- <releaseDir>  # validate a release against the vendored contract
npm run bundle:data -- <releaseDir> dist # validate + copy a release into dist/data/
npm run release:notes -- <version>       # print the CHANGELOG section of a version
```

## Working on This Repository (agents)

Full rules: [DEVELOPING.md](DEVELOPING.md) §3.

1. **Branch mutex first** (§3.1): if `.agent-sync.yml` exists, stop and poll every 15 minutes.
   Otherwise create it atomically with `timestamp`/`branch`/`issue`, sync `main` with `origin`,
   branch. Never commit it; remove it when finished and back on `main`.
2. **Plan** (§3.11): before changing code, write `.plan/<branch-or-topic>.md` (tasks, findings
   with evidence, decisions, corrections, open questions), commit and push it, keep it current,
   exactly one task `[~]`.
3. **Version** (§3.10): a PR that changes the site bumps `package.json` and adds a CHANGELOG
   section. Major: page or URL parameter removed/changed incompatibly. Minor: new page, feature or
   visible content. Patch: fixes, styling, dependencies. Docs/tests/CI only: no bump. **Ask the
   maintainer when the level is not obvious.**
4. **Screenshots** (§3.6): a PR that changes a page, component or style shows screenshots of every
   affected page (desktop and phone) to the maintainer in the chat; it is marked ready only after
   acceptance.
5. **Before merge:** defects found but not fixed → GitHub issue (`bug` or `refactoring` plus a
   `severity: *` label); behavioural decisions → REQUIREMENTS.md; rationale, if needed → commit
   message. Then `git rm -r .plan` in its own commit (CI fails otherwise).

Open defects and follow-up work are GitHub issues, not markdown.

The export contract is an input (§3.9): updates arrive verbatim in a `chore/contract-*` PR; data
the contract lacks is a question for the maintainer.

**Git in the devcontainer:** `origin` is SSH and no key is available; use HTTPS with `gh`
credentials:
`git -c url.https://github.com/.insteadOf=git@github.com: -c credential.helper= -c 'credential.helper=!gh auth git-credential' push`.
Pushing `.github/workflows/` changes needs a token with the `workflow` scope.

## File Reference

- `src/lib/data/encode.ts`: id ↔ path-segment encoding
- `src/lib/data/manifest.ts`: `SUPPORTED_FORMAT_VERSION`, `filePath()` from manifest path templates
- `src/lib/data/load.ts`: `ExportClient` (manifest once, files by kind + raw ids, `NotFoundError`, `ReleaseMismatchError`)
- `src/lib/data/config.ts`: data base URL precedence (runtime → build time → `./data/`)
- `src/lib/data/tables.ts`: `findTable()` by id (template-card suffix), `oneRecord()`
- `src/lib/data/types.ts`: types of the export (only what the site reads)
- `src/lib/format.ts`, `cells.ts`, `series.ts`, `links.ts`: pure display/series/URL helpers (`safeUrl` for URLs from the data)
- `src/lib/components/`: shared Svelte components
- `src/lib/styles.css`: global styles, brand tokens
- `src/views/`: page views; `src/pages/`: HTML entries; `src/entries/`: mount scripts
- `src/env.d.ts`: build-time constants (`__APP_VERSION__`)
- `public/config.js`: optional runtime config (`window.DC_STATS_CONFIG`)
- `scripts/export-release.ts`: `validateRelease()` (schemas, one `generated_at`, counts, card presence)
- `scripts/validate-export.ts`, `scripts/bundle-data.ts`: CLIs over it, used by CI and deploy
- `scripts/changelog.ts`: CHANGELOG parsing; `scripts/check-version.ts`, `scripts/release-notes.ts`: CLIs over it
- `vite.config.ts`: multi-page inputs, relative base, `__APP_VERSION__`, `/data/` dev/preview middleware, Vitest config
- `playwright.config.ts`: e2e against `vite preview`, desktop + mobile
- `.github/workflows/ci.yml`: PR/push gates, `.plan/` merge gate
- `.github/workflows/deploy.yml`: tag on merge, approval, Pages deploy
- `contract/`: vendored export contract
- `CHANGELOG.md`: changes per version
- `README.md`, `REQUIREMENTS.md`, `DEVELOPING.md`, `TESTING.md`, `DEPLOYMENT.md`
