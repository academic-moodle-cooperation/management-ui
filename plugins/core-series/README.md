# @oc-mui/plugin-core-series

Core plugin. Registers the `/series` route, its sidebar entry, the Create-series action and its default variant on `series:create-series:variants`, and the series config slice. Ships with the OSS repo and is enabled by default.

## What it provides

| Extension point | What this plugin registers |
|------|------|
| `apps:definitions` | The `series` app at `/series` rendered by `src/App.tsx`. |
| `sidebar:nav-items` | The "Series" sidebar entry. |
| `series:table:toolbar-end-actions` | The "Create series" button (`CreateSeriesAction`), only when `createSeries.placement` is `"toolbar"`; by default it renders next to the page heading and in the empty state. |
| `series:create-series:variants` | The variant `default` (`DefaultCreateSeriesVariant`): the plain metadata form. Other plugins add their own kinds of series here — see [`plugins/core/README.md`](../core/README.md#adding-a-way-to-create-a-series). |
| `app:config:defaults` | Series' default config slice (`config.plugins.series`) — merged *below* `config.json`. |

## Configuration

The plugin owns `config.plugins.series`. Schema and defaults live in [`src/config.ts`](./src/config.ts) via `definePluginConfig` from `@oc-mui/query`.

Reading values in a component:

```ts
import { seriesConfig } from "./config";
const { seriesTable } = seriesConfig.use();
```

The slice's top-level keys are `seriesInfo` (metadata field visibility), `seriesTable` (columns + `createSeries.{enabled,placement,variants}` — see [Creating a series](../../docs/reference/configuration.md#creating-a-series)), and `protection`.

Full merge order: [`docs/reference/configuration.md`](../../docs/reference/configuration.md).

## Development

```bash
pnpm --filter @oc-mui/plugin-core-series test:contract
pnpm --filter @oc-mui/plugin-core-series test
```

## See also

- [`docs/extend/plugin-guide.md`](../../docs/extend/plugin-guide.md) — plugin-author walkthrough.
- [`AGENTS.md`](../../AGENTS.md) — operational rules.
- [`plugin.json`](./plugin.json) — manifest.
