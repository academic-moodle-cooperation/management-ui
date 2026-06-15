---
"@opencast-mui/plugin-admin-marketplace": patch
---

Fix duplicate React keys for JAR plugin cards in the marketplace dashboard.

A single JAR can ship multiple modules under one `scope` (e.g. an org
JAR may register `app`, `sidebar`, `footer`, and `landing-page` all under
one scope `management_ui_plugin_<org>`). The card
list keyed on `jar:${p.scope}` alone, so those modules collided —
producing `Encountered two children with the same key` warnings and
risking dropped or mis-rendered cards.

The per-module `id` (e.g. `<org>/app`) is the only field the backend
guarantees unique across modules of one JAR — `scope` and the
manifest-level `namespace` are shared. The key now uses `p.id`, falling
back to `${scope}:${index}` for malformed entries that lack an id. The
`jarPlugins` hook type is widened with the optional `id` field it
already carries at runtime.
