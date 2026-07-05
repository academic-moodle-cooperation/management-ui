---
"@oc-mui/query": minor
"@oc-mui/router": minor
"@oc-mui/store": minor
"@oc-mui/ui": patch
"@oc-mui/plugin-admin-marketplace": minor
"@oc-mui/plugin-core-episodes": minor
"@oc-mui/plugin-core-series": minor
"@oc-mui/plugin-core-upload": minor
---

Move stateful shared libraries to `peerDependencies` so consumers resolve a single instance.

Shipping libraries that keep module-level state as regular `dependencies` risks a
consumer getting two copies (the classic React "invalid hook call" / broken-context
duplicate-instance bug). These are now peers, provided by the host app:

- `@oc-mui/query` → `@tanstack/react-query`
- `@oc-mui/router` → `@tanstack/react-router` (and drops the unused
  `@tanstack/router-core` direct dependency)
- `@oc-mui/store` → `jotai`, `zustand`
- The four in-tree plugins (`admin-marketplace`, `core-episodes`, `core-series`,
  `core-upload`) move `react` from `dependencies` to `peerDependencies`
  (`^18 || ^19`) + a `devDependencies` entry, matching `plugins/core`.
- `@oc-mui/ui`'s `react` peer is widened from `^19.1.0` to `^18.0.0 || ^19.0.0`
  to match its siblings.

`immer` (store) and `@tanstack/react-query-devtools` (query) stay regular
dependencies — they are used internally and don't carry the singleton hazard. The
workspace resolves the new peers via pnpm's `auto-install-peers` (already the
project default), so the app and dev/test loop are unaffected.
