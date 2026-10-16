---
"@oc-mui/eslint-config": minor
"@oc-mui/ui": patch
---

The wrapper rule now covers drag-and-drop: `@dnd-kit/*` may only be imported by `@oc-mui/ui` itself, everyone else uses `SortableList` from `@oc-mui/ui/components`. Without the rule a plugin could import the library directly and ship its own copy; with it the facade can swap the implementation later without breaking plugins — the same contract `@oc-mui/router`, `@oc-mui/query`, `@oc-mui/i18n` and `@oc-mui/store` already give. `packages/ui` carries the matching self-exemption.
