---
"@oc-mui/eslint-config": patch
---

Ship every rule module the shared config imports. `files` listed `rules/index.js`
but not `rules/no-cross-plugin-config.js` and `rules/no-palette-classes.js`, which
`rules/index.js` imports — so the published 1.1.0 crashed on load for every
consumer outside this workspace (the workspace itself resolved the files from
source and never noticed). No rule changes.
