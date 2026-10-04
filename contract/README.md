# Export contract (vendored)

Verbatim copy of the Domain Connect Scanner's published contract for its static JSON export
(`export.py`). The only interface to the Scanner: never read, copy or depend on Scanner source
code.

| Path | Upstream (DomainConnectScanner) | What it is |
|---|---|---|
| [`EXPORT_FORMAT.md`](EXPORT_FORMAT.md) | `docs/EXPORT_FORMAT.md` | Human description of every file, table and column. The reference for page work. |
| [`schemas/`](schemas/) | `docs/schemas/` | JSON Schemas (Draft 2020-12). `schemas/export/` is the export; the report schemas next to it are `$ref`'d by it. |
| [`examples/export/`](examples/export/) | `docs/examples/export/` | The full export of the Scanner's simulated example database. Used as the dev data set and as test fixtures. |

Current `format_version`: **1**.

## Updating

Never edit these files by hand. When the Scanner's export changes:

1. Copy the three upstream paths over these, unchanged, on a `chore/contract-<topic>` branch.
2. Run `npm test` and `npm run test:e2e`.
3. If `format_version` changed (a breaking change), update `SUPPORTED_FORMAT_VERSION` in
   `src/lib/data/manifest.ts` and fix the pages in the same PR. Additive changes need no code
   change.

The deploy validates every data release against `schemas/export/`; a release that fails is not
published ([DEPLOYMENT.md](../DEPLOYMENT.md)).
