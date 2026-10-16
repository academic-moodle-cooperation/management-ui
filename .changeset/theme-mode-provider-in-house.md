---
"@oc-mui/ui": minor
---

`ThemeModeProvider` no longer wraps `next-themes`; `@oc-mui/ui` ships its own light/dark/system provider and the `next-themes` dependency is gone.

Observable behaviour is unchanged: a `.dark`/`.light` class and the matching `color-scheme` on `<html>`, default `system` that follows the OS preference reactively, the user's choice persisted in `localStorage` under the same key (`theme`) so existing users keep their setting, cross-tab sync, and transitions suppressed while the tokens swap. What changed is that no `<script>` is rendered inside the React tree — React ≥ 19.2 logs "Encountered a script tag while rendering React component" for that, which is what had been holding React at 19.1. The class is applied in a layout effect (before the first React frame paints); the shell's `index.html` additionally applies it before React mounts, so there is no light flash on first paint.

New public export from `@oc-mui/ui/components`: `useThemeMode()` returning `{ theme, resolvedTheme, systemTheme, setTheme }` (plus the `ThemeMode`, `ResolvedThemeMode`, `ThemeModeContextValue` types and the `THEME_MODE_STORAGE_KEY` constant). It is safe to call without a provider. The `Toaster` wrapper now reads the appearance from it.
