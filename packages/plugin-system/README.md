# @workspace/plugin-system

Core infrastructure for the Management UI plugin architecture. This package provides the plugin manager, factory functions, component resolution, and registration system.

## Features

- **Plugin Manager**: Central registry for all plugins and their components
- **Plugin Factory**: `createPlugin` function for standardized plugin creation
- **Component Resolution**: Dynamic component loading and resolution
- **Object Registry**: Store and retrieve plugin-provided objects
- **App Registry**: Register and manage plugin applications

## Installation

This package is automatically available in all monorepo applications:

```typescript
import { createPlugin, PluginManager, PluginProvider } from '@workspace/plugin-system';
```

## Creating Plugins

### createPlugin Function

The `createPlugin` function creates properly formatted plugins with consistent naming:

```typescript
import { createPlugin } from '@workspace/plugin-system';

export const myPlugin = createPlugin({
  namespace: 'my-feature',
  type: 'sidebar',
  version: '1.0.0',
  
  initialize(manager) {
    // Register components, objects, etc.
    manager.registerComponent('sidebar:nav-items', MyNavItem, { order: 10 });
  },
  
  activate() {
    console.log('Plugin activated');
  },
  
  deactivate() {
    console.log('Plugin deactivated');
  }
});
```

### PluginOptions Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `namespace` | `string` | ✅ | Plugin namespace (e.g., 'episodes', 'series'). Must not contain colons. |
| `type` | `string` | ✅ | Plugin type (e.g., 'sidebar', 'app'). Must not contain colons. |
| `version` | `string` | ✅ | Semantic version string |
| `order` | `number` | ❌ | Processing order, lower = first (default: 100) |
| `dependencies` | `string[]` | ❌ | Required plugin namespaces |
| `initialize` | `(manager: PluginManager) => void` | ❌ | Called during plugin registration |
| `activate` | `() => void` | ✅ | Called after initialization |
| `deactivate` | `() => void` | ✅ | Called when plugin is unregistered |

**Note:** `activate` and `deactivate` are **required**. They can be empty functions if no action is needed.

## Plugin Manager

The PluginManager provides methods for registering and retrieving plugin contributions:

### Registering Components

```typescript
initialize(manager) {
  // Register a React component for an extension point
  manager.registerComponent(
    'app:header',           // Extension point
    MyHeaderComponent,      // React component
    { 
      priority: 10,         // Lower = higher priority
      metadata: { name: 'My Header' }
    }
  );
}
```

### Registering Objects

```typescript
initialize(manager) {
  // Register a configuration object
  manager.registerObject(
    'app:config',           // Extension point
    'my-config',            // Unique key
    { theme: 'dark', ... }  // Object value
  );
}
```

### Retrieving Registrations

```typescript
// Get all components for an extension point
const headers = manager.getComponents('app:header');

// Get all objects for an extension point
const configs = manager.getObjects('app:config');

// Get a specific object
const myConfig = manager.getObject('app:config', 'my-config');
```

## React Hooks

### useRegistry

Access registered objects in React components:

```typescript
import { useRegistry } from '@workspace/plugin-system';

function MyComponent() {
  const { getObjects, getObject } = useRegistry();
  
  const allConfigs = getObjects('app:config');
  const specificConfig = getObject('app:config', 'univie-config');
  
  return <div>{/* ... */}</div>;
}
```

## Provider Components

### PluginProvider

Wrap your application to enable the plugin system:

```typescript
import { PluginProvider } from '@workspace/plugin-system';
import { plugins } from '@workspace/plugins';

function App() {
  return (
    <PluginProvider plugins={plugins}>
      <YourApp />
    </PluginProvider>
  );
}
```

## Package Structure

```
packages/plugin-system/
├── src/
│   ├── index.ts              # Main exports
│   ├── pluginFactory.ts      # createPlugin function
│   ├── pluginManager.ts      # PluginManager class
│   ├── IPlugin.ts            # Plugin interface
│   ├── PluginProvider.tsx    # React provider
│   ├── component-resolver.tsx # Component resolution
│   ├── PluginComponent.tsx   # Plugin component wrapper
│   ├── RendererContext.tsx   # Rendering context
│   ├── types.ts              # Shared types
│   ├── appTypes.ts           # App-specific types
│   ├── pluginTypes.ts        # Plugin types
│   └── plugins/
│       ├── appRegistry/      # App registration
│       ├── objectRegistry/   # Object registration
│       └── renderer/         # Rendering system
├── package.json
├── tsconfig.json
└── README.md
```

## Common Patterns

### Extension Point Naming

Extension points use a consistent naming convention:

```
[area]:[feature]
```

Examples:
- `app:header` - Application header
- `sidebar:nav-items` - Sidebar navigation items
- `table-sidebar:tabs` - Table detail sidebar tabs
- `upload:acl-editor` - Upload ACL editor

### Priority System

Lower priority numbers are processed first and take precedence:

```typescript
// High priority - processed first, wins conflicts
manager.registerComponent('app:header', UniversityHeader, { priority: 10 });

// Default priority
manager.registerComponent('app:header', DefaultHeader, { priority: 100 });

// Low priority - processed last, fallback
manager.registerComponent('app:header', FallbackHeader, { priority: 1000 });
```

### Plugin Dependencies

Specify dependencies to ensure load order:

```typescript
export const myPlugin = createPlugin({
  namespace: 'advanced-feature',
  type: 'extension',
  version: '1.0.0',
  dependencies: ['core', 'base-feature'],
  // ...
});
```

## Related Documentation

- [Plugin System Overview](/plugins/README.md) - Plugin architecture
- [Adding Plugins](/docs/workflows/ADDING_PLUGINS.md) - Step-by-step guide
- [Extension Points](/plugins/core/README.md) - Available extension points
- [Configuration System](/docs/CONFIG_GENERATION.md) - Config merging

