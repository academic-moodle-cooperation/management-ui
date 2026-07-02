---
"@oc-mui/plugin-core-episodes": patch
---

Fix a stored XSS in the episode delete-confirmation dialog. The dialog renders a
translated string as HTML (for its static `<strong>` emphasis) and interpolated
the user-controlled event title into it unescaped, because i18n runs with
`escapeValue: false` globally. A crafted event title (e.g. containing an `<img
onerror=…>`) would execute in the session of any user opening the delete dialog.
The title is now escaped for this interpolation while the trusted static markup
is preserved.
