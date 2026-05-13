# Configuration

Quick reference for what the shell reads, where each piece comes from, and how plugins consume their slice. The full layer model with merge rules and edge cases lives in [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — this page is the practical version.

## The shape

```jsonc
{
  "app": {
    "theme": "default",
    "locale": "en",
    "enabledPlugins": ["core", "admin", "episodes", "series", "upload"]
  },
  "auth": {
    "method": "oc-shibboleth"
  },
  "plugins": {
    "episodes": { "pageSize": 50 },
    "series":   { "pageSize": 25 },
    "upload":   { "workflows": ["schedule-and-upload-from-archive"] }
  }
}
```

- **`app.*`** — top-level shell settings. Stable keys: `theme`, `locale`, `enabledPlugins`.
- **`app.enabledPlugins`** — the **ship filter**. Only namespaces listed here load at all. To prevent a plugin from running, remove its namespace.
- **`plugins[id]`** — per-plugin slice. Each plugin owns the sub-shape; the shell just persists it.
- **`plugins[id].enabled: false`** — the **runtime switch**. The plugin loads but skips activation. Use this when you want a plugin available but currently off.

## Where values come from (merge order)

```
app:config:defaults     ← plugin defaults (via app:config:defaults extension point)
       ⊕
base config             ← what the host ships in apps/shell/public/config.json
       ⊕
app:config              ← config plugin's overlay (via app:config extension point)
```

Higher in the list = lower precedence. The `app:config` overlay wins, so an org config plugin can override anything in `config.json`, and `config.json` can override plugin defaults.

Plugin defaults are contributed through `definePluginConfig({ id, schema, defaults })` from `@oc-mui/query` — see [`packages/query/`](../../packages/query/).

## Reading config

### In a plugin component

```ts
import { episodesConfig } from "./config";

const { pageSize } = episodesConfig.use();   // reactive
```

### In an event handler / non-React code

```ts
const { pageSize } = episodesConfig.read();  // sync snapshot
```

### Reading the merged app config

```ts
import { useAppConfig } from "@oc-mui/query";

const { config } = useAppConfig();
const theme = config.app.theme;
```

Reading **another plugin's slice** (`config.plugins["other-plugin"]`) is forbidden — `@oc-mui/eslint-config` catches it.

## Writing your own plugin config

```ts
import { z } from "zod";
import { definePluginConfig } from "@oc-mui/query";

const schema = z.object({
  apiEndpoint: z.string().url(),
  pageSize: z.number().int().positive().default(20),
});

export const myPluginConfig = definePluginConfig({
  id: "my-plugin",
  schema,
  defaults: { pageSize: 20 },
});
```

Then register the defaults so they flow into the merge:

```ts
manager.registerObject("app:config:defaults", "my-plugin", {
  plugins: { "my-plugin": { pageSize: 20 } },
});
```

The Zod schema is used at runtime to validate the merged slice. Invalid values are rejected with a clear error.

## Where the host's `config.json` comes from

`apps/shell/public/config.json` ships a sensible default. Production deployments mount their own `config.json` over the bundled one at the same path; no rebuild required. Orgs typically ship a tiny `.local-plugins/<org>-config/` plugin that registers an `app:config` overlay — this lets them override values across deployments without editing a JSON file.

## Theme & locale

- **`app.theme`** picks a theme CSS file from the shell's theme directory (`apps/shell/src/themes/`) or from any plugin's theme registration. Plugins ship theme tokens as CSS variable overrides — see [`docs/plugins/styling.md`](../plugins/styling.md).
- **`app.locale`** picks the active i18next language. Plugins ship locale files under `<plugin>/locales/<namespace>/<lng>.json` and declare `i18nNamespaces` in `plugin.json`.

## See also

- [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — full layer model.
- [`architecture/CONTRACTS.md`](../architecture/CONTRACTS.md#4-config-contract) — what's frozen.
- [`packages/query/`](../../packages/query/) — `definePluginConfig` reader API.
- [`plugins/creating-a-plugin.md`](../plugins/creating-a-plugin.md#configuration) — plugin author entry point.
