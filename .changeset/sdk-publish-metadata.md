---
"@opencast-mui/plugin-system": patch
"@opencast-mui/plugin-core": patch
"@opencast-mui/plugin-testing": patch
"@opencast-mui/ui": patch
"@opencast-mui/ui-config": patch
"@opencast-mui/utils": patch
"@opencast-mui/i18n": patch
"@opencast-mui/query": patch
"@opencast-mui/router": patch
"@opencast-mui/store": patch
"@opencast-mui/vite-config": patch
"@opencast-mui/eslint-config": patch
"@opencast-mui/typescript-config": patch
"@opencast-mui/app-runtime": patch
"@opencast-mui/tailwind-config": patch
---

Add npm publish metadata to the plugin-author SDK packages.

Each of the 15 packages a plugin author installs (`pnpm create-plugin` deps +
the facades/runtime/styling real and external plugins import) now carries
`description`, `repository`
(+ `directory`), `homepage`, `bugs`, `author`, `keywords`,
`publishConfig.access = "public"`, and its own `LICENSE` file. This is pure
packaging metadata — no code or public-API change — so the packages are ready
for the Phase 6d public flip.

The packages remain `private: true` for now; flipping that (plus pointing
`exports` at built `dist/` and moving React to `peerDependencies`) is tracked
separately. The 7 non-SDK packages (feature plugins, host-only infra) stay
`private: true` permanently by design — see docs/operations/release.md
"What gets published".
