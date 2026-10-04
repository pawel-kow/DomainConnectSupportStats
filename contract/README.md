# Export contract (vendored)

The site renders the static JSON export written by the Domain Connect Scanner's `export.py`
(pawel-kow/DomainConnectScanner#211). This directory is a **verbatim copy** of the Scanner's
published contract for that export. It is the only thing this project knows about the
Scanner: never read, copy or depend on Scanner source code.

| Path | Upstream (DomainConnectScanner) | What it is |
|---|---|---|
| [`EXPORT_FORMAT.md`](EXPORT_FORMAT.md) | `docs/EXPORT_FORMAT.md` | Human description of every file, table and column. The reference for page work. |
| [`schemas/`](schemas/) | `docs/schemas/` | JSON Schemas (Draft 2020-12). `schemas/export/` is the export; the report schemas next to it are `$ref`'d by it. |
| [`examples/export/`](examples/export/) | `docs/examples/export/` | The full export of the Scanner's simulated example database. Used as the dev data set and as test fixtures. |

Current `format_version`: **1**.

## Updating

Never edit these files by hand. When the Scanner's export changes:

1. Copy the three upstream paths over these, unchanged, on a `chore/contract-<topic>` branch.
2. Run `npm test` and `npm run test:e2e`. The contract tests validate the example export
   against the schemas and fail on drift the loaders don't handle.
3. If `format_version` changed (a breaking change), update `SUPPORTED_FORMAT_VERSION` in
   `src/lib/data/manifest.ts` and fix the pages in the same PR. Additive changes need no code
   change: the site ignores unknown tables, columns and keys.

The deploy workflow validates every incoming data release against `schemas/export/` before it
publishes it (DEPLOYMENT.md), so a Scanner that runs ahead of this copy fails the deploy instead
of shipping a broken site.
