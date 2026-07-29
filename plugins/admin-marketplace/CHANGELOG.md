# @oc-mui/plugin-admin-marketplace

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

- e4fafbe: Make remote plugin loading opt-in and fail-closed by default.

  The marketplace fetches and executes third-party code at runtime, so that
  capability is now off unless a deployment explicitly enables it. A new config
  slice gates it:

  ```json
  {
    "plugins": {
      "admin-marketplace": {
        "remotePlugins": { "enabled": true, "allowedDomains": ["cdn.jsdelivr.net"] }
      }
    }
  }
  ```

  - `remotePlugins.enabled` defaults to `false`. Every remote load — community
    install, developer URL, and the boot-time auto-load of persisted plugins —
    routes through a single fail-closed choke point in `RemoteLoader` and is
    refused when disabled.
  - `remotePlugins.allowedDomains` is now deployment-configurable (previously a
    hardcoded default with the config setter unused). The default list is also
    tightened: bare `github.io` was dropped — domain matching is suffix-based, so
    it admitted every GitHub user's Pages site. Deployments hosting plugins on
    GitHub Pages must allow their own subdomain (e.g. `my-org.github.io`)
    explicitly.
  - When disabled, the marketplace's Community and Developer sections render a
    clear "how to enable" banner and the developer URL loader is visibly disabled;
    bundled, organization (JAR), and local plugins are unaffected.
  - Hardened the HTTPS check: the plaintext-HTTP exception for localhost now
    applies only in development, so a production build can't be pointed at
    `http://localhost` to serve plugin code.

  Note: this changes the default behavior — a deployment that relied on the
  community/developer marketplace must set `remotePlugins.enabled: true`.

- 8fef245: Move stateful shared libraries to `peerDependencies` so consumers resolve a single instance.

  Shipping libraries that keep module-level state as regular `dependencies` risks a
  consumer getting two copies (the classic React "invalid hook call" / broken-context
  duplicate-instance bug). These are now peers, provided by the host app:
  - `@oc-mui/query` → `@tanstack/react-query`
  - `@oc-mui/router` → `@tanstack/react-router` (and drops the unused
    `@tanstack/router-core` direct dependency)
  - `@oc-mui/store` → `jotai`, `zustand`
  - The four in-tree plugins (`admin-marketplace`, `core-episodes`, `core-series`,
    `core-upload`) move `react` from `dependencies` to `peerDependencies`
    (`^18 || ^19`) + a `devDependencies` entry, matching `plugins/core`.
  - `@oc-mui/ui`'s `react` peer is widened from `^19.1.0` to `^18.0.0 || ^19.0.0`
    to match its siblings.

  `immer` (store) and `@tanstack/react-query-devtools` (query) stay regular
  dependencies — they are used internally and don't carry the singleton hazard. The
  workspace resolves the new peers via pnpm's `auto-install-peers` (already the
  project default), so the app and dev/test loop are unaffected.

### Patch Changes

- Updated dependencies [4451b10]
- Updated dependencies [dae5dc4]
- Updated dependencies [1234904]
- Updated dependencies [ca4f8f6]
- Updated dependencies [41d22f6]
- Updated dependencies [8fef245]
- Updated dependencies [ed4a3d8]
- Updated dependencies [2de0b14]
  - @oc-mui/utils@1.1.0
  - @oc-mui/query@1.1.0
  - @oc-mui/plugin-system@1.1.0
  - @oc-mui/ui@1.1.0
  - @oc-mui/remote-plugin-loader@1.0.1
