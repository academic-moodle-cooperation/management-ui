---
"@oc-mui/eslint-config": minor
"@oc-mui/ui": patch
"@oc-mui/i18n": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-core-series": patch
"@oc-mui/plugin-admin-marketplace": patch
---

The semantic-token theme rule is now lint-enforced, and the codebase is swept clean

New `local/no-palette-classes` ESLint rule (#297): Tailwind raw palette
color classes (`text-gray-900`, `bg-amber-50`, `focus:ring-indigo-600`, …)
are forbidden — they ignore the theme tokens, which is exactly how #279
(unreadable dark-mode inputs) happened. The rule scans all string and
template literals, so class strings in plain `.ts` style maps are covered
too; the shadcn layer keeps its existing lint exemption.

The sweep replaced ~70 palette usages across the table styles, the
marketplace's amber/emerald status colors (→ `warning`/`ok` tokens, whose
theme stability also removes the hand-written `dark:` duplicates), both
table plugins and the language switcher. Three table row-color variants
that are NAMED after fixed colors (`purple`, `dark`, `black`) keep their
values under a reasoned eslint-disable — no semantic equivalent exists and
removing them would break the exported variant type.
