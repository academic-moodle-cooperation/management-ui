---
"@oc-mui/query": minor
---

The playlist entry fragment (`MuiPlaylistEntryData`) now selects the event's
`startDate` and `created` as well, so a playlist UI can show when each
entry was recorded and offer "order by recording date". Additive: existing
consumers of `MuiPlaylistDataFragment` / `MuiGetPlaylistByIdQuery` see two
new nullable fields on the entry's `event`.
