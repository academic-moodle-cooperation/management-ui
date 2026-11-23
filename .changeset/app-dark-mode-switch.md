---
"@oc-mui/ui": minor
"@oc-mui/ui-config": minor
"@oc-mui/query": minor
---

New `app.darkMode` setting (default `true`). Set it to `false` to keep the UI in the light appearance and hide the Light/Dark/System toggle in the header. `ThemeModeProvider` takes a matching `darkMode` prop, and `useThemeMode()` now reports `darkModeEnabled`; `setTheme` does nothing while dark mode is off.
