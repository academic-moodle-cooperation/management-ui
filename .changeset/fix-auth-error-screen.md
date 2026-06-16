---
"@opencast-mui/router": minor
"@opencast-mui/i18n": patch
---

Fix protected routes hanging on "Checking authentication…" forever when
the backend is unreachable.

`useGetCurrentUser` (the `currentUser` fetch) failing with a **server /
network** error (500, 502, ECONNREFUSED) is, by design, *not* treated as
a logout by `AuthInitializer` — it preserves session state through
transient blips. But on initial load there's no state to preserve: `user`
stays `undefined`, and `AppProtection` / `ProtectedRoute` only knew how to
show the indefinite "Checking authentication…" spinner. There was no
error, no redirect, no recovery.

The protection components now subscribe to the same `currentUser` query
(deduped by queryKey — no extra request) so they can tell "still loading"
from "errored with no user", and branch:

- **401 / 403** (session invalid) → redirect to `/login` (as before).
- **Server / network error** → render an injected `errorComponent`
  (falling back to a minimal inline message + Retry). The shell supplies a
  branded `<ErrorPage code="503">` ("Couldn't verify your session") with
  Retry (re-runs the fetch) and Reload.

The auth-error classifier is extracted to a shared
`isAuthenticationError` module so `AuthInitializer` and the protection
components agree on the auth-vs-server distinction. Adds `authError.*`
i18n keys (en + de).
