---
"@oc-mui/plugin-core-episodes": minor
---

Add `episodesTable.showScheduled` to the episodes config (default `true`). Set it to `false` to hide events that are still scheduled (not recorded yet) from the episodes table, for deployments that list upcoming recordings elsewhere. The rows are filtered per page in the browser, since Opencast has no server-side filter that excludes a status.
