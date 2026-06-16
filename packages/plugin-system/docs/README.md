# Plugin System — concepts

Conceptual companion to the [package README](../README.md), which documents the API surface. This page explains the model: what extension points are, how registration and resolution work, and how organizations customize the Management UI without modifying core code.

## Overview

The plugin system enables **controlled extensibility**:

- **The core (shell + `@opencast-mui/plugin-core`)** defines extension points — *what* can be customized.
- **Plugins** register objects and components on those points — *how* it's customized.
- **The `PluginManager`** coordinates registration, resolution, and lifecycle.

```
┌─────────────────────────────────────────────────┐
│ Plugin System Architecture                      │
├─────────────────────────────────────────────────┤
│ Extension Points (core)                         │
│ ├─ apps:definitions                             │
│ ├─ sidebar:nav-items                            │
│ ├─ app:config:defaults                          │
│ └─ appshell:header / app:header-logo            │
├─────────────────────────────────────────────────┤
│ Plugin Manager                                  │
│ ├─ Object registry    (registerObject)          │
│ ├─ Component registry (registerComponent)       │
│ ├─ Function registry  (addFunction)             │
│ └─ Event bus          (emit / on / off)         │
├─────────────────────────────────────────────────┤
│ Implementations                                 │
│ ├─ Built-in plugins (episodes, series, upload)  │
│ ├─ Organization plugins (.local-plugins/, JARs) │
│ └─ Community plugins (marketplace)              │
└─────────────────────────────────────────────────┘
```

## Creating a plugin

```ts
import { createPlugin, type PluginManager } from "@opencast-mui/plugin-system";

export const myPlugin = createPlugin({
  namespace: "my-org",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // All registrations happen HERE (not in activate()).
    manager.registerObject("sidebar:nav-items", "my-portal", {
      title: "My Portal",
      path: "/portal",
      icon: "building-2",
      order: 50,
      permissions: [],
    });
  },

  activate() {
    /* one-time side effects only */
  },
  deactivate() {
    /* clean up activate()'s side effects */
  },
});
```

The full authoring walkthrough lives at [`docs/plugins/creating-a-plugin.md`](../../../docs/plugins/creating-a-plugin.md); the operational rules (manifest, contract test, boundaries) are in [`AGENTS.md`](../../../AGENTS.md).

## Core concepts

### 1. Extension points

An extension point is a string key (`"namespace:thing"`) that the core reads from. Plugins write to it; the core (or another consumer) queries it. There is no separate "define" step — a point exists by convention, documented in [`plugins/core`](../../../plugins/core/README.md)'s declaration tables and frozen by the Manifest/Runtime contracts in [`docs/architecture/CONTRACTS.md`](../../../docs/architecture/CONTRACTS.md).

### 2. Object registration

Data-shaped contributions (routes, nav items, config defaults):

```ts
manager.registerObject("apps:definitions", "my-app", {
  id: "my-app",
  name: "My App",
  routePath: "/my-app",
  component: MyAppComponent,
});
```

### 3. Component registration and resolution

UI-shaped contributions. Multiple plugins can target the same point; the **lowest `order` wins** when a single component is resolved:

```ts
// Core registers the default header at order 100…
manager.registerComponent("appshell:header", DefaultHeader, {
  key: "default-header",
  order: 100,
});

// …an org plugin overrides it by registering with a lower order.
manager.registerComponent("appshell:header", OrgHeader, {
  key: "org-header",
  order: 50,
});
```

Consumers render the winner through `ComponentResolver`:

```tsx
import { ComponentResolver } from "@opencast-mui/plugin-system";

<ComponentResolver
  componentType="appshell:header"
  defaultComponent={MinimalHeader}
  componentProps={{ user: currentUser }}
/>;
```

`ComponentResolver` falls back to `defaultComponent` when nothing is registered.

### 4. Functions and events

`addFunction` / `executeFunction` register callable extensions; the event bus (`emit` / `on` / `off`) decouples cross-plugin signaling. Both live on the same `PluginManager`.

## Which extension points exist?

The canonical, maintained list is **not** in this file — read:

- [`plugins/core/README.md`](../../../plugins/core/README.md) — every shared extension point, its owner, and its schema.
- [`AGENTS.md`](../../../AGENTS.md#extension-points--the-four-youll-usually-touch) — the four you'll usually touch (`apps:definitions`, `sidebar:nav-items`, `app:config:defaults`, `app:header-logo`).

## Testing plugins

Use the contract-test harness from `@opencast-mui/plugin-testing` — every plugin ships a mechanical `plugin.contract.test.ts` (see [`AGENTS.md`](../../../AGENTS.md#contract-test--required-mechanical) for the template and [`packages/plugin-testing/README.md`](../../plugin-testing/README.md) for the harness API). For unit tests, create a fresh manager with `createPluginManager()` and call your plugin's `initialize()` against it.

## Package structure

```
packages/plugin-system/
├── src/
│   ├── index.ts                  # public API exports
│   ├── pluginFactory.ts          # createPlugin()
│   ├── pluginManager.ts          # createPluginManager() + registries
│   ├── component-resolver.tsx    # ComponentResolver
│   ├── PluginProvider.tsx        # React context (usePluginManager)
│   ├── builtins/                 # renderer, app registry, object registry
│   ├── services/                 # FragmentRegistry (GraphQL fragments)
│   ├── schemas/plugin.schema.json # the Manifest 1.1 JSON schema
│   └── utils/                    # manifest validation, semver checks
├── docs/                         # this page
└── etc/plugin-system.api.md      # committed API-Extractor snapshot (CI-checked)
```

## See also

- [Package README](../README.md) — API table, architecture, layer rules.
- [`docs/architecture/CONTRACTS.md`](../../../docs/architecture/CONTRACTS.md) — Manifest 1.1 / Runtime API 1.0 guarantees.
- [`docs/architecture/decisions/001-plugin-system.md`](../../../docs/architecture/decisions/001-plugin-system.md) — why the architecture is the way it is.
