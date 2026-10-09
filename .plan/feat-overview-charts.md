# feat/overview-charts (#57)

Break the overview's "Domain Connect support over time" chart into four charts, 2×2 on desktop.

## Tasks

- [~] Derive reach-weighted pairs per full sweep (`derived/ecosystem.json`), tests
- [ ] Overview: 4 panels (DC adoption; supporting DNS providers; supported templates; ecosystem growth), both growth variants for preview
- [ ] Screenshots of both variants on real data; maintainer picks one
- [ ] Remove the variant not chosen (and its derived file if unused)
- [ ] Scanner issue for the chosen series
- [ ] Tests (component, e2e), docs (CLAUDE.md, REQUIREMENTS.md), CHANGELOG, minor bump
- [ ] Remove plan

## Findings

- Real data: `pawel-kow/DomainConnectSupportStatsData`, `statsdata/providers`; 2 imports, 7 full sweeps (2026-09-20 … 2026-10-02); scanner start 2026-09-22.
- Replaying each DNS provider card's `support_history` (latest row started before the next full sweep's start; last row: any) reproduces `ecosystem.supported_combinations` and `supporting_dns_providers` exactly for all 7 sweeps.
- Weighted: Σ supported templates × `domains_pct` / 100 = templates per scanned domain: 127.1 → 141.4.

## Decisions

- Variant 1: `ecosystem.supported_combinations` (export).
- Variant 2 unit: templates per scanned domain (Σ templates × domain share); weights from the domain-share import, applied to every sweep.
- First-scan shadow on all but DC adoption.
- Supporting stacks line dropped (stat card stays).
- 4 panels, each its own anchor; first keeps `#support-history`.
- Scanner issue after the maintainer picks the variant, for that series only.

## Corrections

## Open questions

- Which ecosystem growth variant.
