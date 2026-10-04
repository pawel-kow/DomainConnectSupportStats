# DNS provider card — iteration plan

**Branch:** feat/dns-provider-card **Started:** 2026-10-04 **Issue:** #7
**Goal:** `dns-provider.html?id=` shows the DNS provider card from the export and its registry entry; one PR, closes #7.

Work in self-contained steps. After each step: commit, push, update this file, stop for a context
reset. Between steps keep `.agent-sync.yml` and stay on this branch.

## Tasks

- [x] Step 1: card from the export
  - [x] `src/lib/params.ts` (`textParam`, `integerParam`), `parseNameservers` (cells.ts), `needsAdoption` (series.ts); unit tests first
  - [x] `src/views/DnsProvider.svelte`: title + stack link, notes, headline (supported / not supported / not yet determined / domains / rank), settings record, supported templates (links), "Supported templates over time" chart + table, "Domain share over time" chart + table, owned URLs, not-found, load error
  - [x] e2e `tests/e2e/dns-provider.spec.ts` (cards 1, 4, 6; missing/blank/malformed/unknown id; no horizontal scroll)
  - [x] Draft PR #22
- [~] Step 2: registry data in this repo
  - [ ] `registry/schema/provider.schema.json` (draft 2020-12, from the issue's field table)
  - [ ] `registry/examples/` (cloudflare, ionos, plesk; placeholder SVG logos)
  - [ ] `registryPath()` helper `<a>/<b>/` (unit, TDD on the issue's examples)
  - [ ] `scripts/validate-registry.ts`: schema, path from `providerId`, logo exists; CI step on `registry/examples/`
- [ ] Step 3: registry on the site
  - [ ] registry base URL (runtime `registryBaseUrl`, `VITE_REGISTRY_BASE_URL`, `./registry/`), dev/preview `/registry/` from `REGISTRY_DIR`
  - [ ] loader: 404 → no section, other failure → section error; entry parsing, tri-state, unknown keys ignored
  - [ ] `Registry.svelte` section; "Registry entry of stack <name>" when the stack has several deployments
  - [ ] component + e2e tests (cards 1, 2, 5, 6, 4)
- [ ] Step 4: deploy
  - [ ] `deploy.yml`: `REGISTRY_REPO` required (fails when unset), `REGISTRY_REF`; validate; bundle into `dist/registry/` with encoded file names
  - [ ] footer shows the registry commit
  - [ ] DEPLOYMENT.md
- [ ] Step 5: finish
  - [ ] docs (CLAUDE.md page table + file reference, REQUIREMENTS.md, README, TESTING.md), version 0.2.0 + CHANGELOG
  - [ ] `npm run verify`; screenshots desktop + phone, maintainer acceptance
  - [ ] promote findings, `git rm -r .plan`, PR ready

## Findings

- No real release available: `.inputs/scanner_input/export` is identical to `contract/examples/export` (`diff -rq` empty); no data repo yet (#12).
- Card 1 `share_history` has a pruned row with `completed_at: null` (import 1767225600) — `contract/examples/export/dns-providers/1.json`; placing it needs the overview's `adoption` (or `import_id` as Unix seconds, `importTimeMs`).
- Card 4: `provider_id` null, `settings_last_status` `connection_error` with error and last-OK, `support_last_status` null, no supported templates.
- Card 6: share rank `null` at 0 domains; `support_last_seen_ok_at` older than settings.

## Decisions

- Card and registry in one PR, in steps (maintainer).
- Registry schema drafted here in `registry/schema/`; replaced verbatim once the registry repo exists (maintainer).
- `deploy.yml` fails while `REGISTRY_REPO` is unset, like `DATA_REPO` (maintainer).
- "Report a problem" link: not here, #21 (maintainer).
- Two charts: supported templates per sweep (stepped), domain share per import (`share_pct`, domains in the tooltip).
- Overview fetched only when a `share_history` row has `completed_at: null`; if that fetch fails, fall back to `import_id` as Unix seconds.
- Version bump: minor (new page content).
- Unknown id (`?id=999`): the browser logs the 404 as a console error; that e2e test opts into expected errors.
- No last-contact box: settings/support status, errors and last-success times not shown (maintainer). `src/lib/status.ts` removed with it.
- Charts speak of time only: no "import" or "sweep" in chart headings, labels or tooltips (maintainer).
- Settings URLs are links only through `safeUrl`, `rel="nofollow noopener noreferrer"`.

## Corrections

- Share axis ticks repeated "0.5%" (one-decimal rounding at small ranges): ticks now up to 2 decimals.
- Share history table overflowed at 1280 px: `source` column not shown (status says pruned/completed).
- `pkill -f` on the preview server killed the agent's own shell (pattern matched the command line): stop preview servers by PID from `ss -ltnp`.

## Open questions

- Registry: repository owner/name, logo licence, entry maintenance, per-deployment entries (issue #7 "Open questions"); not blocking.
