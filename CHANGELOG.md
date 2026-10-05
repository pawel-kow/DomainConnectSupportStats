# Changelog

Changes per site version. Versions follow [SemVer](https://semver.org/): major for a page or URL
parameter removed or changed incompatibly, minor for new pages, features or content, patch for
fixes, styling and dependencies.

## [0.9.0] - 2026-10-05

### Added

- Stacks list: every stack with deployments (link to its DNS providers), support as lowest,
  median and highest across deployments with a range bar, and domains; sort, search, pages of 20.

## [0.8.0] - 2026-10-05

### Added

- Stack card: deployments (links to DNS provider cards), supporting deployments per template
  (links to template and service provider cards), domain share over time (summed over the
  current deployments), the stack's registry entry (logo, contact, details), link to its
  deployments in the DNS providers list.

## [0.7.0] - 2026-10-05

### Added

- Service providers list: every service provider with templates (link to its templates in the
  templates list), supported templates, supporting DNS providers, first added, last updated and
  reach; search (`?q=`), pages of 20.

## [0.6.0] - 2026-10-04

### Added

- Service provider card: templates, supporting DNS providers and reach, templates with support
  and reach (filter, pages of 20), supporting DNS providers per template over time with a picker
  (the 7 templates with most reach by default), link to its templates in the templates list.

### Changed

- Charts can hide their legend when the page shows its own.

## [0.5.0] - 2026-10-04

### Added

- Templates list: every template with support and reach, filter by service provider (`?spid=`),
  search (`?q=`), never-probed templates behind "show all" (`&all=1`), pages of 20.

## [0.4.0] - 2026-10-04

### Added

- Template card: supporting DNS providers with links and total, reach, supporters over time with
  a caveat when the history differs, description and versions, records, logo, notes.

### Changed

- Card logos that fail to load are hidden and requested without a referrer.

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
