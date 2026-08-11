---
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
---

A failed metadata save is no longer silent

The edit sidebar closed unconditionally right after firing the update
mutation: on failure there was no error toast, the edits were dropped, and
the only difference to a successful save was the missing success toast
(#287). The sidebar now closes only on success; failures show the existing
`changesFailed` toast and keep the panel open with the edits intact, so a
retry saves the same change. The Save button is disabled while the
mutation is in flight.
