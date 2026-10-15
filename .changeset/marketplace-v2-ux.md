---
"@oc-mui/plugin-admin-marketplace": minor
---

Marketplace v2 — reorganized around the two questions an admin actually has.

**Installed** ("what is running here?") lists every plugin grouped by origin — bundled, organization (JAR), local development — as read-only transparency with live status. **Discover** ("what can I try?") carries the registry entries with explicit Try/Install actions (and finally explains the difference: Try = this session, Install = this browser, never other users), the installed-in-this-browser list, and the custom-URL developer card collapsed behind an Advanced disclosure with its risk gate unchanged. Themes becomes a third tab.

Removed with the redesign: the per-browser enable/disable toggles for bundled plugins (including the conflicts workflow — overrides from earlier sessions still surface a banner with a reset), the namespace filter, the plugin detail view, and the hand-maintained `plugin-metadata.ts` map that fed it (a documented maintenance burden). The `PluginExplorer` and plugin-metadata re-exports are gone from the package surface.
