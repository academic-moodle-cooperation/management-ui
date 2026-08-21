# CI

For contributors to this repo. Afterwards you'll know which checks run on your pull request and what makes each one fail.

What runs on every PR, in what order, and how to reproduce a failure locally.

## The local gate

```bash
pnpm verify
```

Runs the canonical pre-push pipeline in dependency order — the step list is documented once in [AGENTS.md → Pre-push gate](../../AGENTS.md#pre-push-gate--pnpm-verify). Same gates CI runs. If it's green locally, CI will be green; the only flakes you'll see in CI but not locally are cold-start Playwright timeouts, which retry automatically.

**Always run `pnpm verify` before pushing.** Failures caught locally cost a few minutes; failures caught in CI cost a round-trip plus reviewer attention.

## The CI graph

Two workflows run on every PR — except docs-only PRs, which skip `Test` and run the docs fast path instead ([below](#changes-that-skip-ci-gates)).

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
| `e2e` | `pnpm test:e2e` — the Playwright suite against the shell with a mocked backend. Uploads `playwright-report` on failure. |

One local-vs-CI difference worth knowing when an `e2e` failure won't reproduce: locally Playwright runs against the shell's Vite **dev server**, in CI against **`vite preview` serving the production build** (see [`playwright.config.ts`](../../playwright.config.ts) and [`testing.md` → Local vs. CI](./testing.md#local-vs-ci-the-web-server-differs)). Reproduce a CI-only failure with `pnpm --filter shell preview`.

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

These workflows run outside the PR gate — too slow or too environment-dependent
for every PR, or post-merge by design. All are also available on demand
(`workflow_dispatch`).

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

### `Docs sync` ([`.github/workflows/docs-sync.yml`](../../.github/workflows/docs-sync.yml))

Post-merge drift check: on every push to `develop` it rebuilds the docs site
(plus the docs lint / link checks once those are adopted) and opens or updates
a single tracking issue on failure. Dormant while Actions billing is
unresolved; self-activates once restored.

## Changes that skip CI gates

**Docs-only changes take a fast path.** A PR that touches only `docs/**` and `*.md` files skips `Test` entirely (`paths-ignore` in [`test.yml`](../../.github/workflows/test.yml)) and instead runs the three docs jobs in [`docs.yml`](../../.github/workflows/docs.yml): VitePress site build, markdown lint (`pnpm docs:lint`, rules in [`.markdownlint.jsonc`](../../.markdownlint.jsonc)), and an offline repo-internal link check (lychee, config in [`lychee.toml`](../../lychee.toml)). `Changeset` still runs on every PR — it has no path filter, so a markdown-only change inside a versioned package keeps its changeset requirement.

Workflow-only changes still run the full suite — there's no skip for `.github/`. The `Changeset` gate additionally exempts by content, not path — the authoritative rule and its exemptions live in [AGENTS.md → Versioning](../../AGENTS.md#versioning--changesets-every-versioned-package-and-public-api-changes).

## Branch protection

The long-lived branches (`develop` and the `r/NN.x` release lines) require the `Test` and `Changeset` workflows green before merging. Direct pushes are not blocked at the GitHub level today, but treat them as forbidden — all changes go through PR.

Caution for whoever configures required status checks: `Test`'s jobs are path-filtered (docs-only PRs skip them), and GitHub leaves a required-but-skipped check stuck on "Expected". If `Test` jobs become required checks, docs-only PRs will never turn mergeable — require the `Changeset` job (it runs on every PR) and/or add a same-named no-op job for the ignored paths instead.

## See also

- [`release.md`](./release.md) — the publish flow on top of these gates.
- [`testing.md`](./testing.md) — the test strategy the CI jobs enforce.
- [`open-followups.md`](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/docs/reference/open-followups.md) — known CI roughness and planned improvements. (GitHub link — the page is deliberately excluded from the published docs site.)
