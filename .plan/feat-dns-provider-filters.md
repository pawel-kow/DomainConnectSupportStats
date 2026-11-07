# DNS providers list: filters, first found

## Tasks
- [~] Tests first: filters, `?filter=` links, derived first seen
- [ ] `deriveDnsProviders()`, `derived/dns-providers.json`, `ExportClient.dnsProviders()`
- [ ] `dns-providers.ts` filters, `withFirstSeen()`; view select and column
- [ ] Stack links to the list carry `filter=all`
- [ ] Docs, version 0.23.0, CHANGELOG
- [ ] verify, real-release check, screenshots

## Findings
- Release 2026-11-06: 2,913 rows; `supported_count` > 0: 294, overview latest `supporting_dns_providers`: 294.
- Old default: 445 rows, hides 52 supporters (all `dead`).
- Card 21 at 509f23a: `support_status` dead, `Temporary failure in name resolution`, 162 supported.
- Status split: ok/ok 441, ok/dead 195, ok/null 2,268, failed/dead 4, failed/ok 4, ok/error 1.
- `first_seen_at` is on the card only; 0 null; 1 row in the last 30 days.

## Decisions
- `null` status is unknown: in no failure filter, only in All.
- `partial` counts as not OK.
- "With errors": supported_count >= 1 (no row has exactly 1 today, so >1 gives the same rows).
- "New": within 30 days of the release's `generated_at`.
- `?filter=<id>`; `?all=1` still reads as `filter=all`.

## Open questions
- Maintainer: confirm the >= 1 reading and null handling.
