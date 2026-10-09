# clean-up-display — iteration plan

**Branch:** feat/clean-up-display **Started:** 2026-10-09 **Issue:** #55
**Goal:** domain figures as % only (absolute in hover, with scan), dates without time (datetime in
hover), overview cards relabelled, template support as DNS providers of the supporting ones, `since`
on template supporters.

## Tasks

Steps (big story: pause after each for a context reset; keep mutex and branch).

- [x] Investigate, ask, plan
- [x] Step 1 — derived data: `scripts/derive.ts` writes `derived/templates.json` (supporting DNS
      providers per template) and `derived/templates/{spid}/{sid}.json` (`since` per supporting DNS
      provider) from DNS provider cards' `supported_templates`; types in `src/lib/data/derived.ts`;
      `ExportClient` loaders; unit tests first
- [x] Step 2 — helpers (TDD): `formatCell` timestamps date only, `cellTitle` full datetime UTC;
      domain-share hover text ("80M of 190.6M scanned domains in the partial scan of 01-06-2026");
      scan label from manifest + overview `adoption`; denominator = overview last `ecosystem`
      `supporting_dns_providers`; templates list rows with derived support columns
- [x] Step 3 — views: overview cards; templates list Support/Not supported; template card headline
      and `since` column; service provider card templates %; dates in card records and
      NewSupporters with hover
- [x] Step 4 — views: domain counts → % with hover on lists, cards, stat cards, charts tooltips,
      leaderboards
- [~] Step 5 — e2e updates, Scanner issues, docs (REQUIREMENTS, CLAUDE.md file ref), version
      0.16.0 + CHANGELOG, real-release check, screenshots, draft PR
- [ ] Promote findings, delete this file

## Findings

- `templates.json` `supported_count`/`unsupported_count`/`total` count probe combinations (DNS
  provider × template version), not DNS providers — example: `template1` supported_count 5, its
  card has 3 supporters.
- "of 451" in the templates list is `total` (combinations on record) — `src/views/Templates.svelte`
  `supported_count` cell.
- "2,902 DNS providers with domains" is overview `adoption.dns_providers`; 2,912 is the
  `dns_providers` list row count = `manifest.files.dns_providers.rows.dns_providers`.
- 284 is overview last `ecosystem` row `supporting_dns_providers` (history replay); current-state
  count (dns-providers rows with `supported_templates` > 0) can differ: example 4 vs 3.
- Template card `supporters` has no `since`; DNS provider card `supported_templates` has it per
  template → derivable.
- Layout already loads `overview.json` on every page (annotation); `ExportClient.file` does not
  cache (HTTP cache does).
- No data repo next to the checkout: real-release check needs one.

## Decisions (maintainer, 2026-10-09)

- Templates list: Supported = DNS providers supporting it (derived), % of the supporting DNS
  providers (284); Not supported = 284 − supporters (includes not yet determined), % of 284.
  Never-probed rows keep "Not probed yet".
- Same denominator on: service provider card Templates table (`supporting_providers`), template card
  headline "Supporting DNS providers".
- Denominator: overview last `ecosystem` `supporting_dns_providers` (the number on the overview).
- Full/partial scan: `sample_percent` 100 → "full scan", < 100 → "partial scan", unknown → "scan".
  Date: import `started_at` (else `completed_at`), as the overview's "scan of".
- Footer annotation "(190.6M domains scanned)" and methodology scan totals stay.
- Version: minor (0.16.0).
- Scanner issues: `since` in template `supporters`; supporting DNS providers per template in
  `templates.json`.

## Step notes (resume here)

- Step 1 done: `deriveTemplates(dir)` in `scripts/derive.ts` → `{ list, cards }`;
  `scripts/derive-data.ts` writes `derived/templates.json` and `derived/templates/<spid>/<sid>.json`;
  `ExportClient.templatesSupport()`, `templateSupporters(spid, sid)`; types `TemplatesSupport`,
  `TemplateSupporters` in `src/lib/data/derived.ts`. CLAUDE.md/DEPLOYMENT docs for derived files
  still to update (step 5).
- Places showing domain counts (step 4): DnsProviders/Stacks/ServiceProviders/Templates lists
  (custom cells), Stack card (deployments `domains`, template_coverage `reach_domains`, stat card,
  share chart tooltip), DnsProvider card (stat card, share chart tooltip), ServiceProvider card
  (stat card, templates `reach_domains`), Template card (stat card, supporters `domains`),
  Leaderboards (`entrantRows` count for domains board, `reachRows`), Overview chart tooltip.
- Places showing datetimes (step 3): `cells.ts` `formatCell` timestamp, card `<dd>`s in
  Template/ServiceProvider/DnsProvider views; NewSupporters date needs the hover.

- Step 5: e2e green on the example export (364); docs, 0.16.0, Scanner issues
  pawel-kow/DomainConnectScanner#248 (since), #249 (supporting providers per template). Real
  release (generated_at 2026-10-07T15:10:05Z, data repo cloned to the scratchpad): validates,
  derive 1,695 template files in 4 s; pages load without errors (only registry 404s of the dev
  registry), no horizontal overflow at Pixel 7. Real release has `sample_percent` null → hover
  says "scan of 05-09-2026". Screenshots await acceptance.

- Round 2 (maintainer review): DNS provider support in templates (F-2.21), stacks distribution
  derived (`derived/stacks.json`), DNS provider card sorted by since desc. "Median" checked: the
  export's `median_supported_pct` equals the true median for all 25 real stacks (plesk.com: median
  0.0, mean 0.73); Cloudflare has 2 deployments, so median = mean. Kept median. `since` across
  versions: Scanner issue pawel-kow/DomainConnectScanner#250 (not derivable).

## Corrections

## Open questions

- Phone columns of the template supporters table after `domains` goes (proposal: name, since,
  reach_pct) — confirm with screenshots.
