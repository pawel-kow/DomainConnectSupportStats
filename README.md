# Domain Connect Support Statistics

A static statistics site showing how far [Domain Connect](https://www.domainconnect.org/) is
supported across the DNS providers that host real domains: adoption among scanned domains,
template support per DNS provider, stack, service provider and template, and how both change
over time.

The data comes from the [Domain Connect Scanner](https://github.com/pawel-kow/DomainConnectScanner)'s
static JSON export. The look follows the Templates statistics dashboard at
[stats.domainconnect.org](https://stats.domainconnect.org).

**Live:** https://pawel-kow.github.io/DomainConnectSupportStats/

## Pages

| Page                                                  | Shows                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------- |
| Overview (`index.html`)                               | Domain Connect support over time, latest headline numbers                   |
| DNS providers, Stacks, Service providers, Templates   | Full lists with sort, filter and search _(in progress)_                     |
| DNS provider, Stack, Service provider, Template cards | One entity's support, domain share, history and cross-links _(in progress)_ |

Every view is a plain shareable link; query parameters carry only ids and filters.

## Development

Requires Node 22.18+ (the devcontainer has Node 24 and Chromium for Playwright).

```bash
npm ci
npm run dev          # http://localhost:5173/ with the example data set
npm run verify       # lint, type check, tests, build, e2e
```

`DATA_DIR=<path to a release> npm run dev` renders a real export release instead of the example.
All commands: [CLAUDE.md](CLAUDE.md#development-commands).

## How it fits together

- **Svelte 5 + TypeScript, Vite multi-page build**: one HTML file per page, no backend.
- **Chart.js** for charts, bundled (no CDN; the only third-party request allowed is privacy-friendly analytics).
- **[`contract/`](contract/)**: the Scanner's export format, schemas and example export, vendored
  verbatim. The site is built only against this contract.
- **Deploy**: the Scanner pushes each release to a data repo and triggers this repo's GitHub
  Pages workflow, which validates the release and publishes site and data together
  ([DEPLOYMENT.md](DEPLOYMENT.md)).

## Documentation

| Document                                               | For                                                  |
| ------------------------------------------------------ | ---------------------------------------------------- |
| [REQUIREMENTS.md](REQUIREMENTS.md)                     | What the site must do                                |
| [DEVELOPING.md](DEVELOPING.md)                         | Code and process conventions                         |
| [TESTING.md](TESTING.md)                               | Test layers and gates                                |
| [DEPLOYMENT.md](DEPLOYMENT.md)                         | Pages, data repo, Scanner publish step, operations   |
| [contract/EXPORT_FORMAT.md](contract/EXPORT_FORMAT.md) | The data: every file, table and column               |
| [CLAUDE.md](CLAUDE.md)                                 | Architecture and file reference (also for AI agents) |
