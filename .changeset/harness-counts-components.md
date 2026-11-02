---
"@oc-mui/plugin-testing": patch
---

`expectRegistered` / `expectAllManifestRegistrationsSucceed` now also count
components registered with `registerComponent`. They only looked at the
object registry, so a plugin that populates an extension point with a React
component — an actions cell, a header slot — could not list that point in
`plugin.json` without failing its contract test.
