# feat/overview-charts (#57)

Break the overview's "Domain Connect support over time" chart into four charts, 2×2 on desktop.

## Tasks

- [x] Derive reach-weighted pairs per full sweep (`derived/ecosystem.json`), tests
- [x] Overview: 4 panels (DC adoption; supporting DNS providers; supported templates; ecosystem growth), both growth variants for preview
- [x] Screenshots of both variants on real data; maintainer picks one
- [x] Remove the variant not chosen; headline: templates per domain replaces supported pairs
- [x] Scanner issue: pawel-kow/DomainConnectScanner#257
- [x] Tests (unit, e2e), docs (CLAUDE.md, REQUIREMENTS.md F-1.1, F-1g, F-1h, F-4.5), CHANGELOG, 0.17.0
- [~] PR, final screenshots accepted by the maintainer
- [ ] Remove plan

## Findings

- Real data: `pawel-kow/DomainConnectSupportStatsData`, `statsdata/providers`; 2 imports, 7 full sweeps (2026-09-20 … 2026-10-02); scanner start 2026-09-22.
- Replaying each DNS provider card's `support_history` (latest row started before the next full sweep's start; last row: any) reproduces `ecosystem.supported_combinations` and `supporting_dns_providers` exactly for all 7 sweeps.
- Weighted: Σ supported templates × `domains_pct` / 100 = templates per scanned domain: 127.1 → 141.4.

## Decisions

- Ecosystem growth: weighted variant (maintainer). Headline card "Templates per domain" replaces supported pairs (maintainer).
- Variant 1: `ecosystem.supported_combinations` (export).
- Variant 2 unit: templates per scanned domain (Σ templates × domain share); weights from the domain-share import, applied to every sweep.
- First-scan shadow on all but DC adoption.
- Supporting stacks line dropped (stat card stays).
- 4 panels, each its own anchor; first keeps `#support-history`.
- Scanner issue after the maintainer picks the variant, for that series only.

## Corrections

## Open questions


- Real-data preview: `node scripts/derive-data.ts <data> <out>`, then `DATA_DIR=<data> DERIVED_DIR=<out> npx vite`.
