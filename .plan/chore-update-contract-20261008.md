# Contract 2026-10-08 — iteration plan

**Branch:** chore/update-contract-20261008 **Started:** 2026-10-08 **Issue:** none (#45 follow-up)
**Goal:** vendored export contract (schema_version 15) merged with tests green and version bumped.

## Tasks

- [x] Re-test against the new contract
- [~] Version 0.15.1, CHANGELOG
- [ ] Update #45 with the new contract fields
- [ ] Methodology screenshots, draft PR, acceptance
- [ ] Promote findings, delete this file

## Findings

- Additive: format_version 1, schema_version 14 → 15; manifest `share_import.started_at`/`completed_at`, `latest_sweep`, `latest_full_sweep`; `completed_at` in every sweep row; window-based `known_dns_providers`/`published_templates`; notes name the import by time — contract/export/EXPORT_FORMAT.md diff
- `npm run verify` green without code changes: 362 e2e passed, 6 skipped; example export: 24 files valid
- Sweep tables render as charts only, so the new `completed_at` column shows nowhere — src/views/*.svelte
- METHODOLOGY.md gained §5.3 "sweep completion" text, baked into methodology.html

## Decisions

- Patch bump 0.15.1 (maintainer): methodology text only
- Annotation via the manifest fields stays in #45 (maintainer: update #45)

## Corrections

## Open questions
