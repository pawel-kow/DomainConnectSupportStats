# feat/data-annotation (#44), on top of feat/methodology (#43)

## Tasks

- [~] `src/lib/annotation.ts`: sweep source per page, import completion time (unit tests first)
- [ ] Layout: annotation at the end of `<main>`, header box removed; `sweep` prop (component tests)
- [ ] Card views pass their card's sweep (DNS provider, service provider, template)
- [ ] e2e: annotation on every page incl. methodology, desktop + phone
- [ ] REQUIREMENTS F-2.1, CLAUDE.md file reference, 0.14.0 + CHANGELOG
- [ ] Screenshots, PR (draft, base feat/methodology)

## Decisions

- Card that fails to load or is not found: `Support figures: –`.
- Completion time unknown (overview fails, `completed_at` null): `scan completed –`.
- Stack card, lists, methodology: Layout default (overview `ecosystem` last row).

## Findings

- Example export: every sweep source ends at `2026-09-02 02:00:00`; e2e can't tell sources
  apart, unit tests do.
