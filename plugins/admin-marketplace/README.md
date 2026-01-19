# Admin Marketplace Plugin

**Version:** 1.0.0  
**Type:** App Plugin (Library)  
**Last Updated:** 2026-01-19

## Purpose

The Admin Marketplace plugin provides a dynamic plugin marketplace that allows administrators to browse, try, and install remote plugins at runtime without rebuilding the application. It implements the "Parallel Engine" architecture pattern, leveraging the existing PluginManager to seamlessly integrate remote modules.

## Features

- **Dynamic Plugin Loading** - Load remote ES modules at runtime using dynamic `import()`
- **Plugin Registry** - Browse available plugins with metadata (name, description, version, author)
- **Try Before Install** - Load plugins temporarily without persisting them
- **Persistent Installation** - Install plugins and save to localStorage for automatic loading
- **Developer Mode** - Load custom plugin URLs during development (e.g., localhost)
- **Uninstall Support** - Remove installed plugins from localStorage
- **Auto-Load** - Automatically load installed plugins on application startup

## Plugin Structure

```
plugins/admin-marketplace/
├── src/
│   ├── services/
│   │   └── remote-loader.ts      # Remote plugin loading service
│   ├── views/
│   │   └── MarketplaceDashboard.tsx  # Marketplace UI component
│   └── index.ts                   # Plugin entry point
├── package.json
├── tsconfig.json
└── README.md                      # This file
```

## Architecture: Parallel Engine Approach

### What is "Parallel Engine"?

The "Parallel Engine" approach means that remote plugins run in the **same plugin system** as built-in plugins, rather than in an isolated sandbox. Remote plugins:

1. Are loaded as ES modules via dynamic `import()`
2. Are registered with the **same PluginManager** instance
3. Have **full access** to all extension points
4. Can **extend and customize** the application just like built-in plugins
5. Run in the **same JavaScript context** and share the same dependencies

### Benefits

- **Seamless Integration** - Remote plugins are indistinguishable from built-in plugins
- **Full Capabilities** - No restrictions on what remote plugins can do
- **Simple API** - Uses the standard Plugin interface
- **No IFrames** - No cross-origin restrictions or message passing overhead
- **Shared Dependencies** - Remote plugins can use application dependencies

### Security Considerations

⚠️ **Important:** The Parallel Engine approach requires **trusted plugin sources** because:

- Remote plugins execute with full application privileges
- They can access all extension points and APIs
- They run in the same context as the core application

**Recommendations:**

- Only load plugins from trusted sources
- Implement authentication/authorization for the marketplace
- Consider code signing or hash verification for remote plugins
- Use HTTPS URLs only
- Implement plugin permissions system for production use

## Implementation Details

### Remote Loader Service

**File:** `src/services/remote-loader.ts`

The RemoteLoader service handles:

```typescript
RemoteLoader.loadAndRegister(url, manager); // Load and register plugin
RemoteLoader.persist(url); // Save to localStorage
RemoteLoader.remove(url); // Remove from localStorage
RemoteLoader.getInstalledUrls(); // Get all installed plugin URLs
RemoteLoader.clearAll(); // Clear all installed plugins
```

**Storage Key:** `installed_remote_plugins`

**Storage Format:** JSON array of URLs

```json
["https://example.com/plugin1.js", "https://example.com/plugin2.js"]
```

### Marketplace Dashboard

**File:** `src/views/MarketplaceDashboard.tsx`

The MarketplaceDashboard component provides:

- **Plugin Grid** - Displays available plugins with metadata
- **Try Button** - Loads plugin without saving to localStorage
- **Install Button** - Loads plugin and saves to localStorage
- **Uninstall Button** - Removes plugin from localStorage
- **Developer Mode** - Input field for custom plugin URLs
- **Installed Plugins List** - Shows all persisted plugins

### Plugin Registry

The plugin registry is currently a static array (`AVAILABLE_PLUGINS`) for demonstration purposes. In production, this should be fetched from a remote API:

```typescript
const AVAILABLE_PLUGINS = [
  {
    id: "example-plugin-1",
    name: "Example Analytics Plugin",
    description: "Adds analytics dashboard and reporting features",
    version: "1.0.0",
    author: "Example Team",
    url: "https://example.com/plugins/analytics.js",
    category: "Analytics",
  },
  // ... more plugins
];
```

**Production Enhancement:** Replace with API call:

```typescript
const { data: plugins } = await fetch("/api/marketplace/plugins");
```

## Plugin Registration

### Main Plugin Entry

```typescript
// plugins/admin-marketplace/src/index.ts
export const adminMarketplacePlugin = createPlugin({
  namespace: "admin",
  type: "app",
  initialize(manager) {
    // Register marketplace app route
    manager.registerObject("apps:definitions", "marketplace", {
      id: "marketplace",
      name: "Marketplace",
      routePath: "/admin/marketplace",
      component: () => MarketplaceDashboard({ manager }),
    });

    // Register sidebar navigation
    manager.registerObject("sidebar:nav-items", "marketplace", {
      title: "Marketplace",
      path: "/admin/marketplace",
      icon: ShoppingBag,
      order: 1000,
      permissions: ["admin.view"],
    });

    // Auto-load installed plugins
    const savedUrls = RemoteLoader.getInstalledUrls();
    savedUrls.forEach((url) => {
      RemoteLoader.loadAndRegister(url, manager).catch(console.error);
    });
  },
});
```

### Extension Points

| Extension Point     | Usage                  | Description                       |
| ------------------- | ---------------------- | --------------------------------- |
| `apps:definitions`  | Register marketplace app | Adds `/admin/marketplace` route   |
| `sidebar:nav-items` | Add navigation item    | Adds "Marketplace" to sidebar     |

## Development

### Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- Management UI core system

### Local Development

This is a library plugin and does not run standalone. To develop:

```bash
# From monorepo root
pnpm dev
```

Then navigate to `http://127.0.0.1:3000/admin/marketplace`

### Building

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint
```

## Creating Remote Plugins

Remote plugins must follow the standard Plugin interface:

```typescript
// my-remote-plugin.js (ES module served over HTTP)
import { createPlugin } from "@workspace/plugin-system";

export default createPlugin({
  namespace: "my-remote-plugin",
  type: "feature",
  version: "1.0.0",

  initialize(manager) {
    // Register your components, routes, etc.
    manager.registerComponent("app:header", MyCustomHeader);
  },

  activate() {
    console.log("My remote plugin activated");
  },

  deactivate() {
    console.log("My remote plugin deactivated");
  },
});
```

**Requirements:**

1. Must be a valid ES module
2. Must export a default plugin object
3. Plugin must have an `initialize` function
4. Must be served with proper CORS headers
5. Must be accessible via HTTPS (or HTTP in development)

### Testing Remote Plugins Locally

1. Create a plugin module in your development environment
2. Serve it locally (e.g., via `python -m http.server 3001`)
3. Use Developer Mode in the marketplace to load it:
   ```
   http://localhost:3001/my-plugin.js
   ```

## Usage Examples

### Try a Plugin (Temporary)

```typescript
// Load without persisting
await RemoteLoader.loadAndRegister(
  "https://example.com/plugin.js",
  manager
);
```

### Install a Plugin (Persistent)

```typescript
// Load and persist to localStorage
await RemoteLoader.loadAndRegister(
  "https://example.com/plugin.js",
  manager
);
RemoteLoader.persist("https://example.com/plugin.js");
```

### Uninstall a Plugin

```typescript
// Remove from localStorage (plugin remains loaded until reload)
RemoteLoader.remove("https://example.com/plugin.js");
```

### Get Installed Plugins

```typescript
const installedUrls = RemoteLoader.getInstalledUrls();
console.log(installedUrls); // ['https://example.com/plugin1.js', ...]
```

## Configuration

### Environment Variables

No environment variables required for basic functionality.

For production marketplace with remote registry:

```bash
VITE_MARKETPLACE_API_URL=https://api.example.com/marketplace
```

### Permissions

The marketplace requires the `admin.view` permission to access. Update your permission system to grant this permission to administrators.

## Integration

### Adding to Plugin Registry

Update `plugins/index.ts`:

```typescript
export * from "./admin-marketplace";
```

### Registering in Application

The plugin is automatically registered when imported from `plugins/index.ts`:

```typescript
import { adminMarketplacePlugin } from "@workspace/plugins";

// Plugin will be initialized by the PluginManager
```

## Dependencies

### Workspace Dependencies

- `@workspace/plugin-system` - Plugin infrastructure
- `@workspace/ui` - UI components (Button, Card, Input, etc.)
- `lucide-react` - Icons (ShoppingBag)
- `react` - UI library

### External Dependencies

None

## Future Enhancements

### Recommended Production Features

1. **Remote Plugin Registry API**

   - Fetch plugin list from backend API
   - Support plugin search and filtering
   - Display download counts, ratings, reviews

2. **Plugin Verification**

   - Hash verification for plugin integrity
   - Code signing for trusted publishers
   - Plugin sandboxing for untrusted sources

3. **Plugin Metadata**

   - Screenshots and documentation
   - Changelog and version history
   - Dependency requirements

4. **Enhanced Security**

   - Plugin permissions system
   - OAuth/API key authentication
   - Rate limiting for plugin loading

5. **Plugin Management**
   - Enable/disable installed plugins without uninstalling
   - Plugin update notifications
   - Automatic updates

## Troubleshooting

### Plugin Not Loading

**Symptoms:** Plugin fails to load, error in console

**Causes:**

- Invalid plugin format (not exporting default plugin)
- CORS headers not set on remote server
- Network/connectivity issues
- Plugin code has errors

**Solutions:**

1. Check browser console for detailed error messages
2. Verify the plugin URL is accessible and returns valid JavaScript
3. Ensure the server sets proper CORS headers
4. Verify the plugin exports a default object with `initialize` method

### Plugin Not Appearing After Install

**Symptoms:** Installed plugin doesn't appear on next page load

**Causes:**

- localStorage not available
- Plugin URL became inaccessible
- Plugin code has errors preventing initialization

**Solutions:**

1. Check browser console on page load
2. Verify localStorage contains the plugin URL
3. Check that the plugin URL is still accessible
4. Try uninstalling and reinstalling the plugin

### Developer Mode URL Not Working

**Symptoms:** Custom URL fails to load

**Causes:**

- CORS issues with local development server
- Invalid URL format
- Plugin not served correctly

**Solutions:**

1. Ensure your local server sets CORS headers:
   ```
   Access-Control-Allow-Origin: *
   ```
2. Use the correct URL format (include protocol)
3. Verify the plugin file is being served correctly

## Related Documentation

- [Plugin System Overview](/plugins/README.md)
- [Creating Plugins Guide](/docs/workflows/ADDING_PLUGINS.md)
- [Extension Points Catalog](/plugins/core/README.md)
- [UI Components](/packages/ui/README.md)

## License

Part of the Management UI project.

## Changelog

### 1.0.0 (2026-01-19)

- Initial plugin release
- Dynamic plugin loading with `import()`
- Plugin marketplace UI
- Try/Install functionality
- Developer mode for custom URLs
- localStorage persistence
- Auto-load on initialization
