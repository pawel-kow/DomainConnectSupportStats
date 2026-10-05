# Service providers list — iteration plan

**Branch:** feat/service-providers-list **Started:** 2026-10-05 **Issue:** #5
**Goal:** `service-providers.html` lists every service provider from `service-providers.json`
table `service_providers` with sort, search (`?q=`), pages of 20, links to the card and the
templates list, reach as a share of the scanned domains.

## Tasks

- [x] `links.serviceProviders({ q })` (test first)
- [x] View `ServiceProviders.svelte`, entry
- [x] E2E spec `service-providers.spec.ts` (content, links, search in URL, mobile columns)
- [x] Docs: CLAUDE.md page table, REQUIREMENTS.md F-1.4 + F-1f; version 0.7.0, CHANGELOG
- [~] `npm run verify`; stress copy of the example; screenshots accepted
- [ ] PR ready; promote findings, delete this file

## Decisions (maintainer, 2026-10-05)

- Phone width: name (id below), templates, reach (% below).
- Templates and supported templates: separate sortable columns; templates links to
  `templates.html?spid=`.
- `?q=` follows the search box.
- Minor bump (new page): 0.7.0.
- No hidden rows: the contract lists every service provider, including ones without templates.

## Findings

- Example export: 3 service providers; `unnamed.example` has `name` = its id, 0 supported, reach 0.
- No real release yet (#12): real-release check by a stress copy of the example.

- `npm run verify` green: 201 Playwright (21 new), Vitest green.
- Stress copy (60 providers, long names and hosts, `null` reach and dates, 0 templates): no
  horizontal scroll at Pixel 7; 3 pages of 20.

## Corrections

- Phone width overflowed by 1 px with the id `nowrap` (`exampleservice.domainconnect.org`): ids
  now wrap anywhere at every width.

## Open questions
