---
"@opencast-mui/app-runtime": patch
"@opencast-mui/eslint-config": patch
"@opencast-mui/i18n": patch
"@opencast-mui/plugin-admin-marketplace": patch
"@opencast-mui/plugin-core-episodes": patch
"@opencast-mui/plugin-core-series": patch
"@opencast-mui/plugin-core-upload": patch
"@opencast-mui/plugin-example": patch
"@opencast-mui/plugin-system": patch
"@opencast-mui/plugin-testing": patch
"@opencast-mui/plugins": patch
"@opencast-mui/providers": patch
"@opencast-mui/query": patch
"@opencast-mui/remote-plugin-loader": patch
"@opencast-mui/router": patch
"@opencast-mui/store": patch
"@opencast-mui/tailwind-config": patch
"@opencast-mui/typescript-config": patch
"@opencast-mui/ui": patch
"@opencast-mui/ui-config": patch
"@opencast-mui/utils": patch
"@opencast-mui/vite-config": patch
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
