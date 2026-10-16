---
"@oc-mui/query": minor
---

Typed playlist operations. `@oc-mui/query` now ships generated hooks for the Opencast 20 playlist API: `useMuiGetMyPlaylistsQuery`, `useMuiGetPlaylistByIdQuery`, `useMuiCreatePlaylistMutation`, `useMuiUpdatePlaylistMetadataMutation`, `useMuiUpdatePlaylistEntriesMutation`, `useMuiUpdatePlaylistAclMutation` and `useMuiDeletePlaylistMutation`, plus the `MuiPlaylistData` / `MuiPlaylistEntryData` fragments and `PLAYLIST_SORTABLE_FIELDS`. The update mutations are split per concern because the backend applies `updatePlaylist` as a patch — a caller can change the entry order without touching the ACL, and vice versa. Against an Opencast 19 backend these operations fail with a "cannot query field" error; consumers must gate on backend support.
