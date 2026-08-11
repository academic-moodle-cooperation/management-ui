---
"@oc-mui/query": patch
---

`definePluginConfig`: partial config slices now merge over the defaults instead of silently doing nothing

Plugin schemas declare required fields, and `validateOrFallback` used to
validate the **raw** `config.json` slice — so an operator who set a single
key failed validation and got every default back, with only a console
warning to show for it (#256). The reader now deep-merges the raw slice on
top of the plugin's registered defaults before validating (objects merge,
arrays replace — the same semantics as every other config layer), so a
partial override behaves as an override. Invalid values still fall back to
the full defaults with the same warning.
