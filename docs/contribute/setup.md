# Set up the repo

For contributors to this repo. Afterwards you'll have the shell running from a source checkout with hot reload.

## Prerequisites

- **Node.js and pnpm** — both pinned in the root [`package.json`](../../package.json) (`engines` and `packageManager`). Run `corepack enable` once and the pinned pnpm version is used automatically. The docs never restate the numbers, so they can't drift.
- **Java and Maven** — only needed to build the deployable JAR. Pure frontend work needs neither.

## Clone, install, run

```bash
git clone https://github.com/academic-moodle-cooperation/management-ui.git
cd management-ui
pnpm install
pnpm build              # required once — see below
pnpm test:e2e:install   # one-time, before your first `pnpm verify`
pnpm dev
```

The shell comes up at **<http://127.0.0.1:3000/management-ui/>**. Vite hot-reloads the shell and the packages; the plugin loader picks up rebuilt bundles in `plugins/<name>/dist/` and `.local-plugins/<name>/dist/`. `pnpm test:e2e:install` downloads the Chromium build Playwright drives — needed by the E2E leg of the gate, not by `pnpm dev`.

**`pnpm build` is required, not a one-time nicety.** `@oc-mui/vite-config` is consumed from its `dist/` and nothing builds it during install, so a bare `pnpm dev` on a fresh clone stops at `ERR_MODULE_NOT_FOUND`. The same build populates the `dist-types/` directories downstream packages type-check against. Afterwards you iterate without repeating it.

## Pick a backend

The shell needs a backend at boot for `config.json`, `plugins.json`, `/info/me.json`, and `/graphql`. The dev server proxies those paths to `http://localhost:8080` unless you override the target ([`packages/vite-config/src/proxy.ts`](../../packages/vite-config/src/proxy.ts) lists them). With nothing listening, the browser sees 502s and the terminal prints one friendly notice, then goes quiet.

- **An Opencast you already run** — the [Quickstart](../quickstart.md) has that command line and what each variable does.
- **A full local stack** — Opencast, the GraphQL plugin, the Management UI backend bundles, OpenSearch: [Full local setup](../getting-started/local-backend.md).

### No backend at all

Enough for plugin-authoring work that doesn't depend on live data. Serve the four paths above as static JSON from any local HTTP server and point `VITE_PROXY_TARGET` at it; with `VITE_LOCAL_CONFIG=true` the committed local `config.json` stays the one served, so your stub can skip that endpoint. The smoke test in [`tests/e2e/smoke.spec.ts`](../../tests/e2e/smoke.spec.ts) is the working set of stubs, copy-pasteable.

Those stubs answer as an **anonymous** session (`{ "user": null }` on `/info/me.json`, `{ "data": null }` on `/graphql`), which boots the shell but leaves every app route behind the sign-in screen. Session state is decided by the GraphQL `currentUser` query (`MuiGetCurrentUser` in [`useGetCurrentUser.ts`](../../packages/query/src/hooks/useGetCurrentUser.ts)), *not* by `/info/me.json` — which only supplies the roles that role-gated apps check. To be treated as logged in, answer `POST /graphql` with:

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

Any `userRole` other than `ROLE_USER_ANONYMOUS` counts as authenticated. App routes then render, with empty states everywhere the null stub answers.

## Trouble?

- **`pnpm install` complains about workspace deps.** Old pnpm — `corepack enable`, then retry.
- **Vite can't resolve `@oc-mui/…`.** `pnpm build` never ran; see above.
- **CI is green, your machine isn't.** `pnpm clean` (drops build output, caches, and `node_modules` across the workspace), then `pnpm install`, then `pnpm verify`.

Next: [Your first pull request](./first-pr.md) — the loop from a change to an open PR. Mounting an org plugin under `.local-plugins/` instead: [Distribution](../plugins/distribution.md).
