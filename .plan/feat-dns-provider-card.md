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
- [x] Step 2: registry data in this repo
  - [x] `registry/schema/provider.schema.json` (draft 2020-12, from the issue's field table)
  - [x] `registry/examples/` (cloudflare, ionos, plesk; placeholder SVG logos)
  - [x] `registryPath()` in `src/lib/registry/path.ts` (`tests/unit/registry-path.test.ts`)
  - [x] `scripts/registry.ts` (`validateRegistry()` → `{entries: {providerId, file, logo?}[], errors}`, `entryPath()`), CLI `scripts/validate-registry.ts`, `npm run validate:registry`, CI step; `tests/contract/example-registry.test.ts`
- [x] Step 3: registry on the site
  - [x] `resolveBaseUrl`/`registryBaseUrl()` (config.ts; runtime `registryBaseUrl`, `VITE_REGISTRY_BASE_URL`, `./registry/`); vite middleware `serveInputs()` serves `/registry/` from `REGISTRY_DIR` (default `registry/examples`)
  - [x] `src/lib/registry/entry.ts` (`parseEntry`, `FEATURES`, `parseSource`), `load.ts` (`RegistryClient.entry/logoUrl/source`, `entryFileUrl`); `entryPath` moved to `path.ts`; `formatFlag`, `safeMailto`
  - [x] `src/lib/components/Registry.svelte`, wired in `DnsProvider.svelte` before the headline
  - [x] tests: unit `registry-entry`, `registry-load`, config/format/links; component `Registry.test.ts`; e2e cards 1, 2, 3, 5, 6, 4, 500, missing registry.json (registry.json routed in e2e)
- [x] Step 3b: card layout (maintainer)
  - [x] order: title (name, registry logo; small id/stack line), headline, contact block, domain share over time, supported templates over time, supported templates, registry details, settings, notes, owned URLs
  - [x] components `CardTitle`, `RegistryContact`, `Registry` (details), `ExternalLink`, `ContactList`; `.record`/`.plain` global; REQUIREMENTS.md F-1a; comment on #8
- [x] Step 3c: trim the card (maintainer)
  - [x] Registry: hide every row whose value is unknown (null/absent/empty list) in `RegistryContact` and `Registry` (onboarding facts, features incl. tri-state `null`, partner, notes); hide a feature group with no rows, the Features/Onboarding sub-heading when empty, and the whole contact block / details section when nothing is left (the entry link alone does not keep the details section)
  - [x] `DnsProvider.svelte`: remove the `DataTable`s under "Domain share over time" and "Supported templates over time"; keep the empty-history text ("Not measured yet") when a history has no rows
  - [x] tests: component (`Registry.test.ts`: `–` assertions → rows absent; Plesk/IONOS sparse entries), e2e (`draws both charts…` row counts → charts only; IONOS/Plesk sections), CardTitle unchanged
  - [x] screenshots desktop + phone (cards 1, 2, 5), commit, push
- [x] Step 3d: hide non-public ids (maintainer)
  - [x] `isPublicKey()` (cells.ts): `DataTable` never shows `id`, `dns_provider_id`, `import_id`, `sweep_id`, also when listed in `keys`
  - [x] DNS provider card: title line "Stack …" only; not-found "This DNS provider"; name fallback "Unnamed DNS provider"
  - [x] `Layout.svelte` banner: "scan completed <time>" from overview `adoption.completed_at` (prop `client`); "latest scan" while loading or when unknown
  - [x] `Overview.svelte`: tooltips without import/sweep id; stat card "scan of <date>" (`started_at`, else `completed_at`)
  - [x] tests: unit `isPublicKey`, component DataTable/Layout, e2e overview "shows no internal id", card title/not-found
  - [x] overview: adoption and ecosystem tables removed (C-11 changed)
  - [x] REQUIREMENTS.md F-2.1, F-2.9; screenshots desktop + phone (overview, cards 1, 4, 999)
- [x] Step 4: deploy
  - [x] `bundleRegistry()` (scripts/registry.ts), CLI `scripts/bundle-registry.ts <dir> <dist> <owner/name> <commit>`, `npm run bundle:registry`; contract tests
  - [x] `deploy.yml`: `REGISTRY_REPO` required, `REGISTRY_REF`; checkout `registry-data`; validate + bundle into `dist/registry/`; run summary line
  - [x] footer "Registry <short commit>" → `github.com/<repo>/tree/<commit>` (Layout prop `registry`; `RegistryClient.source()` fetched once; DnsProvider passes its client); e2e fixture routes `registry.json` for every page
  - [x] DEPLOYMENT.md (§1, §2.1, new §2.3 registry repo, §3, §4)
- [~] Step 5: finish (start here)
  - [x] docs (CLAUDE.md page table + file reference, REQUIREMENTS.md F-1.6/F-1a/F-3.6, README, TESTING.md), version 0.2.0 + CHANGELOG
  - [x] `npm run verify` green (72 e2e)
  - [~] screenshots desktop + phone (overview, cards 1, 2, 4, 5, 999) shown; waiting for maintainer acceptance
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
- Registry schema: `$id` `https://github.com/Domain-Connect/DnsProviders/schema/provider.schema.json` (proposed repo); unknown keys allowed; URLs `^https?://`; `logo` a file name ending `.svg|.png|.jpg`; email contacts need an `@`, url contacts a URL.
- Settings URLs are links only through `safeUrl`, `rel="nofollow noopener noreferrer"`.
- Registry repository and commit: `registry/registry.json` `{repository, commit}` written by the bundle step; the site reads it for the entry's repository link (and the footer, step 4). Missing or invalid: no link (maintainer).
- Card layout (REQUIREMENTS.md F-1a, also for the stack card #8): title with name and registry logo, id/stack small; headline; contact block (website, documentation, technical contact, onboarding contact, request form, process documentation); domain share over time; supported templates over time; supported templates; registry details (onboarding facts, features, notes, entry link); settings; notes; owned URLs (maintainer).
- Registry entries: unknown or empty values are not shown; no `–` rows (maintainer). Partner is its own row ("Partner") after the flags; a details section with only the entry link is not shown.
- Charts without data tables on every page, the overview included; C-11 changed (maintainer).
- A deployment of a multi-deployment stack shows the stack's logo; title line "Stack Plesk (plesk.com)"; contact block "Contact of stack Plesk" (maintainer).
- Deployed registry layout as in the issue: `registry/<a>/<b>/<encoded file>` (no `providers/`); dev/preview map `/registry/<a>/<b>/<seg>` to `REGISTRY_DIR/providers/<a>/<b>/<decoded seg>`, `/registry/registry.json` to `REGISTRY_DIR/registry.json`.
- Logo URL: `<a>/<b>/<encodeSegment(logo)>`, `<a>/<b>` from the providerId.
- "Registry entry of stack <name>": stack card (`stack` kind, table `stack`, `deployments`, `name`) fetched only when an entry exists; `deployments > 1` → stack heading linking the stack card; fetch failure → stack heading with the `provider_id`.

- Footer registry commit on every page: one `registry.json` request per page; no link when missing or invalid.
- Registry repo public: no token secret.
- Registry changes deploy with the next data deploy (daily or by hand); no dispatch type for the registry.

- Banner time: the manifest's `share_import` has no time; Layout fetches `overview.json` for the import's `completed_at` (one extra request per page).

## Corrections

- Share axis ticks repeated "0.5%" (one-decimal rounding at small ranges): ticks now up to 2 decimals.
- Share history table overflowed at 1280 px: `source` column not shown (status says pruned/completed).
- `pkill -f` on the preview server killed the agent's own shell (pattern matched the command line): stop preview servers by PID from `ss -ltnp`.


## Open questions

- Export `notes` (shown verbatim) contain import ids, e.g. "Domain share: import 1780272000 …": asked in pawel-kow/DomainConnectScanner#220; shown verbatim until a contract update.
- Registry: repository owner/name, logo licence, entry maintenance, per-deployment entries (issue #7 "Open questions"); not blocking.
