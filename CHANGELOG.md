# Changelog

Changes per site version. Versions follow [SemVer](https://semver.org/): major for a page or URL
parameter removed or changed incompatibly, minor for new pages, features or content, patch for
fixes, styling and dependencies.

## [0.3.0] - 2026-10-04

### Added

- DNS providers list: support, statuses and domains per DNS provider; search, sort, stack filter;
  given-up, never-probed and zero-domain providers behind a "show all" toggle; caveats.

### Changed

- Tables show fewer columns at phone width to fit the screen; DNS provider card's supported
  templates without versions.
- Long tables in pages of 20 rows (50, 100 or all on request): DNS providers list, DNS provider
  card's supported templates (now with a filter).

## [0.2.0] - 2026-10-04

### Added

- DNS provider card: support, domain share and supported templates over time, supported templates
  with links, settings, notes, owned URLs.
- DNS provider registry entry on the card: logo, contact block, onboarding facts, features.
- Registry commit in the footer of every page.
- Deploy validates and publishes the DNS provider registry with the data.

### Changed

- Header names the domain-share import by its scan's completion time.
- Overview: chart without data tables; no internal ids in tooltips.
- Tables never show internal ids.

## [0.1.0] - 2026-10-04

### Added

- Overview page: Domain Connect support over time and latest headline numbers.
- Placeholder pages for the lists and cards.
- Release facts (`generated_at`, domain-share import) in every page header.
- Site version in the footer.
- Deploy to GitHub Pages: approved, tagged site versions with the current validated data release.
