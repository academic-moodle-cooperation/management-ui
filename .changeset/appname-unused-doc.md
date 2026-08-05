---
"@oc-mui/ui-config": patch
---

Document that `app.appName` is currently unrendered.

The TSDoc claimed it is "shown in chrome (header, etc.)", but no component reads it — the header renders the logo (`logoUrl`/`orgLogoUrl` or an `app:header-logo` registration) and the browser tab uses `HtmlDocumentTitle`. Deployments were setting it expecting a visible effect. Comment only; no behaviour change.
