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

The registry document gains three optional fields: `tagline` (one-line pitch
for cards), `accentColor` (tile/artwork color), and `integrity` (SRI hash of
the bundle). All have fallbacks; existing registries stay fully compatible.
