# @oc-mui/plugins

## 1.0.3

### Patch Changes

- @oc-mui/plugin-admin-marketplace@1.2.1
- @oc-mui/plugin-core@1.1.1
- @oc-mui/plugin-core-episodes@1.2.1
- @oc-mui/plugin-core-series@1.2.1
- @oc-mui/plugin-core-upload@1.1.2
- @oc-mui/plugin-example@1.0.3

## 1.0.2

### Patch Changes

- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 4e4545c: Translate the remaining German comments in `plugins/index.ts` to English (comment-only, no code change).
- Updated dependencies [b135497]
- Updated dependencies [85a910f]
- Updated dependencies [cf06651]
- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [564d02f]
- Updated dependencies [0ec637a]
- Updated dependencies [a446b51]
- Updated dependencies [c4ae3f9]
- Updated dependencies [fb144d3]
- Updated dependencies [45dc3ae]
- Updated dependencies [36b1289]
- Updated dependencies [8ec82fc]
- Updated dependencies [f0b25e0]
- Updated dependencies [31b002b]
- Updated dependencies [e51ece6]
- Updated dependencies [05c6477]
- Updated dependencies [3f6bf7d]
- Updated dependencies [90dca3b]
- Updated dependencies [57a7d88]
- Updated dependencies [2fbe7c9]
- Updated dependencies [a007934]
- Updated dependencies [49dcb64]
- Updated dependencies [462e731]
- Updated dependencies [ac86dd6]
- Updated dependencies [b954e20]
- Updated dependencies [2044d7f]
- Updated dependencies [5ec9a9e]
  - @oc-mui/plugin-core-series@1.2.0
  - @oc-mui/plugin-core-episodes@1.2.0
  - @oc-mui/plugin-admin-marketplace@1.2.0
  - @oc-mui/plugin-core@1.1.0
  - @oc-mui/plugin-core-upload@1.1.1
  - @oc-mui/plugin-example@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [1234904]
- Updated dependencies [b87d5b3]
- Updated dependencies [ca4f8f6]
- Updated dependencies [e4fafbe]
- Updated dependencies [8fef245]
- Updated dependencies [951a89a]
  - @oc-mui/plugin-core@1.0.1
  - @oc-mui/plugin-core-episodes@1.1.0
  - @oc-mui/plugin-admin-marketplace@1.1.0
  - @oc-mui/plugin-core-series@1.1.0
  - @oc-mui/plugin-core-upload@1.1.0
  - @oc-mui/plugin-example@1.0.1
