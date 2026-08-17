---
"@oc-mui/plugin-system": minor
"@oc-mui/i18n": minor
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
---

Let a plugin supply the label for the sidebar tab it contributes.

The host derived the visible caption from the registration key by string surgery (`acme:exam-recordings` → "Exam Recordings"), so it could never be translated and leaked the internal key naming into the UI. `registerComponent` now accepts an optional `label`: a translation key, following the same convention as `sidebar:nav-items` titles. The host resolves it at render time, so the caption follows a language switch, and it loads the key's namespace itself — the tab's own component may not have mounted yet.

Additive and backwards compatible: registrations without a `label` keep the derived caption. The resolution ships in `@oc-mui/i18n` as `useExtensionLabels` (plus `deriveLabelFromKey`).
