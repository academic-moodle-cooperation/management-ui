---
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/i18n": patch
---

Give the Videos table's icon-only buttons accessible names

The layout toggle and both delete actions rendered bare icons — no
aria-label, no sr-only text — so screen readers announced unnamed buttons
(#254). The layout toggle now carries an sr-only label reflecting the
TARGET state ("Switch to gallery view" / "Switch to list view", new keys
in en+de), and both delete buttons reuse their existing tooltip labels as
sr-only text. The E2E specs drop their icon-class selector workaround and
locate the toggle by role and name — the same information a screen reader
uses.
