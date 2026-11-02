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

The registry document gains three optional fields: `tagline` (one-line pitch
for cards), `accentColor` (tile/artwork color), and `integrity` (SRI hash of
the bundle). All have fallbacks; existing registries stay fully compatible.
