# @oc-mui/app-runtime

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
