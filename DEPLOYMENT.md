# Deployment

How the site is published: GitHub Pages, fed by a separate data repo that the Domain Connect
Scanner pushes its export releases to.

---

## 1. Operating model

```
Scanner host (cron)                     data repo (DATA_REPO)            this repo
───────────────────                     ─────────────────────            ─────────
export.py → OUT_DIR/current/  ──push──▶  one release (manifest.json …)
                              ──repository_dispatch (export-published)──▶ deploy.yml
                                                                          ├ checkout site + data repo
                                                                          ├ npm test, npm run build
                                                                          ├ validate release vs contract/
                                                                          ├ bundle into dist/data/
                                                                          └ publish dist/ to Pages
```

- **Site and data are published together, as one Pages artifact.** A visitor never sees new
  pages with old data or the reverse, and the page and the release it reads always come from
  one deploy.
- **A release that doesn't validate is not published.** The deploy fails and Pages keeps
  serving the last good deploy. This protects the site when the Scanner's format runs ahead of
  the vendored contract (DEVELOPING.md §3.6b).
- **Only the files the release's manifest reaches are published** (`scripts/bundle-data.ts`):
  nothing else in the data repo (README, scripts, older releases) ever goes public.
- The site has no secrets and no backend. Its only moving parts are the two repos and the
  workflow.

Triggers of `.github/workflows/deploy.yml`:

| Trigger                                  | When                         | Why                                        |
| ---------------------------------------- | ---------------------------- | ------------------------------------------ |
| `push` to `main`                         | A PR is merged               | Ship site changes with the current release |
| `repository_dispatch` `export-published` | The Scanner pushed a release | Ship new data                              |
| `schedule` daily 07:30 UTC               | Always                       | Fallback if a dispatch was lost            |
| `workflow_dispatch`                      | By hand                      | Redeploy, e.g. after fixing the data repo  |

Deploys run one at a time (`concurrency: pages`); a newer trigger waits.

---

## 2. One-time setup

### 2.1 This repo (pawel-kow/DomainConnectSupportStats)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → Variables:**

   | Variable    | Required | Default | Meaning                                                                 |
   | ----------- | -------- | ------- | ----------------------------------------------------------------------- |
   | `DATA_REPO` | yes      | —       | `owner/name` of the data repo                                           |
   | `DATA_REF`  | no       | `main`  | Branch (or tag) of the data repo to deploy                              |
   | `DATA_PATH` | no       | `.`     | Directory inside the data repo that holds the release (`manifest.json`) |

3. **Secret `DATA_REPO_TOKEN`** — only if the data repo is private: a fine-grained token with
   _Contents: read_ on the data repo. A public data repo needs no secret.
4. **Branch protection on `main`:** require PRs and the CI `test` and `no-plan-files` checks.
5. The site is then at `https://pawel-kow.github.io/DomainConnectSupportStats/`. The build uses
   a relative base, so a custom domain later needs no rebuild: set it under Settings → Pages
   (and DNS), nothing in the code.

### 2.2 The data repo

Created by the maintainer, name free (it goes into `DATA_REPO`). Public is recommended — the
data is published on the site anyway. Layout, with the default `DATA_PATH=.`:

```
<data repo>/
  manifest.json
  overview.json
  dns-providers.json
  dns-providers/{id}.json
  stacks.json, stacks/…
  service-providers.json, service-providers/…
  templates.json, templates/…/…
  README.md            optional; never published
```

i.e. exactly the **contents** of the Scanner's `OUT_DIR/current/` (one release, symlink
resolved), replacing the previous release in full on every push. Nothing in the data repo runs;
it needs no workflows and no Pages of its own.

### 2.3 The Scanner side (publish step)

The Scanner host needs:

- push access to the data repo (a deploy key with write access, or a fine-grained token with
  _Contents: read and write_ on the data repo only), and
- a fine-grained token with _Contents: read and write_ on **this** repo, only to send the
  `repository_dispatch` (GitHub requires that permission for dispatches; it grants nothing the
  token is used for otherwise). Store it outside the Scanner's repo checkout, readable only by
  the cron user.

The publish step, run after each export (when and how often is the Scanner's decision —
DomainConnectScanner DEPLOYMENT.md §10A):

```bash
#!/usr/bin/env bash
# Publish the newest export release to the data repo, then trigger the site deploy.
set -euo pipefail
OUT_DIR=/var/lib/dcscanner-export          # export.py --out-dir
DATA_CHECKOUT=/var/lib/dcstats-data         # clone of the data repo
SITE_REPO=pawel-kow/DomainConnectSupportStats

git -C "$DATA_CHECKOUT" pull --ff-only
# Mirror the release (dereferencing the `current` symlink), keeping the repo's own files.
rsync -a --delete --exclude .git --exclude README.md "$OUT_DIR/current/" "$DATA_CHECKOUT/"
generated_at=$(jq -r .generated_at "$DATA_CHECKOUT/manifest.json")
git -C "$DATA_CHECKOUT" add -A
if git -C "$DATA_CHECKOUT" diff --cached --quiet; then
  echo "release $generated_at already published"; exit 0
fi
git -C "$DATA_CHECKOUT" commit -q -m "Export release $generated_at"
git -C "$DATA_CHECKOUT" push -q

curl -fsS -X POST \
  -H "Authorization: Bearer $(cat /etc/dcstats/dispatch-token)" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$SITE_REPO/dispatches" \
  -d "{\"event_type\":\"export-published\",\"client_payload\":{\"generated_at\":\"$generated_at\"}}"
```

If the dispatch fails, the daily scheduled deploy picks the release up.

---

## 3. Runtime configuration

Pages read the release from `./data/` (bundled by the deploy). To point a build at a data host
instead, without rebuilding, set it in `config.js` next to the pages:

```js
window.DC_STATS_CONFIG = { dataBaseUrl: 'https://data.example.org/current/' };
```

Build-time alternative: `VITE_DATA_BASE_URL=… npm run build`. Precedence: runtime → build time →
`./data/`. A cross-origin data host must send CORS headers. The standard deploy needs neither.

---

## 4. Operations

### 4.1 Checking a deploy

The deploy run's summary records the site commit, the data repo commit, the release's
`generated_at` and the trigger. The site header shows `generated_at` too, so "is the new data
live?" is one look at the page.

### 4.2 When a deploy fails

| Failure                                              | Meaning                                                                         | Action                                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Require the data repo variable`                     | `DATA_REPO` unset                                                               | Set it (§2.1)                                                                                                                                                 |
| Data repo checkout                                   | Wrong `DATA_REPO`/`DATA_REF`, or private without `DATA_REPO_TOKEN`              | Fix variable/secret                                                                                                                                           |
| `npm test`                                           | `main` is broken                                                                | Fix via PR; CI should have caught it                                                                                                                          |
| `Validate and bundle the release` with schema errors | The Scanner's format changed beyond the vendored contract, or a corrupt release | Compare the release with `contract/`; for a format change, bring in the new contract (contract/README.md); for a corrupt release, re-publish from the Scanner |
| … with `missing` / `generated_at` errors             | A partial or mixed release was pushed                                           | Re-run the Scanner's publish step                                                                                                                             |

In every case the site keeps serving the last good deploy.

### 4.3 Rollback

- **Site:** revert the PR on `main` (via a PR); the push deploys.
- **Data:** `git revert` the release commit in the data repo (or push an older release), then run
  the deploy by hand (Actions → Deploy → Run workflow).

### 4.4 Data repo growth

Each release replaces several thousand small JSON files; git stores only what changed, but
history grows with every release. If the repo grows unwieldy, history can be dropped
(force-push a single-commit branch): the site only ever deploys the tip. Agree it with the
maintainer first; it rewrites the data repo's history.
