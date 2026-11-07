# DNS providers list: filters, first found

## Tasks
- [x] Tests first: filters, `?filter=` links, derived first seen
- [x] `deriveDnsProviders()`, `derived/dns-providers.json`, `ExportClient.dnsProviderFacts()`
- [x] `dns-providers.ts` filters, `withFirstSeen()`; view select and column
- [x] Stack links to the list carry `filter=all`
- [x] Docs, version 0.23.0, CHANGELOG
- [x] verify, real-release check, screenshots
- [~] Maintainer acceptance of screenshots and open questions

## Findings
- Release 2026-11-06: 2,913 rows; `supported_count` > 0: 294, overview latest `supporting_dns_providers`: 294.
- Old default: 445 rows, hides 52 supporters (all `dead`).
- Card 21 at 509f23a: `support_status` dead, `Temporary failure in name resolution`, 162 supported.
- Status split: ok/ok 441, ok/dead 195, ok/null 2,268, failed/dead 4, failed/ok 4, ok/error 1.
- `first_seen_at` is on the card only; 0 null; 1 row in the last 30 days.

- Real page, release 2026-11-06: filter counts 294 / 441 / 8 / 196 / 56 / 1 / 2,913, equal to the independent count.
- First found column overflowed 33 px at 1280; cell padding reduced on wide screens: 0 from 1100 px up. 1024 px: 65 px, was 78 px without the column.
- Phone table overflow 103 px with real data: #81, phone columns unchanged.
- 2,912 of 2,913 rows are before `scannerStartDate` and show the First scan badge.

## Decisions
- `null` status is unknown: in no failure filter, only in All.
- `partial` counts as not OK.
- "With errors": supported_count >= 1 (no row has exactly 1 today, so >1 gives the same rows).
- "New": within 30 days of the release's `generated_at`.
- `?filter=<id>`; `?all=1` still reads as `filter=all`.

## Open questions
- Maintainer: confirm the >= 1 reading and null handling.
- Maintainer: First found column shows First scan on nearly every row: keep the badge?
