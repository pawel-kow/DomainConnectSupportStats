# fix/dev-entries

## Tasks

- [x] Dev server serves the page entry scripts

## Findings

- Vite root is `src/pages`; pages load `../entries/<page>.ts`. The browser requests
  `/entries/<page>.ts`, outside root: `vite dev` answers 404. The build resolves the path on disk.

## Decisions

- Alias `/entries/` to `src/entries/` in `vite.config.ts`. Dev-only effect: no version bump.
