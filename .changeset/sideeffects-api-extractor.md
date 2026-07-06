---
"@oc-mui/utils": patch
"@oc-mui/plugin-system": patch
"@oc-mui/query": patch
"@oc-mui/router": patch
"@oc-mui/store": patch
"@oc-mui/ui-config": patch
"@oc-mui/app-runtime": patch
"@oc-mui/plugin-testing": patch
"@oc-mui/ui": patch
---

Declare `sideEffects` for tree-shaking, and add API-surface tracking to three more packages.

- `sideEffects: false` on the pure packages (`utils`, `plugin-system`, `query`,
  `router`, `store`, `ui-config`, `app-runtime`, `plugin-testing`) so bundlers can
  drop unused exports. `@oc-mui/ui` uses `["**/*.css"]` (it ships `globals.css`).
  `@oc-mui/i18n` is intentionally left unset — its entry initialises i18next at
  import time, which is a real side effect.
- `@oc-mui/app-runtime`, `@oc-mui/utils`, and `@oc-mui/plugin-testing` gain an
  `api-extractor.json` + `api-check`/`api-check:ci` scripts + a committed
  `etc/*.api.md`, so unintended public-API changes are caught in review (matching
  the six packages that already had this).
