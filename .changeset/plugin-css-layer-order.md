---
"@oc-mui/ui": minor
"@oc-mui/remote-plugin-loader": patch
---

Make the `plugins` cascade layer actually take effect, and place it where it is safe: between Tailwind's `base` and `utilities` (Theme Contract 2.1).

Two defects, one visible symptom (a remote plugin's landing page rendered without vertical padding, margins or heading size on deployments whose host build never generated those classes):

- `@oc-mui/ui/postcss.config` loaded `@tailwindcss/postcss` pinned to a 2024 alpha (`0.0.0-oxide.4`). Vite picked that config up automatically, so the alpha ran in addition to `@tailwindcss/vite` and rewrote the compiled `@layer` statement, hoisting `plugins` below `base` — Tailwind's preflight reset then overrode every plugin utility. The alpha dependency is removed, the shell and playground ship no PostCSS config, and `@oc-mui/ui/postcss.config` stays as a deprecated empty config for one major cycle.
- The declared order (`plugins` after `utilities`) was never in effect and is unsafe: a plugin ships a complete Tailwind sheet, and its plain `.hidden` would beat the host's `md:block` on the sidebar wrapper. The new order `theme, base, plugins, components, utilities` lets plugin utilities beat preflight while host utilities keep precedence on class-name collisions; a plugin escalates its own responsive variants with Tailwind's `!` modifier. Documented in `docs/extend/styling.md`; the loader's comment follows.
