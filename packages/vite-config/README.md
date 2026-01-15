# @workspace/vite-config

**Version:** 0.0.0  
**Type:** Core Infrastructure / Build Tooling  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@workspace/vite-config` package provides centralized, reusable Vite configurations for all applications, packages, and plugins within the monorepo. It ensures a consistent build process, dev server behavior, and optimized production output across the entire platform.

**In Scope:**

- Shared base Vite configuration (`baseConfig`).
- Specialized configurations for the **Core Shell** and **Plugins**.
- Centralized dev server port management.
- Standardized proxy settings for backend communication.
- Custom Vite plugins for the Management UI ecosystem (e.g., config generation).

**Out of Scope:**

- Defining package-specific build scripts (these belong in each package's `package.json`).
- Managing the build output (handled by the `dist` folders of individual packages).

## Architecture & Design Decisions

### Design Principles

- **Don't Repeat Yourself (DRY):** Common plugins (React, Tailwind) and resolve aliases are defined once in the base config.
- **Specialization:** Different module types (Apps vs. Plugins) have distinct requirements (e.g., plugins build as library modules).
- **Collision Prevention:** Dev server ports are centrally managed to allow multiple apps to run simultaneously without conflict.

### Key Concepts

#### Base Configuration
Contains the foundation: React SWC plugin, Tailwind CSS integration, and path aliases (like `@workspace/*` and `@/*`).

#### Shell vs. Plugin Config
- **Shell Config:** Optimized for building the main entry point application.
- **Plugin Config:** Configured for "Library Mode" to ensure plugins can be dynamically loaded by the shell.

#### Port Management (`ports.ts`)
Defines a predictable port mapping for every application in the workspace (e.g., Core on 3000, Series on 3001, etc.).

## API Surface (Public Exports)

### Core API

#### `baseConfig`
The foundational Vite configuration object.

#### `createShellConfig(options)`
**Purpose:** Factory for creating the Core Shell's Vite configuration.

#### `createPluginConfig(options)`
**Purpose:** Factory for creating a plugin's Vite configuration.

#### `getAppPort(appName)`
**Purpose:** Returns the assigned dev server port for a given application.

## Dependencies & Coupling

### Dependency Graph

```
@workspace/vite-config
├── External Dependencies
│   ├── vite (^6.3.5)
│   ├── @vitejs/plugin-react-swc (^3.9.0)
│   ├── @tailwindcss/vite (^4.1.7)
│   └── vite-plugin-static-copy (^1.0.6)
└── Workspace Dependencies
    └── @workspace/utils - For logging and port logic
```

### Dependency Layer

**Layer:** Core Infrastructure

## Usage Examples

### Using in a Plugin (`vite.config.ts`)

```typescript
import { defineConfig } from "vite";
import { createPluginConfig } from "@workspace/vite-config";

export default defineConfig(
  createPluginConfig({
    name: "my-plugin",
    port: 3005
  })
);
```

### Customizing the Proxy

```typescript
import { devProxy } from "@workspace/vite-config/proxy";

// Used within a vite.config.ts
proxy: {
  "/graphql": devProxy.graphql,
}
```

## File Structure

```
packages/vite-config/
├── src/
│   ├── base.config.ts          # Shared foundation
│   ├── shell.config.ts         # Main app configuration
│   ├── plugin.config.ts        # Library mode for plugins
│   ├── ports.ts                # Port assignments
│   ├── proxy.ts                # Dev server proxy settings
│   └── index.ts                # Public API exports
├── package.json
└── README.md                   # This file
```

---

## Contributing

1. **New Apps:** When adding a new application, assign it a unique port in `src/ports.ts`.
2. **Aliases:** Keep path aliases in sync with `packages/typescript-config`.
3. **Build Stability:** Avoid adding experimental Vite plugins here as they impact the stability of the entire monorepo.
