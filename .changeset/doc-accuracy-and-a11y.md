---
"@oc-mui/app-runtime": patch
"@oc-mui/plugin-admin-marketplace": patch
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-core": patch
---

Documentation accuracy and accessibility fixes.

- **@oc-mui/app-runtime**: README now shows the real `bootstrapStandaloneApp(AppComponent, containerId, config)` signature (the previous example used a non-existent options-object form) and the actual dependency list.
- **@oc-mui/plugin-admin-marketplace**: add `aria-label`s to the icon-only dismiss-error and refresh buttons in the marketplace dashboard.
- **@oc-mui/plugin-system**: rewrite `docs/README.md` to match the real API (`createPluginManager`, `ComponentResolver`; the previous version documented non-existent `defineExtensionPoint` / `resolveComponent` methods, a stale package layout, and linked to archived docs that are not in the repo).
- **@oc-mui/plugin-core**: header module README now imports from `@oc-mui/plugin-core` (the previously named `@oc-mui/plugins` package does not exist).
