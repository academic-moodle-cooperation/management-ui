---
"@opencast-mui/ui": minor
"@opencast-mui/i18n": patch
"@opencast-mui/plugins": patch
"@opencast-mui/plugin-core-upload": patch
---

Dark mode: make the existing dark tokens actually reachable.

The `.dark` token block in `globals.css` was complete but unreachable — no
provider ever applied the `.dark` class. Adds `ThemeModeProvider` and
`ThemeModeToggle` (exported from `@opencast-mui/ui`), wrapping `next-themes`:
default-to-system with a Light/Dark/System header toggle, persisted, applied
as a `.dark` class on `<html>`. The shell mounts the provider at the root and
the core header renders the toggle next to the language switcher.

This is the **appearance axis**, orthogonal to the `app.theme` org branding.
Plugins that use the semantic token utilities (`bg-background`,
`text-foreground`, …) get dark mode for free; `docs/plugins/styling.md` gains
a "Dark mode" section explaining the contract. Toggle labels are i18n'd
(`common.appearance.*`, en + de).

Also fixes the default-theme dark-mode regressions that this surfaced — all
hardcoded palette colors that ignored the tokens: the data-table border/body
text/dividers (`border-gray-*`, `text-gray-600`, `divide-gray-*` →
`border-border`/`text-foreground`/`divide-border`), the empty-state icons
(`text-gray-400`), the logo "M" (`text-white` → `text-primary-foreground`, so
it's no longer white-on-white in dark), and the upload action bar
(`bg-white` → `bg-background`).
