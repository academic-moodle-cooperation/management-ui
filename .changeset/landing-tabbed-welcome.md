---
"@oc-mui/ui": minor
"@oc-mui/i18n": patch
"@oc-mui/plugin-core": patch
---

Redesign the pre-login welcome screen (`DefaultLandingPage`) as a tabbed
editorial launch page with three audience lanes — About, Operations, and
Developers — each with its own layout. Panels share a constant-height grid with
state-driven visibility, so the centered tab bar never shifts and switching is
flash-free.

- **Self-hosted Geist / Geist Mono** become the app-wide default font (set in
  `globals.css`, bundled via `@font-face` — no external/CDN dependency at
  runtime). The indigo brand accent is scoped to the landing via CSS-variable
  overrides so it stays on-brand under any theme.
- New landing copy in **en + de** (informal German); a few additional `lucide`
  icon re-exports from `@oc-mui/ui`.
- A subtle "Star on GitHub" plus a live GitHub-release "what's new" badge
  (cached in `localStorage`, fails silently — no console error offline).
- The core footer (`@oc-mui/plugin-core`) now shows the build version and the
  deployed commit SHA (linked), injected at build time.
