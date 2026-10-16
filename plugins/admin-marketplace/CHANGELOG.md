# @oc-mui/plugin-admin-marketplace

## 1.2.0

### Minor Changes

- f0b25e0: `remotePlugins.allowInsecureHttp` — deployment opt-out from the HTTPS requirement for remote plugin URLs.

  Default stays false (HTTPS required in production builds). Meant for deployments that themselves run without TLS (test boxes, intranet installs), where the page is plain HTTP anyway and the requirement only blocks the feature without adding protection. The domain allowlist still applies.

- 31b002b: Make the marketplace's registry deployment-configurable and give remote plugins translations.

  `remotePlugins.registryUrls` in the config slice names the registries (static `registry.json` files) whose entries the marketplace lists — until now only a dev-mode local registry was ever consulted, so no production deployment could actually browse anything. Listing and loading stay gated separately: entries become visible via `registryUrls`, executing them still requires `enabled` plus an allowlisted host.

  Registry entries (and the localStorage install records) can now carry `localesUrl` + `i18nNamespaces`; the loader registers them the same way the JAR path does, so a remote-loaded plugin keeps its translations instead of falling back to raw keys — including across reloads, which replay installed plugins.

- e51ece6: Marketplace v2 — reorganized around the two questions an admin actually has.

  **Installed** ("what is running here?") lists every plugin grouped by origin — bundled, organization (JAR), local development — as read-only transparency with live status. **Discover** ("what can I try?") carries the registry entries with explicit Try/Install actions (and finally explains the difference: Try = this session, Install = this browser, never other users), the installed-in-this-browser list, and the custom-URL developer card collapsed behind an Advanced disclosure with its risk gate unchanged. Themes becomes a third tab.

  Removed with the redesign: the per-browser enable/disable toggles for bundled plugins (including the conflicts workflow — overrides from earlier sessions still surface a banner with a reset), the namespace filter, the plugin detail view, and the hand-maintained `plugin-metadata.ts` map that fed it (a documented maintenance burden). The `PluginExplorer` and plugin-metadata re-exports are gone from the package surface.

### Patch Changes

- 85a910f: The config-slice boundary is mechanical now: the new `local/no-cross-plugin-config` rule flags any raw read of an AppConfig's `plugins` map (`useAppConfig().config.plugins[...]`, `config?.plugins?.[id]`), pointing at the `definePluginConfig` reader instead. The infrastructure that legitimately touches the raw map (the reader itself, the config-merge tests, route protection, the shell's loader and router provider) is enumerated as ignores next to the rule's wiring. The "no lint rule catches this yet, so reviews enforce it" comments across the workspace now name the rule.
- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 8ec82fc: Correct code comments and docs that claimed a lint rule flags direct cross-slice config reads — no such rule exists yet; reviews enforce the config-slice rule today.
- 90dca3b: `PageShell` standardizes the content pages (#257): uniform page padding, the title in the same place and type scale on every page, optional description, an optional right-aligned actions slot, separator, content. Episodes, series, upload and the marketplace all render through it now — the marketplace loses its own padding/heading dialect (its view toggle moves into the actions slot), upload loses its accidental flex-wrap frame. The landing page deliberately stays out (marketing surface). Plugin apps should adopt `PageShell` so their pages sit flush with the core ones.
- 2fbe7c9: Hold React at `~19.2.0` (down from `^19.3.0`). React 19.3 makes the production
  build roughly four times slower on WebKit (Safari, iPad) — the browser matrix
  went from all-green in 2.4 min to 11 failed / 28 flaky in 10 min, bisected to
  the 19.3 bump alone. `react` and `react-dom` are pinned in every package and in
  the root `pnpm.overrides` so the workspace keeps resolving to a single copy;
  Dependabot ignores React minors until the hold is lifted (see
  `docs/reference/open-followups.md` §11). Peer ranges and public APIs are
  unchanged.
- a007934: React lifted from the 19.1 hold to `^19.3.0`. The `pnpm.overrides` pinning `react`, `react-dom`, `@types/react` and `@types/react-dom` to 19.1 are removed together with the Dependabot ignore for React minors; the workspace resolves to a single React copy without the workspace-root dev dependencies the hold had needed. Peer ranges (`^18.0.0 || ^19.0.0`) are unchanged. API reports regenerated: `@types/react` 19.3 spells JSX return types as `React.JSX.Element`, a rendering change only.
- ac86dd6: The semantic-token theme rule is now lint-enforced, and the codebase is swept clean

  New `local/no-palette-classes` ESLint rule (#297): Tailwind raw palette
  color classes (`text-gray-900`, `bg-amber-50`, `focus:ring-indigo-600`, …)
  are forbidden — they ignore the theme tokens, which is exactly how #279
  (unreadable dark-mode inputs) happened. The rule scans all string and
  template literals, so class strings in plain `.ts` style maps are covered
  too; the shadcn layer keeps its existing lint exemption.

  The sweep replaced ~70 palette usages across the table styles, the
  marketplace's amber/emerald status colors (→ `warning`/`ok` tokens, whose
  theme stability also removes the hand-written `dark:` duplicates), both
  table plugins and the language switcher. Three table row-color variants
  that are NAMED after fixed colors (`purple`, `dark`, `black`) keep their
  values under a reasoned eslint-disable — no semantic equivalent exists and
  removing them would break the exported variant type.

- Updated dependencies [ff5eb70]
- Updated dependencies [ec52929]
- Updated dependencies [8bf09b0]
- Updated dependencies [c0e302b]
- Updated dependencies [b135497]
- Updated dependencies [421e712]
- Updated dependencies [85a910f]
- Updated dependencies [1f6b671]
- Updated dependencies [cf06651]
- Updated dependencies
- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [3f02712]
- Updated dependencies [564d02f]
- Updated dependencies [a446b51]
- Updated dependencies [fb144d3]
- Updated dependencies [45dc3ae]
- Updated dependencies [4ae141b]
- Updated dependencies [36b1289]
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
  - @oc-mui/i18n@1.1.0
  - @oc-mui/plugin-system@1.2.0
  - @oc-mui/remote-plugin-loader@1.1.0
  - @oc-mui/utils@1.2.0

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
