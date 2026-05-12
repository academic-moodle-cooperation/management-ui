---
"@workspace/app-runtime": patch
"@workspace/eslint-config": patch
"@workspace/i18n": patch
"@workspace/plugin-admin-marketplace": patch
"@workspace/plugin-core-episodes": patch
"@workspace/plugin-core-series": patch
"@workspace/plugin-core-upload": patch
"@workspace/plugin-example": patch
"@workspace/plugin-system": patch
"@workspace/plugin-testing": patch
"@workspace/plugins": patch
"@workspace/providers": patch
"@workspace/query": patch
"@workspace/remote-plugin-loader": patch
"@workspace/router": patch
"@workspace/store": patch
"@workspace/tailwind-config": patch
"@workspace/typescript-config": patch
"@workspace/ui": patch
"@workspace/ui-config": patch
"@workspace/utils": patch
"@workspace/vite-config": patch
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
