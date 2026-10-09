# Deployment

GitHub Pages, built from a tagged site release, the current export release from the data repo and
the DNS provider registry.

---

## 1. Operating model

```
Scanner host (cron)                     data repo (DATA_REPO)            this repo
───────────────────                     ─────────────────────            ─────────
export.py → OUT_DIR/current/  ──push──▶  one release (manifest.json …)
                              ──repository_dispatch (export-published)──▶ deploy.yml
                                                                          ├ pick site version (tag)
                                                                          ├ checkout tag + data repo
                                                                          │   + registry repo
                                                                          ├ npm test, npm run build
                                                                          ├ validate release vs contract/export/
                                                                          ├ bundle into dist/data/
                                                                          ├ derive into dist/data/derived/
                                                                          ├ validate registry vs contract/registry/
                                                                          ├ bundle into dist/registry/
                                                                          └ publish dist/ to Pages
```

- Site, data and registry are published together as one Pages artifact.
- Only tagged site versions are published. The deployed version is the **latest GitHub Release**.
- A release that fails validation is not published; Pages keeps the last good deploy.
- Only files reachable from the release's manifest are published (`scripts/bundle-data.ts`).
- Derived data (`data/derived/`: `leaderboards.json`, `ecosystem.json`, `stacks.json`, `templates.json`, one file per template at
  its card's path; `scripts/derive-data.ts`) is computed from the bundled release on every deploy.
- Only valid registry entries and their logos are published, at `registry/<a>/<b>/<encoded file
name>`, with `registry/registry.json` `{repository, commit}` (`scripts/bundle-registry.ts`). An
  invalid registry is not published.
- No secrets, no backend.

`.github/workflows/deploy.yml`:

| Trigger                                      | Site version       | Flow                                                                                  |
| -------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------- |
| `push` to `main`, new `package.json` version | `v<version>` (new) | tag + prerelease → approval in environment `release` → deploy → release marked latest |
| `push` to `main`, version already tagged     | —                  | nothing deployed                                                                      |
| `repository_dispatch` `export-published`     | latest release     | deploy                                                                                |
| `schedule` daily 07:30 UTC                   | latest release     | deploy (covers a lost dispatch)                                                       |
| `workflow_dispatch`                          | latest release     | deploy                                                                                |

Release notes are the version's [CHANGELOG.md](CHANGELOG.md) section. A rejected or failed approval
leaves the prerelease unpublished; data deploys keep using the previous latest release. Deploys run
one at a time (`concurrency: pages`).

---

## 2. One-time setup

### 2.1 This repo (pawel-kow/DomainConnectSupportStats)

1. **Settings → Pages → Source: GitHub Actions.**
2. **Settings → Environments → New environment `release`** → Required reviewers: the maintainer.
3. **Settings → Secrets and variables → Actions → Variables:**

   | Variable        | Required | Default | Meaning                                            |
   | --------------- | -------- | ------- | -------------------------------------------------- |
   | `DATA_REPO`     | yes      | —       | `owner/name` of the data repo                      |
   | `DATA_REF`      | no       | `main`  | Branch or tag of the data repo                     |
   | `DATA_PATH`     | no       | `.`     | Directory in the data repo holding `manifest.json` |
   | `REGISTRY_REPO` | yes      | —       | `owner/name` of the DNS provider registry (public) |
   | `REGISTRY_REF`  | no       | `main`  | Branch or tag of the registry                      |

4. **Secret `DATA_REPO_TOKEN`**, only for a private data repo: fine-grained token, _Contents:
   read_ on the data repo.
5. **Branch protection on `main`:** PRs required; required checks `test` and `no-plan-files`.
6. URL: `https://pawel-kow.github.io/DomainConnectSupportStats/`. A custom domain is set under
   Settings → Pages and DNS; the relative base needs no rebuild.

### 2.2 The data repo

Created by the maintainer, any name (`DATA_REPO`), public recommended. With `DATA_PATH=.`:

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

The contents of the Scanner's `OUT_DIR/current/` (one release, symlink resolved), replaced in full
on every push. No workflows, no Pages.

### 2.3 The registry repo

Public; one file per DNS provider stack, `providers/<a>/<b>/<providerId>.json`, valid against
`contract/registry/schema/provider.schema.json`, logos next to the entries (layout and folder rule:
`contract/registry/REGISTRY_FORMAT.md`, `src/lib/registry/path.ts`). Deploy checks it out into
`registry/`, the path of the dev registry submodule. A registry change is published by the next
deploy (daily, or Deploy by hand).

### 2.4 The Scanner side (publish step)

The Scanner host needs:

- push access to the data repo (deploy key with write access, or fine-grained token with
  _Contents: read and write_ on the data repo only);
- a fine-grained token with _Contents: read and write_ on **this** repo, used only for the
  `repository_dispatch`, stored outside the Scanner checkout, readable only by the cron user.

Publish step, run after each export:

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

A failed dispatch is picked up by the daily deploy.

---

## 3. Runtime configuration

Pages read the release from `./data/`. A different data host, without rebuilding, in `config.js`:

```js
window.DC_STATS_CONFIG = { dataBaseUrl: 'https://data.example.org/current/' };
```

Build time: `VITE_DATA_BASE_URL=… npm run build`. Precedence: runtime → build time → `./data/`. The
registry likewise: `registryBaseUrl`, `VITE_REGISTRY_BASE_URL`, `./registry/`. A cross-origin host
must send CORS headers.

The day scanning began, before which "first seen" and "supported since" dates show the badge
"First scan": `scannerStartDate: '2026-09-22'` (`YYYY-MM-DD`, UTC). The shipped `public/config.js`
sets it; unset or invalid, no date is marked.

Shared links (share menu) and the link-preview image are built on the URL the browser shows. A
different site URL, e.g. the public site while testing on localhost (share targets reject localhost
links): `shareBaseUrl: 'https://stats.example.org/'`, build time `VITE_SHARE_BASE_URL`. The page
name, its query and the panel anchor are kept. Unset or not an absolute http(s) URL: the browser's
URL.

---

## 4. Operations

### 4.1 Checking a deploy

The run summary lists the site version, site commit, data repo commit, registry commit, the
release's `generated_at` and the trigger. The page header shows `generated_at`; the footer shows the
site version and the registry commit.

### 4.2 Releasing a site version

Merge a PR with a new version (DEVELOPING.md §3.10), then approve the `release` deployment in the
Deploy run (Actions → Deploy → Review deployments).

### 4.3 When a deploy fails

| Failure                                          | Meaning                                                             | Action                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `Require the data repo variable`                 | `DATA_REPO` unset                                                   | Set it (§2.1)                                                                                           |
| `Require the registry repo variable`             | `REGISTRY_REPO` unset                                               | Set it (§2.1)                                                                                           |
| `No site release yet`                            | Data deploy before the first approved site release                  | Release a site version (§4.2)                                                                           |
| `Release notes`                                  | No CHANGELOG section for the version                                | Add it via PR with a patch bump                                                                         |
| Data repo checkout                               | Wrong `DATA_REPO`/`DATA_REF`, or private without `DATA_REPO_TOKEN`  | Fix variable/secret                                                                                     |
| `npm test`                                       | The tagged version is broken                                        | Fix via PR with a patch bump                                                                            |
| `Validate and bundle the release`, schema errors | Format changed beyond the vendored contract, or a corrupt release   | Compare with `contract/export/`: new contract copy (contract/README.md), or re-publish from the Scanner |
| … `missing` / `generated_at` errors              | Partial or mixed release pushed                                     | Re-run the Scanner's publish step                                                                       |
| `Validate and bundle the registry`               | An entry fails the schema, sits at the wrong path or lacks its logo | Fix the entry in the registry repo, then run Deploy by hand                                             |

The site keeps serving the last good deploy.

### 4.4 Rollback

- **Site:** revert via PR with a patch bump; or mark the previous release as latest
  (`gh release edit v<previous> --latest`) and run Deploy by hand.
- **Registry:** `git revert` the commit in the registry repo, or set `REGISTRY_REF` to a good tag,
  then run Deploy by hand.
- **Data:** `git revert` the release commit in the data repo (or push an older release), then run
  Deploy by hand.

### 4.5 Data repo growth

Each release replaces several thousand small JSON files; history grows with each one. History can
be dropped (force-push a single-commit branch) after agreement with the maintainer; deploys use
only the tip.
