---
"@oc-mui/plugin-core-series": minor
"@oc-mui/i18n": minor
---

The create-series dialog is now a shell over `series:create-series:variants`. The plain metadata form became the variant `default`; when a plugin registers further variants the dialog opens with a chooser, and variants whose `requiredRoles` the user lacks are hidden. New config under `plugins.series.seriesTable.createSeries`: `variants.<id>.enabled` / `.order` to hide or reorder single variants (including `default`), and `placement` (`"heading"`, the new default, or `"toolbar"`) for the button, which now sits next to the page heading as a primary action and is also offered in the empty state. The `series` locale gains the chooser strings. The empty state points at the button when one is available (`noSeriesAvailable.createText`); `noSeriesAvailable.text`, also shown on the upload page, no longer sends users to the web interface.
