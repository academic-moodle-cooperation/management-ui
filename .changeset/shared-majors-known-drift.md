---
"@oc-mui/plugin-system": patch
---

Document the known drift between `SHARED_RUNTIME_MAJORS` (still 1 for
`@oc-mui/ui`, `@oc-mui/query`, `@oc-mui/ui-config`) and the published 2.x
majors of those packages in the source comment; no runtime change. Plugins
should leave the three names out of `workspaceDependencies` until the table
is lifted with the next host major.
