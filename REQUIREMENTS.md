# Requirements

What the Domain Connect support statistics site must do, and the constraints that bind it.
Origin: the "Future frontend: spec notes" of pawel-kow/DomainConnectScanner#211, refined with
the maintainer on 2026-10-04 (issue #1): implementation decisions first, then a product interview
(§0). The data's meaning is defined by [contract/EXPORT_FORMAT.md](contract/EXPORT_FORMAT.md);
this file does not repeat it.

## 0. Product

### P-1 Purpose

The site exists to **drive Domain Connect adoption**: it makes support, and the lack of it,
visible to the whole ecosystem, so that DNS providers enable more templates and service providers
publish more of them. Being an accurate public reference is a means to that end, not the goal
itself.

The landing page answers one question at a glance: **is Domain Connect support improving?** It
shows the trend over time of supporting DNS providers, supported templates and reach, and the
latest values.

### P-2 Audiences

All four matter. The site serves each with the same public data; none gets a private view.

| Audience                                                       | Comes to the site to                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Domain Connect community (protocol maintainers, working group) | Track adoption and the health of the ecosystem; point others to it                      |
| DNS providers                                                  | See their own support next to their peers', and spot gaps or errors in their deployment |
| Service providers (template publishers)                        | See how many DNS providers and domains can apply their templates                        |
| Public, press, analysts                                        | Get headline adoption numbers and trends they can cite                                  |

### P-3 Tone towards named companies

Named DNS providers appear with low support, errors and "dead" status on public pages. The site
**shows every fact, carefully framed**:

- neutral wording: states what was observed and when, never judges ("last probe failed on
  <date>", not "broken");
- the context next to the fact: statuses lag, probes can fail transiently, numbers cover the
  scanned zones only;
- positive rankings only (P-4): no "worst of" or "biggest gaps" lists.

### P-4 Leaderboards

Rankings are welcome as a positive incentive. The site offers:

- **Top supporting providers**, as two separate boards: by number of templates supported, and
  by domains reached. Neither alone is fair (a small provider can support everything; a large
  one can reach many domains with little support).
- **Most improved**: the largest gain in supported templates over recent sweeps.
- **Biggest reach**: templates and service providers whose templates can reach the most
  domains.

Not offered: boards of low support or large providers with low support.

### P-5 Calls to action

Light touch: where it helps, a short pointer on how to get listed or improve support, linking to
domainconnect.org and the Domain Connect Templates repository. No marketing copy.

### P-6 Trust and corrections

- **Methodology page**: one "About / methodology" page explains how the data comes about
  (scanning, sampling, provider identification and attribution, support probing, sweeps), what
  the numbers count and their limits. Data pages link to it wherever a caveat applies, instead
  of repeating it.
- **Report a problem**: every card links to a GitHub issue in this (public) repository,
  pre-filled with the entity's id and the release's `generated_at`, so a provider who thinks its
  numbers are wrong has a direct channel.

### P-7 Freshness

The site sets no freshness requirement of its own: it shows whatever release the Scanner
publishes, when it publishes it, and always says how old that release is (F-2.1).

### P-8 Success

The site works if:

- **adoption rises**: the overview's trend goes up (supporting providers, supported templates,
  reach);
- **it is cited and linked**: by the community, providers and the press;
- **providers react**: DNS providers fix errors or add support after seeing their card.

The second is measured with privacy-friendly analytics (C-7).

### P-9 Direction

- **One Domain Connect statistics site, eventually.** This site and stats.domainconnect.org
  (the Templates statistics) are separate for now but are meant to merge. Navigation, page names
  and URLs are kept compatible with that.
- **English now, other languages later.** Texts are kept translatable (C-12).

### P-10 Out of scope

- Per-domain lookup ("does my domain support Domain Connect?"): the export holds no per-domain
  data.
- Live probing or any check run on demand from the site.
- Accounts, subscriptions, alerts or change notifications.
- Data reuse features for now: no downloads (JSON/CSV), chart image export or embeddable badges.

## 1. Functional requirements

### F-1 Pages

| Id     | Page                                    | Data                     | Must show                                                                                                                                                                                                                                                                             |
| ------ | --------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-1.1  | `index.html` (landing)                  | `overview.json`          | One "Domain Connect support over time" chart on a shared date axis: adoption `dc_pct` per import (with `dc_domains` in the tooltip) and `supporting_dns_providers`, `supporting_stacks`, `supported_templates` per full sweep (secondary axis); the latest values as headline numbers |
| F-1.2  | `dns-providers.html` (`?stack=`, `&q=`) | `dns-providers.json`     | Every DNS provider; filter by stack and search                                                                                                                                                                                                                                        |
| F-1.3  | `stacks.html`                           | `stacks.json`            | Every stack with its support distribution                                                                                                                                                                                                                                             |
| F-1.4  | `service-providers.html`                | `service-providers.json` | Every service provider                                                                                                                                                                                                                                                                |
| F-1.5  | `templates.html` (`?spid=`)             | `templates.json`         | Every template; filter by service provider                                                                                                                                                                                                                                            |
| F-1.6  | `dns-provider.html?id=`                 | DNS provider card        | Charts: supported templates per sweep, domain share per import                                                                                                                                                                                                                        |
| F-1.7  | `stack.html?id=`                        | Stack card               | Deployments; chart: share per import                                                                                                                                                                                                                                                  |
| F-1.8  | `service-provider.html?id=`             | Service provider card    | Templates; chart: supporting providers per template per sweep                                                                                                                                                                                                                         |
| F-1.9  | `template.html?spid=&sid=`              | Template card            | Records, supporters; chart: supporting DNS providers per sweep                                                                                                                                                                                                                        |
| F-1.10 | Methodology page                        | —                        | P-6: how the data comes about, what the numbers count, their limits                                                                                                                                                                                                                   |

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
- F-2.6 **Active by default**: lists hide dead, never-probed and zero-domain entries by default,
  with a visible "show all (N hidden)" toggle; the full set stays one click away.
- F-2.7 Every card has a "report a problem" link (P-6).
- F-2.8 Caveats link to the methodology page (P-6).

### F-3 Data and deployment

- F-3.1 Pages read `manifest.json` first and build every file URL from its path templates and
  the id encoding.
- F-3.2 The data base URL is configurable at build time (`VITE_DATA_BASE_URL`) and at runtime
  (`config.js`); default `./data/`.
- F-3.3 A new release reaches the site without a code change: the Scanner pushes it to the data
  repo and triggers the deploy (DEPLOYMENT.md).
- F-3.4 A release that fails validation against the vendored contract is not published.

### F-4 Leaderboards

- F-4.1 Top supporting DNS providers by templates supported, and separately by domains reached
  (P-4).
- F-4.2 Most improved DNS providers by gain in supported templates over recent sweeps.
- F-4.3 Biggest reach: templates and service providers by domains reached.

## 2. Constraints

| Id   | Constraint                                                                                                                                                     | Why                                                 |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| C-1  | Static and stateless: no backend, no write path, no state shared between pages beyond the URL                                                                  | GitHub Pages; shareable links                       |
| C-2  | One HTML file per page (multi-page build), not an SPA                                                                                                          | Spec; each page loads only its data                 |
| C-3  | Built only from `contract/`; never from Scanner source                                                                                                         | The contract is the interface (DEVELOPING.md §3.6b) |
| C-4  | Ignore unknown files, tables, columns and keys; find tables by id                                                                                              | Additive contract changes need no version bump      |
| C-5  | `null` is unknown: shown as `–`, drawn as a gap, sorted last, never 0                                                                                          | EXPORT_FORMAT.md "Values", "Time series"            |
| C-6  | Third-party text is escaped; data URLs pass `safeUrl`                                                                                                          | XSS on a public site                                |
| C-7  | No runtime requests to third-party hosts (bundled libraries, no CDN or fonts), **except one privacy-friendly analytics service**: cookieless, no personal data | Visitor privacy; measuring P-8                      |
| C-8  | Look and feel aligned with stats.domainconnect.org; navigation and URLs compatible with a later merge                                                          | Same family of sites (P-9)                          |
| C-9  | Works at phone width without horizontal page scroll                                                                                                            | Shared links are opened on phones                   |
| C-10 | Only `format_version` `SUPPORTED_FORMAT_VERSION` is rendered; others fail loudly                                                                               | A misread data set is worse than none               |
| C-11 | WCAG 2.2 AA: contrast, keyboard use, screen-reader-usable tables, and every chart's data also available as a table                                             | Public site, all audiences                          |
| C-12 | User-facing texts kept translatable (not scattered through logic); English only for now                                                                        | Other languages later (P-9)                         |

## 3. Decisions (2026-10-04, maintainer)

- Svelte 5 + TypeScript, Vite multi-page; Chart.js for charts.
- Data in a separate data repo, delivered by `repository_dispatch` + build; daily fallback.
- Hosted on github.io for now; custom domain later, no rebuild needed (relative base).
- Contract vendored under `contract/`, updated by PR.
- Node-only tooling; tests: Vitest (unit, contract, component) and Playwright.
- Product interview (§0): drive adoption; all four audiences; facts shown carefully framed;
  positive leaderboards only; light calls to action; methodology page; reports via this repo's
  issues; privacy-friendly analytics; active-by-default lists; WCAG 2.2 AA; English, translatable;
  eventual merge with stats.domainconnect.org; no reuse features yet.

## 4. Open questions

- **Analytics service** (C-7): which one, and hosted where (e.g. Plausible, GoatCounter,
  self-hosted)? Needed before any analytics is added.
- **Leaderboard data** (F-4.1, F-4.2): "by domains reached" for a DNS provider is its `domains`
  in the list; "most improved" needs each provider's `support_history` from its card, i.e. one
  fetch per provider. A Scanner-side aggregate in the export may be preferable; to be decided
  when F-4 is built.
- **Methodology content** (F-1.10): who writes it, and from which source? It must not be
  derived from Scanner code (C-3).
