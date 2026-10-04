# Service provider card — iteration plan

**Branch:** feat/service-provider-card **Started:** 2026-10-04 **Issue:** #9
**Goal:** `service-provider.html?id=` renders `service-providers/{id}.json` (F-1.8), with e2e,
docs and version 0.6.0.

## Tasks

- [x] Investigate contract, example cards, Template view
- [x] Helper `src/lib/service-providers.ts` (per-template series, chart selection) + unit tests
- [x] View `ServiceProvider.svelte`, entry
- [x] E2E spec `tests/e2e/service-provider.spec.ts`
- [~] Stress copy check (many templates, long names, nulls), screenshots to maintainer
- [x] Docs (CLAUDE.md, REQUIREMENTS.md F-1e, CHANGELOG), version 0.6.0
- [ ] Promote findings, delete this file

## Findings

- Card tables `service_provider`, `support` (one record each), `templates`, `support_history`
  (long format, one row per sweep × template) — contract/EXPORT_FORMAT.md:543-602
- Example: 3 cards; `unnamed.example` has `name` null; history rows of a template may be missing
  for some sweeps (`mail` absent at sweep 3) — contract/examples/export/service-providers/
- No logo for a service provider in the export.
- Stress copy (32 templates, long names and ids, null reach, missing sweeps, one template
  without history): no horizontal scroll at Pixel 7; `npm run verify` green (208 Vitest, 180
  Playwright).
- No data repo yet (#12): real-release check replaced by a stress copy of the example.

## Decisions

- Chart: lines for the 7 templates with most reach (templates table order); a checkbox list turns
  any template's line on/off; selection not in the URL (maintainer).
- Templates table: template (card link, service id below), version, added, updated, supporting,
  reach, reach %; phone: template, supporting, reach %; filter, pages of 20 (maintainer).
- Layout: title (name, id), headline (templates, supporting DNS providers, domains reached),
  chart, templates, details (first added, last updated), notes.
- A template keeps its colour when lines are toggled (colour by its position in the order).
- Version: minor (new page).

## Corrections

- Chart.js legend took half the phone chart with 7 long names; hidden when the picker (with
  colour swatches) is shown.

## Open questions
