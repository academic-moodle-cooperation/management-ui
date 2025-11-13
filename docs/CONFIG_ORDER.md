# Configuration Order and Merging

## Overview

The application uses an **explicit order-based configuration system** that ensures consistency between development and production modes. This document explains how configuration merging works and how to control which organization's configuration is active.

## How It Works

### Configuration Merge Order

Configurations are merged in this order (later configs override earlier ones):

1. **Default Config** (`packages/ui-config/src/index.ts`) - Base configuration
2. **Plugin Configs** - Organization-specific configurations (e.g., `univie`, `tuwien`)

The **last config in the list wins** for any conflicting properties.

### Development Mode

In development, plugin configs are registered dynamically when plugins initialize. The merge order is determined by:

1. **Export order in `plugins/index.ts`** - Plugins exported later override earlier ones
2. **Runtime merging in `useAppConfig`** - Configs are merged at runtime using `deepMerge`

**Example:**
```typescript
// plugins/index.ts
export * from './core';
export * from './tuwien';   // Registered first
export * from './univie';   // Registered last - WINS
```

In this case, `univie` config will override `tuwien` config because it's exported last.

### Production Mode

In production, configs are merged **at build time** by the `generateConfigPlugin`:

1. **Explicit list in `vite.config.ts`** - Only specified configs are merged
2. **Pre-merged `config.json`** - Written to `dist/ui/config/management-ui/config.json`
3. **No runtime merging** - The pre-merged config is used as-is

**Example:**
```typescript
// apps/management-ui-core/vite.config.ts
const PLUGIN_CONFIGS = [
  // tuwienConfig,  // Commented out
  univieConfig,     // ACTIVE
];
```

Only `univieConfig` is merged into the production build.

## Switching Organizations

To switch from one organization to another (e.g., from `univie` to `tuwien`):

### 1. Update `vite.config.ts` (Production)

```typescript
// apps/management-ui-core/vite.config.ts
const PLUGIN_CONFIGS = [
  tuwienConfig,     // ACTIVE
  // univieConfig,  // Commented out
];
```

### 2. Update `plugins/index.ts` (Development)

```typescript
// plugins/index.ts
export * from './core';
export * from './univie';   // Exported first
export * from './tuwien';   // Exported last - WINS
```

**Important:** The export order in `plugins/index.ts` should match the order in `PLUGIN_CONFIGS` to ensure dev and prod behave the same way.

### 3. Rebuild

```bash
pnpm --filter management-ui-core build
```

## Key Files

### Configuration Sources

- **`packages/ui-config/src/index.ts`** - Default base configuration
- **`plugins/univie/implementations/config/config.ts`** - Univie-specific config
- **`plugins/tuwien/implementations/config/config.ts`** - TU Wien-specific config

### Configuration Loading

- **`packages/query/src/hooks/useAppConfig.ts`** - Runtime config loading and merging
  - In **dev**: Merges `defaultConfig` + plugin configs at runtime
  - In **prod**: Uses pre-merged `config.json` (no runtime merging)

### Build-Time Generation

- **`packages/vite-config/src/generate-config-plugin.ts`** - Vite plugin that generates `config.json` at build time
- **`apps/management-ui-core/vite.config.ts`** - Specifies which configs to merge for production

### Plugin Exports

- **`plugins/index.ts`** - Controls which plugins are exported and their order (affects dev mode)

## Deep Merge Utility

The `deepMerge` function is used for configuration merging:

- **Runtime (dev mode):** `packages/query/src/hooks/useAppConfig.ts` imports from `@workspace/utils/deepMerge`
- **Build-time (prod):** `packages/vite-config/src/generate-config-plugin.ts` has an inlined copy to avoid build-time import issues

> **Note:** The `deepMerge` function is intentionally duplicated in `generate-config-plugin.ts` because `@workspace/utils` exports TypeScript source files directly, which causes issues when imported during Vite's config loading phase

### Merge Behavior

- **Objects:** Merged recursively
- **Arrays:** Replaced (not merged)
- **Primitives:** Replaced
- **Undefined:** Skipped

## Benefits of This Approach

1. **✅ Explicit** - Clear which config is active (no implicit ordering)
2. **✅ Consistent** - Same merge order in dev and prod
3. **✅ Single merge** - Only merge once at build time for production
4. **✅ Easy to switch** - Just reorder/comment the array
5. **✅ No duplication** - Shared `deepMerge` utility
6. **✅ Predictable** - Easy to debug and understand

## Example: Checking Active Configuration

### Development

```bash
# Start dev server
pnpm --filter management-ui-core dev

# Check browser console for merged config
# The config will show the last exported plugin's values
```

### Production

```bash
# Build
pnpm --filter management-ui-core build

# Check generated config
cat apps/management-ui-core/dist/ui/config/management-ui/config.json | jq '.app.theme'
# Output: "univie" (or whatever is active in PLUGIN_CONFIGS)
```

## Troubleshooting

### Different configs in dev vs prod

**Problem:** Dev mode shows `tuwien` theme, but prod shows `univie`.

**Solution:** Ensure the export order in `plugins/index.ts` matches `PLUGIN_CONFIGS` in `vite.config.ts`.

### Config not updating after rebuild

**Problem:** Changed `PLUGIN_CONFIGS` but config.json still shows old values.

**Solution:** Clear the dist folder and rebuild:
```bash
rm -rf apps/management-ui-core/dist
pnpm --filter management-ui-core build
```

### Import errors after commenting out plugins

**Problem:** Build fails with "X is not exported by plugins/index.ts".

**Solution:** Keep all plugins exported in `plugins/index.ts` for compatibility. Control which config is active using `PLUGIN_CONFIGS` in `vite.config.ts` and export order.

