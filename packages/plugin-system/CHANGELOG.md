# @oc-mui/plugin-system

## 1.1.0

### Minor Changes

- ca4f8f6: Restrict the plugin marketplace to administrators and gate developer URL loading.

  The marketplace loads and executes third-party code at runtime, so it is now
  admin-only:
  - `AppDefinition.requiredRoles` (plugin-system) and `AppProtectionConfig.requiredRoles`
    (router) let an app declare the roles allowed to open its route. `AppProtection`
    enforces them against the user's _granted_ roles (the `roles` array from Opencast's
    `/info/me.json`) — not the per-user `ROLE_USER_<username>` identity role — and shows
    an access-denied screen to authenticated users who lack the role. A deployment can
    override an app's roles via `config.plugins[<id>].protection.requiredRoles` (e.g. a
    non-default admin role).
  - The app sidebar (ui) hides nav entries whose `requiredRoles` the current user does
    not hold, so role-gated routes no longer surface a dead link.
  - The admin marketplace declares `requiredRoles: ["ROLE_ADMIN"]` (Opencast's default
    admin role) on its routes and nav item, and its developer "load from URL" flow now
    requires an explicit per-visit risk acknowledgement before it will run untrusted code.

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
- Updated dependencies [ed4a3d8]
  - @oc-mui/utils@1.1.0
