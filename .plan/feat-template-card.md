# Template card — iteration plan

**Branch:** feat/template-card **Started:** 2026-10-04 **Issue:** #10
**Goal:** `template.html?spid=&sid=` renders the template card per F-1.9 with e2e coverage, docs and version 0.4.0.

## Tasks

- [x] Investigate contract, existing card, decisions with the maintainer
- [x] Unit tests (TDD) for record details helper
- [x] Template view, entry, links
- [x] E2E spec (content, links, not-found, caveat, mobile)
- [x] Docs (CLAUDE.md page table, REQUIREMENTS F-1c + C-7), version 0.4.0, CHANGELOG
- [~] Real-release check, screenshots, maintainer acceptance
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

- `npm run verify` green: 206 Vitest, 137 Playwright; template spec 160/160 with `--repeat-each=5`
- No data repo checked out; `.inputs/scanner_input/export` equals the example export. Stress copy instead: 42 supporters with long names, a 270-char DKIM TXT record: wraps, pages at 20, no horizontal scroll on Pixel 7

## Corrections

- Card-order e2e flaked once: logo and chart shift the layout as they load; the test now waits for both

## Open questions
