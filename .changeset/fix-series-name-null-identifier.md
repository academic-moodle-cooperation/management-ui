---
"@oc-mui/plugin-core-episodes": patch
---

Skip the series-name lookup when the episodes route has no series selected.

The episodes app heading resolved a series title via `useMuiGetSeriesNameByIdQuery`
unconditionally, passing an empty string when no series was in scope (the "all
episodes" view, or events that belong to no series). The backend `seriesById`
resolver rejects that with `Identifier cannot be null`, surfacing a
`DataFetchingException` on every load of the route.

The lookup now lives in a dedicated `useSeriesName` hook that stays disabled
(`enabled: Boolean(seriesId)`) until a non-empty series id is available, so no
request is issued for the series-less case.
