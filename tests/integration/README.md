# Integration E2E (real podman Opencast)

The real-backend tier of the test pyramid. Unlike the mocked smoke suite in
[`tests/e2e/`](../e2e/README.md), these specs drive the shell against a **live
Opencast** so they catch what mocks can't — GraphQL schema drift, real auth, JAR
deploys. They implement parts of the manual
[`docs/operations/test-protocol.md`](../../docs/operations/test-protocol.md)
(§3, §4, §15) automatically.

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
  answers (it does **not** build Opencast from sources).
- `auth.setup.ts` logs in once (`POST /j_spring_security_check`) and saves the
  session to `playwright/.auth/opencast.json`; the data specs reuse it.
- The shell runs with `VITE_PROXY_TARGET=$OPENCAST_BASE_URL` and
  `VITE_LOCAL_CONFIG=true` — local config enables the core plugins under test,
  while data + auth hit the live backend.

## Prerequisites

1. **A running podman Opencast.** From your `opencast-podman` checkout:
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

### Mutating specs (opt-in)

The §3.2 create-series spec writes a series the API can't delete, so it's gated
behind `OPENCAST_ALLOW_MUTATIONS` and skipped otherwise. Run it only against a
disposable backend:

```bash
OPENCAST_ALLOW_MUTATIONS=1 OPENCAST_BASE_URL=http://localhost:8080 pnpm test:integration
```

### §10 JAR build + deploy

[`scripts/verify-jar-deploy.sh`](../../scripts/verify-jar-deploy.sh) (`pnpm
test:jar-deploy`) automates the JAR pipeline against a disposable Opencast:
scaffolds a throwaway plugin, `mvn package`s the OSGi JAR, asserts its
headers/contents, `podman cp`s it into the container's `deploy/`, and polls
`plugins.json` until Opencast's PluginBundleTracker reports it — cleaning up
(container JAR, scaffold, lockfile) on exit. Needs `mvn` with the Opencast
parent POM reachable (present in `~/.m2` on the host that built Opencast) and
a running local podman stack. It's backend-mutating — local only, never shared.

## Configuration (env vars)

Everything is overridable — see [`opencast-env.ts`](opencast-env.ts) for the
full list and defaults (taken from the `opencast-podman` compose/env files).

| Var | Default | Purpose |
|---|---|---|
| `OPENCAST_BASE_URL` | `http://opencast-runtime:8080` | Host-reachable Opencast URL the shell proxies to. Use `http://localhost:8080` to skip the `/etc/hosts` entry. |
| `OPENCAST_USER` / `OPENCAST_PASS` | `admin` / `opencast` | Login seed (§15). |
| `OPENCAST_HEALTH_PATH` | `/info/me.json` | Readiness probe. |
| `OPENCAST_AUTOSTART` | _unset_ | If `1`, run `runtime.sh start` when Opencast is down. Needs the two vars below. |
| `OPENCAST_PODMAN_DIR` | _unset_ | Path to your `opencast-podman` checkout (autostart only). |
| `OPENCAST_VERSION` | _unset_ | Opencast major version for autostart / §10 JAR dir. |

Example against a `localhost`-published Opencast you start yourself:

```bash
OPENCAST_BASE_URL=http://localhost:8080 pnpm test:integration
```

## Status

Validated **green against a real Opencast backend** (all 6 specs pass: auth
setup, §4 GraphQL data flow on episodes + series, §3 episodes table + sort). The
infrastructure (health-check, proxy, form login → saved session) and the
backend-specific assumptions are confirmed:

- Login uses Opencast's Spring Security defaults (`/j_spring_security_check`,
  `j_username` / `j_password`); the session authenticates through the proxy.
- The episodes view renders a `<table>` (`getByRole("table")`).
- Sorting fires `MuiGetMyEvents` carrying an `orderBy` variable.

If a future UI change moves any of these (e.g. episodes defaults to a
gallery/grid, or a custom auth provider replaces the form), update the
corresponding spec — that's the regression signal doing its job.
