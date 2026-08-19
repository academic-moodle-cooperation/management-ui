---
"@oc-mui/ui": minor
"@oc-mui/plugin-core-episodes": minor
"@oc-mui/plugin-core-series": minor
---

Series column labels work, and the gallery's combined cells become a configuration choice.

- The per-column config semantics (order + default visibility, `label`/`labelKey` overrides) now live in `@oc-mui/ui` (`normalizeColumnConfigs`, `getColumnLabelOverrides`, `resolveColumnLabel`, `resolveColumnMeta`, `getColumnVisibilityDefaults`) and both tables use them. The series table previously declared `labelKey` in its schema but never consumed it — a silent config no-op; it now resolves labels exactly like the episodes table, including loading org-plugin namespaces (#372).
- The episodes gallery's column pool now carries both presentations: the combined cells get stable config ids (`video`, `dateAndLocation` — they keep sorting by their primary content), a standalone `thumbnail` column arrives, and every single-value list column is available (hidden by default). One deployment keeps the combined look, another splits it into single columns, purely via `views.gallery.columns` (#373). **Config note:** gallery configs that addressed the combined cells as `title`/`startDate` must use `video`/`dateAndLocation` now.
- The tables' persisted column-visibility store starts empty instead of seeding `{ title: true }` — the seed counted as a user choice and pinned the title column against the config defaults.
