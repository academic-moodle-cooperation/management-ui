# @oc-mui/ui-config

Static, side-effect-free baseline for `AppConfig`. Defines the type shape and the default values; the reactive layer lives in `@oc-mui/query`'s `useAppConfig` and `definePluginConfig` reader.

**Contract**: 1.x. Public API surface tracked in [`etc/ui-config.api.md`](./etc/ui-config.api.md).

## Usage

```ts
import { defaultConfig, getAppConfig, type AppConfig } from "@oc-mui/ui-config";

// Override a few keys; the rest fall back to defaults.
const config = getAppConfig({
  app: { theme: "dark", locale: "en" },
});
```

The runtime reads `config.json` (or the org-shipped equivalent), merges it on top of `defaultConfig`, and exposes the result through `useAppConfig()` from `@oc-mui/query`. Plugins read **their own slice** through `definePluginConfig({ id, schema, defaults })`.

## Surface

| Symbol | Purpose |
|--------|---------|
| `AppConfig` (type) | The shape of the merged app config. Plugin slices live under `config.plugins[id]`. |
| `defaultConfig` | The baseline value — what callers get with no overrides. |
| `getAppConfig(overrides?)` | Pure merge of `defaultConfig` with caller-supplied overrides. |

Plugin slice shapes live in each plugin's `src/config.ts`, not here. This package only owns the top-level keys (`app`, `auth`, `plugins`, etc.) that the shell guarantees stable.

## Layer

Foundation. Depends on nothing in the workspace — by design, so it can be imported before any provider is mounted.

## See also

- [`docs/architecture/CONFIGURATION.md`](../../docs/architecture/CONFIGURATION.md) — full layer model and merge order.
- [`docs/architecture/CONTRACTS.md`](../../docs/architecture/CONTRACTS.md#4-config-contract) — what's frozen.
- [`packages/query/README.md`](../query/README.md) — the reactive layer (`useAppConfig`, `definePluginConfig`).
- [`etc/ui-config.api.md`](./etc/ui-config.api.md) — committed API surface.
