---
"@oc-mui/plugin-admin-marketplace-v2": minor
"@oc-mui/plugins": patch
---

New plugin: `admin-marketplace-v2` — ground-up marketplace rebuild, running in
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
