---
"@oc-mui/eslint-config": minor
"@oc-mui/query": patch
"@oc-mui/plugin-core-episodes": patch
"@oc-mui/plugin-admin-marketplace": patch
---

The config-slice boundary is mechanical now: the new `local/no-cross-plugin-config` rule flags any raw read of an AppConfig's `plugins` map (`useAppConfig().config.plugins[...]`, `config?.plugins?.[id]`), pointing at the `definePluginConfig` reader instead. The infrastructure that legitimately touches the raw map (the reader itself, the config-merge tests, route protection, the shell's loader and router provider) is enumerated as ignores next to the rule's wiring. The "no lint rule catches this yet, so reviews enforce it" comments across the workspace now name the rule.
