# @oc-mui/plugin-system

**Version:** 0.0.0  
**Type:** Foundation / Core Infrastructure  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@oc-mui/plugin-system` is the heart of the Management UI's extensibility architecture. it allows the application to be composed of independent modules (plugins) that can add new features, override UI components, and extend the core functionality without modifying the base codebase.

It manages the lifecycle of plugins, provides a centralized registry for components and objects, and enables decoupled communication between modules.

**In Scope:**

- Plugin registration, initialization, and lifecycle management.
- Dynamic component resolution through **Extension Points**.
- Centralized function registry for cross-plugin communication.
- Event system for decoupled notifications.
- Generic object registry for shared data.

**Out of Scope:**

- Specific UI components (these are registered *into* the system by plugins).
- Application-level routing logic (though it provides the registry to store routes).
- State management for specific features.

## Architecture & Design Decisions

### Design Principles

- **Loose Coupling:** Plugins do not import each other directly; they communicate via the `pluginManager`'s function and event systems.
- **Inversion of Control:** The core application defines "Extension Points", and plugins provide the implementations.
- **Namespacing:** All registered components and objects are namespaced (`namespace:plugin-type`) to prevent collisions.

### Key Concepts

#### Plugin Lifecycle
Every plugin implements the `Plugin` interface:
1.  **`initialize`**: Setup dependencies and register functions.
2.  **`activate`**: Register components and objects.
3.  **`deactivate`**: Clean up resources.

#### Extension Points & `ComponentResolver`
The `ComponentResolver` is a React component that looks up registered components for a specific `componentType` (the extension point). If no plugin provides a component, it falls back to a `defaultComponent`.

#### Function Registry
Plugins can "export" functionality by adding functions to the `pluginManager`. Other plugins or the core app can then execute these functions by name.

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ @oc-mui/plugin-system Architecture   │
├─────────────────────────────────────────┤
│ [ Plugin Manager (Central Service) ]    │
│    /           |            \           │
│ [Functions] [Events] [Registries]       │
│    |           |            |           │
│ [ Plugins ] <──┼──────────> [ UI ]      │
│  (Modules)     |      (ComponentResolver)│
└─────────────────────────────────────────┘
```

## API Surface (Public Exports)

### Core API

#### `createPluginManager()`
**Purpose:** Factory function to create a new instance of the plugin manager.

#### `PluginProvider`
**Purpose:** React context provider that makes the `pluginManager` available via `usePluginManager()`.

#### `ComponentResolver`
**Purpose:** React component for rendering plugin-provided components.
**Props:**
- `componentType` (string): The extension point name.
- `defaultComponent`: Fallback component.
- `componentProps`: Props passed to the resolved component.

#### `Plugin` (Interface)
**Purpose:** The contract that every plugin must satisfy.

## Dependencies & Coupling

### Dependency Graph

```
@oc-mui/plugin-system
├── External Dependencies
│   └── react (^19.1.0)
└── Workspace Dependencies
    └── @oc-mui/utils - For logging and common utilities
```

### Dependency Layer

**Layer:** Foundation

**Allowed to depend on:** Core Infrastructure (utils).

**Rules:**
- **CRITICAL:** This package must not depend on any higher-layer packages (query, router, ui, etc.) to avoid circular dependencies.

## Usage Examples

### Creating a Plugin

```typescript
import { Plugin, PluginManager } from "@oc-mui/plugin-system";

export const MyPlugin: Plugin = {
  name: "my-namespace:my-feature",
  version: "1.0.0",
  
  initialize(manager: PluginManager) {
    // Add shared functions
    manager.addFunction("my-feature.doSomething", () => console.log("Done"));
  },
  
  activate() {
    // Register components to extension points
    this.manager.registerComponent("appshell:header:top", MyHeaderIcon);
  },
  
  deactivate() {}
};
```

### Using the Component Resolver

```typescript
import { ComponentResolver } from "@oc-mui/plugin-system";

const Header = () => (
  <header>
    <h1>My App</h1>
    <ComponentResolver 
      componentType="appshell:header:top"
      defaultComponent={() => null}
      componentProps={{}}
    />
  </header>
);
```

## Extension Points

Common extension points used in the core application:
- `appshell:header`: Customize the main header.
- `appshell:footer`: Customize the main footer.
- `appshell:sidebar:top`: Add items to the top of the sidebar.
- `datatable:row-actions`: Add actions to table rows.

## File Structure

```
packages/plugin-system/
├── src/
│   ├── pluginManager.ts        # Central logic
│   ├── component-resolver.tsx  # React component for lookup
│   ├── IPlugin.ts              # Interface definition
│   ├── PluginProvider.tsx      # React context provider
│   ├── plugins/                # Internal plugin implementations
│   │   ├── appRegistry/        # App management
│   │   └── objectRegistry/     # Data management
│   └── index.ts                # Public API exports
├── package.json
└── README.md                   # This file
```

---

## Contributing

1. **Keep it lean:** This is a core package. Avoid adding external dependencies.
2. **Communication:** Use the function registry instead of direct imports for cross-plugin logic.
3. **Naming:** Always use the `namespace:plugin-type:target` format for registration keys.
4. **Events:** Prefer the event system for "fire and forget" notifications.
