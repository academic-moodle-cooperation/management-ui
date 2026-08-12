# CI

What runs on every PR, in what order, and how to reproduce a failure locally.

## The local gate

```bash
pnpm verify
```

Runs `lint → check-types → build → test → test:contract → api-check → test:e2e` in dependency order. Same gates CI runs. If it's green locally, CI will be green; the only flakes you'll see in CI but not locally are cold-start Playwright timeouts, which retry automatically.

**Always run `pnpm verify` before pushing.** Failures caught locally cost a few minutes; failures caught in CI cost a round-trip plus reviewer attention.

## The CI graph

Two workflows run on every PR.

### `Test` ([`.github/workflows/test.yml`](../../.github/workflows/test.yml))

```
lint-types
   │
   └── unit
         │
         ├── contract
         ├── api-check
         └── e2e
```

| Job | What it does |
|-----|--------------|
| `lint-types` | `pnpm install`, builds packages, runs `pnpm lint`, runs `pnpm check-types`. |
| `unit` | `pnpm test`. Uploads coverage to Codecov. |
| `contract` | `pnpm test:contract` across every plugin. |
| `api-check` | `pnpm api-check:ci`. Fails the PR if any `packages/<pkg>/etc/<pkg>.api.md` snapshot differs from the regenerated output. |
| `e2e` | `pnpm test:e2e` — Playwright smoke against the shell with mocked backend. Uploads `playwright-report` on failure. |

### `Changeset` ([`.github/workflows/changeset.yml`](../../.github/workflows/changeset.yml))

`pnpm changeset:status` against the PR's base branch. Fails if a versioned package is touched without a changeset.

## Reproducing failures

| Failed job | Local command |
|------------|---------------|
| `lint-types` | `pnpm lint` and/or `pnpm check-types` |
| `unit` | `pnpm test` |
| `contract` | `pnpm test:contract` |
| `api-check` | `pnpm api-check` — inspect `git diff packages/*/etc/*.api.md` |
| `e2e` | `pnpm test:e2e` |
| `Changeset` | `pnpm changeset:status` |

## API-check failures specifically

The `api-check` job fails when the committed snapshot disagrees with what API Extractor regenerates from your changes. Two flavours:

- **Intentional change**: regenerate, commit, add a changeset.
  ```bash
  pnpm api-check
  git add packages/*/etc/*.api.md
  pnpm changeset    # describe the bump
  ```
- **Unintentional change**: something you didn't expect crossed a package boundary. Diff the report; usually the fix is to mark a symbol `@internal` or stop re-exporting it.

See [`release.md` → API surface drift detection](./release.md#api-surface-drift-detection) for the full model.

## Workflows outside the PR gate

Two tiers are too slow or too environment-dependent to run on every PR. Both are
also available on demand (`workflow_dispatch`).

### `Integration (real backend)` ([`.github/workflows/integration.yml`](../../.github/workflows/integration.yml))

`pnpm test:integration` against a live Opencast — 03:00 UTC. Catches schema
drift, auth and real-data regressions that a mocked suite cannot see.

### `Browser matrix (E2E)` ([`.github/workflows/matrix.yml`](../../.github/workflows/matrix.yml))

The same `tests/e2e/` specs the PR gate runs on chromium, executed on Firefox,
WebKit and two tablet emulations — see
[`playwright.matrix.config.ts`](../../playwright.matrix.config.ts). Those
projects are the manual test protocol's per-browser result columns, which a
human used to walk one at a time.

**Not scheduled.** It runs on push to `develop` and the `r/NN.x` release lines, and on
demand. These specs break when code changes, not when time passes, so a nightly
run would mostly re-test an unchanged tree — merge into a long-lived branch is
the moment a cross-browser regression can actually enter.

It is also a single job running the projects sequentially, and it skips chromium
(test.yml already covers every one of these specs there for each PR). Both
choices are about runner minutes: one workspace build instead of five, and no
duplicated engine. Locally, `pnpm test:matrix` still runs all five projects.

A manual dispatch takes an optional `projects` input — space-separated
`--project` arguments — to narrow the run.

## Changes that skip CI gates

Doc-only and workflow-only changes still run the full suite — there's no skip. The `Changeset` gate is the only one that conditionally exempts: changes under `apps/`, root config, docs, or `.github/` don't need a changeset because those packages are in `.changeset/config.json`'s `ignore` list.

## Branch protection

The branches `main`, `develop`, and `release/**` are configured to require the `Test` and `Changeset` workflows green before merging. Direct pushes are not blocked at the GitHub level today, but treat them as forbidden — all changes go through PR.

## See also

- [`release.md`](./release.md) — the publish flow on top of these gates.
- [`testing.md`](./testing.md) — the test strategy the CI jobs enforce.
- [`open-followups.md`](./open-followups.md) — known CI roughness and planned improvements.
