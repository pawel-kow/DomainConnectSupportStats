# compact-numbers — iteration plan

**Branch:** feat/compact-numbers **Started:** 2026-10-05 **Issue:** #35
**Goal:** big counts show compact (38.5M) with the exact value in a tooltip, small percentages keep significant digits, and small shares get a readable 0-based percent axis.

## Tasks

- [x] Investigate call sites (`formatCount`, `formatPct`, `TimeChart`, `DataTable`, `StatCard`)
- [~] Failing unit tests: `formatCount` compact, `formatExact`, adaptive `formatPct`, axis decimals
- [ ] Implement in `src/lib/format.ts`
- [ ] `Count` component and `StatCard` `exact`: title tooltip with the exact count
- [ ] Table cells (`formatCell`, view snippets) compact with tooltip; sort stays on raw values (test)
- [ ] `TimeChart`: tick decimals from the tick step
- [ ] E2E check, real-release check, screenshots (desktop, phone)
- [ ] REQUIREMENTS.md, CHANGELOG, version 0.10.0
- [ ] Promote findings, delete this file

## Findings

- `formatCount` is `Intl.NumberFormat('en-US')`; `formatPct` is `toFixed(1)`; the share charts use `formatLeft={(v) => `${Number(v.toFixed(2))}%`}` and `beginAtZero: true`, so a share below 0.005% gives ticks of `0%`.
- Cells format through `formatCell` (`cells.ts`); sorting uses raw values (`compareCells`), so compact text does not affect it.

## Decisions

- Compact from 10,000: `K`, `M`, `B`, one decimal, trailing `.0` dropped, dot decimal, suffix attached.
- Everywhere (cards, tables, axes, tooltips); exact count in `title`. Pagination ranges stay exact.
- `formatPct`: 2 significant digits below 1%; `<0.0001%` floor; percent axis starts at 0 with adaptive tick decimals (changed after viewing real data: fitting the data was dropped).
- Version 0.10.0 (visible content).

## Open questions

- None.
