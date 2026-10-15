---
"@oc-mui/query": patch
---

The 19 line's committed GraphQL schema is now taken from an Opencast 19 instance. It had been refreshed from an Opencast 20 server when the committed-schema mechanism landed, so the line carried types for an API its backend does not have — the playlist types among them. Regenerating from Opencast 19 removes those generated base types (`Playlist`, `PlaylistEntry`, `CurrentUserMyPlaylistsArgs`, …) from the package surface; no hook or fragment on this line used them, and nothing on this line could have, so this is a correction of the snapshot rather than a behaviour change. The sortable/filterable field lists for events and series are identical on both majors.
