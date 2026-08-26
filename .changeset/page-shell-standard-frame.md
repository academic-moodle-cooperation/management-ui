---
"@oc-mui/ui": minor
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-upload": patch
"@oc-mui/plugin-admin-marketplace": patch
---

`PageShell` standardizes the content pages (#257): uniform page padding, the title in the same place and type scale on every page, optional description, an optional right-aligned actions slot, separator, content. Episodes, series, upload and the marketplace all render through it now — the marketplace loses its own padding/heading dialect (its view toggle moves into the actions slot), upload loses its accidental flex-wrap frame. The landing page deliberately stays out (marketing surface). Plugin apps should adopt `PageShell` so their pages sit flush with the core ones.
