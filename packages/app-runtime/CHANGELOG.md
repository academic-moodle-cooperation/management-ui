# @oc-mui/app-runtime

## 1.0.3

### Patch Changes

- Updated dependencies [bbbdf68]
  - @oc-mui/query@2.0.1
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/router@1.1.2
  - @oc-mui/ui@2.0.1
  - @oc-mui/utils@1.2.0

## 1.0.2

### Patch Changes

- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 2fbe7c9: Hold React at `~19.2.0` (down from `^19.3.0`). React 19.3 makes the production
  build roughly four times slower on WebKit (Safari, iPad) — the browser matrix
  went from all-green in 2.4 min to 11 failed / 28 flaky in 10 min, bisected to
  the 19.3 bump alone. `react` and `react-dom` are pinned in every package and in
  the root `pnpm.overrides` so the workspace keeps resolving to a single copy;
  Dependabot ignores React minors until the hold is lifted (see
  `docs/reference/open-followups.md` §11). Peer ranges and public APIs are
  unchanged.
- a007934: React lifted from the 19.1 hold to `^19.3.0`. The `pnpm.overrides` pinning `react`, `react-dom`, `@types/react` and `@types/react-dom` to 19.1 are removed together with the Dependabot ignore for React minors; the workspace resolves to a single React copy without the workspace-root dev dependencies the hold had needed. Peer ranges (`^18.0.0 || ^19.0.0`) are unchanged. API reports regenerated: `@types/react` 19.3 spells JSX return types as `React.JSX.Element`, a rendering change only.
- 2044d7f: Move the `build:types` incremental state file (`tsconfig.build.tsbuildinfo`) into `dist-types/` so it lives and dies with the declaration output it describes. Previously the state file sat at the package root, outside the turbo `dist-types/**` cache outputs: a stale state file next to a deleted/partial `dist-types/` made `tsc` skip emission entirely, and turbo then cached the empty `dist-types/` — poisoning the (worktree-shared) build cache and breaking `check-types` repo-wide with `TS7016` errors on later "cache hit" runs (#258).
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
- Updated dependencies [31c19e7]
- Updated dependencies [3f02712]
- Updated dependencies [564d02f]
- Updated dependencies [a446b51]
- Updated dependencies [fb144d3]
- Updated dependencies [45dc3ae]
- Updated dependencies [3e20b75]
- Updated dependencies [0f076c1]
- Updated dependencies [a5c54f6]
- Updated dependencies [8ec82fc]
- Updated dependencies [9db8ada]
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
- Updated dependencies [a36e731]
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
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/router@1.1.1
  - @oc-mui/utils@1.2.0

## 1.0.1

### Patch Changes

- dae5dc4: Remove verified dead code (pre-open-source cleanup).

  None of these had any consumer (checked in-repo and across the org plugin
  repos):
  - `@oc-mui/query`: removed the null-wrapper `useGenericQuery` (use `useQuery`
    directly) and the never-initialised GraphQL client singleton
    (`getGraphQLClient` / `initializeGraphQLClient`) — the live path is the
    `createGraphQLClient` factory. (`QueryKey`, which was only re-exported through
    `useGenericQuery`, is no longer surfaced; import it from `@tanstack/react-query`.)
  - `@oc-mui/app-runtime`: removed the unused `registerApp` / `getApps` from the
    runtime context (and the `useState`-backed second app registry behind them) —
    apps flow through the plugin manager's `apps:definitions`, not this context.

  Not touched:
  - `datetime-picker.tsx` is **live** (rendered by `MetadataUpdateField` for
    DURATION fields, used by core-episodes/series), so it and the react-aria
    dependencies stay.
  - `SwitchHeadlessUI` (and the `@headlessui/react` dependency behind it) is
    **live**: tuwien's SidebarHeader in management-ui-plugins uses it for the
    language toggle. Removing it is tracked as a follow-up (native radix Switch +
    tuwien migration) in `docs/operations/open-followups.md`.

- 1234904: Make `dist` the canonical published entry point so an `npm`-based publish can't ship broken packages.

  Previously each package's top-level `main`/`types`/`exports` pointed at `./src/*`,
  with the `dist`-pointing map only under `publishConfig`. That is only correct when
  the publish tool applies `publishConfig` (pnpm does; `npm publish`/`npm pack` do
  not) — so a plain `npm publish` (e.g. the first-publish bootstrap) would ship a
  tarball whose entry points resolve to `src/`, which isn't in the published `files`.

  Now the top-level `exports` are `dist`-canonical for consumers, and `publishConfig`
  is reduced to `{ "access": "public" }`. There is deliberately no `development`
  condition pointing at `src`: vite/vitest activate `development` by default, so a
  published map carrying it would send _consumers'_ tooling to a `src/` path that is
  not in the tarball (caught by the SDK publish smoke-test). Inside the monorepo the
  dev server resolves source via the shell's vite aliases, and tests resolve built
  `dist` (turbo orders `^build`/`^build:types` first). No public API changed; this is
  packaging metadata only.

  Note this fixes the _entry points_ only. `workspace:*` dependency specifiers are
  still rewritten to real ranges by `pnpm publish` (which `changeset publish` uses),
  not by plain `npm publish` — so the first-publish bootstrap must use `pnpm`, as
  documented in `.github/workflows/release.yml`.

- ed4a3d8: Declare `sideEffects` for tree-shaking, and add API-surface tracking to three more packages.
  - `sideEffects: false` on the pure packages (`utils`, `plugin-system`, `query`,
    `router`, `store`, `ui-config`, `app-runtime`, `plugin-testing`) so bundlers can
    drop unused exports. `@oc-mui/ui` uses `["**/*.css"]` (it ships `globals.css`).
    `@oc-mui/i18n` is intentionally left unset — its entry initialises i18next at
    import time, which is a real side effect.
  - `@oc-mui/app-runtime`, `@oc-mui/utils`, and `@oc-mui/plugin-testing` gain an
    `api-extractor.json` + `api-check`/`api-check:ci` scripts + a committed
    `etc/*.api.md`, so unintended public-API changes are caught in review (matching
    the six packages that already had this).

- Updated dependencies [4451b10]
- Updated dependencies [dae5dc4]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [41d22f6]
- Updated dependencies [8fef245]
- Updated dependencies [39c4b67]
- Updated dependencies [ed4a3d8]
- Updated dependencies [2de0b14]
  - @oc-mui/utils@1.1.0
  - @oc-mui/query@1.1.0
  - @oc-mui/plugin-system@1.1.0
  - @oc-mui/router@1.1.0
  - @oc-mui/ui@1.1.0
