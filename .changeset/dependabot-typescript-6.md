---
"@oc-mui/app-runtime": patch
"@oc-mui/i18n": patch
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-testing": patch
"@oc-mui/providers": patch
"@oc-mui/query": patch
"@oc-mui/remote-plugin-loader": patch
"@oc-mui/router": patch
"@oc-mui/store": patch
"@oc-mui/tailwind-config": patch
"@oc-mui/ui": patch
"@oc-mui/ui-config": patch
"@oc-mui/utils": patch
"@oc-mui/vite-config": patch
"@oc-mui/plugin-admin-marketplace": patch
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-upload": patch
"@oc-mui/plugin-example": patch
"@oc-mui/plugins": patch
---

Dependency maintenance: TypeScript 5.5 → 6.0. The `tsconfig.json` files drop
the now-deprecated `baseUrl` (every `paths` entry was already relative to the
config file), `@oc-mui/vite-config` sets `rootDir` explicitly, and the
packages that side-effect-import a stylesheet without resolving `vite/client`
declare `*.css` themselves, since TypeScript 6 rejects unresolved side-effect
imports by default.
