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

Its mirror image, **plugin pauses**: `readPluginPauses`, `writePluginPauses`,
`addPluginPause`, `removePluginPause` and `PLUGIN_PAUSES_STORAGE_KEY`. A paused
namespace is enabled on the deployment but skipped by the host in that tab, so
a plugin that fills the same slots can be looked at on its own.

`PLUGIN_API_VERSION` is now `1.2.0`.
