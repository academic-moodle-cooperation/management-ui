---
"@oc-mui/plugin-system": patch
"@oc-mui/eslint-config": patch
---

Internal refactor with no public API change.

- `packages/plugin-system/src/plugins/` → `packages/plugin-system/src/builtins/`.
  The directory holds the three host plugins (`objectRegistry`, `appRegistry`,
  `renderer`) that the plugin-system always registers. Naming it `plugins/`
  was an internal-name collision with the top-level `plugins/` directory and
  forced a `mode: "full"` + `**/*` workaround in the boundaries rule.
- `@oc-mui/eslint-config` boundaries config simplified back to the cleaner
  `mode: "folder"` + bare patterns, and gains an expanded comment block
  documenting the known upstream/tooling limitations (root-path requirement,
  v5 selector syntax, workspace-import resolver gap) so future readers don't
  re-discover them.

The exported runtime API of `@oc-mui/plugin-system` is unchanged.
Consumers of `@oc-mui/eslint-config` see no rule-behaviour change.
