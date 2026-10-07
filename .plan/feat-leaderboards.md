# leaderboards — iteration plan

**Branch:** feat/leaderboards **Started:** 2026-10-07 **Issue:** #15
**Goal:** `leaderboards.html` with the F-4 boards, and on the overview "new supporting DNS
providers (30 days)" plus a Most improved top 5, from the current export and a derived file.

## Tasks

- [x] Investigate: issue, Scanner #229 (merged 2026-10-06), real release 20261007T151005Z
- [x] Decisions with the maintainer (below)
- [x] Step 1: contract vendored in PR #38 (`chore/contract-supported-templates`, upstream
      `docs/` at Scanner f4c50aa, incl. METHODOLOGY.md and report examples). This branch is
      rebased on it; rebase on `main` once #38 is merged.
- [~] Step 2: `scripts/derive-data.ts <releaseDir> <outDir>` (TDD): reads every
      `dns_provider` card via the manifest, writes `leaderboards.json` (`generated_at` of the
      release; per DNS provider the first sweep with `supported_templates` > 0, unless that is
      the export's first sweep). Deploy: after `bundle:data`, into `dist/data/derived/`. Dev:
      `npm run derive` → `.derived/` (gitignored), served as `/data/derived/`; e2e generates it
      from the example export.
- [ ] Step 3: `src/lib/leaderboards.ts` (TDD): board ranking, stack folding, windows
- [ ] Step 4: `leaderboards.html` page, nav entry, e2e
- [ ] Step 5: overview: new supporting DNS providers (30 days), Most improved top 5
- [ ] Step 6: real-release check, docs (CLAUDE.md, REQUIREMENTS.md F-4, DEPLOYMENT.md,
      DEVELOPING.md), minor version + CHANGELOG, screenshots to the maintainer
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

## Corrections

- The new example export changed values and order (verify template gained a supporter); unit and
  e2e tests that pinned them were updated in #38. `example.db*` files from the maintainer's copy
  are not upstream-tracked and were left out (moved to the session scratchpad).

## Open questions

- none
