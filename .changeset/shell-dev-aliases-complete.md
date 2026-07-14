---
"@oc-mui/vite-config": patch
---

Complete the shell dev-server source aliases: `@oc-mui/app-runtime`,
`@oc-mui/store` (root-level entry + `atoms`/`useStore`/`useTableStore`
subpaths), and `@oc-mui/plugin-core` were missing from the alias map. With dist
as the canonical entry point, un-aliased workspace imports resolve to `dist/` —
on an unbuilt tree Vite's dependency scan then failed with "Failed to resolve
entry for package \"@oc-mui/app-runtime\"" and the dev server never became
ready (this is how the CI E2E job failed). The aliases restore source
resolution for those packages in shell dev; independently, dev now assumes a
built SDK (the E2E workflow builds it first).
