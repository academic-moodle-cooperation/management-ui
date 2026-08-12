---
"@oc-mui/vite-config": patch
---

Serve root-level plugin locales from the `.local-plugins` dev mount. Locale discovery (dev-server manifest + middleware) and the shell's static-copy targets now honor the canonical `<plugin>/locales/<namespace>/<lng>.json` layout — relocatable via `plugin.json`'s `locales` field — in addition to the multi-module `modules/<module>/locales/` layout, so scaffolded plugins get their translations in the dev shell without mirroring files into `modules/`. When both layouts ship the same namespace, the root-level files win.
