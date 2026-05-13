---
"@oc-mui/app-runtime": patch
"@oc-mui/eslint-config": patch
"@oc-mui/i18n": patch
"@oc-mui/plugin-admin-marketplace": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-upload": patch
"@oc-mui/plugin-example": patch
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-testing": patch
"@oc-mui/plugins": patch
"@oc-mui/providers": patch
"@oc-mui/query": patch
"@oc-mui/remote-plugin-loader": patch
"@oc-mui/router": patch
"@oc-mui/store": patch
"@oc-mui/tailwind-config": patch
"@oc-mui/typescript-config": patch
"@oc-mui/ui": patch
"@oc-mui/ui-config": patch
"@oc-mui/utils": patch
"@oc-mui/vite-config": patch
---

Re-license every workspace package from MIT to the **Educational Community
License, Version 2.0** (`ECL-2.0`). The repo-root `LICENSE` file ships the
full ECL 2.0 text; each `package.json` now carries `"license": "ECL-2.0"`.

ECL 2.0 is Apache 2.0 with a patent-grant scope narrowed to the needs of
educational institutions; it is the license used by Opencast and several
other education-sector open-source projects. Adopting it aligns Management
UI with the Opencast ecosystem and avoids the patent-grant ambiguity MIT
leaves open.

No code change. The patch bump records the metadata change so consumers
auditing licenses pick it up on their next dependency update.
