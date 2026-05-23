---
"@oc-mui/query": minor
---

Friendly "Backend not reachable" notice when the Vite proxy can't reach
the configured target on dev-server boot, plus a real error screen in
the browser when the shell can't fetch its config.

Surfaced by Section 2 of the release test protocol — without a backend,
Vite was logging an 8-9-line ECONNREFUSED stack trace for every blocked
proxy request, repeating per request, with no actionable advice. Easy
to mistake for "the dev server is broken" rather than "you didn't
configure a backend."

What changed:

- packages/vite-config/src/proxy.ts: each proxy entry now attaches an
  error handler via Vite's `configure` callback. On the first
  ECONNREFUSED per unique target, it prints a single boxed notice
  explaining what's happening and three remediations (start your local
  Opencast, point at staging via VITE_PROXY_TARGET, or stub the four
  endpoints). Subsequent errors against the same target are silenced.
  The handler also responds with a 502 + JSON body so the browser
  stops hanging.

- docs/getting-started/installation.md: the "Configure the backend"
  section is rewritten as three numbered options (point at existing
  backend, run Opencast locally, stub the four endpoints) with copy-
  pasteable commands. Was previously two paragraphs of vague advice.

- docs/operations/test-protocol.md: Setup section now explicitly tells
  testers to export VITE_PROXY_TARGET before Section 2 and calls out
  which sections (1, 8, 13, 14) don't need a backend.

Verified by deliberately starting the dev server with no backend
running. Got one prominent boxed notice; subsequent same-target requests
silent. Without the change, 10+ lines per failed request.

Vite still emits its own one-line `[vite] http proxy error: …` summary
per request — that comes from Vite's internal logger and would need a
custom-logger wiring to suppress. Could be a follow-up if anyone finds
the residual noise annoying; for now the friendly notice is the signal
and the rest is short enough to ignore.

No package code touched in any shipped consumer; the vite-config
change is internal to the build helper.

**Browser-side error UI (the second half of the fix).** Previously the
shell rendered `<AppLoader>Loading configuration...</AppLoader>`
indefinitely on a failed config fetch — React Query retries 3× with
exponential backoff, then sits in the error state forever because
nothing was handling `isError`. Now:

- `@oc-mui/query` exposes `refetch` and `configUrl` from `useAppConfig`
  (purely additive — minor bump). `refetch` lets a recovery UI re-run
  the fetch without a full page reload; `configUrl` lets the error
  screen show what was tried.
- `apps/shell/src/components/ConfigLoadError.tsx` (new) renders when
  `isError` is true. Dev environment shows the URL we tried, the error
  message, the `VITE_PROXY_TARGET=...` instruction, and a link to
  `docs/getting-started/installation.md`. Prod shows a generic
  "contact your administrator" message. Both have Retry + Reload page
  buttons.
- `apps/shell/src/main.tsx` branches on `isError` and renders the new
  screen instead of falling through to a half-bootstrapped shell.

Verified by starting `pnpm dev` with no backend running. After the
React-Query retries exhaust (~10s), the screen swaps from "Loading
configuration..." to the new error layout. The Retry button re-fires
the fetch without reload.
