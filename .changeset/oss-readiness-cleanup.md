---
"@opencast-mui/i18n": patch
"@opencast-mui/plugin-system": patch
"@opencast-mui/remote-plugin-loader": patch
"@opencast-mui/ui": patch
"@opencast-mui/ui-config": patch
"@opencast-mui/utils": patch
"@opencast-mui/vite-config": patch
"@opencast-mui/plugin-admin-marketplace": patch
"@opencast-mui/plugin-core": patch
"@opencast-mui/plugin-core-upload": patch
---

Open-source readiness cleanup — remove organization-specific identifiers and internal references ahead of the public release. No public API changes.

- **@opencast-mui/ui**: drop the org-specific `tuw` / `tuwel` ACL labels from the `muitable-sidebar` locales (the ACL editor resolves labels by policy name, so deployments supply their own labels); repoint the default landing page's docs URL to the project's canonical docs site; use the `--primary` semantic token instead of a hardcoded color in the sidebar-header default.
- **@opencast-mui/plugin-admin-marketplace**: remove the hardcoded organization plugin catalog from `plugin-metadata.ts`; repoint the default community registry to the org-owned registry; route runtime logging through the shared `logger`; enforce the marketplace domain allowlist for absolute theme URLs (parity with remote plugin loading).
- **@opencast-mui/plugin-system**: route `FragmentRegistry` logging through the shared `logger`; genericize the manifest-schema examples.
- **@opencast-mui/vite-config**: drop org-specific plugin names from the dev port-allocation list; genericize comments.
- **@opencast-mui/plugin-core**: genericize the `app:header-logo` documentation example.
- **@opencast-mui/i18n**, **@opencast-mui/utils**, **@opencast-mui/ui-config**, **@opencast-mui/remote-plugin-loader**, **@opencast-mui/plugin-core-upload**: genericize example/test data and code comments.

Behavior change is limited to the removed org-specific ACL locale keys, which fall back to the raw key until a deployment supplies its own labels.
</content>
