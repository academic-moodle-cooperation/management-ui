---
"@oc-mui/i18n": minor
"@oc-mui/ui": patch
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-upload": patch
---

Translate the strings that stayed English (and one German) regardless of the selected language, and format dates in the active language.

- `@oc-mui/i18n` gains `formatDate` / `activeDateLocale`. Six call sites built `new Intl.DateTimeFormat("de-DE", …)` themselves, so every date was German whatever the UI language was; they now share one helper that reads the active language and returns an empty string for unusable input instead of throwing inside a table cell.
- `@oc-mui/i18n` also gains `setUserLanguage` / `getUserLanguage` / `applyConfiguredLanguage`. `app.locale` was declared in the config contract but nothing read it; it is now applied as the deployment's default language, with an explicit user choice remembered and taking precedence.
- Filter reset, "More actions", the ACL editor's update button, login/logout, the series upload action, the sidebar metadata tab, the upload list's remove control and file size, and the series-picker placeholder now go through `t(...)`. New keys ship in both shipped locales.
- The row-total counter in the data-table pagination bar was rendered only when there was nothing to count, which also left the page controls stranded at the left edge of the row.
- The sidebar tab strip sized itself for exactly two tabs; the column count now follows the number of tabs actually rendered, so a second plugin-contributed tab no longer breaks the layout.
