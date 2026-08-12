# End-to-end tests

Playwright tests that drive the real `apps/shell` — locally against the Vite
dev server, in CI against the production build.

## Run locally

```bash
# one-time: install Chromium and its system dependencies
pnpm test:e2e:install

# headless run (Playwright auto-starts the shell dev server on :3000)
pnpm test:e2e

# interactive UI mode for debugging
pnpm test:e2e:ui
```

`webServer` in [playwright.config.ts](../../playwright.config.ts) reuses an
already-running shell when one is detected on `127.0.0.1:3000`, otherwise it
boots `pnpm --filter shell dev` itself. In CI there is no dev server: the job
builds the SDK + shell and the suite runs against `pnpm --filter shell preview`
serving the **production build** — so a CI-only failure usually means a bug that
only exists in the built output; reproduce with `pnpm --filter shell preview`.

## What runs in CI

The `e2e` job in [.github/workflows/test.yml](../../.github/workflows/test.yml)
runs the suite on pushes and pull requests targeting `develop` and the `r/**`
release lines. Playwright reports are uploaded as an artifact when a test fails.

## The two mock backends

The repo ships no backend, so every spec mocks the network. Two layers exist:

- [`_mock-backend.ts`](_mock-backend.ts) — one-liner boot stubs (`stubShellBoot`)
  that answer the shell's boot endpoints (and every GraphQL call with
  `{ data: null }`); use it when the test only needs the shell up, optionally
  with an edited config (used by the config, theming and i18n specs).
- [`_fixtures/mock-backend.ts`](_fixtures/mock-backend.ts) — a stateful
  in-memory Opencast that answers per operation, honours
  `query`/`orderBy`/`limit`/`offset`, applies mutations, and records every
  GraphQL call; use it when the test exercises data flows (tables, saves) —
  the file's header comment explains the split in full.

## Protocol-driven specs

Four specs — [`protocol-series.spec.ts`](protocol-series.spec.ts),
[`protocol-episodes.spec.ts`](protocol-episodes.spec.ts),
[`protocol-navigation.spec.ts`](protocol-navigation.spec.ts) and
[`protocol-upload.spec.ts`](protocol-upload.spec.ts) — automate steps from an
org's manual test protocol. Each test claims a step by putting its id in the
title:

```ts
test("[SER-08] column visibility survives paging to the next page", …)
```

`pnpm protocol:coverage` reconciles those markers against the protocol —
see [`tests/protocol/README.md`](../protocol/README.md).

They run against the stateful [`_fixtures/mock-backend.ts`](_fixtures/mock-backend.ts).
Its call recording matters: where the real behaviour lives server-side (search),
the spec asserts on *what the frontend asked for* rather than on mocked results,
which would only test the mock.

## Browser matrix

```bash
pnpm test:matrix:install   # one-time: chromium + firefox + webkit
pnpm test:matrix           # every spec here across 5 browser/device projects
pnpm test:matrix --project=webkit
```

[`playwright.matrix.config.ts`](../../playwright.matrix.config.ts) turns the
protocol's per-browser result columns into projects. `pnpm test:e2e` stays
chromium-only so the pre-push gate stays fast.

## Adding a test

Drop a new `*.spec.ts` next to [smoke.spec.ts](smoke.spec.ts). The test base
URL is `http://127.0.0.1:3000/management-ui/`, so use relative `page.goto("…")`
or absolute paths starting with `/management-ui/…`.
