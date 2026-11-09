---
"@oc-mui/ui": patch
---

Fix a missing React `key` in `MetadataField`'s `MIXED_TEXT` list rendering, which logged a dev-mode warning for every multi-value field (creators, contributors).
