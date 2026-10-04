# DNS providers list — iteration plan

**Branch:** feat/dns-providers-list **Started:** 2026-10-04 **Issue:** #3
**Goal:** `dns-providers.html` lists every DNS provider from `dns-providers.json` with stack filter,
search, hide-by-default toggle, badges and caveats; tests, docs, version 0.3.0.

## Tasks

- [x] Investigate contract, existing views, DataTable, links
- [~] Unit tests + `src/lib/dns-providers.ts` (undetermined count, hidden rule, stack filter, derived column, status badges)
- [ ] `links.dnsProviders` gains `all`; tests
- [ ] View `DnsProviders.svelte`, entry, badge style; URL kept in sync (`replaceState`)
- [ ] Card view reuses the undetermined helper
- [ ] E2E spec `dns-providers.spec.ts`
- [ ] Docs (CLAUDE.md page table, REQUIREMENTS.md, TESTING.md), version 0.3.0, CHANGELOG
- [ ] `npm run verify`, draft PR, screenshots desktop + phone, maintainer acceptance
- [ ] Promote findings, delete this file

## Findings

- Example `dns_providers`: 6 rows; hidden by the rule: id 3 (support `dead`), id 4 (support `null`),
  id 6 (domains 0) — `contract/examples/export/dns-providers.json`.
- No data repo exists yet (#12); `.inputs/scanner_input/export` equals the example export
  (`diff -rq` empty). Real-release check deferred to #12.
- `DataTable` renders only table columns: the not-yet-determined column is added to a derived table.

## Decisions

- Hidden by default: settings or support status `dead`, support status `null` (never probed), or
  `domains` = 0 (`null` domains stays visible). Toggle "Show all (N hidden)" in the URL as `&all=1`.
  Applies after the stack filter.
- Columns: name (link) with `api_host` below; stack (link, `–` when null); settings; support;
  supported "n of total (pct)"; not supported "n (pct)"; not yet determined; domains "n (pct)".
  Sort by the count.
- Badges: ok → "OK" green; `http_error`/`error` → "HTTP error" orange; `connection_error` →
  "Connection error" orange; `dead` → "Given up" grey; `null` → "Not checked yet" grey. Hover box:
  the raw status value and that it describes the last attempt.
- `?q=` and `&all=` kept in sync with the URL via `history.replaceState`.
- Version: minor (new page).

## Corrections

## Open questions
