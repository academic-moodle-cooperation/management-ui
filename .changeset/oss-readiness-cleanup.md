---
"@oc-mui/i18n": patch
"@oc-mui/plugin-system": patch
"@oc-mui/remote-plugin-loader": patch
"@oc-mui/ui": patch
"@oc-mui/ui-config": patch
"@oc-mui/utils": patch
"@oc-mui/vite-config": patch
"@oc-mui/plugin-admin-marketplace": patch
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-core-upload": patch
---

Open-source readiness cleanup — remove organization-specific identifiers and internal references ahead of the public release. No public API changes.

- **@oc-mui/ui**: drop the org-specific `tuw` / `tuwel` ACL labels from the `muitable-sidebar` locales (the ACL editor resolves labels by policy name, so deployments supply their own labels); repoint the default landing page's docs URL to the project's canonical docs site; use the `--primary` semantic token instead of a hardcoded color in the sidebar-header default.
- **@oc-mui/plugin-admin-marketplace**: remove the hardcoded organization plugin catalog from `plugin-metadata.ts`; repoint the default community registry to the org-owned registry; route runtime logging through the shared `logger`; enforce the marketplace domain allowlist for absolute theme URLs (parity with remote plugin loading).
- **@oc-mui/plugin-system**: route `FragmentRegistry` logging through the shared `logger`; genericize the manifest-schema examples.
- **@oc-mui/vite-config**: drop org-specific plugin names from the dev port-allocation list; genericize comments.
- **@oc-mui/plugin-core**: genericize the `app:header-logo` documentation example.
- **@oc-mui/i18n**, **@oc-mui/utils**, **@oc-mui/ui-config**, **@oc-mui/remote-plugin-loader**, **@oc-mui/plugin-core-upload**: genericize example/test data and code comments.

Behavior change is limited to the removed org-specific ACL locale keys, which fall back to the raw key until a deployment supplies its own labels.
</content>
