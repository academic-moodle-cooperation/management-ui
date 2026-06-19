---
"@oc-mui/vite-config": patch
---

Fix community-plugin externalization after the `@workspace` → `@oc-mui`
rename. `createCommunityPluginConfig`'s `DEFAULT_EXTERNALS` still keyed
off `/^@workspace\//`, which no longer matches any package — so every
community plugin built with it silently **bundled** the host packages
(`@oc-mui/utils`, `@oc-mui/plugin-system`, `@oc-mui/ui`, `@oc-mui/i18n`,
…) instead of importing them as the host-provided runtime singletons.

Two consequences this fixes:

- The bundled `@oc-mui/utils` logger was compiled in `vite build`
  (production) mode, freezing its `isDevelopment` gate to `false` — so a
  plugin's own `logger.info`/`logger.debug` calls (e.g. the scaffold's
  `[<name>] activated` line) were dead no-ops in dev. With `@oc-mui/*`
  externalized, plugins call the host logger and the line prints.
- A plugin bundling its own copy of `@oc-mui/ui` / `@oc-mui/i18n` /
  `@oc-mui/plugin-system` got *forked* React context / i18n / plugin
  manager instances instead of sharing the host's. Externalizing
  restores singleton behavior.

Effect on bundle size is dramatic: the scaffold's placeholder plugin
drops from ~25.6 kB (41 modules) to ~0.6 kB (1 module), now importing
`@oc-mui/plugin-system` and `@oc-mui/utils` rather than inlining them.
