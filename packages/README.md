# Packages

Shared infrastructure for the Management UI. Apps and plugins consume these — never the other way around.

The dependency layers are documented in [`docs/reference/architecture.md`](../docs/reference/architecture.md#package-layers). The rule: lower layers never depend on higher layers. The [`@oc-mui/eslint-config`](./eslint-config/) boundaries rule enforces it mechanically.

## Catalog

### Core infrastructure (zero workspace dependencies)

| Package | Purpose |
|---------|---------|
| [`@oc-mui/utils`](./utils/) | Pure utility functions (`logger`, `deepMerge`, `parseDuration`, …). |
| [`@oc-mui/typescript-config`](./typescript-config/) | Shared TypeScript configs (`base`, `react-library`, `react-application`, …). |
| [`@oc-mui/eslint-config`](./eslint-config/) | Shared ESLint configs (`base`, `react-internal`, `type-aware`). Owns the wrapper rule and boundaries rule. |
| [`@oc-mui/tailwind-config`](./tailwind-config/) | Tailwind preset + plugin. Token-based theming for shadcn/ui. |
| [`@oc-mui/vite-config`](./vite-config/) | Shared Vite configs (`shell`, `community-plugin`), ports, proxy, custom plugins. |

### Foundation (depend only on core)

| Package | Purpose | Contract |
|---------|---------|----------|
| [`@oc-mui/plugin-system`](./plugin-system/) | `createPlugin`, `PluginManager`, extension-point resolution. The runtime every plugin runs on. | Manifest + Runtime API |
| [`@oc-mui/store`](./store/) | State facade over Zustand + Jotai. | api-checked |
| [`@oc-mui/i18n`](./i18n/) | Translation layer over i18next + react-i18next. | api-checked |
| [`@oc-mui/ui-config`](./ui-config/) | `AppConfig` type + `defaultConfig` baseline. | Config (defines the shape) |

### Integration (depend on foundation + core)

| Package | Purpose | Contract |
|---------|---------|----------|
| [`@oc-mui/query`](./query/) | Data fetching over TanStack Query + GraphQL. Owns `definePluginConfig`. | Config reader API |
| [`@oc-mui/router`](./router/) | Routing layer over TanStack Router + auth. | api-checked |
| [`@oc-mui/ui`](./ui/) | Shared component library on Tailwind + shadcn/ui. | Theme consumer |
| [`@oc-mui/remote-plugin-loader`](./remote-plugin-loader/) | Loads `.mjs` plugins by URL — used by JAR loader and marketplace. | — |
| [`@oc-mui/plugin-testing`](./plugin-testing/) | Contract-test harness. | Test-only |

Contract names refer to the frozen surfaces in [`docs/reference/contracts.md`](../docs/reference/contracts.md) — current version numbers live there, not here. "api-checked" means the package's public surface is snapshotted in `etc/<pkg>.api.md` and drift-checked by `pnpm api-check`.

### Application (compose everything below)

| Package | Purpose |
|---------|---------|
| [`@oc-mui/providers`](./providers/) | `AppProviders` — the canonical provider hierarchy. |
| [`@oc-mui/app-runtime`](./app-runtime/) | Standalone/integrated dual-mode wrapper for apps registered on `apps:definitions`. |

## Adding a new package

1. Pick the right layer. Lower is better; you can't move up later without breakage.
2. Scaffold under `packages/<name>/` with `package.json`, `tsconfig.json`, `vitest.config.ts`. Mirror a sibling's shape.
3. Define a strict `exports` field — that's your public API surface.
4. Write a README in the consistent shape (see any of the catalog entries above).
5. Add it to the catalog here.
6. If it crosses a contract boundary, add it to `api-check` (commit `etc/<pkg>.api.md`) and update [`docs/reference/contracts.md`](../docs/reference/contracts.md).

## See also

- [`docs/reference/architecture.md`](../docs/reference/architecture.md) — the layer model.
- [`docs/reference/contracts.md`](../docs/reference/contracts.md) — frozen surfaces.
- [`docs/contribute/release.md`](../docs/contribute/release.md) — versioning and changesets.
