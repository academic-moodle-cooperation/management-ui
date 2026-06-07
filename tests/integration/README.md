# Integration E2E (real podman Opencast)

The real-backend tier of the test pyramid. Unlike the mocked smoke suite in
[`tests/e2e/`](../e2e/README.md), these specs drive the shell against a **live
Opencast** so they catch what mocks can't — GraphQL schema drift, real auth, JAR
deploys. They implement parts of the manual
[`docs/operations/test-protocol.md`](../../docs/operations/test-protocol.md)
(§3, §4, §15) automatically.

This is Task 1 of
[`docs/operations/test-automation-plan.md`](../../docs/operations/test-automation-plan.md).

## How it's wired

```
Playwright (chromium)
        │  drives
        ▼
shell dev server  ── 127.0.0.1:3000/management-ui/
        │  Vite proxy forwards /graphql, /info/me.json,
        │  /j_spring_security_*, plugins.json …
        ▼
podman Opencast   ── OPENCAST_BASE_URL  (default http://opencast-runtime:8080)
```

- `global-setup.ts` polls `${OPENCAST_BASE_URL}/info/me.json` until Opencast
  answers (it does **not** build Hinkelstein from sources).
- `auth.setup.ts` logs in once (`POST /j_spring_security_check`) and saves the
  session to `playwright/.auth/opencast.json`; the data specs reuse it.
- The shell runs with `VITE_PROXY_TARGET=$OPENCAST_BASE_URL` and
  `VITE_LOCAL_CONFIG=true` — local config enables the core plugins under test,
  while data + auth hit the live backend.

## Prerequisites

1. **A running podman Opencast.** From your `hinkelstein-podman` checkout:
   ```bash
   ./runtime.sh start <opencast-major-version>
   ```
2. **`/etc/hosts` entry** so the default base URL resolves (Opencast's own
   `server.url` is `http://opencast-runtime:8080`, and it's picky about the host
   header matching during auth):
   ```
   127.0.0.1 opencast-runtime
   ```
3. **Chromium for Playwright** (one-time): `pnpm test:e2e:install`.

## Run

```bash
pnpm test:integration         # headless
pnpm test:integration:ui      # interactive UI mode
```

## Configuration (env vars)

Everything is overridable — see [`opencast-env.ts`](opencast-env.ts) for the
full list and defaults (taken from the `hinkelstein-podman` compose/env files).

| Var | Default | Purpose |
|---|---|---|
| `OPENCAST_BASE_URL` | `http://opencast-runtime:8080` | Host-reachable Opencast URL the shell proxies to. Use `http://localhost:8080` to skip the `/etc/hosts` entry. |
| `OPENCAST_USER` / `OPENCAST_PASS` | `admin` / `livestream` | Login seed (§15). |
| `OPENCAST_HEALTH_PATH` | `/info/me.json` | Readiness probe. |
| `OPENCAST_AUTOSTART` | _unset_ | If `1`, run `runtime.sh start` when Opencast is down. Needs the two vars below. |
| `HINKELSTEIN_PODMAN_DIR` | _unset_ | Path to your `hinkelstein-podman` checkout (autostart only). |
| `OPENCAST_VERSION` | _unset_ | Opencast major version for autostart / §10 JAR dir. |

Example against a `localhost`-published Opencast you start yourself:

```bash
OPENCAST_BASE_URL=http://localhost:8080 pnpm test:integration
```

## Status / "confirm locally"

These specs are a **first cut** — the infrastructure (health-check, proxy, login)
is solid, but a few things can only be confirmed against a live backend:

- The login form field names / success redirect are Opencast's Spring Security
  defaults; adjust `auth.setup.ts` if your deployment customised them.
- The episodes view is asserted to render a `<table>`; if it defaults to a
  gallery/grid, update `episodes.spec.ts`.
- The sort `orderBy` variable name is assumed from `test-protocol.md` §4.4.

Iterate these to green locally, then they become permanent regression cover.
