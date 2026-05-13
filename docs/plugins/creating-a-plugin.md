# Creating a plugin

This is the walkthrough for plugin authors. For the canonical authoring rules — manifest fields, extension-point list, contract-test template — see [`AGENTS.md`](../../AGENTS.md). For stability guarantees see [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md).

## Where plugins live

| Location | When to use |
|----------|-------------|
| `plugins/<name>/` | A built-in plugin shipped with this repo. Reviewed in PR, lives in this monorepo, ships in releases. |
| `.local-plugins/<name>/` | An org or community plugin. Its own git repo, mounted into this workspace at dev time. Gitignored from this repo. |

Both follow the same layout and contract. The decision is "do I want this in the OSS release or do I own it elsewhere".

## Scaffold

```bash
# Org / community plugin (default — under .local-plugins/)
pnpm create-plugin my-plugin

# Built-in plugin (under plugins/, ships with the repo)
pnpm create-plugin my-plugin --in-tree
```

The CLI writes the full layout plus a working `app:header-logo` placeholder so `pnpm test:contract` passes on first run. Replace the placeholder, update `plugin.json`'s `extensionPoints`, and you have a real plugin.

## Anatomy

```
my-plugin/
├── plugin.json          # Manifest 1.1 (id, name, version, namespace, extensionPoints, ...)
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts                  # createPlugin({ ... })
    ├── plugin.contract.test.ts   # the required contract test
    └── ...                       # your plugin code
```

### The entry point

```ts
import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

export const myPlugin = createPlugin({
  namespace: "my-namespace", // kebab-case, matches plugin.json
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register everything here, NOT in activate().
    manager.registerObject("apps:definitions", "my-app", {
      // route + component
    });
  },

  activate() { /* one-time side effects */ },
  deactivate() { /* clean up the side effects */ },
});
```

**The registration rule:** every `manager.registerObject(...)` call goes in `initialize()`. `activate()` and `deactivate()` are for side effects only (logging, subscribing). The test harness re-registers between tests; registering in `activate()` means the second test sees nothing.

### The manifest (`plugin.json`)

Every extension point your `initialize()` touches must also appear in `plugin.json`'s `extensionPoints` array. The contract test fails when an entry is declared but not populated. Lint fails when a key collides with another plugin's.

See [`AGENTS.md` → Plugin layout](../../AGENTS.md#plugin-layout-canonical) for the full required-fields list.

### The contract test

Required. Copy [`packages/plugin-testing/README.md`](../../packages/plugin-testing/README.md)'s template, change only the import line. The harness checks:

- The plugin activates cleanly.
- Every extension point declared in `plugin.json` is actually populated.
- No errors or warnings during activation.
- `i18n` locales (if shipped) have matching key sets.

Run it with:

```bash
pnpm --filter @oc-mui/plugin-my-plugin test:contract
```

## Extension points you'll touch most

| Point | What you register | Example |
|-------|-------------------|---------|
| `apps:definitions` | A route + component the shell mounts under `/<routePath>` | `plugins/core-episodes/src/index.ts` |
| `sidebar:nav-items` | Left-nav entry | same file |
| `app:config:defaults` | A `Partial<AppConfig>` slice merged below `config.json` | `plugins/core-*/src/config.ts` |
| `app:header-logo` | An `{ src, alt, href, width, height }` object | `plugins/example/` |

The full set is documented at the registration sites and in [`@oc-mui/plugin-system`](../../packages/plugin-system/README.md).

## Configuration

A plugin gets its own slice of `AppConfig` at `config.plugins[id]`. Declare the slice with a Zod schema:

```ts
import { z } from "zod";
import { definePluginConfig } from "@oc-mui/query";

const schema = z.object({
  apiEndpoint: z.string().url(),
  pageSize: z.number().int().positive().default(20),
});

export const myPluginConfig = definePluginConfig({
  id: "my-plugin",     // matches plugin.json `id`
  schema,
  defaults: { pageSize: 20 },
});
```

Use `myPluginConfig.use()` in components, `myPluginConfig.read()` in event handlers. Reading another plugin's slice is forbidden; lint catches it.

Full layer model and reader API: [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md).

## Styling

Use semantic tokens — see [`plugins/styling.md`](./styling.md). No hardcoded colors. No `!important`.

## i18n

- Declare namespaces in `plugin.json`'s `i18nNamespaces` array.
- Locale files at `<plugin>/locales/<namespace>/<locale>.json`.
- Reference keys with `t("namespace:key")` via `useTranslation` from `@oc-mui/i18n`.

The contract test's `expectI18nKeyParity` fails when locale files drift apart.

## Development loop

For an in-tree plugin (`plugins/<name>/`), the shell's Vite build picks it up automatically:

```bash
pnpm --filter @oc-mui/shell dev
```

Add your plugin's id to `app.enabledPlugins` in your config and visit the route you registered on `apps:definitions`.

For a `.local-plugins/` plugin, build the plugin once so the loader can find its `dist/`:

```bash
pnpm --filter @oc-mui/plugin-my-plugin build
pnpm --filter @oc-mui/shell dev
```

Iterate on the plugin in watch mode:

```bash
pnpm --filter @oc-mui/plugin-my-plugin dev
```

## Pre-flight check

Before opening a PR (in-tree) or releasing (community):

```bash
pnpm verify
```

That runs lint, type-check, unit tests, contract tests, API check, and a Playwright smoke against the shell — about 90 turbo tasks. If it's red locally it'll be red in CI.

If you changed a public `@oc-mui/*` API, also run `pnpm api-check` and commit the regenerated `etc/<pkg>.api.md` plus a changeset. See [`operations/release.md`](../operations/release.md).

## When the plugin grows up

If you started with an in-tree plugin and want to graduate it to its own repository (so an org can ship it independently), see [`distribution.md`](./distribution.md).

## See also

- [`AGENTS.md`](../../AGENTS.md) — canonical authoring rules and the pre-flight checklist.
- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md) — manifest, runtime API, theme, and config contracts with stability guarantees.
- [`distribution.md`](./distribution.md) — packaging, publishing, JAR deployment.
- [`testing.md`](./testing.md) — beyond the contract test.
- [`packages/plugin-testing/README.md`](../../packages/plugin-testing/README.md) — full harness API.
