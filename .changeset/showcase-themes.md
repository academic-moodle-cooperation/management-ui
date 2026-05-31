---
"@oc-mui/plugin-admin-marketplace": patch
---

Add four professional showcase themes for the marketplace, replacing the
"bad examples". Each is a **distinct design language** — not just a recolor —
varying color, typography, radius, shadows and spacing, and shipping both
light (`:root`) and dark (`.dark`) using only the standard semantic tokens:

- **Oxford Navy** — navy + gold, serif headings, sharp `0.25rem` radius, crisp shadows (editorial/formal).
- **Modern Slate & Teal** — slate + teal, geometric sans, soft `0.875rem` radius, diffused shadows, airy spacing (SaaS).
- **Heritage Burgundy** — burgundy + cream, elegant serif (Palatino), `0.375rem` radius, minimal shadows, generous spacing (luxe).
- **Forest Sage** — forest green + stone, rounded humanist sans (Trebuchet), round `1.25rem` radius, soft shadows (organic/calm).

Typography uses **system font stacks only** — no web fonts — to stay GDPR-safe
and work offline. The structural variety also folds in what the old
".local-plugins" demo themes (compact/rounded/minimal/warm) used to show.

The registry is cleaned up: the six `.local-plugins` entries (tuwien, univie,
compact, rounded, minimal, warm) are removed — they pointed at a private repo,
only worked in dev, and broke in a build. The shipped registry now lists only
themes that actually apply everywhere: the four showcases + the example.

The CSS files live in `apps/shell/public/plugins/themes/*.css` so they are
served as **raw `text/css`** at the marketplace's preview URL
(`/management-ui/plugins/themes/<name>.css`) in both dev and the production
build. They're registered in the marketplace's `AVAILABLE_THEMES` under a new
"Showcase" category.

Note: marketplace theme CSS *must* be served as a static file. Files under a
source dir like `plugins/themes/` are returned by Vite as JS modules (dev) or
the SPA `index.html` fallback (build), so injecting them via `<link rel=
stylesheet>` "loads" (200) but applies nothing — which is why marketplace
theme-apply silently did nothing. The shipped **`example`** theme had the same
bug; it's moved to `public/plugins/themes/example.css` too.

The shell's config (`app.theme`) loader is updated to resolve a theme by
**probing candidate URLs and checking the `content-type` is CSS** before
injecting — `<link>` `onerror` can't be used because the SPA returns `200`
`index.html` for missing paths. So both the marketplace path *and*
`app.theme` now apply these themes, in dev and build.

Verified live: Oxford Navy applies via the marketplace's `ThemeLoader.apply`
mechanism **and** via `app.theme` in `config.json` — both flip
`--theme-name`/`--primary` and render correctly in light and dark.
