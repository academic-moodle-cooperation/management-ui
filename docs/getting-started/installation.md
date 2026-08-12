# Run from source

For plugin developers and contributors. Afterwards you'll have the shell running locally from a source checkout, with hot reload and the full test gate available.

Installing Management UI on an Opencast server? That's a different path — see [Deployment](./deployment.md). This page is the development setup.

## Prerequisites

- **Node.js** ≥ 20 (LTS recommended).
- **pnpm** — run `corepack enable` once; corepack then uses the exact version pinned in the root `package.json`'s `packageManager` field automatically. (Alternatively `npm install -g pnpm`, matching that pin.)
- A reachable **Opencast** instance (real or stubbed) if you want full functionality. For initial poking-around the shell boots fine with mocked endpoints.

## Clone & install

```bash
git clone https://github.com/academic-moodle-cooperation/management-ui.git
cd management-ui
pnpm install
pnpm build         # one-time — builds dist-types/ for upstream workspace packages
```

The first build populates the `dist-types/` directories that downstream packages need for type-checking. After that, you can iterate without re-running `pnpm build`.

First time only: `pnpm test:e2e:install` downloads the Chromium build Playwright drives for the E2E suite (CI runs the same step).

## Run the shell

```bash
pnpm dev
```

Opens the shell at **http://127.0.0.1:3000/management-ui/**. The Vite dev server hot-reloads everything; the plugin loader picks up changes in `plugins/<name>/dist/` and `.local-plugins/<name>/dist/`.

## Configure the backend

The shell expects a backend to be reachable at boot for `config.json`, `plugins.json`, `/info/me.json`, and `/graphql`. The Vite dev server proxies those paths to a configurable target (defaults to `http://localhost:8080`). If nothing is listening on the target, your browser will see 502s and the terminal running `pnpm dev` will print a single friendly notice (then go quiet) explaining what's missing.

You have three options, in increasing order of effort:

1. **Point at an existing backend** (recommended for plugin authors):

   ```bash
   VITE_PROXY_TARGET=https://your-staging.example.org pnpm dev
   ```

   The shell talks to that backend; no local Opencast needed. Reload after starting.

2. **Run Opencast locally** and let the default proxy target (`http://localhost:8080`) reach it. The complete walkthrough — Opencast build, GraphQL plugin, the Management UI backend bundles, OpenSearch via podman — is in [Full local setup](./local-backend.md); the proxy paths the shell needs are listed in [`packages/vite-config/src/proxy.ts`](../../packages/vite-config/src/proxy.ts).

3. **Skip the backend entirely** for pure plugin-authoring work that doesn't depend on live data. Stub the endpoints the shell needs at boot — the Playwright smoke test in [`tests/e2e/smoke.spec.ts`](../../tests/e2e/smoke.spec.ts) shows the working set: `/ui/config/management-ui/config.json`, `/management-tool/ui/config/plugins.json`, `/info/me.json`, and `/graphql` (the smoke test additionally stubs `api.github.com` and Gravatar so no request leaves the machine). You can do this with any local HTTP server that serves static JSON files, then point `VITE_PROXY_TARGET` at it (add `VITE_LOCAL_CONFIG=true` and the committed local `config.json` stays the one served, so your stub can skip that endpoint).

   The smoke stubs answer as an **anonymous** session (`{ "user": null }` on `/info/me.json`, `{ "data": null }` on `/graphql`) — enough to boot the shell, but every app route stays behind the sign-in screen. **Session state is decided by the GraphQL `currentUser` query** (`MuiGetCurrentUser` in [`useGetCurrentUser.ts`](../../packages/query/src/hooks/useGetCurrentUser.ts)), not by `/info/me.json` (which supplies the granted roles for role-gated apps). To make the shell treat you as logged in, have the stub answer `POST /graphql` with:

   ```json
   {
     "data": {
       "currentUser": {
         "__typename": "User",
         "username": "admin",
         "name": "Local Admin",
         "email": "admin@example.org",
         "userRole": "ROLE_USER_ADMIN"
       }
     }
   }
   ```

   Any `userRole` other than `ROLE_USER_ANONYMOUS` counts as authenticated; app routes then render (data-driven pages will still show empty states, since every other query gets the null stub).

Configuration model details: [`configuration.md`](./configuration.md).

## Verify the install

```bash
pnpm verify
```

Runs the full local gate — the same pipeline as CI; the step list is documented once in [AGENTS.md → Pre-push gate](../../AGENTS.md#pre-push-gate--pnpm-verify). If this passes you have a working tree.

## Common commands

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Run the shell at :3000 (and the playground at :3001 if configured). |
| `pnpm verify` | Full local pre-push gate. |
| `pnpm test` | Unit tests across all packages. |
| `pnpm test:contract` | Plugin contract tests. |
| `pnpm test:e2e` | The Playwright E2E suite (incl. smoke) against the shell. |
| `pnpm api-check` | Regenerate `etc/*.api.md` snapshots. |
| `pnpm create-plugin <name>` | Scaffold an org/community plugin under `.local-plugins/<name>/`. |
| `pnpm create-plugin <name> --in-tree` | Scaffold a built-in plugin under `plugins/<name>/`. |
| `pnpm changeset` | Add a release-note entry for your change. |

## What's at `.local-plugins/`?

Empty by default. Each `.local-plugins/<org>/` is its own git repository — orgs clone theirs in to develop alongside the shell. The directory is gitignored from this repo.

To mount one: `git clone <your-org-plugin> .local-plugins/<org-name>`, then `pnpm install` from the workspace root. The shell's local-plugins manifest will pick it up at next boot.

## Trouble?

- **`pnpm install` fails complaining about workspace deps.** You're likely on an old pnpm. `corepack enable` (which activates the version pinned in `package.json`) and retry.
- **Vite can't find `@oc-mui/...`.** Ensure `pnpm build` ran at least once.
- **CI passes but local fails.** Run `pnpm clean` (removes build output, caches, and `node_modules` across the workspace), then `pnpm install`, then `pnpm verify` again.

## See also

- [`configuration.md`](./configuration.md) — the config model.
- [`upgrading.md`](./upgrading.md) — moving between versions.
- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — dev workflow.
- [`docs/operations/ci.md`](../operations/ci.md) — what `pnpm verify` mirrors.
