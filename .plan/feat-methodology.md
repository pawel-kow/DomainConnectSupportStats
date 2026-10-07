# methodology — iteration plan

**Branch:** feat/methodology **Started:** 2026-10-07 **Issue:** #14
**Goal:** `methodology.html`: a short site part (this release's zones and sampling, not covered,
corrections, privacy) and the vendored `contract/export/METHODOLOGY.md` verbatim; linked from the
footer and from every caveat.

## Tasks

- [x] Investigate: issue, METHODOLOGY.md, caveats on the pages, decisions with the maintainer
- [~] `scripts/methodology.ts` (TDD): Markdown → HTML with `marked`, GitHub-style heading ids,
      headings one level down, tables in a scroll wrapper
- [ ] Vite plugin: bakes the HTML into `methodology.html` (`transformIndexHtml`); the view moves
      the static node into the layout (no `{@html}`)
- [ ] `Methodology.svelte`: this release (`share_import` zones, `zone_domains`,
      `sample_percent`, `scanned_domains`), not covered, report a problem, privacy
- [ ] `links.methodology(anchor)`, footer link, caveat links (overview, lists, template history
      caveat, DNS providers status caveat)
- [ ] e2e: page renders, anchors exist, caveat links resolve; unit tests for links
- [ ] Docs (CLAUDE.md, REQUIREMENTS.md F-1.10/F-2.8, README), minor version + CHANGELOG,
      screenshots to the maintainer
- [ ] Promote findings, `git rm -r .plan`

## Decisions (maintainer, 2026-10-07)

- Page `methodology.html`.
- Content: short site-written intro, then METHODOLOGY.md verbatim.
- Rendering at build time with `marked` (dev dependency), static HTML in the page.
- Linked from the footer only (no nav entry), and from the caveats.
- Caveats keep one sentence next to the fact and link to the matching section.
- Corrections: a generic "Report a problem" link (new issue in this repository) and "no cookies,
  no analytics" (#13 changes it later). Per-card F-2.7 out of scope.
- Version: minor.

## Findings

- METHODOLOGY.md: 367 lines, sections 1–8, one external link (Templates repository), formulas in
  indented code blocks, three tables. EXPORT_FORMAT.md links to it with GitHub anchors
  (`#22-census-and-probability-sample`).
- `manifest.share_import` has `zones`, `zone_domains`, `sample_percent` (example: `com`, `org`,
  240000, 5.0); `ShareImport` type lacks them.
- No cookies or storage in `src/`; no external fonts.
- PR #40 (leaderboards) is open: expect conflicts in `package.json`, CHANGELOG, `links.ts`.

## Corrections

## Open questions

- none
