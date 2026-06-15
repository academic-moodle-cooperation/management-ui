---
"@opencast-mui/ui-config": major
"@opencast-mui/query": major
"@opencast-mui/vite-config": minor
---

Config cleanup + committed dev config (pre-1.0 OSS prep).

**Pruned dead `AppConfig` fields** (no readers anywhere in the workspace):
`app.title`, `app.appTitle`, `app.version`, `app.organizationUrls`,
`auth.tokenRefreshUrl`, `api.timeout`. Removed from the type and
`defaultConfig`; `ui-config` and `query` API snapshots regenerated. This is
a breaking removal on the package type surface (hence major) but **not** a
Config Contract change — the frozen contract keys (`app.theme`,
`app.locale`, `app.enabledPlugins`, `config.plugins[id]`, the merge order,
and the `definePluginConfig` reader) are untouched. An `AppConfig` index
signature (`[key: string]: unknown`) keeps deployment configs that still
carry the removed keys from failing validation — they're simply ignored.

**Committed default `config.json`** at
`apps/shell/public/ui/config/management-ui/config.json`. Vite copies it into
the build output so the Opencast JAR ships it as the default; deployments
mount their own over it at the same path.

**Runtime-editable dev config.** New `localConfigDevPlugin` (exported from
`@opencast-mui/vite-config`) serves that committed file at the exact fetch path in
dev, re-read on each request — so `pnpm dev` (no backend) lets you edit
`config.json` and reload without a backend. `proxy.ts` now leaves the config
path un-proxied in that mode; when `VITE_PROXY_TARGET` is set the path is
proxied to the backend as before and the local file is ignored.

**`VITE_LOCAL_CONFIG=true`** forces the committed config to be served locally
*even with* `VITE_PROXY_TARGET` set — config is editable locally while
GraphQL/auth/uploads still hit the backend (`createProxyConfig` gains a
`forceLocalConfig` option). Documented in `.env.example`.

Docs updated (`getting-started/configuration.md`,
`architecture/CONFIGURATION.md`, `architecture/CONTRACTS.md` changelog,
`operations/test-protocol.md` §6) to match.
