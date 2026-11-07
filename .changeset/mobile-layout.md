---
"@oc-mui/ui": patch
"@oc-mui/plugin-core": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-core-upload": patch
---

Phone-width layout fixes. The videos table offers its gallery toggle and every table its column menu on phones, where they and the reload button show as icons. Tables keep their empty state, toolbar and pager on screen, and an empty table reads "Page 1 of 1" instead of "Page 1 of -1". The upload page stacks its two columns below `lg`, the create series dialog keeps its selects inside, the landing page starts right below its tabs, and the footer wraps. Page padding is smaller below `md`.
