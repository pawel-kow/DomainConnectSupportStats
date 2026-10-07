# leaderboards — iteration plan

**Branch:** feat/leaderboards **Started:** 2026-10-07 **Issue:** #15
**Goal:** `leaderboards.html` with the F-4 boards, and on the overview "new supporting DNS
providers (30 days)" plus a Most improved top 5, from the current export and a derived file.

## Tasks

- [x] Investigate: issue, Scanner #229 (merged 2026-10-06), real release 20261007T151005Z
- [x] Decisions with the maintainer (below)
- [x] Step 1: contract vendored in PR #38 (`chore/contract-supported-templates`, upstream
      `docs/` at Scanner f4c50aa, incl. METHODOLOGY.md, without the per-report examples). Merged; this branch
      is rebased on `main`.
- [x] Step 2: `scripts/derive.ts` (`deriveLeaderboards()`, tests `tests/unit/derive.test.ts`),
      CLI `scripts/derive-data.ts [releaseDir=$DATA_DIR|example] [outDir=.derived]`
      (`npm run derive`). Output `leaderboards.json`: `{generated_at, first_sweep: {sweep_id,
      started_at} | null, first_support: [{dns_provider_id, sweep_id, started_at,
      supported_templates}]}`, newest first, export's first sweep left out; scannerStartDate
      and the 30-day window are the site's job. Deploy: step after `bundle:data`
      (`npm run derive -- dist/data dist/data/derived`). Vite serves `DERIVED_DIR` (default
      `.derived/`, gitignored) as `/data/derived/`; Playwright runs `npm run derive` before
      preview. Real release: Webnames.ca (2774, sweep 3) only, first sweep 2.
- [x] Step 3: `src/lib/leaderboards.ts` (tests `tests/unit/leaderboards.test.ts`): `entrants()`
      (stacks folded, `reachedDomains` = domains of supporting deployments), `topByTemplates`,
      `topByDomains`, `mostImproved(window)`, `topReach`, `newSupporting`, `improvedWindow`
      (`?window=90d`, else `sweep`). Types in `src/lib/data/derived.ts` (shared with
      `scripts/derive.ts`); `ExportClient.leaderboards()` rejects another `generated_at`.
- [x] Step 4: `leaderboards.html` (`src/views/Leaderboards.svelte`, components `Board`,
      `NewSupporters`), nav entry "Leaderboards", e2e `tests/e2e/leaderboards.spec.ts`. Six boards:
      templates, domains reached, most improved (`?window=90d`), new supporting (30 days, derived
      file; its load error stays inside its panel), template reach, service provider reach.
- [x] Step 5: overview: new supporting DNS providers (30 days), Most improved top 5, side by side
      (stacked below 900px), each loading on its own (errors stay in the panel)
- [~] Step 6: real-release check done (20261007T151005Z: validate, derive, e2e without page
      errors beyond example-value assertions, preview screenshots); docs updated; 0.12.0 +
      CHANGELOG; `npm run verify` green. Waiting: maintainer acceptance of the screenshots.
- [ ] Promote findings, `git rm -r .plan`

## Decisions (maintainer, 2026-10-07)

- Placement: new page `leaderboards.html` with all boards. The overview gets only:
  - **New supporting DNS providers, last 30 days**, all of them (no size limit), newest first;
  - **Most improved** top 5 (window: since the previous sweep), with a link to the page;
  - both below "Domain Connect support over time", before "About these numbers"; side by side
    on desktop, stacked on phone.
- Most improved window: both, switched with `?window=`; default since the previous sweep
  (`supported_templates_change`), other ~90 days (`supported_templates_change_90d`). Empty
  window says so.
- Stacks replace grouped providers on the boards: one row per stack (from `stacks.json`, linking
  to `stack.html`) for DNS providers with a `provider_id` of a stack; one row per DNS provider
  otherwise (linking to `dns-provider.html`). Mixed lists.
- Board size: top 10; only positive ranked value (positive change for Most improved); `null`
  left out; ties by domains, then name.
- "New supporting DNS provider": first `support_history` row with `supported_templates` > 0;
  date = that sweep's `started_at`. Left out when that sweep started before the scanner start
  (`scannerStartDate`, runtime config) or is the export's first sweep. Within 30 days before
  `generated_at`. One row per DNS provider (deployment), linking to its card, stack name shown.
- Derived data: post-processing script over the release (`derived/` next to the export); the site
  rejects it when its `generated_at` differs from the manifest's.

## Findings

- Release 20261007T151005Z: 2912 DNS providers, 25 stacks, `format_version` 1, schema 14.
  249 DNS providers with `supported_templates` > 0.
- `supported_templates_change`: 13 non-zero (Plesk ×5 at 104, AS207960 129, NameSilo 116,
  Danego 110, Webnames.ca 103, Domain Chief 102, Cloudflare 39, GoDaddy 2, Secure Server 2).
  `supported_templates_change_90d`: `null` for all 2912 (first sweep 2026-09-20).
- Top by templates: Plesk deployments take 5 of the top 6 → stack folding.
- `first_seen_at` is only on the DNS provider card; all 2912 are 2026-09.
- Newly supporting today (rule above): Webnames.ca only (0 → 164 on 2026-09-27).
- `METHODOLOGY.md` is vendored (maintainer copied it).

- Real release: most DNS providers with support declare a one-deployment stack, so the boards
  show mostly stack rows ("Stack · 1 deployment"). Plesk (2886 deployments) leads templates.
- Unhandled rejections: a promise rendered by a nested `{#await}` that shows only after the outer
  load needs its own `.catch`, else a pageerror (overview, leaderboards).

## Corrections

- The new example export changed values and order (verify template gained a supporter); unit and
  e2e tests that pinned them were updated in #38. `example.db*` files from the maintainer's copy
  are not upstream-tracked and were left out (moved to the session scratchpad).

## Open questions

- none
