# @oc-mui/plugins

## 1.0.6

### Patch Changes

- f8f9a38: The plugins README lists the themes shipped with the shell, including the new `modern` theme.
- 70c8d34: New plugin: `admin-marketplace-v2` — ground-up marketplace rebuild, running in
  parallel to `admin-marketplace` while features migrate piece by piece (the
  plugins barrel now exports it).
  
  Features so far:
  
  - **Discover catalog** — read-only browsing of the plugins and themes offered
    by configured registries (search, category filters, detail dialog).
    Browsing never fetches or executes remote code.
  - **Try gesture** — ephemeral, tab-scoped trials. "Try" records a marker in
    `sessionStorage` and reloads, so the plugin loads through the boot path and
    actually works; the trial dies with the tab. Fail-closed behind
    `try.enabled` plus a domain allowlist, HTTPS enforcement
    (`try.allowInsecureHttp` opt-out), workspace/API compatibility checks, and
    optional integrity pinning (`try.requireIntegrity` to make it mandatory).
    There is deliberately no permanent install — permanence goes through the
    deployment path.
  - **Library** — the deployment's plugin inventory, one row per namespace,
    grouped by status (active / trials / available but disabled) with origin,
    module types, version, a read-only newer-in-registry hint, and the exact
    `app.enabledPlugins` value to copy. Read-only by design — except for one
    gesture: **Try** on a present-but-disabled plugin previews it in this tab
    only (via `@oc-mui/plugin-system`'s preview contract; no code is fetched).
  - **Theme try-on** — shipped, org and registry themes in one list; Try
    applies a theme instantly in this tab (no reload), one click ends it; the
    `app.theme` value to make it permanent is shown. Shipped themes are listed
    from `apps/shell/public/plugins/themes/index.json`.
  
  - **V4 look** — the design studies' layout, brought over with tokens only:
    one header line (wordmark, Explore · Library with count and update dot,
    search), hero, category pills, **Featured** cards (ids curated per
    deployment via `featured`), plugin rows, theme cards whose swatch is parsed
    from the theme's own CSS. Tiles show a Lucide icon from `icon` (per-category
    default otherwise) on the accent gradient; the "Try it" pill and the green
    state pill follow the studies.
  
  - **Extends / Requires** — the detail view and the Library show which
    extension points a plugin populates (live registry for running plugins,
    manifest otherwise) and whether the plugins it depends on are present on
    this deployment. Deployed plugins' manifests are read from where the
    backend already serves them.
  
  - **Try with overlap handling** — before a trial, the dialog names the active
    plugins that fill the same single slots (footer, landing page, sidebar,
    header) and offers to pause them in this tab via the new pause contract;
    End trial brings them back. The Library shows paused plugins in their own
    group.
  
  The registry document reads the manifest's presentational fields (`tagline`,
  `accentColor`, `icon`, `screenshots` — the latter loaded only from this origin
  or an allowlisted host) plus `integrity` (SRI hash of the bundle). All have
  fallbacks; existing registries stay fully compatible.
- Updated dependencies [9cd60b8]
- Updated dependencies [a94974b]
- Updated dependencies [cfbe304]
- Updated dependencies [cfbe304]
  - @oc-mui/plugin-admin-marketplace@1.2.3
  - @oc-mui/plugin-core-episodes@1.3.2
  - @oc-mui/plugin-core-series@1.3.0
  - @oc-mui/plugin-core-upload@1.1.5
  - @oc-mui/plugin-core@1.2.0
  - @oc-mui/plugin-example@1.0.5

## 1.0.5

### Patch Changes

- Updated dependencies [59814cc]
- Updated dependencies [3f6c7da]
  - @oc-mui/plugin-core-upload@1.1.4
  - @oc-mui/plugin-core-episodes@1.3.1
  - @oc-mui/plugin-core-series@1.2.3

## 1.0.4

### Patch Changes

- 25ad329: Dependency maintenance: TypeScript 5.5 → 6.0. The `tsconfig.json` files drop
  the now-deprecated `baseUrl` (every `paths` entry was already relative to the
  config file), `@oc-mui/vite-config` sets `rootDir` explicitly, and the
  packages that side-effect-import a stylesheet without resolving `vite/client`
  declare `*.css` themselves, since TypeScript 6 rejects unresolved side-effect
  imports by default.
- Updated dependencies
- Updated dependencies [25ad329]
- Updated dependencies [6bc9234]
  - @oc-mui/plugin-core-episodes@1.3.0
  - @oc-mui/plugin-admin-marketplace@1.2.2
  - @oc-mui/plugin-core@1.1.2
  - @oc-mui/plugin-core-series@1.2.2
  - @oc-mui/plugin-core-upload@1.1.3
  - @oc-mui/plugin-example@1.0.4

## 1.0.3

### Patch Changes

- Updated dependencies [e2e7814]
  - @oc-mui/plugin-admin-marketplace@1.2.1
  - @oc-mui/plugin-core-episodes@1.2.1
  - @oc-mui/plugin-core-series@1.2.1
  - @oc-mui/plugin-core-upload@1.1.2
  - @oc-mui/plugin-example@1.0.3
  - @oc-mui/plugin-core@1.1.1

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
