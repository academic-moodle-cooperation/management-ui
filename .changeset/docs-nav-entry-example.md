---
---

Docs: add a concrete, copy-pasteable "screen + sidebar entry" worked
example to `docs/plugins/creating-a-plugin.md`, modelled verbatim on
`plugins/core-upload/src/index.ts` (so it actually renders). Covers the
`apps:definitions` + `sidebar:nav-items` pair — the most common plugin
shape — plus the mandatory `export default` and the `AppDefinition`
field reference.

Also corrects two inaccuracies that caused real confusion: the
"extension points you'll touch most" table now points `apps:definitions`
/ `sidebar:nav-items` at `core-upload` (a clean reference) and flags that
`app:header-logo` is **declared but not rendered** by the default shell
(it's only the scaffold's contract-test placeholder). The same note is
added to `plugins/core/README.md`'s extension-point table.

Docs-only.
