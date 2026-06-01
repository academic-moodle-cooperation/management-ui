---
---

Docs: document `replacesJarScopes` in `docs/plugins/distribution.md`. The
manifest field exists in the schema and the loader (it makes the dev
shell skip a deployed JAR plugin in favour of a local `.local-plugins/`
build of the same plugin), but was undocumented — so a developer mounting
a plugin locally while pointed at a backend that already ships it as a
JAR sees a duplicate in the marketplace and a confusing
`Plugin URL returned HTML (404 or SPA fallback)` console error.

Adds a "Developing a plugin that's also deployed as a JAR" subsection
under Path 2 explaining the error, the `replacesJarScopes` fix (with a
`plugin.json` example), where to find the JAR scope, and that it's
dev-only metadata with no production effect.

Docs-only.
