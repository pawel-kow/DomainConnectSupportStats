# stack-card — iteration plan

**Branch:** feat/stack-card **Started:** 2026-10-05 **Issue:** #8
**Goal:** `stack.html?id=` shows the stack card per F-1a, replacing the placeholder.

## Tasks

- [~] Plan
- [ ] Extract StatusBadge from DnsProviders; Stack view; entry
- [ ] E2E spec, unit test for share-history caveat helper if any
- [ ] Docs (CLAUDE.md, REQUIREMENTS.md), version 0.8.0 (minor: new page), CHANGELOG
- [ ] Real-release check, screenshots, promote findings, delete this file

## Findings

- Registry component takes `stack: null` for an entry that is the card's own (Registry.svelte:12).
- Example stacks: cloudflare.com (1 deployment), ionos.com, plesk.com (2), quiet-host.example.

## Decisions

- Version minor 0.8.0.
- Headline: deployments, support median (min–max), domains.

## Corrections

## Open questions
