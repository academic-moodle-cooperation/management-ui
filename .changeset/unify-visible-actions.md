---
"@oc-mui/plugin-core-episodes": patch
---

Both Videos views show the same three direct actions

The list view showed four direct actions (incl. Download) while the
gallery showed three, hiding Download and Delete behind the overflow menu
(#42). The list now matches the gallery: edit-data, edit-video and play
stay direct; Download and the delete actions live in the "More actions"
menu in both views.
