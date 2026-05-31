---
"@oc-mui/plugin-admin-marketplace": patch
---

Add four professional showcase themes for the marketplace, replacing the
"bad examples" with distinct, university-style palettes that each ship both
light (`:root`) and dark (`.dark`) variants using only the standard semantic
tokens:

- **Oxford Navy** — deep navy + warm gold, serif headings (traditional).
- **Modern Slate & Teal** — cool slate neutrals + teal, clean sans (contemporary).
- **Heritage Burgundy** — burgundy/crimson + cream, serif (old-institution).
- **Forest Sage** — forest green + warm stone (natural-sciences / sustainability).

The CSS files live in `plugins/themes/*.css` (the shell's theme glob loads
them when `app.theme` is set) and are registered in the marketplace's
`AVAILABLE_THEMES` under a new "Showcase" category. Verified live: Oxford
Navy applies in both light and dark via `app.theme`, and the preview URLs
serve (HTTP 200).
