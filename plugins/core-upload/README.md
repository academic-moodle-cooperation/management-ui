# @opencast-mui/plugin-core-upload

Core plugin. Registers the `/upload` route, its sidebar entry, and the upload config slice. Ships with the OSS repo and is enabled by default.

## What it provides

| Extension point | What this plugin registers |
|------|------|
| `apps:definitions` | The `upload` app at `/upload` rendered by `src/App.tsx`. |
| `sidebar:nav-items` | The "Upload" sidebar entry. |
| `app:config:defaults` | Upload's default config slice (`config.plugins.upload`) — merged *below* `config.json`. |

## Configuration

The plugin owns `config.plugins.upload`. Schema and defaults live in [`src/config.ts`](./src/config.ts) via `definePluginConfig` from `@opencast-mui/query`.

Reading values in a component:

```ts
import { uploadConfig } from "./config";
const { workflows, ingestMode } = uploadConfig.use();
```

Full merge order: [`docs/architecture/CONFIGURATION.md`](../../docs/architecture/CONFIGURATION.md).

## Development

```bash
pnpm --filter @opencast-mui/plugin-core-upload test:contract
pnpm --filter @opencast-mui/plugin-core-upload test
```

## See also

- [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md) — plugin-author walkthrough.
- [`AGENTS.md`](../../AGENTS.md) — operational rules.
- [`plugin.json`](./plugin.json) — manifest.
