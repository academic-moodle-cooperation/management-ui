---
"@oc-mui/plugin-core": minor
"@oc-mui/plugin-core-episodes": minor
---

New extension point `episodes:table:status-indicators`: a plugin registers an `EpisodeStatusIndicator` (`matches`, `icon`, `tone`, `label`, optional `href`/`target`) and the episodes table shows it in place of the default status icon — in the list view's status column and as the gallery thumbnail overlay — for every row the indicator claims; with an `href` the icon and the thumbnail link to where the state is resolved (the editor, say). This is how a deployment surfaces states `eventStatus` does not carry, such as a processed event that still awaits publication. `@oc-mui/plugin-core` exports the type and the `EPISODE_STATUS_INDICATORS` key and now also documents the existing `episodes:table:actions` slot.

The gallery thumbnail no longer links to an empty `href` when a processed event has no `publishUrl`.
