---
"@oc-mui/plugin-core-episodes": patch
---

Fix "Error loading episodes" when sorting the description, contributors,
or duration columns. The episodes table showed sort controls on these
three columns, but Opencast's `EventOrderByInput` doesn't accept them as
sort fields — clicking the control sent an invalid `orderBy` variable and
the query failed.

Marked all three columns `enableSorting: false`. `DataTableColumnHeader`
already renders a plain (non-interactive) label when a column can't sort,
so the misleading sort buttons disappear too.

Series is unaffected — `SeriesOrderByInput` does include description and
contributors, so those columns stay sortable there. The asymmetry is a
backend schema decision (events and series support different sort fields),
not something the UI controls.
