# App Plugin Strategy

This directory contains core app-related plugin implementations.

## Architecture

**Self-Contained Apps**: Each app is responsible for contributing its own navigation items, making apps swappable and independently runnable.

## Available Plugin Implementations

- `episodesNavImplementation` - Adds "Episodes" to sidebar
- `seriesNavImplementation` - Adds "Series" to sidebar
- `uploadNavImplementation` - Adds "Upload" to sidebar
- `seriesCreateImplementation` - Adds "Create series" action button/dialog to series table toolbar

## Usage in Apps

### Option 1: Import and Register in App's Plugin Loading

```typescript
// In your app's plugin loading (e.g., apps/management-ui-episodes/src/plugins/index.ts)
import { episodesNavImplementation, seriesCreateImplementation } from "@workspace/plugins";

export const appPlugins = [
  episodesNavImplementation,
  seriesCreateImplementation,
  // ... other app-specific plugins
];
```

### Option 2: Register in App Initialization

```typescript
// In your app's main file or plugin initializer
import { usePluginManager } from "@workspace/plugin-system";
import { episodesNavImplementation } from "@workspace/plugins";

const manager = usePluginManager();
manager.register(episodesNavImplementation);
```

## Series Toolbar End Actions

`seriesCreateImplementation` registers on the `series:table:toolbar-end-actions` extension point.

Schema:

```typescript
{
  id: string; // Unique action id
  order: number; // Display order (lower = earlier)
  component: React.ComponentType<{ refetch?: () => void }>;
}
```

Default registered action:

```typescript
manager.registerObject("series:table:toolbar-end-actions", "create-series", {
  id: "create-series",
  order: 100,
  component: CreateSeriesToolbarAction,
});
```

## Optional ACL Plugin For Create-Series

The create-series dialog supports an optional ACL editor component extension point:

`series:create-series:acl-editor`

Default behavior (without plugin):

- ACL policy is resolved to `private` (if available)
- ACL entries include current user role with `read` and `write`
- ACL is not shown in the dialog UI
- Language and license are chosen from fixed lists (select inputs)

## Navigation Item Schema

Each navigation implementation registers an object with this schema:

```typescript
{
  title: string,           // Display name
  path: string,            // Route path
  icon: string,            // Icon identifier
  order: number,           // Display order (lower = higher up)
  permissions: string[],   // Required permissions
  featureFlags: string[],  // Required feature flags
  category: string         // Grouping category
}
```

## Order Convention

- `10` - Home (core)
- `20` - Series
- `30` - Episodes
- `40` - Upload
- `50+` - Custom/University items

## Benefits

1. **Modularity**: Each app manages its own navigation
2. **Swappable**: Replace series app → navigation updates automatically
3. **Independent**: Apps can run standalone with their navigation
4. **Clean**: Core only provides Home, apps provide their specific items
5. **Extensible**: Universities can add their own navigation implementations

## Adding New Apps

To add navigation for a new app:

1. Create `your-app-nav-implementation.ts` in this directory
2. Export it from `index.ts`
3. Add it to main implementations `index.ts`
4. Import and register it in your app

Example:

```typescript
export const myAppNavImplementation = createPlugin({
  namespace: "my-app",
  type: "navigation",
  version: "1.0.0",
  initialize(manager) {
    manager.registerObject("sidebar:nav-items", "my-app", {
      title: "My App",
      path: "/my-app",
      icon: "star",
      order: 50,
      permissions: ["my-app.view"],
      featureFlags: [],
      category: "custom",
    });
  },
  activate() {
    console.log("My App navigation activated");
  },
  deactivate() {
    console.log("My App navigation deactivated");
  },
});
```
