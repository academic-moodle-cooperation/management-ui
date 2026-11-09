---
"@oc-mui/vite-config": patch
---

Update `vite-plugin-static-copy` to 4.x. Version 4 mirrors each matched file's full directory path below the destination, so the shell's copy targets now state explicitly which part of the path to keep: locale files still land at `locales/<namespace>/<lng>.json` and assets at `assets/...`, for in-tree plugins and for both `.local-plugins` locale layouts. The locale globs also skip `node_modules` now, so the build no longer ships the locale folders of installed dependencies under `locales/`.
