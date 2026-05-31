---
---

Fix scaffolded plugins silently never loading at runtime.

The `create-plugin` template emitted only a **named** export
(`export const <name>Plugin = createPlugin(...)`), but the remote-plugin
loader registers via `module.default`. So a freshly-scaffolded plugin
built and passed its contract test, yet was fetched and then silently
dropped at runtime (never registered, never activated).

Three coordinated changes:

- **Template** (`src/index.ts.tpl`): add `export default <name>Plugin`
  so the loader can pick it up. The named export is kept for
  tests/direct imports.
- **Contract test template** (`src/plugin.contract.test.ts.tpl`): assert
  the module's default export is the plugin object. The old contract
  test imported the named export and tested it in a harness, so it
  passed for a plugin the real loader could never load — this closes
  that gap for every future scaffold.
- **Shell** (`PluginInitializer.tsx`): the `.local-plugins` load batch
  now logs a warning when `loadAndRegister` returns `success: false`
  (matching the JAR-plugin batch). Previously such failures were
  dropped, making "why won't my plugin load?" undebuggable.

Template/scaffold + shell only (no published package code) — empty
changeset records the nature of the change.
