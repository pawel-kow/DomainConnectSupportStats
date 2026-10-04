# Screenshot acceptance — iteration plan

**Branch:** docs/screenshot-acceptance **Started:** 2026-10-04 **Issue:** none
**Goal:** the dev process requires screenshots of affected pages, accepted by the maintainer in the chat, before a frontend PR is finalised.

## Tasks

- [x] Investigate where the process describes screenshots
- [~] Add the acceptance step to DEVELOPING.md and CLAUDE.md
- [ ] Promote findings, delete this file

## Findings

- Screenshots are mentioned only as PR content: DEVELOPING.md §3.2 and §3.5.
- §3.6 is the gate before `gh pr ready` for page, component and `src/lib/` changes.
- Playwright projects: Desktop Chrome, Pixel 7 (playwright.config.ts:20-21).

## Decisions

- Acceptance step goes into §3.6, before `gh pr ready`; CLAUDE.md agent rules point to it.
- Docs only: no version bump.

## Corrections

## Open questions
