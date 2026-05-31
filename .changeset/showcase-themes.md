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

The CSS files live in `apps/shell/public/plugins/themes/*.css` so they are
served as **raw `text/css`** at the marketplace's preview URL
(`/management-ui/plugins/themes/<name>.css`) in both dev and the production
build. They're registered in the marketplace's `AVAILABLE_THEMES` under a new
"Showcase" category.

Note: marketplace theme CSS *must* be served as a static file. Files under a
source dir like `plugins/themes/` are returned by Vite as JS modules (dev) or
the SPA `index.html` fallback (build), so injecting them via `<link rel=
stylesheet>` "loads" (200) but applies nothing — which is why marketplace
theme-apply silently did nothing for these (and still does for the existing
`example` theme at `plugins/example/example.css`, tracked separately).

Verified live: applying Oxford Navy via the marketplace's `ThemeLoader.apply`
mechanism (the exact `<link>` injection) flips `--theme-name`/`--primary` and
renders correctly in light and dark.
