# Your first plugin

A hands-on walkthrough: scaffold a plugin you can **actually see** — a page with a sidebar entry — run it, and then ship it. About 5 minutes.

For the full reference (manifest fields, extension points, config, i18n) see [`creating-a-plugin.md`](./creating-a-plugin.md); for packaging see [`distribution.md`](./distribution.md). This page is the guided first run.

## 1. Scaffold with the `app` template

```bash
pnpm create-plugin reports --template app
```

The default scaffold (`--template minimal`) registers an `app:header-logo` placeholder that **nothing in the shell renders** — handy for the contract test, but you can't see it, which makes "did it load?" hard to answer. `--template app` instead gives you a **real screen plus a sidebar link**, visible in both dev and production.

It scaffolds under `.local-plugins/reports/` and runs `pnpm install` to link the package.

## 2. What you got

```
.local-plugins/reports/
├── plugin.json              # type: "app", extensionPoints: apps:definitions + sidebar:nav-items
├── package.json
├── tsconfig.json, vite.config.ts, vitest.config.ts, vitest.setup.ts, eslint.config.js, README.md
├── backend/                 # Maven/JAR layout — ignore for now, used in step 5
└── src/
    ├── index.ts             # the two registrations (see below)
    ├── ReportsPage.tsx      # the page mounted at /reports — edit this
    └── plugin.contract.test.ts
```

`src/index.ts` registers exactly two things in `initialize()`:

```ts
// the screen — a route + component the shell mounts at /reports
manager.registerObject("apps:definitions", "reports", {
  id: "reports", name: "Reports", routePath: "/reports", component: ReportsPage,
});
// the left-nav entry that links to it
manager.registerObject("sidebar:nav-items", "reports", {
  title: "Reports", path: "/reports", icon: Sparkles,
  order: 50, permissions: [], featureFlags: [], category: "content",
});
```

…and `export default reportsPlugin` (the loader registers via `module.default` — keep it).

## 3. Run it and see it

```bash
pnpm build                                  # once — builds the host packages it depends on
pnpm --filter @oc-mui/plugin-reports build  # → dist/reports.mjs (the dev server serves this)
```

Enable it in the **served** config — add `"reports"` to `app.enabledPlugins` in
`apps/shell/public/ui/config/management-ui/config.json` — then start the shell so that file is the one served (no backend, or `VITE_LOCAL_CONFIG=true` — see [Configuration](../getting-started/configuration.md)):

```bash
pnpm dev      # http://127.0.0.1:3000/management-ui/
```

A **Reports** entry appears in the sidebar; click it and the page renders at `/reports`. That sidebar entry is your "it loaded" signal.

Two things worth knowing:

- App routes are behind authentication — if your session is invalid you'll see the auth-error screen instead of the page, even though the plugin loaded fine (the sidebar entry still shows).
- The `[reports] activated` console line is logged via `logger.info`, which is **dev-only** (suppressed in production builds). Don't rely on it at staging — the rendered nav entry is the durable signal.

## 4. Verify the contract

```bash
pnpm --filter @oc-mui/plugin-reports test:contract
```

Passes out of the box: it checks the plugin activates, every `extensionPoints` entry in `plugin.json` is populated, there's a `default` export (this assertion is written into the scaffolded test itself — the harness doesn't check it), no console errors, and i18n key parity (a no-op until you ship `locales/` and declare `i18nNamespaces`).

## 5. Ship it — the four delivery paths

Same plugin code; only the delivery differs.

| Path | How | When |
|---|---|---|
| **Dev server** | what you just did — `.local-plugins/*/dist/*.mjs` served + loaded via the dev manifest | local development |
| **In-tree** | scaffold with `--in-tree` (lands in `plugins/`); bundled into the shell at build, auto-loads | a plugin that ships *with* the core repo |
| **JAR** | `cd .local-plugins/reports/backend && mvn package` → copy the JAR to `$OPENCAST_HOME/deploy/`; Opencast serves it at `/static/plugins/reports/` and lists it in `plugins.json` | production deploy to Opencast |
| **CDN / marketplace** | host `dist/reports.mjs` at any HTTPS URL with CORS → **Marketplace → Developer Tools → Try / Install** (persists in `localStorage`) | community distribution, no JAR |

The JAR and CDN paths use the same runtime loader as the dev server (it registers via `module.default`). Full packaging + deploy story: [`distribution.md`](./distribution.md).

## See also

- [`creating-a-plugin.md`](./creating-a-plugin.md) — the reference: manifest, extension points, config, GraphQL naming, the dev loop.
- [`distribution.md`](./distribution.md) — in-tree vs JAR vs CDN packaging.
- [`plugins/core/README.md`](../../plugins/core/README.md) — every extension point and what renders it.
