---
"@opencast-mui/utils": patch
"@opencast-mui/plugin-system": patch
"@opencast-mui/store": patch
---

Add no-regression coverage thresholds to these packages' `vitest.config.ts`.
Test-infrastructure only — no change to the published packages' public API or
runtime (the API snapshots are unchanged); the bump just satisfies the
changeset gate for the touched packages.
