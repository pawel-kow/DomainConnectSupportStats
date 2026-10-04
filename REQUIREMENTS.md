# Requirements

What the Domain Connect support statistics site must do, and the constraints that bind it.
Origin: the "Future frontend: spec notes" of pawel-kow/DomainConnectScanner#211, refined with
the maintainer on 2026-10-04 (issue #1). The data's meaning is defined by
[contract/EXPORT_FORMAT.md](contract/EXPORT_FORMAT.md); this file does not repeat it.

## 1. Functional requirements

### F-1 Pages

| Id    | Page                                    | Data                     | Must show                                                                                                                                                                                                                                                                             |
| ----- | --------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1.1 | `index.html` (landing)                  | `overview.json`          | One "Domain Connect support over time" chart on a shared date axis: adoption `dc_pct` per import (with `dc_domains` in the tooltip) and `supporting_dns_providers`, `supporting_stacks`, `supported_templates` per full sweep (secondary axis); the latest values as headline numbers |
| F-1.2 | `dns-providers.html` (`?stack=`, `&q=`) | `dns-providers.json`     | Every DNS provider; filter by stack and search                                                                                                                                                                                                                                        |
| F-1.3 | `stacks.html`                           | `stacks.json`            | Every stack with its support distribution                                                                                                                                                                                                                                             |
| F-1.4 | `service-providers.html`                | `service-providers.json` | Every service provider                                                                                                                                                                                                                                                                |
| F-1.5 | `templates.html` (`?spid=`)             | `templates.json`         | Every template; filter by service provider                                                                                                                                                                                                                                            |
| F-1.6 | `dns-provider.html?id=`                 | DNS provider card        | Charts: supported templates per sweep, domain share per import                                                                                                                                                                                                                        |
| F-1.7 | `stack.html?id=`                        | Stack card               | Deployments; chart: share per import                                                                                                                                                                                                                                                  |
| F-1.8 | `service-provider.html?id=`             | Service provider card    | Templates; chart: supporting providers per template per sweep                                                                                                                                                                                                                         |
| F-1.9 | `template.html?spid=&sid=`              | Template card            | Records, supporters; chart: supporting DNS providers per sweep                                                                                                                                                                                                                        |

### F-2 Common behaviour

- F-2.1 Every page shows the release's `generated_at` and domain-share import in its header.
- F-2.2 Lists: client-side sort, filter and search over the full row set; default order is the
  export's.
- F-2.3 Cross-links: DNS provider ↔ stack, DNS provider ↔ template, template ↔ service provider,
  stack → its deployments; as plain `<a href>` page links (EXPORT_FORMAT.md "Cross-links").
- F-2.4 A card page with a missing parameter or an unknown id shows a "not found" state linking
  back to its list page; any other load failure shows an error state. Never a blank page.
- F-2.5 Query parameters carry only raw entity ids and filters, never the page; every view is a
  shareable link.

### F-3 Data and deployment

- F-3.1 Pages read `manifest.json` first and build every file URL from its path templates and
  the id encoding.
- F-3.2 The data base URL is configurable at build time (`VITE_DATA_BASE_URL`) and at runtime
  (`config.js`); default `./data/`.
- F-3.3 A new release reaches the site without a code change: the Scanner pushes it to the data
  repo and triggers the deploy (DEPLOYMENT.md).
- F-3.4 A release that fails validation against the vendored contract is not published.

## 2. Constraints

| Id   | Constraint                                                                                    | Why                                                 |
| ---- | --------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| C-1  | Static and stateless: no backend, no write path, no state shared between pages beyond the URL | GitHub Pages; shareable links                       |
| C-2  | One HTML file per page (multi-page build), not an SPA                                         | Spec; each page loads only its data                 |
| C-3  | Built only from `contract/`; never from Scanner source                                        | The contract is the interface (DEVELOPING.md §3.6b) |
| C-4  | Ignore unknown files, tables, columns and keys; find tables by id                             | Additive contract changes need no version bump      |
| C-5  | `null` is unknown: shown as `–`, drawn as a gap, sorted last, never 0                         | EXPORT_FORMAT.md "Values", "Time series"            |
| C-6  | Third-party text is escaped; data URLs pass `safeUrl`                                         | XSS on a public site                                |
| C-7  | No runtime requests to third-party hosts (bundled libraries, no CDN, fonts or analytics)      | Visitor privacy; no external dependency at runtime  |
| C-8  | Look and feel aligned with stats.domainconnect.org                                            | Same family of sites                                |
| C-9  | Works at phone width without horizontal page scroll                                           | Shared links are opened on phones                   |
| C-10 | Only `format_version` `SUPPORTED_FORMAT_VERSION` is rendered; others fail loudly              | A misread data set is worse than none               |

## 3. Decisions (2026-10-04, maintainer)

- Svelte 5 + TypeScript, Vite multi-page; Chart.js for charts.
- Data in a separate data repo, delivered by `repository_dispatch` + build; daily fallback.
- Hosted on github.io for now; custom domain later, no rebuild needed (relative base).
- Contract vendored under `contract/`, updated by PR.
- Node-only tooling; tests: Vitest (unit, contract, component) and Playwright.
