---
"@opencast-mui/app-runtime": patch
"@opencast-mui/plugin-admin-marketplace": patch
"@opencast-mui/plugin-system": patch
"@opencast-mui/plugin-core": patch
---

Documentation accuracy and accessibility fixes.

- **@opencast-mui/app-runtime**: README now shows the real `bootstrapStandaloneApp(AppComponent, containerId, config)` signature (the previous example used a non-existent options-object form) and the actual dependency list.
- **@opencast-mui/plugin-admin-marketplace**: add `aria-label`s to the icon-only dismiss-error and refresh buttons in the marketplace dashboard.
- **@opencast-mui/plugin-system**: rewrite `docs/README.md` to match the real API (`createPluginManager`, `ComponentResolver`; the previous version documented non-existent `defineExtensionPoint` / `resolveComponent` methods, a stale package layout, and linked to archived docs that are not in the repo).
- **@opencast-mui/plugin-core**: header module README now imports from `@opencast-mui/plugin-core` (the previously named `@opencast-mui/plugins` package does not exist).
