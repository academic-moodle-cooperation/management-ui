---
"@oc-mui/i18n": patch
---

Fix core i18n namespaces (`common`/`series`/`episodes`/`upload`) returning 404 in
development. The HTTP backend's dev base URL was `/management-ui/dist/locales`,
but `vite-plugin-static-copy` serves the locale files at `/management-ui/locales`
(no `/dist/` prefix) — the same path production already uses. So on a clean
`pnpm --filter shell dev`, every core namespace request 404'd (the bug was only
masked when a stale `apps/shell/dist/` from a prior build happened to be served).
Pointed the dev base at `/management-ui/locales` so dev matches both production
and the static-copy output. Plugin namespaces registered via
`registerPluginI18nNamespaces` (e.g. `.local-plugins`, which serve under
`/dist/locales`) keep their own base and are unaffected.
