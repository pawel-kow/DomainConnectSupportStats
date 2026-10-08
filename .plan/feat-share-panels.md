# Share panels — iteration plan

**Branch:** feat/share-panels **Started:** 2026-10-07 **Issue:** #41
**Goal:** every chart and table panel has a stable anchor, a `#` link and a share menu (Bluesky,
Mastodon, LinkedIn, copy link, OS share sheet); every page has Open Graph tags.

Big story: one PR, steps with a pause for `/clear` after each (mutex and branch kept).

## Tasks

- [x] Step 1: `src/lib/share.ts` (TDD): shared URL (location + query + anchor, no sort/page),
      post text, target URLs (Bluesky, Mastodon, LinkedIn), Mastodon instance validation and
      storage (try/catch `localStorage`), Apple-platform detection for the icon
- [x] Step 2: components `Panel.svelte` (section with slug id, h2 with `#` link on hover/focus,
      share icon in the title row, scroll + brief highlight when the hash matches after the data
      loaded, `prefers-reduced-motion`) and `ShareMenu.svelte` (keyboard menu, inline Mastodon
      form, "Link copied" `aria-live` for 2 s, Web Share "More…" when `navigator.share`);
      component tests; list pages keep the hash on `history.replaceState`
- [x] Step 3: use `Panel` on every chart and table panel (slugs below); static `og:title`,
      `og:description`, `og:image`, `twitter:card` per HTML page; og:image made absolute at
      runtime; e2e (anchor scroll, copy link, menu desktop + phone)
- [~] Step 4: docs (REQUIREMENTS F-2 entries, C-1 exception, CLAUDE.md file reference), minor
      bump + CHANGELOG, real-release check, screenshots, PR ready
- [ ] Promote findings, delete this file

## Slugs (stable, English, unique per page)

| Page              | Panel → slug                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| index             | support over time → `support-history`; new supporting → `new-supporting`; most improved → `most-improved`                                                                             |
| dns-providers     | `dns-providers`                                                                                                                                                                       |
| stacks            | `stacks`                                                                                                                                                                              |
| service-providers | `service-providers`                                                                                                                                                                   |
| templates         | `templates`                                                                                                                                                                           |
| dns-provider      | domain share over time → `domain-share-history`; supported templates over time → `support-history`; templates table → `templates`; URLs table → `urls`                                |
| stack             | domain share over time → `domain-share-history`; deployments → `deployments`; coverage → `coverage`                                                                                   |
| service-provider  | per-template chart → `support-history`; templates → `templates`                                                                                                                       |
| template          | supporting DNS providers over time → `support-history`; supporters → `supporters`; records → `records`                                                                                |
| leaderboards      | `most-templates`, `most-domains`, `most-improved`, `new-supporting`, `template-reach`, `service-provider-reach`                                                                       |

## Findings

- Panels are `<section class="panel"><h2>…</h2>…</section>` written inline in each view (grep
  `<section class="panel"` in `src/views/`); no shared panel component yet.
- Some table headings come from the data (`templates.title`, `urls.title`, `deployments.title`,
  `coverage.title`, `supporters.title`): slugs must not derive from heading text.
- List pages rewrite the URL with `history.replaceState(null, '', links.x(...))`
  (`DnsProviders.svelte:22`, `Templates.svelte:21`, `ServiceProviders.svelte:17`,
  `Leaderboards.svelte:37`): this drops `location.hash`; must keep it.
- Table sort, page and page size are component state in `DataTable`, never in the URL: the
  shared URL is `location` minus nothing but with the panel anchor.
- `Methodology.svelte:21` already scrolls to the hash after its content is in place.
- Site URLs: `https://pawel-kow.github.io/DomainConnectSupportStats/`, custom domain possible
  (DEPLOYMENT.md:73); `vite.config.ts` uses a relative base.
- Brand assets: `public/assets/DomainConnectSquareBlack.png` 152×145.

## Decisions

- Share icon and anchor only on chart and table panels (TimeChart, DataTable, Board,
  NewSupporters); Settings, Registry, Details, About, Notes, caveats, intro stay as they are.
- og:image: `./assets/DomainConnectSquareBlack.png` in the static HTML, rewritten to a full URL
  relative to the current base URL in the browser; `twitter:card` `summary`.
- Mastodon instance: inline form in the menu (host input, Share, error), "Change instance" once
  stored.
- Post text: `<panel title> – <page context> – Domain Connect support statistics`; page context
  is the entity name on cards, the page name on lists; dropped when equal to the panel title.
- Version: minor (issue).

- Step 1 done: `src/lib/share.ts` (`sharedUrl`, `withHash`, `postText`, `blueskyUrl`,
  `mastodonUrl`, `linkedinUrl`, `parseInstance`, `loadInstance`/`saveInstance` with key
  `dc-stats.mastodon-instance`, `isApplePlatform`), 18 tests in `tests/unit/share.test.ts`.

- Step 2 done: `Panel.svelte` (props `id`, `title`, `context`, `ready`, `testid`; scrolls once
  `ready` and on `hashchange`), `ShareMenu.svelte` (Mastodon form replaces the menu; Escape in
  the input closes), list pages keep `location.hash` via `withHash`. Tests:
  `tests/component/{Panel,ShareMenu}.test.ts`. Testing Library: `context` and `anchor` are
  Svelte options, pass props under `props:`.

- Step 3 done: `Panel` on every chart and table panel (slugs as above); Overview and
  Leaderboards pass `ready` once their boards' data settled; Open Graph tags in every
  `src/pages/*.html`; `absoluteOgImage()` in `share.ts`, called by `Layout`. e2e:
  `tests/e2e/share.spec.ts`.

## Corrections

- The `#` link sits next to the h2, not inside it: inside, it became part of the heading's
  accessible name (e2e `getByRole('heading', { name, exact })` failed).
- Link-preview crawlers do not run scripts: they see the relative `og:image` only.
- Maintainer: shared links stay absolute from the browser's URL; an override for testing
  (localhost links fail to publish): runtime `shareBaseUrl`, build time `VITE_SHARE_BASE_URL`
  (`resolveShareBaseUrl`, `sharedUrl(location, anchor, shareBase)`), also the base of `og:image`.

- Step 4: REQUIREMENTS F-2.14–F-2.16 and C-1, CLAUDE.md, 0.14.0 + CHANGELOG done; verify green.

- Maintainer feedback: logos in the menu (Simple Icons, CC0; LinkedIn from v10, later versions
  dropped it) in `src/lib/share-icons.ts`; Mastodon defaults to `mastodon.social`, one row with
  an edit button (secondary menuitem, ArrowRight/ArrowLeft); LinkedIn `share-offsite` opened an
  empty post: now `/feed/?shareActive=true&text=`.

## Open questions

- Real-release check: no data repo checked out next to this one and no access to `DATA_REPO`;
  done against the example export only.
