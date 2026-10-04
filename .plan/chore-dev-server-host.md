# dev-server-host — iteration plan

**Branch:** chore/dev-server-host **Started:** 2026-10-04 **Issue:** none
**Goal:** `npm run dev` and `npm run preview` reachable from the host browser through the devcontainer port forward.

## Tasks

- [x] Investigate why the host browser gets no response
- [~] Set `server.host` and `preview.host` in vite.config.ts
- [ ] Verify IPv4 and IPv6 loopback, run verify
- [ ] Promote findings, delete this file

## Findings

- In the container `localhost` resolves to `::1` only (`getent hosts localhost`).
- Vite dev listens on `[::1]:5173` only (`ss -ltnp`); `curl 127.0.0.1:5173` fails, `curl localhost:5173` returns 200.
- The VS Code port forward connects over IPv4, so the host browser gets no response.

## Decisions

- `host: true` for dev and preview: listens on all addresses (IPv4 and IPv6).
- No version bump: dev tooling only, the built site is unchanged.

## Corrections

## Open questions
