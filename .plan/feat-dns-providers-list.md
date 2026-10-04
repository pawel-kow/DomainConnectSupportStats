# DNS providers list: pagination — iteration plan

**Branch:** feat/dns-providers-list **Started:** 2026-10-04 **Issue:** #3
**Goal:** long lists paginated (20 default, 20/50/100/All) with a filter; DNS providers list and the
DNS provider card's supported templates; screenshots accepted.

## Tasks

- [x] List page, phone columns (accepted earlier in this PR)
- [~] Pure pagination helper + tests (`src/lib/paging.ts`)
- [ ] DataTable `pageSize` prop: pager, size selector, reset on filter/sort/data change; component tests
- [ ] Apply: DNS providers list; card supported templates (paginated + searchable)
- [ ] E2E (many rows via routed fixture), docs (REQUIREMENTS F-2.10, TESTING), CHANGELOG
- [ ] verify, screenshots, acceptance
- [ ] Remove this file

## Decisions

- Pagination: default 20 rows; selector 20 / 50 / 100 / All, not in the URL; page not in the URL;
  back to page 1 when search, sort, toggle or page size change.
- Applies to lists that can grow long: DNS providers list, card supported templates (also gets a
  filter). Owned URLs: unchanged.
- Shipped in PR #24 with 0.3.0.

## Findings

## Corrections

## Open questions
