---
"@oc-mui/app-runtime": patch
"@oc-mui/i18n": patch
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-testing": patch
"@oc-mui/query": patch
"@oc-mui/router": patch
"@oc-mui/store": patch
"@oc-mui/ui-config": patch
"@oc-mui/ui": patch
"@oc-mui/utils": patch
"@oc-mui/plugin-core": patch
---

Move the `build:types` incremental state file (`tsconfig.build.tsbuildinfo`) into `dist-types/` so it lives and dies with the declaration output it describes. Previously the state file sat at the package root, outside the turbo `dist-types/**` cache outputs: a stale state file next to a deleted/partial `dist-types/` made `tsc` skip emission entirely, and turbo then cached the empty `dist-types/` — poisoning the (worktree-shared) build cache and breaking `check-types` repo-wide with `TS7016` errors on later "cache hit" runs (#258).
