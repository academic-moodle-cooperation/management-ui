# shell

The Management UI's only production application. Owns routing, layout, auth, theme, i18n, and the plugin loader. Ships zero feature code itself — every visible feature comes from a plugin registered on `apps:definitions`.

## Run

```bash
pnpm --filter shell dev          # http://127.0.0.1:3000/management-ui/
pnpm --filter shell build        # production bundle
pnpm --filter shell preview      # serve the built bundle
```

## What it does at boot

1. **Expose shared modules** on `window.__SHARED_MODULES__` so dynamically loaded plugins resolve `react`, `@oc-mui/*`, etc.
2. **Register built-in plugins** from `@oc-mui/plugins` (the `plugins/index.ts` barrel).
3. **Load JAR plugins** from the backend's `/management-tool/ui/config/plugins.json` if present.
4. **Load `.local-plugins/` (dev only)** by fetching `/local-plugins/manifest.json`.
5. **Two-phase activation**: load `*:config` plugins first → merge config → load remaining plugins filtered by `app.enabledPlugins`. Full model in [`docs/reference/configuration.md`](../../docs/reference/configuration.md).
6. **Mount the router** with every route registered on `apps:definitions`.

## Layout

```
apps/shell/
├── src/
│   ├── main.tsx                            Entry point — mounts AppProviders + RouterProvider
│   ├── components/
│   │   ├── DynamicRouterProvider.tsx       Builds routes from apps:definitions
│   │   ├── PluginInitializer.tsx           Runs the two-phase load
│   │   └── ...
│   ├── services/
│   │   ├── jarPluginLoader.ts              Fetches plugins.json, loads each via remote-plugin-loader
│   │   ├── localPluginsManifest.ts         Fetches /local-plugins/manifest.json (dev)
│   │   ├── matomo.ts                       Optional Matomo analytics bootstrap (config-driven)
│   │   └── sharedDepsGate.ts               Shared-dependency major check gating JAR/.local-plugins loads
│   ├── shared/
│   │   └── sharedModules.ts                window.__SHARED_MODULES__ wiring
│   ├── loadPlugins.ts                      Built-in plugin loader + namespace filter
│   └── themes/
│       └── default.css                     Default org theme (token overrides)
├── public/                                 Static assets served at /management-ui/
├── index.html
└── vite.config.ts
```

## Dev proxy

The Vite dev server proxies backend paths (`/admin-ng`, `/info`, `/graphql`, etc.) to a configurable upstream — see [`@oc-mui/vite-config/proxy`](../../packages/vite-config/src/proxy.ts). Local development typically points at a real Opencast or at a mocking layer.

## Configuration

The shell reads `public/config.json` at boot. Production deployments mount their own `config.json` over the bundled default. Plugin slices live under `config.plugins[id]`. Full layer model: [`docs/reference/configuration.md`](../../docs/reference/configuration.md).

## What it isn't

- Not a feature app. Use a plugin.
- Not published to npm — it's a deployable bundle.
- Not the playground. The playground at [`apps/playground/`](../playground/) is the dev-only single-plugin sandbox.

## See also

- [`docs/reference/architecture.md`](../../docs/reference/architecture.md) — three pillars.
- [`docs/reference/decisions/003-shell-plus-core-plugins.md`](../../docs/reference/decisions/003-shell-plus-core-plugins.md) — why one shell instead of multiple top-level apps.
- [`docs/extend/distribution.md`](../../docs/extend/distribution.md) — the four ways plugins reach the shell.
- [`packages/providers/`](../../packages/providers/) — the provider hierarchy this app mounts.
