---
"@oc-mui/plugin-core": minor
---

New extension point `series:create-series:variants`: a plugin registers a `CreateSeriesVariant` (id, label, optional description, icon and `requiredRoles`, and a component that renders the dialog body and footer) to offer another way of creating a series, for example a course-bound series with fixed metadata. The types `CreateSeriesVariant` and `CreateSeriesVariantProps` and the constant `CREATE_SERIES_VARIANTS` are exported.
