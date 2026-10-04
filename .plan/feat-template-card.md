# Template card — iteration plan

**Branch:** feat/template-card **Started:** 2026-10-04 **Issue:** #10
**Goal:** `template.html?spid=&sid=` renders the template card per F-1.9 with e2e coverage, docs and version 0.4.0.

## Tasks

- [x] Investigate contract, existing card, decisions with the maintainer
- [~] Unit tests (TDD) for record details helper
- [ ] Template view, entry, links
- [ ] E2E spec (content, links, not-found, caveat, mobile)
- [ ] Docs (CLAUDE.md page table, REQUIREMENTS F-1c + C-7), version 0.4.0, CHANGELOG
- [ ] Real-release check, screenshots, maintainer acceptance
- [ ] Promote findings, delete this file

## Findings

- Table ids prefixed `<spid>/<sid>/`; `findTable` suffix match covers it — src/lib/data/tables.ts
- Records columns vary; numbers may be strings; header = key verbatim — EXPORT_FORMAT.md "records"
- Default `formatCell` would show `port` 5060 as "5,060" — src/lib/cells.ts `count` kind; records need verbatim values
- Example `template1`: history last 4, supporters 3 rows → caveat case — contract/examples/export/templates/exampleservice.domainconnect.org/template1.json
- `unnamed.example/x`: null name and provider name, no supporters, null logo — edge case fixture

## Decisions

- Logo: `<img>` from `logo_url` (safeUrl, no referrer), exception to C-7 until #25 bundles logos
- Order: title → headline → about (description, variables, versions, dates, SHA) → chart → supporters → records → notes
- Records: three columns at every width: type, host, every other non-null field as `key: value` in one cell, verbatim
- Caveat footnote under the chart only when the last history value differs from the supporter count
- Version: minor (new page) → 0.4.0

## Corrections

## Open questions
