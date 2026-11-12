# @oc-mui/plugin-admin-marketplace-v2

## 0.2.0

### Minor Changes

- 14662f0: The marketplace v2 plugin is translated. Every visible string of the Explore and Library tabs, the Try dialog, the detail view, the theme cards and the trial banner now comes from the new `marketplace` namespace, shipped in English and German next to the other core namespaces; the sidebar entry resolves its title through the same key. Diagnostic messages from the Try security gates (allowlist, protocol, integrity) stay English: they quote configuration keys for administrators.
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

### Patch Changes

- 9cd60b8: Dependency maintenance: minor/patch bumps of `lucide-react` (0.417 → 0.577, still the host-provided 0.x major), `tailwindcss`/`@tailwindcss/vite`, `autoprefixer`, `typescript-eslint`, `@microsoft/api-extractor`, `@playwright/test`, `@swc/helpers`, `@tanstack/react-query-devtools` and `@graphql-codegen/typescript-operations`.
- 522aaec: Marketplace v2: the Explore / Installed split explains itself. Catalog entries that already run on this deployment show an **Installed** pill (was "Active here") that jumps to the plugin's row in the Installed tab (was "Library"), which now opens with a one-line summary of what it lists; `#library=<namespace>` deep-links to a row.
- 25fdfd1: Marketplace v2: the Themes tab no longer lists feature plugins as themes. A deployed or local plugin is offered as an org theme only when the stylesheet at its conventional path sets at least one theme token (`--background`, `--card`, `--primary`, `--sidebar`, `--muted`, `--border`) in `:root` or `.dark`; a plugin's own Tailwind stylesheet at that path is ignored.
- cd729c2: A plugin trial whose app lands on a route another app already serves no longer leaves the shell on an endless loader: duplicate routes are deduplicated when the router is built (first registration wins, the collision is logged), a failed router build shows an error screen with a reload action, and the marketplace's trial banner names the route collision on the trial so "End trial" is the obvious way out.
- Updated dependencies [9cd60b8]
- Updated dependencies [e4f061d]
- Updated dependencies [8c48874]
- Updated dependencies [522aaec]
- Updated dependencies [cd729c2]
- Updated dependencies [14662f0]
- Updated dependencies [d778e49]
- Updated dependencies [a94974b]
- Updated dependencies [e4f061d]
- Updated dependencies [b864edb]
- Updated dependencies [e4f061d]
- Updated dependencies [03706e3]
- Updated dependencies [cfbe304]
- Updated dependencies [7a1689f]
  - @oc-mui/plugin-system@1.4.0
  - @oc-mui/query@2.1.2
  - @oc-mui/ui@2.1.0
  - @oc-mui/i18n@1.2.0
  - @oc-mui/remote-plugin-loader@1.3.0
  - @oc-mui/utils@1.3.1
