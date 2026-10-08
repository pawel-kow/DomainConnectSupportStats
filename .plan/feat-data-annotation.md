# Data annotation to main (#44)

## Tasks

- [x] Merge `main` into `feat/data-annotation`; CHANGELOG conflict resolved, 0.15.0
- [x] `npm run verify`, PR #50 to `main`
- [~] Screenshots accepted (unchanged since #46), remove plan

## Findings

- PR #46 (this branch) merged into `feat/methodology` after #43 had landed on `main`; the
  annotation never reached `main` (`src/lib/annotation.ts` missing on `main`).
- `main` took 0.14.0 for share panels; this branch becomes 0.15.0.

## Decisions

- Methodology page has no annotation (accepted in #46; REQUIREMENTS F-2.1).
