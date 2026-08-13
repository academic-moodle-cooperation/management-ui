# Building a plugin

For plugin developers past the scaffold. Afterwards your plugin reads its own validated config slice, ships a translated string, and you know which page to open for everything else.

This is the guided tour. The canonical rules — manifest fields, boundaries, pre-flight checklist — live in [`AGENTS.md`](../../AGENTS.md), the stability guarantees in [`CONTRACTS.md`](../architecture/CONTRACTS.md).

## Scaffold

```bash
pnpm create-plugin <name> [--template <minimal|app>] [--in-tree] [--no-pom] [--no-install]
```

`.local-plugins/<name>/` is the default and the right home for an org or community plugin — its own git repo, mounted into this workspace at dev time, gitignored. `--in-tree` puts it under `plugins/<name>/` instead, for a built-in shipped with this repo. `--no-pom` skips the `backend/` Maven layout (CDN-only plugins), `--no-install` the automatic `pnpm install`. Generator: [`scripts/create-plugin.mjs`](../../scripts/create-plugin.mjs).

## The entry point — three rules

```ts
export const myPlugin = createPlugin({
  namespace: "my-plugin",              // kebab-case, matches plugin.json's `namespace` and `id`
  type: "app",
  version: "1.0.0",
  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "my-app", { /* route + component */ });
  },
  activate() { /* one-time side effects only */ },
  deactivate() { /* clean them up */ },
});
export default myPlugin;
```

1. **Every `registerObject` call goes in `initialize()`**, never `activate()` — the harness re-registers between tests, so registering in `activate()` makes the second test see nothing.
2. **`export default` is mandatory.** The remote loader registers via `module.default`; a named-only export builds fine and is then silently never loaded. The scaffolded contract test catches it.
3. **Every point you register on is declared in `plugin.json`'s `extensionPoints`.** The contract test fails on declared-but-unpopulated entries.

## Extension points

`apps:definitions` (route + component) and `sidebar:nav-items` (the left-nav entry linking to it) are the pair that puts a screen on the map; `app:config:defaults` carries your config slice. `app:header-logo` is the minimal scaffold's placeholder and is **not rendered by the default shell** — swap it for `apps:definitions` for anything visible.

Header actions, footer slots, table-row detail panels, and the upload and ACL editors are catalogued in [`plugins/core/README.md`](../../plugins/core/README.md); the `AppDefinition` fields beyond the required four are in [`AGENTS.md`](../../AGENTS.md#extension-points--the-four-youll-usually-touch).

## A config slice your deployment can override

A plugin owns exactly one slice at `config.plugins.<id>`, declared once with a Zod schema. Never read another plugin's slice, and never reach into your own via raw `config.plugins[...]` — always go through the reader. Continuing the `hello` plugin from [Your first plugin](./first-plugin.md). The scaffold ships neither dependency, so add them first:

```bash
pnpm --filter @oc-mui/plugin-hello add zod "@oc-mui/query@workspace:*"
```

```ts
// src/config.ts
import { z } from "zod";
import { definePluginConfig } from "@oc-mui/query";

export const helloConfig = definePluginConfig({
  id: "hello",                                        // matches plugin.json `id`
  schema: z.object({ greeting: z.string().optional() }),
  defaults: { greeting: "Hello from the defaults" },
});
```

Call `helloConfig.register(manager)` in `initialize()`, add `"app:config:defaults"` to `extensionPoints`, and read the slice with `helloConfig.use()` in a component (`read(config)` outside React). Rebuild and reload: the heading shows the default. Now put `"plugins": { "hello": { "greeting": "Hello from config.json" } }` in the served `config.json` and reload again — it changes. Defaults from the plugin, overrides from the deployment, validated by your schema. Layer model, merge semantics, and what an invalid value does: [`CONFIGURATION.md`](../architecture/CONFIGURATION.md).

## A translated string

`@oc-mui/i18n` is not in the scaffold either — add it the same way:

```bash
pnpm --filter @oc-mui/plugin-hello add "@oc-mui/i18n@workspace:*"
```

Then add `"i18nNamespaces": ["hello"]` to `plugin.json`, put `locales/hello/en.json` and `locales/hello/de.json` next to it, and read keys with `usePluginTranslation(["hello"])`. The contract test's key-parity check now covers your locales. Multi-module layouts and the dev-loop quirks: [Translations](./i18n.md).

## The dev loop, and then what

`pnpm dev` is the whole loop. It runs `turbo run dev`, which starts the shell **and** the watch build of every workspace package that has a `dev` script — including each `.local-plugins/*` plugin, whose bundle the shell then serves from `dist/`. Don't also run `pnpm --filter @oc-mui/plugin-hello dev` alongside it: that's a second watcher writing the same `dist/`. Use the filtered command only when you want the plugin watcher *without* the shell. In-tree plugins skip the plugin build — the shell's Vite build compiles them directly.

- [Styling](./styling.md) — semantic tokens and `@oc-mui/ui` components. No hardcoded colors (lint-enforced); dark mode comes free if you comply.
- [Testing a plugin](./testing.md) — the required contract test, and what your unit tests should cover.
- [Add a GraphQL field](./graphql-field.md) — when the data you need isn't in the schema yet. Operation names carry your namespace as a PascalCase prefix, lint-enforced: [`CONTRACTS.md` § GraphQL Operation Naming](../architecture/CONTRACTS.md#6-graphql-operation-naming).
- [Distribution](./distribution.md) — dev mount, in-tree, JAR, or CDN.

Before a PR or a release, work through the pre-flight checklist in [`AGENTS.md`](../../AGENTS.md#tldr--pre-flight-checklist) and run `pnpm verify`.
