---
"@oc-mui/ui-config": major
"@oc-mui/query": major
---

Remove `app.appName` — it was never rendered anywhere

Nothing read the key: not the shell, not the in-tree plugins, not the org
plugins (univie/tuwien). It sat in the public `AppConfig` type suggesting a
capability that did not exist (#266). Removing it now is free; after the first
npm publish it would require a deprecation cycle.

The document title continues to come from `app.HtmlDocumentTitle`, the header
branding from `app.logoUrl` / `app.orgLogoUrl` and the theme. Deployment
`config.json` files that still carry `appName` keep working — unknown keys are
ignored by the config merge.

`@oc-mui/query` is bumped alongside because its public surface re-exposes the
`AppConfig` type (via `useAppConfig`), so the field removal is observable
through it as well.
