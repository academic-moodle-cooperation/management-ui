---
"@oc-mui/i18n": patch
"@oc-mui/ui": patch
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-upload": patch
---

Locale files describe the UI that exists (#341), and a dead tsconfig is gone (#326).

Deleted the translation keys with no renderer: the never-shown upload-completion dialog, `upload:access`/`noSeries`/`uploadButton.completed` and the unreachable `upload:noSeriesAvailable` block, the series Studio/Playlist/Episodes action labels (trivially recreated when #108/#109 build those features), the duplicate `muitable-sidebar` tab-label pair, and the footer's Support/Imprint/Privacy labels (`core-footer:help` stays — an org plugin's footer reuses it). Wired the one string that should have been showing: the series empty state's explanatory paragraph (`series:noSeriesAvailable.text`) now renders under the title in both empty states. Also removed `packages/ui/src/components/ui/tsconfig.json` — compiler relaxations consumed by no build, lint, or editor path; the package's stricter tsconfig already checks those files and passes.
