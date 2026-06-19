# @oc-mui/vite-config

Shared Vite configurations and custom Vite plugins. Every app, package, and plugin in the workspace builds through a preset from here so build behaviour stays consistent.

## Usage

In an app or package `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { shellConfig } from "@oc-mui/vite-config";

export default defineConfig(shellConfig({ /* overrides */ }));
```

In an external community plugin:

```ts
import { defineConfig } from "vite";
import { communityPluginConfig } from "@oc-mui/vite-config/community-plugin";

export default defineConfig(communityPluginConfig({
  entry: "src/index.ts",
  name: "my-plugin",
}));
```

## Subpath exports

| Subpath | What it provides |
|---------|------------------|
| `@oc-mui/vite-config/base` | `baseConfig` — React, Tailwind, common aliases, sourcemaps. |
| `@oc-mui/vite-config` (or `./index`) | The shell config plus re-exports of the helpers. |
| `@oc-mui/vite-config/community-plugin` | `communityPluginConfig` — library-mode build for plugins published outside the workspace (CDN/JAR). Externalizes shared modules listed in `@oc-mui/remote-plugin-loader`'s `SHARED_MODULE_NAMES`. |
| `@oc-mui/vite-config/proxy` | Dev-server proxy table for backend endpoints (`/admin-ng`, `/info`, `/graphql`, …). |
| `@oc-mui/vite-config/ports` | Centralised port assignments — `shell` on 3000, `playground` on 3001, etc. Prevents collisions when several dev servers run together. |
| `@oc-mui/vite-config/plugins/fragment-extractor` | Custom Vite plugin: harvests GraphQL fragments from sources so the runtime can register them with the host's fragment registry. |

## Internal Vite plugins

[`src/plugins/local-plugins-dev.ts`](./src/plugins/local-plugins-dev.ts) is the dev-server piece that discovers `.local-plugins/<name>/dist/*.mjs`, serves them at `/local-plugins/<name>/<file>.mjs`, and exposes `/local-plugins/manifest.json` for the shell to load. Detailed write-up in [`docs/plugins/distribution.md`](../../docs/plugins/distribution.md#path-2--local-plugins-dev-only).

## Layer

Core infrastructure. Depends on `@oc-mui/utils` only.

## See also

- [`docs/plugins/distribution.md`](../../docs/plugins/distribution.md) — how the four loading paths use these configs.
- [`packages/tailwind-config/README.md`](../tailwind-config/README.md) — the Tailwind preset wired in here.
