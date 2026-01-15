# @workspace/ui-config

**Version:** 0.0.0  
**Type:** Foundation / Configuration  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@workspace/ui-config` package is the centralized source of truth for application configuration defaults and types. It defines the structure of the `AppConfig` and provides the baseline settings for authentication, API endpoints, and plugin behaviors.

This package is designed to be **pure and static**, allowing it to be used early in the application lifecycle without side effects.

**In Scope:**

- Default configuration values (`defaultConfig`).
- Type definitions for the entire application configuration (`AppConfig`).
- Utility function for merging instance-specific configs (`getAppConfig`).
- Plugin-specific configuration schemas (e.g., table columns, metadata visibility).

**Out of Scope:**

- Fetching configuration from a server (handled by `@workspace/query`).
- Reactive configuration state (handled by `@workspace/query`'s `useAppConfig` hook).
- Environment-specific logic (should be injected into `getAppConfig`).

## Architecture & Design Decisions

### Design Principles

- **Static Baseline:** Provides a complete "working" configuration out of the box.
- **Hierarchical Merging:** Configs are merged layer by layer (Default → Global Server Config → Plugin Config).
- **Type Safety:** Uses TypeScript interfaces to ensure that configuration overrides match the expected schema.

### Key Concepts

#### `defaultConfig`
A large object containing all default values for the platform. This includes:
- **`app`**: Visual identity (title, logos, theme).
- **`auth`**: Redirect URLs for login/logout (supporting both production and dev).
- **`api`**: Base URLs and timeouts.
- **`plugins`**: Specific settings for the Series, Episodes, and Upload apps.

#### `getAppConfig(overrides)`
A pure function that takes optional overrides and merges them deeply with the `defaultConfig`.

## API Surface (Public Exports)

### Exports Structure

```typescript
export { defaultConfig, getAppConfig } from "./index";
export * from "./types";
```

### Types & Interfaces

#### `AppConfig`
The main interface representing the entire configuration tree. It is extensible via `[key: string]: unknown` to allow plugins to add their own top-level keys.

## Dependencies & Coupling

### Dependency Graph

```
@workspace/ui-config
└── Workspace Dependencies
    └── None (Core Foundation)
```

### Dependency Layer

**Layer:** Foundation

**Allowed to depend on:** External dependencies only.

## Usage Examples

### Accessing Default Config

```typescript
import { defaultConfig } from "@workspace/ui-config";

console.log(defaultConfig.api.graphqlEndpoint); // "/graphql"
```

### Merging Configs

```typescript
import { getAppConfig } from "@workspace/ui-config";

const myConfig = getAppConfig({
  app: { title: "Custom Title" }
});
```

## File Structure

```
packages/ui-config/
├── src/
│   ├── index.ts                # Default config and merge function
│   ├── types.ts                # AppConfig interfaces
│   └── index.ts                # Public API exports
├── package.json
└── README.md                   # This file
```

---

## Contributing

1. **Changing Defaults:** Be careful when changing `defaultConfig` as it affects all applications in the monorepo.
2. **New Plugins:** When adding a new app or plugin that needs configuration, add its type definition to `PluginsConfig` in `types.ts`.
3. **Immutability:** Always use `getAppConfig` to create a new configuration object instead of mutating the existing one.
