# @oc-mui/plugin-core-series

Core plugin. Registers the `/series` route, its sidebar entry, the Create-series toolbar action, and the series config slice. Ships with the OSS repo and is enabled by default.

## What it provides

| Extension point | What this plugin registers |
|------|------|
| `apps:definitions` | The `series` app at `/series` rendered by `src/App.tsx`. |
| `sidebar:nav-items` | The "Series" sidebar entry. |
| `series:table:toolbar-end-actions` | The "Create series" button rendered in the toolbar of the series table. |
| `app:config:defaults` | Series' default config slice (`config.plugins.series`) — merged *below* `config.json`. |

## Configuration

The plugin owns `config.plugins.series`. Schema and defaults live in [`src/config.ts`](./src/config.ts) via `definePluginConfig` from `@oc-mui/query`.

Reading values in a component:

```ts
import { seriesConfig } from "./config";
const { seriesTable } = seriesConfig.use();
```

The slice's top-level keys are `seriesInfo` (metadata field visibility), `seriesTable` (columns + `createSeries.enabled`), and `protection`.

Full merge order: [`docs/architecture/CONFIGURATION.md`](../../docs/architecture/CONFIGURATION.md).

## Development

```bash
pnpm --filter @oc-mui/plugin-core-series test:contract
pnpm --filter @oc-mui/plugin-core-series test
```

## See also

- [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md) — plugin-author walkthrough.
- [`AGENTS.md`](../../AGENTS.md) — operational rules.
- [`plugin.json`](./plugin.json) — manifest.
