---
"@oc-mui/plugin-usage-stats": minor
"@oc-mui/plugins": minor
"@oc-mui/vite-config": patch
"@oc-mui/i18n": patch
---

New in-tree plugin `usage-stats`: a "Statistics" page and an episodes-panel "Usage" tab showing how often a creator's videos are watched, views over time, and which parts were seen. Reads the Opencast Statistics External API (`/api/statistics`, e.g. Matomo providers) first, then the usertracking service, and falls back to clearly labelled demo data. The plugin barrel exports it, and the dev proxy now forwards `/usertracking` to `VITE_PROXY_TARGET`.

Fixed alongside: `useExtensionLabels` (sidebar titles and panel-tab captions registered as translation keys) now re-resolves once the key's namespace has loaded, instead of showing the derived fallback until the next language switch. Any plugin whose nav title lives in its own namespace was affected.
