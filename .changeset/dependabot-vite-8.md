---
"@oc-mui/vite-config": patch
"@oc-mui/i18n": patch
"@oc-mui/providers": patch
"@oc-mui/router": patch
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-testing": patch
---

Dependency maintenance: Vite 6 → 8 (Rolldown-based), with
`@vitejs/plugin-react-swc` 4 and `@vitejs/plugin-react` 5.2 as the matching
plugin majors. `@oc-mui/vite-config` accepts `vite` 6, 7 or 8 as its peer and
drops the Rollup-only `generatedCode.constBindings` output option (Rolldown
always emits const bindings). The `pnpm create-plugin` templates scaffold
against Vite 8.
