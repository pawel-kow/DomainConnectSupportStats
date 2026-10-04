# Templates list — iteration plan

**Branch:** feat/templates-list **Started:** 2026-10-04 **Issue:** #6
**Goal:** `templates.html` (`?spid=`, `&q=`, `&all=`) lists every template per F-1.5 with e2e coverage, docs and version 0.5.0.

## Tasks

- [x] Investigate contract, DNS providers list, decisions with the maintainer
- [x] Scanner issue: `logo_url` in `templates.json`
- [x] Unit tests (TDD) for the list helper (spid filter, never-probed hidden)
- [x] Templates view, entry, links (`q`, `all`)
- [x] E2E spec (content, links, spid filter, search in URL, mobile)
- [x] Docs (CLAUDE.md page table, REQUIREMENTS F-1d), version 0.5.0, CHANGELOG
- [~] Real-release check, screenshots, maintainer acceptance
- [ ] Promote findings, delete this file

## Findings

- `templates.json` `service_templates` has no logo; `logo_url` only on each template card — contract/EXPORT_FORMAT.md "templates.json"
- `provider_id` there is the service provider id — EXPORT_FORMAT.md "templates.json"
- Example export: 5 templates, none with `total` 0 — contract/examples/export/templates.json

- Scanner issue for `logo_url`: pawel-kow/DomainConnectScanner#224
- `npm run verify` green: 204 Vitest, 158 Playwright; templates spec 95/95 with `--repeat-each=5`
- No data repo checked out; stress copy (305 templates, long names and ids, 24 never probed): pages at 20, wraps, no horizontal scroll on Pixel 7

## Decisions

- Logos: no logos until the contract carries `logo_url` in `templates.json` (Scanner issue); no per-row card fetch
- Never probed (`total` 0): hidden by default, "show all (N hidden)" toggle, `&all=1`; shown as "Not probed yet"
- Columns: template (card link) with service id below; service provider (card link); added; supported (of total, %); not supported (%); reach (domains, % of scanned). Phone: template, supported, reach
- `?q=` and `&all=` follow the search box and toggle, as on DNS providers
- Version: minor (new page) → 0.5.0

## Corrections

- Link e2e failed on the card's logo from a non-existent example host: the test routes `logo.png`, like the card spec

## Open questions
