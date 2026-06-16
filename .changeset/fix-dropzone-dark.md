---
"@opencast-mui/plugin-core-upload": patch
---

Fix the upload drop area rendering as a white box in dark mode. The dropzone
used `bg-primary-foreground` as its background — but `--primary-foreground` is
the *text/icon color that sits on a primary button* (near-white, for contrast),
not a surface color, so it stayed light in dark mode (and bright in themes
whose primary-foreground is white). Switched to `bg-muted`, the adaptive
surface token the dropzone's other variant already uses, so it follows the
appearance and theme.
