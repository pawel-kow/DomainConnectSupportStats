# chore/plan-gate-drafts (#54)

## Tasks

- [~] `no-plan-files` skips draft PRs; runs on `ready_for_review`
- [ ] Docs: DEVELOPING.md §3.11, TESTING.md §7
- [ ] PR, remove plan

## Findings

- `ci.yml` `pull_request` uses default types (opened, synchronize, reopened): marking a draft
  ready triggers no run, so the gate needs `ready_for_review`.

## Decisions

- CI only: no version bump.
