# DNS providers list — iteration plan

**Branch:** feat/dns-providers-list **Started:** 2026-10-04 **Issue:** #3
**Goal:** `dns-providers.html` lists every DNS provider from `dns-providers.json` with stack filter,
search, hide-by-default toggle, badges and caveats; tests, docs, version 0.3.0.

## Tasks

- [x] Investigate contract, existing views, DataTable, links
- [x] Unit tests + `src/lib/dns-providers.ts` (undetermined count, hidden rule, stack filter, derived column, status badges)
- [x] `links.dnsProviders` gains `all`; tests
- [x] View `DnsProviders.svelte`, entry, badge style; URL kept in sync (`replaceState`)
- [x] Card view reuses the undetermined helper
- [x] E2E spec `dns-providers.spec.ts`
- [x] Docs (CLAUDE.md page table, REQUIREMENTS.md, TESTING.md), version 0.3.0, CHANGELOG
- [~] `npm run verify`, draft PR, screenshots desktop + phone, maintainer acceptance
- [ ] Promote findings, delete this file

## Findings

- `npm run verify` green: 172 Vitest, 94 Playwright (desktop + mobile).

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
  supported "n of total"; not supported; undetermined; domains; % under each count.
  Sort by the count.
- Badges: ok → "OK" green; `http_error`/`error` → "HTTP error" orange; `connection_error` →
  "Connection error" orange; `dead` → "Given up" grey; `null` → "Not checked yet" grey. Hover box:
  the raw status value (maintainer) and that it describes the last attempt.
- `?q=` and `&all=` kept in sync with the URL via `history.replaceState`.
- Version: minor (new page).

## Corrections

- Maintainer: phone width shows only name, supported and domains (DataTable `phoneKeys`, hidden
  below 480 px); status badges and stack stay on wide screens.

- Desktop table overflowed the panel by 103 px (measured `.table-wrapper` scrollWidth 1191 vs
  1088): derived header shortened to "Undetermined", % moved under the count, badges and API hosts
  wrap on wide screens; now 1088 = 1088. Phones scroll inside the table.
- Not-supported % read `unsupported_count_pct` (shown `–`); fixed to `unsupported_pct`.

## Open questions
