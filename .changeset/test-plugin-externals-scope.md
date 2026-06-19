---
"@oc-mui/vite-config": patch
---

Add a vitest regression test for `createCommunityPluginConfig`'s
`DEFAULT_EXTERNALS`. It asserts the `build.rollupOptions.external`
predicate externalizes the host scope (`@oc-mui/*`) and the React
runtime, while NOT matching the old `@workspace/*` scope or unrelated
deps. This guards the `@workspace` → `@oc-mui` rename so the regex can't
silently drift back and make community plugins over-bundle the host
singletons again. Wires up a `test` script (`vitest run`) and `vitest`
devDependency so the package participates in the repo's test pipeline.
