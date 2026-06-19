---
"@oc-mui/query": minor
"@oc-mui/ui": minor
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
---

Derive table column sortability from the GraphQL schema instead of
hardcoding it per column.

Replaces the per-column `enableSorting: false` band-aid (which silently
drifts — add a column, forget the flag, reintroduce the "/episodes sort"
bug) with a schema-driven mechanism:

- `@oc-mui/query` now exports `EVENT_SORTABLE_FIELDS` and
  `SERIES_SORTABLE_FIELDS` (+ the `EventSortableField` /
  `SeriesSortableField` types). These runtime arrays are the source of
  truth for which fields the backend accepts in `EventOrderByInput` /
  `SeriesOrderByInput`. Compile-time assertions (`satisfies` for
  validity + an `Exclude`-based completeness check) keep them provably
  in sync with the generated types — change the schema, run codegen, and
  any drift surfaces as a type error.

- `@oc-mui/ui` now exports `restrictSortingToFields(columns,
  sortableFields)` — flips `enableSorting: false` on any column whose
  field isn't in the list, while respecting columns that set
  `enableSorting` explicitly. `DataTableColumnHeader` already renders a
  plain label when a column can't sort, so disabled columns lose their
  sort button too.

- `core-episodes` and `core-series` apply the helper at the end of their
  column factories. Episodes' description/contributors/duration columns
  (the original bug) are now disabled automatically; series resolves a
  long-standing `TODO: Enable sorting when backend provides sortable
  column metadata` the same way.

Fixes the "/episodes" sort crash: clicking sort on description,
contributors, or duration sent an `orderBy` field the backend rejects
("field name 'description' is not defined for input object type
'EventOrderByInput'").
