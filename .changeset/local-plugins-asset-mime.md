---
"@oc-mui/vite-config": patch
---

Dev server: serve `.local-plugins/` assets with correct per-extension MIME
types (notably `.svg` → `image/svg+xml`) so a plugin's SVG/icon/font assets
render in dev instead of silently failing under `application/octet-stream`.
