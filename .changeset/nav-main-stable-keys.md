---
"@oc-mui/ui": patch
---

The sidebar no longer shows a navigation entry twice. Entries were keyed by their translated title, and two plugins whose title keys end the same way (for example `nav.title`) shared one placeholder label while their translations loaded, which left a duplicate row behind.
