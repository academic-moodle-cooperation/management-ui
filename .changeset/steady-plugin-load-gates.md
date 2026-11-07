---
"@oc-mui/plugin-system": patch
---

The shell now honours `config.plugins[<namespace>].enabled: false` for JAR and `.local-plugins` plugins too, as the Config Contract says; it used to apply the switch to bundled plugins only. A plugin switched off this way is no longer fetched, and a tab-scoped preview still passes the switch. These paths now load only declared config plugins (`type: config`, or the `config` namespace) before the rest, so a module that contributes config should declare that type. On the `.local-plugins` path the type comes from the file name (`plugin-<folder>-config.mjs`), not from `plugin.json`. No API change in this package.

README: `validatePluginMetadata` is a hand-written check of the manifest's key constraints, not Zod-backed.
