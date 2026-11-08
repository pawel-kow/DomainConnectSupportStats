# DNS providers list: "new" = newly supporting

## Tasks
- [~] Tests first: `new` from `newSupporting()` ids, label, unavailable without leaderboards
- [ ] `dnsProviderList` takes the new supporters' ids; view loads `leaderboards()`
- [ ] Docs, version 0.23.1, CHANGELOG
- [ ] verify, real-release check, screenshots

## Findings
- Release 2026-11-08: overview new supporters 11 (Plesk, first support sweep 2026-10-24); first found within 30 days: 0.
- `first_seen_at`: 2,912 of 2,913 on 2026-09-20, one on 2026-10-08.

## Decisions
- `new` uses `newSupporting()` (30 days before `generated_at`, not before `scannerStartDate`, first sweep left out): same rows as the overview. Accepted by the maintainer.
- First found column stays.
