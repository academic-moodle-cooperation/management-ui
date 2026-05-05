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

## Adding a test

Drop a new `*.spec.ts` next to [smoke.spec.ts](smoke.spec.ts). The test base
URL is `http://127.0.0.1:3000/management-ui/`, so use relative `page.goto("…")`
or absolute paths starting with `/management-ui/…`.
