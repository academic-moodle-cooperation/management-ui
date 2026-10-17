# @oc-mui/plugin-testing

## 1.0.3

### Patch Changes

- Updated dependencies [b1d5f78]
  - @oc-mui/utils@1.3.0
  - @oc-mui/plugin-system@1.2.1

## 1.0.2

### Patch Changes

- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 82ff870: README no longer hard-codes contract version pairs (one of which had already drifted) — the versions live in `docs/architecture/CONTRACTS.md`, enforced by the new `pnpm docs:ownership` check.
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
- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [9db8ada]
- Updated dependencies [3f6bf7d]
- Updated dependencies [2fbe7c9]
- Updated dependencies [a007934]
- Updated dependencies [a36e731]
- Updated dependencies [2044d7f]
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/utils@1.2.0

## 1.0.1

### Patch Changes

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
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [ed4a3d8]
  - @oc-mui/utils@1.1.0
  - @oc-mui/plugin-system@1.1.0
