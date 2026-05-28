---
"@oc-mui/query": minor
"@oc-mui/ui": minor
"@oc-mui/router": minor
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
  `isError` is true. Composed from the shared `<ErrorPage code="502">`
  primitive so it matches the rest of the error-page family. Dev
  environment shows the URL we tried, the error message, the
  `VITE_PROXY_TARGET=...` instruction, and a link to
  `docs/getting-started/installation.md`. Prod shows a generic
  "contact your administrator" message. Both have Retry + Reload page
  buttons.
- `apps/shell/src/main.tsx` branches on `isError` and renders the new
  screen instead of falling through to a half-bootstrapped shell.

Verified by starting `pnpm dev` with no backend running. After the
React-Query retries exhaust (~10s), the screen swaps from "Loading
configuration..." to the new error layout. The Retry button re-fires
the fetch without reload.

**Error-page consolidation (`@oc-mui/ui` minor).** While wiring
`ConfigLoadError` into the existing error-page family (404 / 500 / 401
/ 403 / 503), the family itself wasn't really a family — each page
duplicated the same centered-layout / big-status-code / actions-row
markup, the shell had its own divergent `NotFoundError` using raw gray
colors, and the maintenance page had a dead "Learn more" button. New
shape:

- `packages/ui/src/components/errors/error-page.tsx` (new) — shared
  `<ErrorPage code title description details actions />` primitive
  owning the centered layout, the big numeric code, typography, and
  the actions row. Exported from `@oc-mui/ui/components`.
- All five existing error pages refactored to compose `<ErrorPage>`:
  `GeneralError`, `NotFoundError`, `UnauthorisedError`,
  `ForbiddenError`, `MaintenanceError`. Same visual output, ~half the
  code, single place to evolve the look.
- `MaintenanceError`: the previously-dead "Learn more" button now
  takes an optional `onLearnMoreClick` handler and is hidden if no
  handler is provided.
- `ConfigLoadError` composes the same `<ErrorPage>` so the
  "couldn't load config" screen matches the rest of the family.
- `apps/shell/src/components/errors/ErrorBoundary.tsx` →
  `ModuleErrorFallback.tsx`: the file previously exported a duplicate
  `ErrorBoundary` class and a divergent `NotFoundError` using raw
  Tailwind palette colors. Both are now sourced from
  `@oc-mui/ui/components` (single canonical implementation), and the
  remaining inline fallback was switched from `bg-red-50` /
  `text-red-700` to the semantic `bg-destructive/5` /
  `text-destructive` tokens so it themes correctly.
- `DynamicRouterProvider` wires `useNavigate` into the 404 page so the
  "Go Back" and "Back to Home" buttons actually do something.

Net: every full-screen error in the app now goes through the same
primitive, every error page is themeable, and there are no more
duplicate `ErrorBoundary` / `NotFoundError` definitions drifting from
each other.

**Login redirect loop fix (`@oc-mui/router` minor + vite-config).**
Surfaced by Section 3 of the test protocol — visiting a protected route
(`/episodes`) while logged out sent the browser to
`http://localhost:3000/login.html` and got stuck there. Root cause:

- `packages/vite-config/src/proxy.ts` no longer proxied `/login.html`.
  When `AppProtection` redirects an anonymous user to
  `/j_spring_security_login`, Opencast's Spring Security 302-redirects to
  `/login.html` (its real login form). Vite had no proxy entry for that
  path, so the SPA fallback served the shell again, which re-ran
  `AppProtection`, which redirected again — a loop. The entry existed on
  a pre-OSS branch but was dropped during the open-source extraction.
  Put it back.

- `packages/router/src/route-protection/AppProtection.tsx`: the
  loading / redirecting / unauthenticated states used raw Tailwind
  palette colors (`text-gray-600`, `bg-blue-500`) and duplicated the
  "Checking authentication" markup three times. Cleaned up to semantic
  tokens (`text-muted-foreground` etc.) and given two new **optional**
  props — `redirectingComponent` and `unauthenticatedFallback` — so the
  consumer can inject branded UI. (Additive, hence the minor bump; the
  props aren't part of the public `.api.md` surface since
  `AppProtectionProps` is internal.) The router package deliberately
  does *not* import `<ErrorPage>` from `@oc-mui/ui` — `@oc-mui/ui`
  already depends on `@oc-mui/router`, so importing back would form a
  dependency cycle. Dependency injection sidesteps it.

- `apps/shell/src/components/DynamicRouterProvider.tsx` injects an
  `<AppLoader>Redirecting to login…</AppLoader>` for the redirect flash
  and a branded `<ErrorPage code="401">` (with a "Back to Home" button)
  for the no-login-URL fallback.

Verified by visiting `/episodes` logged out against a local backend:
the browser now follows through to Opencast's login form instead of
bouncing on a dead `/login.html`.
