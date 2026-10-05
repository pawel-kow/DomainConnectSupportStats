# Contracts under contract/, test registry as submodule — iteration plan

**Branch:** refactor/contract-registry-submodule **Started:** 2026-10-05 **Issue:** #29
**Goal:** `contract/export/` and `contract/registry/` (schema, format doc, golden examples) as
verbatim contract copies; the test registry repository as submodule `registry/` for dev; deploy
clones `REGISTRY_REPO` into `registry/`; CI, tests and docs follow.

## Tasks

- [~] Move export contract to `contract/export/`, fix references
- [ ] `contract/registry/` from the test registry repo; remove `registry/examples/`, `registry/schema/`
- [ ] Submodule `registry/`; dev/preview default, e2e on the golden copy, `validate:registry` default
- [ ] CI (submodule checkout), deploy (`registry/` path), devcontainer, lint ignores
- [ ] Docs: contract/README.md, CLAUDE.md, README.md, DEVELOPING.md, DEPLOYMENT.md, TESTING.md, REQUIREMENTS.md
- [ ] `npm run verify`, PR
- [ ] Promote findings, delete this file

## Findings

- Test registry (`pawel-kow/DomainConnectDNSProviderRegistryTest` @ 37e4894): `providers/` and
  `schema/provider.schema.json` identical to `registry/examples/providers/` and
  `registry/schema/` (`diff -r`).
- Path references: `vite.config.ts:16,18`, `scripts/export-release.ts:11-13`,
  `scripts/registry.ts:22-24`, `scripts/validate-registry.ts`, `tests/fixtures.ts:6`,
  `tests/unit/registry-entry.test.ts:6`, `tests/component/Registry.test.ts:12`,
  `deploy.yml` (`registry-data`).

## Decisions

- `contract/registry/`: `REGISTRY_FORMAT.md` (registry repo README.md), `schema/`, `examples/`
  (golden copy of `providers/`, test fixture). Validation uses this schema only (maintainer).
- `registry/` submodule = dev registry for `npm run dev`/`preview`; it develops towards real
  data. Unit, component, contract and e2e tests use the golden copy (maintainer).
- `validate:registry` default: `registry/` (the dev registry); CI checks out the submodule.
- Deploy: site checkout without submodules, `REGISTRY_REPO` into `registry/`; tests there use the
  golden copy.
- No version bump: site output unchanged (maintainer).

## Corrections

## Open questions
