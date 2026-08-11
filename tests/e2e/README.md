# End-to-end tests

Playwright tests that drive the real `apps/shell` Vite dev server.

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
boots `pnpm --filter shell dev` itself. CI always boots fresh.

## What runs in CI

The `e2e` job in [.github/workflows/test.yml](../../.github/workflows/test.yml)
runs the suite against a clean dev server on every push and pull request.
Playwright reports are uploaded as an artifact when a test fails.

## Protocol-driven specs

[`protocol-series.spec.ts`](protocol-series.spec.ts) and
[`protocol-episodes.spec.ts`](protocol-episodes.spec.ts) automate steps from an
org's manual test protocol. Each test claims a step by putting its id in the
title:

```ts
test("[SER-08] column visibility survives paging to the next page", …)
```

`pnpm protocol:coverage` reconciles those markers against the protocol —
see [`tests/protocol/README.md`](../protocol/README.md).

They run against [`_fixtures/mock-backend.ts`](_fixtures/mock-backend.ts), which
keeps a mutable in-memory store, honours `query`/`orderBy`/`limit`/`offset`,
applies mutations, and records every GraphQL operation. That last part matters:
where the real behaviour lives server-side (search), the spec asserts on *what
the frontend asked for* rather than on mocked results, which would only test the
mock.

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
