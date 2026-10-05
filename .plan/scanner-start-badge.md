# scanner-start-badge — iteration plan

**Branch:** feat/scanner-start-badge **Started:** 2026-10-05 **Issue:** #34
**Goal:** `since` / `first_seen_at` values before the scanner start date show a "Before scans" badge; sweep charts shade that span.

## Tasks

- [~] config: `scannerStartDate` with default and validation
- [ ] `cells.ts`: before-start check, sort
- [ ] `DataTable`: badge with tooltip
- [ ] `TimeChart`: shaded span (sweep-series charts only)
- [ ] unit, component, e2e tests
- [ ] REQUIREMENTS.md, README/DEPLOYMENT config docs, CHANGELOG 0.11.0, version

## Findings

- `sweepSeries` charts: Overview, Template, DnsProvider (support history). Import-series charts are not shaded.
- `first_seen_at` is shown in a DnsProvider `<dd>` (formatDateTime), not a table.

## Open questions

None.
