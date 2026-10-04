# Project initialization — iteration plan

**Branch:** chore/init **Started:** 2026-10-04 **Issue:** #1
**Goal:** A buildable, tested, deployable Svelte/Vite multi-page site skeleton that follows the
adapted process docs, with the overview page (`index.html`) rendering the vendored example export.

## Tasks

- [x] Read inputs: issue pawel-kow/DomainConnectScanner#211 "Future frontend", EXPORT_FORMAT.md,
      schemas, example export, existing stats page, Scanner process docs
- [x] Clarify open decisions with the maintainer (see Decisions)
- [x] Vendor the export contract into `contract/`
- [x] Repo hygiene: .gitignore, devcontainer (Node only), .claude settings, remove .venv
- [x] Vite + Svelte 5 + TS multi-page scaffold (9 HTML entries, base path + data URL configurable)
- [x] Shared lib: id encoding, manifest/path building, fetch + not-found, formatting, two-clock series
- [x] Shared components: header/footer/layout (stats.domainconnect.org look), generic data table, not-found
- [x] Overview page: headline numbers, adoption + ecosystem chart (Chart.js), notes/caveats
- [x] Placeholder for the 8 other pages (render header + "coming soon" linking to overview)
- [x] Tests: Vitest unit, ajv contract tests, Svelte component tests, Playwright e2e
- [x] CI workflow (lint, typecheck, tests, build, e2e, `.plan/` gate)
- [x] Pages deploy workflow (repository_dispatch + schedule + manual; checkout data repo; validate; deploy)
- [x] Process docs adapted: CLAUDE.md, DEVELOPING.md, TESTING.md, DEPLOYMENT.md, README.md, REQUIREMENTS.md
- [x] File follow-up issues for the remaining pages (#3–#10; chart overlap #11)
- [x] Promote findings, `git rm -r .plan`

## Findings

- Release validation: the example export is 24 files; a release missing `stacks.json` is refused by `bundle-data.ts` (exit 1) — local run 2026-10-04
- The bundled `dist/` works served statically under a sub-path (`/DomainConnectSupportStats/index.html`, python http.server) — screenshot check 2026-10-04
- Chromium needed `npx playwright install-deps` in this container (libatk missing); the new devcontainer postCreate does `--with-deps`
- Overview chart: "Supported templates" is constant 3 in the example and is drawn under the other right-axis lines; acceptable with legend toggling, revisit with real data
- Export contract: format_version 1; every data file is `{generated_at, notes, tables{id:{title,columns,rows,footer}}}`;
  ids encoded with the `~xx` rule; manifest `files.<kind>.path` is authoritative — `.inputs/scanner_input/EXPORT_FORMAT.md`
- Template card table ids are prefixed `<spid>/<sid>/` — find by suffix after last `/` — EXPORT_FORMAT.md "templates/…"
- Two clocks: import series vs sweep series; place import at `adoption.started_at`, fallback `completed_at`,
  then `import_id` as epoch; gaps are not zeros — EXPORT_FORMAT.md "Time series"
- Existing stats page: vanilla HTML + Plotly, brand tokens in `styles.css` (`--primary-navy #03263B`, `--accent-cyan #00bfff`,
  `--accent-coral #ff6663`, …), white header with logo, navy footer — `.inputs/DomainConnectTemplateStatsPage/`
- Repo origin uses SSH, which is not available in the devcontainer; `gh` HTTPS credentials work
  (`git -c url.https://github.com/.insteadOf=git@github.com: …`)
- `gh` token lacks `read:project`, so the issue cannot be moved to "In Progress" on a project board by the agent

## Decisions

- Svelte 5 + TS, Vite multi-page (maintainer)
- Chart.js, not Plotly (maintainer) — lighter; colours taken from the brand tokens to stay aligned
- Separate data repo, name in repo variable `DATA_REPO`; Scanner pushes, then `repository_dispatch`
  (`event_type: export-published`) triggers build+deploy here; scheduled fallback (maintainer)
- github.io for now; `base` is relative (`./`) so the site works under any path (maintainer: no custom domain yet)
- Contract vendored under `contract/`, updated by PR; deploy validates the incoming data release against it (maintainer)
- Node-only tooling, Python removed from devcontainer (maintainer)
- Test layers: Vitest unit, ajv contract, Svelte component (jsdom), Playwright e2e (maintainer)
- Data URL: default `./data/` (bundled by deploy), overridable at build time (`VITE_DATA_BASE_URL`) and at
  runtime (`?data=` is NOT used — query params carry only ids/filters per spec; runtime override is
  `window.DC_STATS_CONFIG.dataBaseUrl` in an optional `config.js`)

## Corrections

- Tests were written right after each module, not strictly before (TDD order not followed for the scaffold). They found two real defects: `validateRelease` crashed on a file without `tables` (now guarded, covered by a corrupted-copy test); null cells in numeric columns were left-aligned (alignment is now per column).
- `kill $(pgrep -f "vite preview")` matched and killed its own shell, so the files written in that command were lost and re-written; use `fuser -k <port>/tcp`.
- Playwright `reuseExistingServer` would reuse a stale preview locally: disabled.

## Open questions

- Push of this branch is blocked: the gh token lacks the `workflow` scope needed to push `.github/workflows/` — maintainer runs `gh auth refresh -s workflow` (or pushes)
- Severity labels (`severity: *`) do not exist in this repo yet; creating labels is outside the agent's gh scope

- Data repo name and creation — maintainer creates it; layout documented in DEPLOYMENT.md
