# Configuration Generation & Merging

This document explains how configuration works in development vs production, and answers common questions about the config system.

## Overview

The application uses a **three-layer config system**:

1. **Default Config** (`@workspace/ui-config`) - Base configuration
2. **Plugin Configs** (e.g., `univie`, `tuwien`) - Organization-specific overrides
3. **Production Config** (`config.json`) - Runtime overrides in production

## Development Mode

### How It Works

In development (`pnpm dev`):

1. App starts with `defaultConfig` from `@workspace/ui-config`
2. Plugins register their configs via `manager.registerObject('app:config', 'plugin-name', config)`
3. `useAppConfig()` hook collects all registered plugin configs
4. Configs are **deep-merged** using this order (last wins):
   ```
   defaultConfig → plugin1Config → plugin2Config → ... → pluginNConfig
   ```

### Plugin Registration Order

Plugins are registered in the order they're loaded in `plugins/index.ts`:

```typescript
export * from "./core"; // 1st - Core plugins
export * from "./tuwien"; // 2nd - TUWien config
export * from "./univie"; // 3rd - Univie config (WINS if both set same key)
export * from "./example-university";
```

**Example:**

- If both `tuwien` and `univie` set `app.theme`
- **Univie wins** because it's loaded last
- The merge happens in `useAppConfig()`:

```typescript
// packages/query/src/hooks/useAppConfig.ts
const mergedConfig = useMemo(
  () =>
    deepMerge(
      queryResult.data ?? { ...defaultConfig },
      ...((pluginConfigObjects as Record<string, any>[]) || []),
    ) as AppConfig,
  [queryResult.data, pluginConfigObjects],
);
```

### Which Config Wins?

**Order of precedence (highest to lowest):**

1. ✅ **Last registered plugin** (e.g., `univie` if loaded after `tuwien`)
2. ⬇️ Earlier plugins
3. ⬇️ Default config

**Current order:**

```
defaultConfig < tuwien < univie
```

So `univie` config overrides `tuwien` which overrides `defaultConfig`.

## Production Mode

### How It Works

In production:

1. **Build time**: Vite plugin generates `config.json` from merged configs
2. **Runtime**: App fetches `/ui/config/management-ui/config.json`
3. Config is merged in this order:
   ```
   defaultConfig → config.json → plugin1Config → plugin2Config
   ```

### Build-Time Generation

When you run `pnpm build`, the `generateConfigPlugin` runs:

```typescript
// apps/management-ui-core/vite.config.ts
import { defaultConfig } from "../../packages/ui-config/src/index";
import { config as univieConfig } from "../../plugins/univie/implementations/config/config";

generateConfigPlugin({
  defaultConfig, // Base config
  pluginConfigs: [univieConfig], // Organization configs
});
```

This generates `dist/ui/config/management-ui/config.json` with the merged result.

### Runtime Loading

```typescript
// packages/query/src/hooks/useAppConfig.ts
const queryResult = useQuery({
  queryKey: CONFIG_QUERY_KEY,
  queryFn: () => fetchAndMergeConfig(configUrl), // Fetches config.json
  enabled: !isDev && !!configUrl,
});

// Then merges with plugin configs
const mergedConfig = deepMerge(
  queryResult.data ?? { ...defaultConfig },
  ...pluginConfigObjects, // Plugins can still override at runtime
);
```

## Deep Merge Logic

### Is It Duplicated?

**Short answer: Yes, but intentionally.**

The `deepMerge` function exists in two places:

1. **Runtime** (`packages/query/src/hooks/useAppConfig.ts`) - For browser
2. **Build-time** (`packages/vite-config/src/generate-config-plugin.ts`) - For Node.js

### Why?

1. **Different execution contexts:**
   - Runtime merge runs in the browser
   - Build-time merge runs in Node.js during Vite build

2. **No shared utility possible:**
   - Vite config runs before build, can't import from built packages
   - We can't create a shared util without adding build complexity

3. **Small, stable code:**
   - The function is ~15 lines
   - Logic is well-tested and rarely changes
   - Benefits of deduplication don't outweigh complexity

### The Logic

```typescript
function deepMerge(
  target: Record<string, any>,
  ...sources: Record<string, any>[]
): Record<string, any> {
  return sources.reduce(
    (acc, source) => {
      if (!source) return acc;
      Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const accValue = acc[key];
        if (Array.isArray(accValue) && Array.isArray(sourceValue)) {
          // Arrays are REPLACED, not merged
          acc[key] = sourceValue;
        } else if (
          accValue &&
          typeof accValue === "object" &&
          sourceValue &&
          typeof sourceValue === "object" &&
          !Array.isArray(accValue) &&
          !Array.isArray(sourceValue)
        ) {
          // Objects are recursively merged
          acc[key] = deepMerge({ ...accValue }, sourceValue);
        } else if (sourceValue !== undefined) {
          // Primitives are replaced
          acc[key] = sourceValue;
        }
      });
      return acc;
    },
    { ...target },
  );
}
```

**Key behavior:**

- **Objects**: Recursively merged
- **Arrays**: Replaced (not concatenated)
- **Primitives**: Replaced
- **Undefined values**: Ignored

## How to Control Which Config Wins

### Option 1: Change Plugin Load Order

Edit `plugins/index.ts`:

```typescript
export * from "./core";
export * from "./univie"; // Load univie first
export * from "./tuwien"; // TUWien wins now
```

### Option 2: Conditional Plugin Loading

In `apps/management-ui-core/src/main.tsx`, conditionally register plugins:

```typescript
const organization = import.meta.env.VITE_ORGANIZATION || "univie";

if (organization === "tuwien") {
  pluginManager.register(tuwienConfigPlugin);
} else if (organization === "univie") {
  pluginManager.register(univieConfigPlugin);
}
```

### Option 3: Build Different config.json

In `vite.config.ts`:

```typescript
const org = process.env.ORG || "univie";
const orgConfig = org === "tuwien" ? tuwienConfig : univieConfig;

generateConfigPlugin({
  defaultConfig,
  pluginConfigs: [orgConfig], // Only include active org
});
```

## FAQ

### Q: Why do I see both tuwien and univie configs in dev?

**A:** Both are loaded because `plugins/index.ts` exports both. The **last one wins** for conflicting keys.

### Q: How do I know which config is active?

**A:** Check the React DevTools or console:

```javascript
const { config } = useAppConfig();
console.log("Active theme:", config.app.theme);
console.log("Active logo:", config.app.orgLogoUrl);
```

### Q: Can I have different configs per deployment?

**A:** Yes! Three approaches:

1. **Build different bundles:**

   ```bash
   ORG=tuwien pnpm build  # Builds with TUWien config
   ORG=univie pnpm build  # Builds with Univie config
   ```

2. **Override config.json on server:**
   - Deploy the same bundle
   - Replace `/ui/config/management-ui/config.json` per environment

3. **Use environment variables:**
   - Set `VITE_APP_THEME=tuwien` in `.env.production`
   - Access via `import.meta.env.VITE_APP_THEME`

### Q: Should I delete the duplicate deepMerge?

**A:** No. The duplication is intentional and minimal. Trying to deduplicate would require:

- Build complexity (pre-compile shared utils)
- Runtime overhead (bundle shared code)
- Maintenance burden (manage dual exports)

The 15-line function is stable and worth the duplication.

## Summary

### Development

```
defaultConfig → plugin configs (in load order) → merged runtime config
```

### Production

```
defaultConfig → plugin configs → config.json (build time)
                                     ↓
fetch config.json → merge with runtime plugin configs → final config
```

### Key Takeaways

- **Last plugin wins** in dev mode
- **config.json** is pre-merged at build time
- **deepMerge** duplication is intentional
- **Plugin order** matters: change `plugins/index.ts` to control priority
