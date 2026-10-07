# feat/data-annotation (#44), on top of feat/methodology (#43)

## Tasks

- [x] `src/lib/annotation.ts`: sweep source per page, import completion time (unit tests first)
- [x] Layout: annotation at the end of `<main>`, header box removed; `sweep` prop (component tests)
- [x] Card views pass their card's sweep (DNS provider, service provider, template)
- [x] e2e: annotation on every page incl. methodology, desktop + phone
- [x] REQUIREMENTS F-2.1, CLAUDE.md file reference, 0.14.0 + CHANGELOG
- [~] Screenshots, PR (draft, base feat/methodology)

## Decisions

- Card that fails to load or is not found: `Support figures: –`.
- Completion time unknown (overview fails, `completed_at` null): `scan completed –`.
- Stack card, lists, methodology: Layout default (overview `ecosystem` last row).

## Findings

- Example export: every sweep source ends at `2026-09-02 02:00:00`; e2e can't tell sources
  apart, unit tests do.
- Real release 2026-10-07T15:10:05Z: validated, every page annotated, e2e green. Timestamps
  `nowrap` (phone wrapped inside dates).
- Occasional e2e failures: `EACCES` writing traces under `test-results/` (environment), pass on
  rerun.

## Open

- Screenshots awaiting the maintainer's acceptance.
