# @oc-mui/vite-config

Shared Vite configurations and custom Vite plugins. Every app, package, and plugin in the workspace builds through a preset from here so build behaviour stays consistent.

## Usage

In an app's `vite.config.ts` (see [`apps/shell/vite.config.ts`](../../apps/shell/vite.config.ts) for the full real-world version):

```ts
import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import { createShellAppViteConfig } from "@oc-mui/vite-config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "../.."), "");
  return createShellAppViteConfig({
    packageName: "shell",
    mode,
    env,
    invokerDir: __dirname,
  });
});
```

In an external community plugin:

```ts
import { createCommunityPluginConfig } from "@oc-mui/vite-config/community-plugin";

export default createCommunityPluginConfig({
  pluginName: "my-plugin",
  entry: "./src/index.ts",
});
```

## Subpath exports

| Subpath | What it provides |
|---------|------------------|
| `@oc-mui/vite-config/base` | `createBaseConfig` — React, Tailwind, common aliases, sourcemaps. |
| `@oc-mui/vite-config` (or `./index`) | `createShellAppViteConfig` plus re-exports of the helpers. |
| `@oc-mui/vite-config/community-plugin` | `createCommunityPluginConfig` — library-mode build for plugins published outside the workspace (CDN/JAR). Externalizes shared modules listed in `@oc-mui/remote-plugin-loader`'s `SHARED_MODULE_NAMES`. |
| `@oc-mui/vite-config/proxy` | Dev-server proxy table for backend endpoints (`/admin-ng`, `/info`, `/graphql`, …). |
| `@oc-mui/vite-config/ports` | Centralised port assignments — `shell` on 3000, `playground` on 3001, etc. Prevents collisions when several dev servers run together. |
| `@oc-mui/vite-config/plugins/fragment-extractor` | Custom Vite plugin: harvests GraphQL fragments from sources so the runtime can register them with the host's fragment registry. |

## Internal Vite plugins

[`src/plugins/local-plugins-dev.ts`](./src/plugins/local-plugins-dev.ts) is the dev-server piece that discovers `.local-plugins/<name>/dist/*.mjs`, serves them at `/local-plugins/<name>/<file>.mjs`, and exposes `/local-plugins/manifest.json` for the shell to load. Detailed write-up in [`docs/plugins/distribution.md`](../../docs/plugins/distribution.md#path-2--local-plugins-dev-only).

[`src/plugins/cold-start-hint.ts`](./src/plugins/cold-start-hint.ts) prints a one-line notice when the shell dev server starts with a cold Vite dependency cache — otherwise the pre-bundle blocks silently for 1–2 minutes and looks like a hang.

## Layer

Core infrastructure. Depends on `@oc-mui/utils` only.

## See also

- [`docs/plugins/distribution.md`](../../docs/plugins/distribution.md) — how the four loading paths use these configs.
- [`packages/tailwind-config/README.md`](../tailwind-config/README.md) — the Tailwind preset wired in here.
