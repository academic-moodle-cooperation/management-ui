---
"@oc-mui/plugin-core-episodes": minor
"@oc-mui/plugin-core-series": minor
---

Table column config now sets defaults instead of removing columns (#80).

A deployment's `columns` config used to *remove* everything it didn't list with `show: true` — removed columns vanished from the View menu too, so a user could never bring them back ("Spalten ein-/ausblenden funktioniert nicht"). The config now orders the columns it names and sets their *default* visibility (listed → their `show` flag, unlisted → hidden when a config exists); every column stays in the table and the View menu, and the user's own toggles win over the defaults and persist.

The episodes table additionally loads the i18n namespaces of configured `labelKey`s, so a column label from an org plugin's namespace translates instead of showing the raw key ("labelkey funktioniert nur für core plugin").
