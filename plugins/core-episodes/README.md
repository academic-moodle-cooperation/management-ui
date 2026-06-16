# @opencast-mui/plugin-core-episodes

Core plugin. Registers the `/episodes` route, its sidebar entry, and the episodes config slice. Ships with the OSS repo and is enabled by default.

## What it provides

| Extension point | What this plugin registers |
|------|------|
| `apps:definitions` | The `episodes` app at `/episodes` rendered by `src/App.tsx`. |
| `sidebar:nav-items` | The "Episodes" sidebar entry (icon: `Film`, order 30). Requires `episodes.view` permission. |
| `app:config:defaults` | Episodes' default config slice (`config.plugins.episodes`) — merged *below* `config.json` so deployments win. |

## Configuration

The plugin owns `config.plugins.episodes`. Schema and defaults live in [`src/config.ts`](./src/config.ts) via `definePluginConfig` from `@opencast-mui/query`.

Reading values in a component:

```ts
import { episodesConfig } from "./config";
const { pageSize } = episodesConfig.use();
```

The full merge order (`app:config:defaults` ⊕ base ⊕ `app:config`) lives in [`docs/architecture/CONFIGURATION.md`](../../docs/architecture/CONFIGURATION.md).

## Development

```bash
pnpm --filter @opencast-mui/plugin-core-episodes test:contract
pnpm --filter @opencast-mui/plugin-core-episodes test
```

The contract test at [`src/plugin.contract.test.ts`](./src/plugin.contract.test.ts) is the canonical pattern — copy it when scaffolding a new plugin.

## See also

- [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md) — plugin-author walkthrough.
- [`AGENTS.md`](../../AGENTS.md) — operational rules.
- [`plugin.json`](./plugin.json) — manifest.
