---
"@oc-mui/plugin-system": minor
---

New tab-scoped **plugin preview** contract: `readPluginPreviews`,
`writePluginPreviews`, `addPluginPreview`, `removePluginPreview` and
`PLUGIN_PREVIEWS_STORAGE_KEY`. A preview lists plugin namespaces in
`sessionStorage`; the host treats them as enabled at every load gate for that
browser tab only, so an administrator can look at a plugin that is deployed
but switched off by configuration without enabling it for anyone else. The
list dies with the tab and is never persisted.
