---
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-testing": patch
"@oc-mui/ui": patch
"@oc-mui/ui-config": patch
"@oc-mui/utils": patch
"@oc-mui/i18n": patch
"@oc-mui/query": patch
"@oc-mui/router": patch
"@oc-mui/store": patch
"@oc-mui/vite-config": patch
"@oc-mui/eslint-config": patch
"@oc-mui/typescript-config": patch
---

Add npm publish metadata to the plugin-author SDK packages.

Each of the 13 packages a plugin author installs (`pnpm create-plugin` deps +
the facades real plugins import) now carries `description`, `repository`
(+ `directory`), `homepage`, `bugs`, `author`, `keywords`,
`publishConfig.access = "public"`, and its own `LICENSE` file. This is pure
packaging metadata — no code or public-API change — so the packages are ready
for the Phase 6d public flip.

The packages remain `private: true` for now; flipping that (plus pointing
`exports` at built `dist/` and moving React to `peerDependencies`) is tracked
separately. The 9 non-SDK packages (feature plugins, host-only infra) stay
`private: true` permanently by design — see docs/operations/release.md
"What gets published".
