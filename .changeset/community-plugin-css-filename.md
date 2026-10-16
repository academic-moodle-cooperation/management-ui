---
"@oc-mui/vite-config": patch
---

`createCommunityPluginConfig` now names the extracted stylesheet after the plugin (`dist/<pluginName>.css`), matching the `.mjs` next to it. Vite's default derived the name from `package.json` instead (`dist/plugin-<name>.css` for a scaffolded `@oc-mui/plugin-<name>`), so a JAR's `cssUrl` — and the remote loader's `<name>.css` fallback — pointed at a file that did not exist. If a plugin's `plugin.json` hard-codes the old `plugin-<name>.css` name in its `css` field, update it to `dist/<name>.css`.
