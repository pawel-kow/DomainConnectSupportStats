# Developing

Code and process conventions for the Domain Connect support statistics site.

Read alongside [REQUIREMENTS.md](REQUIREMENTS.md) (what the site must do), [TESTING.md](TESTING.md)
(how it is verified), [DEPLOYMENT.md](DEPLOYMENT.md) (how it is published) and
[contract/EXPORT_FORMAT.md](contract/EXPORT_FORMAT.md) (the data it renders).

**Three facts shape everything here.** This project has one maintainer, so peer review isn't a
safety net — automation and a disciplined self-review checklist do that job instead. It publishes
numbers people will draw conclusions from about named companies' products: a page that shows an
unknown value as 0, a share of the sample as a share of the Internet, or a stale value as current
has made the site worse, however good it looks. And most of the text it shows comes from third
parties (template names, provider names, error messages): rendering it carelessly is an XSS hole
on a public site.

---

## 1. Code conventions

### 1.1 Style

TypeScript (strict, `noUncheckedIndexedAccess`) and Svelte 5 with runes. Prettier formats (single
quotes, width 100), ESLint lints (`typescript-eslint`, `eslint-plugin-svelte`). Don't hand-maintain
formatting: `npm run format`, and CI runs `npm run lint`. Keep reformatting in a **separate
commit** from behaviour changes — a mixed diff can't be reviewed, not even by its own author a
week later.

### 1.2 Naming

| Kind      | Convention                                                | Example                                     |
| --------- | --------------------------------------------------------- | ------------------------------------------- |
| Module    | `camelCase` or `kebab-case` `.ts`, noun                   | `series.ts`, `export-release.ts`            |
| Component | `PascalCase.svelte`, noun                                 | `DataTable.svelte`                          |
| Page      | `kebab-case.html`, the contract's page name               | `service-provider.html`                     |
| Function  | `camelCase`, verb phrase                                  | `filePath`, `importTimeMs`                  |
| Predicate | `is` / `has` / `should`                                   | `isNumericKind`                             |
| Constant  | `UPPER_SNAKE`                                             | `SUPPORTED_FORMAT_VERSION`                  |
| Test      | `describe('<unit>')` + `it('<behaviour>')` in plain words | `it('sorts nulls last in both directions')` |

Three project-specific rules:

**Name the thing it is, not what you assume it is.** A long accurate name beats a short
misleading one. "Domains" in this data are always _attributed, scanned_ domains — a label saying
"domains on the Internet" is a bug.

**Distinguish the provider ids explicitly — the contract itself is inconsistent.**
`dns_provider_id` (a number) is one DNS provider deployment. `provider_id` is a **stack** in
`dns-providers.json`, stack cards and template supporters, but the **service provider** in
`templates.json`. `service_provider_id` is a template publisher. In new code, never name a
variable `providerId`: say `dnsProviderId`, `stackId` or `serviceProviderId`, and convert at the
point where a contract row is read.

**Say what a count counts.** `count`, `total`, `n` are ambiguous where supported, not-supported
and not-yet-determined must add up. Prefer `supportedCount`, `knownDnsProviders`.

### 1.3 Comments

Comment **why**, never what. Required:

- **Contract rules the code enforces** that look arbitrary without it (`findTable`'s suffix match,
  `compareCells` putting `null` last, the two-clock placement in `series.ts`). Name the
  EXPORT_FORMAT.md section.
- **Anything that looks wrong but is right.**
- **Deliberate breadth in error handling** (what a broad `catch` is for).

Forbidden: commented-out code (git remembers), changelog comments (`// fixed 2026-10`), comments
restating the line below. Docstring every exported function: one summary line, then details when
not obvious from the signature and types.

### 1.4 Types

No `any`. Contract data is typed in `src/lib/data/types.ts` — only what the site reads, with
unknown keys allowed (the contract adds keys without a version bump). Cast a cell to its type at
the point you read it (`num(row, key)`), and handle `null` there.

### 1.5 Error handling

- **Never a blank page.** Every page renders inside `Layout`, and every load is an `{#await}` with
  a `{:catch}`: `NotFound` (missing param, 404) links back to the list, `LoadError` for anything
  else.
- **Distinguish "not found" from "failed".** A 404 for a card is a user-facing state; a 5xx or a
  `ReleaseMismatchError` is a load failure. Don't collapse them.
- **Never swallow silently.** Handle meaningfully or let it propagate to the page's `{:catch}`.
- **Reject what you can't render correctly.** An unsupported `format_version` fails loudly
  (`UnsupportedFormatError`) instead of rendering a misread data set.

### 1.6 Rendering third-party text

- Use Svelte's text interpolation (`{value}`), which escapes. `{@html}` is a lint error
  (`svelte/no-at-html-tags`); there is no exception.
- URLs from the data (`logo_url`, `api_url`, ...) are untrusted: only render them as links or
  images after checking the scheme is `https:` (or `http:`), never `javascript:`/`data:`.
- No `console.log` in shipped code.

### 1.7 Svelte

Runes (`$props`, `$state`, `$derived`, `$effect`), no legacy `export let`/stores. A component
takes data as props and renders it; fetching happens in the page view. Pure logic goes in a
`src/lib/*.ts` function, not in a component's `<script>` — a function is testable without a DOM.

---

## 2. Module layout

```
src/pages/*.html → src/entries/*.ts → src/views/*.svelte → src/lib/components/*.svelte
                                                         ↘ src/lib/*.ts → src/lib/data/*.ts
```

One direction only. `src/lib/data/` and `src/lib/*.ts` never import Svelte or touch the DOM
(except `config.ts` reading `window`), so they run under Node in unit tests and in
`scripts/`. A view composes components; it doesn't reimplement a table or a chart.

Function length target: **≤ 40 lines**, one level of abstraction each.

---

## 3. Development process

### 3.0 Starting an iteration: agent branch mutex

Two agent sessions working in the same checkout at once corrupt each other's work — one
switches branches under the other, or both rebase `main` while the other is mid-edit. Before
touching anything else, an agent claims exclusive use of the working tree with a lock file.

1. **Peek for `.agent-sync.yml`** in the repo root before any other action (before reading the
   plan, before touching git). If it exists, another agent holds the checkout: **stop**, and
   poll for its removal every 15 minutes until it's gone. Do not read its contents to make
   decisions — its only meaning is "present" or "absent" (see rule 5).
2. **Claim it atomically** once absent: open with `O_EXCL` (e.g. shell
   `set -o noclobber; { > .agent-sync.yml; } 2>/dev/null`, or Node `fs.openSync(path, 'wx')`) so
   that if two agents race, exactly one create succeeds and the other sees the file already
   exists and falls back to polling (step 1). Never check-then-create as two separate steps —
   that's the race the mutex exists to prevent.
3. **Write the claim** as YAML with exactly these fields:
   ```yaml
   timestamp: 2026-10-04T14:03:00Z
   branch: feat/<topic>
   issue: <GH issue number(s)>
   ```
4. **Sync `main` with `origin` next**, before creating or switching to a work branch —
   `git checkout main && git pull --ff-only origin main` — so the branch created in this
   iteration forks from a current `main`, not a stale local copy.
5. **Never commit the sync file.** It is local coordination state, not project history —
   `.agent-sync.yml` is in `.gitignore`; never `git add` it even under pressure to "just get it
   merged."
6. **Remove it when the iteration is fully finished** — after the PR work is done and the
   agent has switched back to `main`. A crashed or interrupted session leaves the file
   behind; that's a bug to fix by hand (delete it once you've confirmed no other agent is
   actually mid-iteration), not evidence the mechanism should be skipped.

This is a cooperative lock: it only works if every agent session checks it. It does not protect
against a human editing the tree directly, and it does not replace git's own conflict handling.

### 3.1 Test-driven development

Default to TDD wherever there's a testable seam: red → green → refactor — write the failing test,
make it pass minimally, then clean up with the test as the net.

**TDD is mandatory for:**

| Area                                                     | Why                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/data/` (encoding, paths, loading, table lookup) | It is the contract in code; a wrong path is a page of 404s                |
| `src/lib/format.ts`, `cells.ts`, `series.ts`             | Null-as-unknown, rounding and the two clocks decide what a number _means_ |
| `scripts/export-release.ts`                              | It decides whether a release is published                                 |
| Sorting/filtering in `DataTable`                         | Ranking order is a claim about providers                                  |
| Any bug fix                                              | The regression test comes first — it proves you fixed the right thing     |

**TDD is impractical for** page layout, styling and chart cosmetics. Cover pages with Playwright
assertions on what they show (TESTING.md §5) and look at them (screenshots in the PR when the
look changed).

**Bug-fix discipline:** reproduce first as a failing test encoding the _observed_ behaviour, then
fix.

### 3.2 Branching

Trunk-based, short-lived branches:

```
main                  always deployable; protected; no direct pushes; every push deploys
  feat/<topic>        new page or capability
  fix/<topic>         defect
  refactor/<topic>    behaviour-preserving restructuring
  docs/<topic>        documentation only
  chore/<topic>       deps, tooling, hygiene
  chore/contract-<topic>  a new copy of the export contract (contract/README.md)
```

Branch from `main`, rebase to stay current, merge via PR. Keep branches under a few days. **One
concern per branch** — a page and an unrelated fix are two branches; note it, finish, fix
separately. One page per branch is the norm.

### 3.3 Commits

```
<type>(<scope>): <imperative summary>

<why — not what; the diff shows what>

Refs: #<issue>
```

Types: `feat` `fix` `refactor` `perf` `test` `docs` `chore` `ci`. Keep commits atomic and
revertable.

### 3.4 Review — human in the loop for a solo maintainer

With one maintainer, "require an approval" is theatre. The real gates are **automation you can't
skip** and **a checklist completed away from the keyboard you wrote the code on**.

**Every change goes through a PR**, including your own — not for approval, but for the diff view,
the CI run, and the pause. `main` is protected; no direct pushes. (Data never comes through this
repo: releases go to the data repo, DEPLOYMENT.md.)

**Use `gh` only to open issues and PRs, update a PR's description, and flip draft ⟷ ready for
review.** Don't use it to merge, close, comment on, or otherwise manage PRs or issues, trigger
workflows, change repository settings, or touch any other GitHub resource — those stay manual,
through the GitHub UI.

**Keep PR descriptions concise.** State the intent and the main reworks or new features — not a
line-by-line diff narration. Add screenshots when a page's look changed.

**Tier by risk:**

**Tier 1 — self-review, merge when CI is green**

Docs, tests, formatting, styling-only changes, single-file refactors under ~100 lines with tests
passing.

**Tier 2 — self-review, then a mandatory cooling-off period before merge**

Anything touching: data loading, id encoding or manifest handling (`src/lib/data/`) · what a
number means on screen (denominators, null handling, rounding, labels of counts and shares,
sort order of rankings) · rendering of third-party text or URLs · the deploy or CI workflows ·
release validation/bundling (`scripts/`) · a new copy of the contract · a new runtime dependency
or any request to a third-party host.

For Tier 2: open the PR, **sleep on it**, and re-read the full diff the next day before merging.
Use an outside reader when one is available, but don't block on it.

**Self-review checklist** (Tier 2; run through it in the PR's diff view, not your editor):

- [ ] Tests written **before** the fix/feature, and they failed first
- [ ] `npm run verify` green locally, not just the new tests
- [ ] Diff read end to end in the PR view — no debug output, no commented-out code
- [ ] Every number on a changed page: is its denominator stated? Is `null` shown as unknown?
      Does a share of scanned domains say so?
- [ ] Third-party text and URLs escaped/validated; no `{@html}`; no new third-party request from
      the visitor's browser
- [ ] Behaviour touched → [REQUIREMENTS.md](REQUIREMENTS.md) still accurate
- [ ] Checked against a real release, not only the example export (§3.4a)
- [ ] Rollback: if this is wrong in production, revert and push `main` — does that suffice?
- [ ] Agentic work: findings promoted out of `.plan/`, then `git rm -r .plan` in its own commit
      (§3.8)

**AI-assisted changes get Tier 2 treatment regardless of size**, and the PR says so. Generated
code is fluent and confident in ways that mask incorrect assumptions. Read generated diffs more
slowly, not less.

### 3.4a Real-release check gates the draft → ready-for-review transition

The example export is small and hand-shaped; real releases have thousands of rows, long names,
unusual ids and missing values the example doesn't reach. Any change to a page, a shared
component or `src/lib/` is checked against the current real release before it is proposed for
review — not before merge, before _review_.

1. **Open the PR as a draft** as soon as the branch is pushed, so CI runs in parallel.
2. **Run against the real release:** check out the data repo next to this one and run
   `npm run validate:export -- ../<data-repo>/<DATA_PATH>`, then
   `DATA_DIR=../<data-repo>/<DATA_PATH> npm run test:e2e` and look at every changed page in
   `DATA_DIR=... npm run preview` (large tables, long names, null-heavy rows, mobile width).
3. **On a clean run, flip the PR from draft to ready for review** (`gh pr ready`) and update its
   description (`gh pr edit --body`) with the release's `generated_at` and what was checked. On a
   failure, fix, re-run, and only flip once it passes.

E2E assertions pinned to example values (e.g. `60.1%`) are expected to fail against a real
release; what must hold is that no page errors, every page renders, and links resolve. Changes
that don't touch pages or `src/lib/` (docs, CI-only, dependency bumps without runtime effect)
skip this gate.

### 3.5 Working with GH issues

1. If an issue or a bug is discovered and not yet on GitHub — open an issue before work starts.
2. If working on an issue — move it to "In Progress" (manually if the agent's token can't).
3. A PR fixing an issue is linked to it (`Closes #NN` in the description) so it closes on merge.

### 3.6 Verification before merge

Automated ([TESTING.md](TESTING.md) §7): `npm run lint`, `npm run check`, `npm test`,
`npm run validate:export`, `npm run build`, `npm run test:e2e` — `npm run verify` runs them all.

Manual, for Tier 2: the real-release check (§3.4a), and a look at every changed page at phone
width.

### 3.6a Documentation stays current every coding loop

Update affected `.md` files as the last step of the same iteration that changed the code, before
opening the PR — never as a separate, later pass.

| Change                                                         | Update                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A page built, added or its URL parameters changed              | [CLAUDE.md](CLAUDE.md) page table, [REQUIREMENTS.md](REQUIREMENTS.md)                               |
| A new module, script, component or test directory              | [CLAUDE.md](CLAUDE.md)'s File Reference                                                             |
| A new or changed npm script, env var or config key             | [README.md](README.md), [CLAUDE.md](CLAUDE.md) Development Commands                                 |
| A deploy, workflow, variable or secret changed                 | [DEPLOYMENT.md](DEPLOYMENT.md)                                                                      |
| Test layers, fixtures or tooling changed                       | [TESTING.md](TESTING.md)                                                                            |
| A behavioural constraint or requirement established or changed | [REQUIREMENTS.md](REQUIREMENTS.md)                                                                  |
| A defect found but not fixed, or follow-up identified          | A GitHub issue (label `bug`/`enhancement`, plus `severity: *` for bugs)                             |
| A defect fixed                                                 | Close the issue via the PR                                                                          |
| A new copy of the contract                                     | [contract/README.md](contract/README.md) (format version), `SUPPORTED_FORMAT_VERSION` if it changed |

If nothing in the table applies, say so rather than skipping the check silently: "no docs
affected" is a valid conclusion, an unconsidered one is not.

### 3.6b The export contract

`contract/` is the Scanner's published contract for the data this site renders. It is binding and
it is not ours:

1. **Never read DomainConnectScanner source code**, and never infer behaviour from it. Build only
   from `contract/EXPORT_FORMAT.md`, the schemas and the example export. If a page needs something
   the contract doesn't say, ask the maintainer (or open an issue on the Scanner) — don't guess.
2. **Never edit `contract/` by hand.** A new copy comes in a `chore/contract-<topic>` PR, verbatim
   from the Scanner's `docs/` (contract/README.md), with `npm test` and `npm run test:e2e` green.
3. **Additive changes need no code change** — the site ignores unknown files, tables, columns and
   keys. A test or a page that breaks on an additive change is a bug in this repo.
4. **A breaking change** (`format_version` bump) updates `SUPPORTED_FORMAT_VERSION` and every
   affected page in the same PR. Until it is merged, the deploy refuses the new releases (they
   fail validation), and the site keeps showing the last good one.
5. **Tests use the example export as fixtures** (`tests/fixtures.ts`), never a hand-written
   imitation of it: a hand-written fixture encodes our assumptions, not the contract.

### 3.7 Releasing

`main` is deployable and **every push to `main` deploys** (DEPLOYMENT.md). There is no separate
release step: merging the PR is the release. Rollback is `git revert` + PR; the data side rolls
back in the data repo.

### 3.8 Agentic workflows

Work by an AI coding agent follows every rule above, plus one more: **the agent maintains a
written plan file for the duration of the iteration.**

An agent holds its reasoning in a context window the maintainer can't see, that compacts as work
proceeds, and that vanishes when the session ends. A long iteration can drift from the original
task, silently drop a sub-task, or rediscover a finding it already established an hour earlier. A
plan file on disk makes the intended work, current position, and accumulated findings
inspectable at any moment — by the maintainer mid-flight, and by the agent itself after a context
compaction.

#### The rules

1. **Write the plan before the first edit.** One file per iteration at `.plan/<branch-or-topic>.md`.
   Create it after investigating and before changing code — a plan written from assumptions
   instead of the codebase is worse than none.
2. **Commit it and push it.** The plan is tracked in git, on the feature branch, so it
   synchronises like any other file. Commit it early — ideally as the branch's first commit — and
   again whenever it changes materially.
3. **Include a task list with explicit state.** Every task is `[ ]` pending, `[x]` done, or `[~]`
   in progress. Exactly one `[~]` at a time.
4. **Record findings as they are established**, not at the end, with evidence. "The real release
   has 3,412 DNS providers and the list renders in 180 ms" is a finding; "the list seems fast" is
   not.
5. **Update the file as the iteration proceeds**, not once at the close.
6. **Record course corrections, including your own errors.** When an approach is abandoned or an
   earlier conclusion turns out wrong, write down what changed and why.
7. **Delete the plan file before the final merge**, in its own commit. Promote anything worth
   keeping first (below). CI enforces this: a PR that still contains `.plan/` files can't merge.

#### Why committed rather than ignored

It synchronises between sessions and machines, it appears in the PR diff next to the code, it
survives interruption, and it makes handover possible. The cost — it must be actively removed —
is what the CI gate is for.

#### What gets promoted, and where

| Content                                         | Promote to                                                     |
| ----------------------------------------------- | -------------------------------------------------------------- |
| A defect found but not fixed, or follow-up work | A GitHub issue (label `bug` + `severity: *`, or `enhancement`) |
| A behavioural decision or constraint            | [REQUIREMENTS.md](REQUIREMENTS.md)                             |
| Why the change looks like it does               | The commit message and PR description                          |
| Something surprising about the data             | A code comment at the place it surprises                       |
| A question about the contract                   | An issue on the Scanner, or the maintainer                     |

**Filing a finding as a GitHub issue:** write it so it can be read and acted on independently,
with no reference to the plan file — quote the relevant code inline, name concrete file paths and
line numbers, and state the fix. Severity labels: `severity: correctness bug` (🔴 a wrong number
or broken page users see), `severity: operational hazard or significant gap` (🟠),
`severity: quality/maintainability` (🟡), `severity: known/accepted` (🔵, for awareness only).

#### Template

```markdown
# <topic> — iteration plan

**Branch:** feat/<topic> **Started:** YYYY-MM-DD **Issue:** #NN
**Goal:** <one sentence: what "done" means>

## Tasks

- [x] Investigate how X currently works
- [~] Add failing test for Y
- [ ] Implement Y
- [ ] Real-release check, docs (§3.6a)
- [ ] Promote findings, delete this file

## Findings

- <fact> — <evidence: file:line, command output, measurement>

## Decisions

- <choice> — <why, and what was rejected>

## Corrections

- <what I got wrong, and what changed as a result>

## Open questions

- <needs a human answer before proceeding>
```

#### The CI gate

`.github/workflows/ci.yml` job `no-plan-files` fails a PR whose branch still tracks `.plan/`
files, and prints the fix (`git rm -r .plan && git commit -m 'chore: remove iteration plan'`).
It is a _merge_ gate: plans are meant to be committed and pushed while work is in progress.

#### Housekeeping

Use the **Open questions** section. An agent that hits a genuine ambiguity records it there and
asks, rather than assumes — a wrong assumption discovered at review time costs far more than a
question.

---

## 4. Working with data

- **Releases never enter this repo.** The data repo holds them (DEPLOYMENT.md); here, only the
  contract's example export exists, as fixture and dev data.
- **The data is public, but it names companies.** A wrong number on a DNS provider's card is a
  public misstatement about that company's product. When unsure how to present a value, show less,
  label it precisely, and footnote the caveat (EXPORT_FORMAT.md "Caveats").
- **Look at the real thing before shipping a page.** §3.4a.

---

## 5. Tooling

### 5.1 CI

On every PR and push to `main`: lint, format check, type check, Vitest, example-export
validation, build, Playwright (desktop + mobile), and the `.plan/` gate. Never merge red. Keep it
fast enough that you never want to skip it.

### 5.2 Dependencies

- `dependencies` hold only what ships to the browser (today: `chart.js`); everything else is a
  `devDependency`. `package-lock.json` is committed; CI uses `npm ci`.
- **No runtime requests to third-party hosts.** Libraries are bundled, not loaded from a CDN, and
  pages load no external fonts or embeds: a visitor's browser talks only to the site's own origin
  (and, if configured, the data host). The links in the footer are links, not loads. The one
  exception is a single cookieless, privacy-friendly analytics service (REQUIREMENTS.md C-7),
  not yet chosen.
- Update deliberately, one PR, with `npm run verify`.

---

## 6. Documentation

Documentation is part of the change (§3.6a). When code and documentation disagree, fix both:
correct the document, and check whether the code's behaviour was intended.

---

## 7. Conventions specific to this project

**7.1 Presentation integrity outranks polish.** Every number states what it counts and of what
(attributed domains of the _scanned_ domains, supporting providers of the _known_ ones). `null` is
"not measured" — shown as `–`, drawn as a gap, sorted last, never 0. History and current state are
labelled as such. A beautiful chart that misleads has made the site worse.

**7.2 The contract is binding.** §3.6b. Pages follow EXPORT_FORMAT.md's rules (manifest-first
paths, tables by id, ignore unknown keys, verbatim notes) and the site stays correct under every
additive contract change.

**7.3 Static and stateless.** No backend, no write path, no state shared between pages beyond the
URL. Every view is a shareable link carrying only raw ids and filters.

**7.4 Aligned with stats.domainconnect.org.** Brand tokens, header, cards, tables and footer
follow the Templates statistics dashboard (`src/lib/styles.css`). A visual change that diverges
from it is a deliberate decision, recorded in the PR.
