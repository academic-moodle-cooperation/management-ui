---
"@oc-mui/app-runtime": patch
"@oc-mui/eslint-config": patch
"@oc-mui/i18n": patch
"@oc-mui/plugin-admin-marketplace": patch
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-upload": patch
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-testing": patch
"@oc-mui/plugins": patch
"@oc-mui/providers": patch
"@oc-mui/query": patch
"@oc-mui/router": patch
"@oc-mui/store": patch
"@oc-mui/tailwind-config": patch
"@oc-mui/ui": patch
"@oc-mui/ui-config": patch
"@oc-mui/vite-config": patch
---

Dependency maintenance: the October minor/patch group (47 packages) — React 19.3, the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes; the API reports only pick up `@types/react` 19.3 spelling `React.JSX.Element` where `react/jsx-runtime`'s `JSX.Element` stood. One resolution fix: `@types/node` is pinned to the workspace's `^25` across the tree, because optional `@types/node` peers (vitest, api-extractor, graphql-config) otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.
