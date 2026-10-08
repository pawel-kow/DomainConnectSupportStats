# fix/load-errors (#42)

Load errors show a plain message; the technical message goes to `console.warn`.

## Tasks

- [~] `LoadError`: plain message per case (TDD, component test); technical message to `console.warn`
- [ ] e2e: error-state tests assert the text and no `.json` URL; a release-mismatch test
- [ ] REQUIREMENTS.md F-2.4 wording; CHANGELOG, 0.15.1 (patch)
- [ ] verify, PR, screenshots of the error states (desktop, phone)
- [ ] Promote findings, delete this file

## Findings

- `LoadError` is used by every page view and `Methodology`; four lists pass a hand-made
  `Error` for a missing table (`DnsProviders`, `Stacks`, `ServiceProviders`, `Templates`).
- e2e `consoleErrors` fixture fails on `console.error` only; `console.warn` passes.
- `NotFound` (404 on cards) and `Unavailable` (leaderboard panels) are unaffected.

## Decisions

- `ReleaseMismatchError`: heading "The data was just updated", text "Reload the page."
- Everything else: heading "Could not load the data", text "The data is not available at the
  moment. Try again later."
- Patch version: a fix of visible text.
