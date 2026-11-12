---
"@oc-mui/plugin-admin-marketplace-v2": patch
---

Marketplace v2: the Themes tab no longer lists feature plugins as themes. A deployed or local plugin is offered as an org theme only when the stylesheet at its conventional path sets at least one theme token (`--background`, `--card`, `--primary`, `--sidebar`, `--muted`, `--border`) in `:root` or `.dark`; a plugin's own Tailwind stylesheet at that path is ignored.
