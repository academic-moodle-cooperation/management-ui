# @oc-mui/providers

## 3.0.1

### Patch Changes

- Updated dependencies [b1d5f78]
  - @oc-mui/query@2.0.1
  - @oc-mui/app-runtime@1.0.3
  - @oc-mui/router@1.1.2
  - @oc-mui/ui@2.0.1
  - @oc-mui/plugin-system@1.2.1

## 3.0.0

### Patch Changes

- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- a36a941: Declare the `@oc-mui/query` peer dependency as `workspace:^` instead of
  `workspace:*`. The exact-version range made every query release — even a
  patch or minor — fall outside the declared peer range, which is why changesets
  bumped `@oc-mui/providers` a **major** on each query bump (1 → 2 last time, and
  it would have been 2 → 3 on the codegen-toolchain minor). With a caret range
  providers follows query with a patch bump and only takes a major when query
  actually goes major. No runtime change; pnpm rewrites the range to `^<version>`
  at publish time either way.
- a16ad96: `@oc-mui/ui/components` is the plugin SDK surface now — the host's assembly layer moved to a new `@oc-mui/ui/internal` entry.

  Moved out of `components`: `Appshell`, the router primitives (`UiRouterProvider`, `UiRouterPrimitives`, `useUiRouter`), `DefaultLandingPage`, the error pages (`ErrorPage`, `ErrorBoundary`, `NotFoundError`, `ForbiddenError`, `GeneralError`, `MaintenanceError`, `UnauthorizedError`) and `ThemeModeProvider`. Nothing a plugin uses changed: `NavMain`, `ThemeModeToggle`, `AppLoader`/`Loading` and every primitive stay in `components`. The internal entry carries no API report, is not shared with remote-loaded plugins, and `@oc-mui/eslint-config` now forbids importing it from `plugins/` and `.local-plugins/` (the shared restricted-import patterns are hoisted so the plugin-scoped rule extends rather than replaces them). `@oc-mui/app-runtime` and `@oc-mui/providers` import `ErrorBoundary` from the new entry instead of a deep path.

  Done before the first npm publish so the published surface is the one we intend to keep: 240 → 226 exports, every remaining one either used by a plugin today or a generic primitive.

- Updated dependencies [ff5eb70]
- Updated dependencies [ec52929]
- Updated dependencies [8bf09b0]
- Updated dependencies [c0e302b]
- Updated dependencies [b135497]
- Updated dependencies [421e712]
- Updated dependencies [85a910f]
- Updated dependencies [1f6b671]
- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [3f02712]
- Updated dependencies [564d02f]
- Updated dependencies [a446b51]
- Updated dependencies [fb144d3]
- Updated dependencies [45dc3ae]
- Updated dependencies [3e20b75]
- Updated dependencies [0f076c1]
- Updated dependencies [a5c54f6]
- Updated dependencies [8ec82fc]
- Updated dependencies [05c6477]
- Updated dependencies [dc9ca73]
- Updated dependencies [3f6bf7d]
- Updated dependencies [50c7f05]
- Updated dependencies [90dca3b]
- Updated dependencies [ace0e1e]
- Updated dependencies [2a5bcac]
- Updated dependencies [9526e3f]
- Updated dependencies [57a7d88]
- Updated dependencies [5623ce4]
- Updated dependencies [2fbe7c9]
- Updated dependencies [a007934]
- Updated dependencies [86d633c]
- Updated dependencies [2251f74]
- Updated dependencies [ac86dd6]
- Updated dependencies [b954e20]
- Updated dependencies [2044d7f]
- Updated dependencies [a16ad96]
- Updated dependencies [576a3cb]
- Updated dependencies [c69f95b]
- Updated dependencies [0546654]
  - @oc-mui/ui@2.0.0
  - @oc-mui/query@2.0.0
  - @oc-mui/app-runtime@1.0.2
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/router@1.1.1

## 2.0.0

### Patch Changes

- Updated dependencies [dae5dc4]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [41d22f6]
- Updated dependencies [8fef245]
- Updated dependencies [39c4b67]
- Updated dependencies [ed4a3d8]
- Updated dependencies [2de0b14]
  - @oc-mui/query@1.1.0
  - @oc-mui/app-runtime@1.0.1
  - @oc-mui/plugin-system@1.1.0
  - @oc-mui/router@1.1.0
  - @oc-mui/ui@1.1.0
