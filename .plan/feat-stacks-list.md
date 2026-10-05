# stacks-list — iteration plan

**Branch:** feat/stacks-list **Started:** 2026-10-05 **Issue:** #4
**Goal:** `stacks.html` lists every stack from `stacks.json` with sort, search and a support range bar.

## Tasks

- [~] Failing unit test for the range helper (`src/lib/stacks.ts`)
- [ ] Implement helper, `Stacks.svelte`, entry; e2e spec
- [ ] Real-release check, docs (CLAUDE.md table, REQUIREMENTS), version 0.9.0, CHANGELOG
- [ ] Promote findings, delete this file

## Findings

- `stacks.json` table `stacks`: name, provider_id, deployments, min/median/max_supported_pct, domains, domains_pct; export order is by domains desc (EXPORT_FORMAT.md)
- `links.stacks()`, `links.stack(id)` and `stack.html` already exist (#32)

## Decisions

- Columns: name (+ provider id line), deployments, min, median (range bar), max, domains (+ share). Phone: name, deployments, median, domains.
- Minor version (new page content).

## Corrections

## Open questions
