# Versioning and concise writing — iteration plan

**Branch:** feat/versioning **Started:** 2026-10-04
**Goal:** concise-writing rule applied to all docs; SemVer with CHANGELOG, version in the footer,
only approved tagged releases deployed.

## Tasks

- [~] Writing rule in DEVELOPING.md; rewrite README, CLAUDE, DEVELOPING, TESTING, DEPLOYMENT, REQUIREMENTS
- [ ] CHANGELOG.md, version 0.1.0, version check + release-notes script (TDD)
- [ ] Footer shows the version (component test)
- [ ] deploy.yml: tag on merge, `release` environment approval, data deploys use the latest release
- [ ] ci.yml: version/CHANGELOG check
- [ ] npm run verify, PR
- [ ] Remove plan

## Decisions (maintainer)

- PR bumps `package.json` + CHANGELOG; agent asks when the bump level is unclear.
- Merge to `main` tags `v<version>` and creates a prerelease; deploy waits for manual approval
  (environment `release`); after deploy the release becomes "latest".
- Data redeploys (dispatch, schedule, manual) build the latest release.
- Major: page or URL parameter removed/changed incompatibly. Minor: new page, feature, visible
  content. Patch: fixes, styling, dependencies. Docs/tests/CI only: no release.
- First version 0.1.0; one PR.
- All docs rewritten now; code comments fixed when touched.

## Open questions
