---
"@oc-mui/ui": patch
---

Rewrite the 37 self-imports (`@oc-mui/ui/...` → relative paths) so the package no longer depends on its own resolution. The `@oc-mui/ui/*` tsconfig alias, the vitest resolve alias, the tsup self-name externalisation and the `tsconfig.api-extractor.json` workaround are all gone; a regression test keeps the imports relative. API Extractor now also covers the `./hooks` entry point (`etc/ui-hooks.api.md`).
