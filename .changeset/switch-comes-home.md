---
"@oc-mui/ui": minor
---

`Switch` is a first-class `@oc-mui/ui` primitive; the `@headlessui/react` pass-through is gone.

The package shipped a second complete UI library for exactly one aliased export (`SwitchHeadlessUI`). A radix-based `Switch` now lives next to the other primitives, styled with the semantic tokens, and `@headlessui/react` leaves the dependencies. Removing `SwitchHeadlessUI` is a pre-npm public-surface removal (#277's window): consumers switch to `Switch` — its org-plugin consumer is migrated in the plugins repo counterpart.
