# Community Plugin Template

This is a template for creating community plugins for the Management UI.

## Quick Start

### Option 1: Within the Monorepo (Recommended)

1. **Copy the template to plugins directory:**
   ```bash
   # IMPORTANT: Copy to plugins/ directory so it's in the workspace
   cp -r plugins/community-plugin-template plugins/my-plugin
   cd plugins/my-plugin
   ```

2. **Update `package.json`:**
   - Change `name` to `@community/your-plugin-name`
   - Update `pluginMetadata` with your plugin's information
   - Update `author` and `repository` fields

3. **Install dependencies (from monorepo root):**
   ```bash
   # From the monorepo root directory
   cd ../..
   pnpm install --no-frozen-lockfile
   ```
   
   **Important:** 
   - `@workspace/*` packages are provided by the host application (peerDependencies)
   - Only `devDependencies` (like `rollup`, `vite`, etc.) need to be installed
   - `--no-frozen-lockfile` is needed when adding new packages to the workspace

4. **Build the plugin:**
   ```bash
   cd plugins/my-plugin
   pnpm build
   ```

### Option 2: Standalone (Outside Monorepo)

If you're developing outside the monorepo:

1. **Copy/clone the template**
2. **Update `package.json`** (same as above)
3. **Install only devDependencies:**
   ```bash
   # Install only build tools, NOT @workspace packages
   pnpm install --ignore-workspace --no-frozen-lockfile
   # Note: This will fail for @workspace/* packages - that's expected!
   # They will be provided by the host application at runtime
   ```
4. **Build:**
   ```bash
   pnpm build
   ```

**⚠️ Important:** `@workspace/*` packages are **peerDependencies** - they are provided by the Management UI host application at runtime, not installed during build.

5. **Test locally:**
   ```bash
   # Serve the built plugin
   npx http-server dist --cors -p 5173

   # In the Management UI, use Developer Mode to load:
   # http://127.0.0.1:5173/my-plugin.mjs
   ```

## Troubleshooting

### "Cannot find package 'rollup'" or "Cannot find module 'vite'"
**Solution:** 
1. Make sure your plugin is in the `plugins/` directory (within the workspace)
2. Run `pnpm install --no-frozen-lockfile` from the monorepo root
3. The `rollup` and `vite` packages are in `devDependencies` and need to be installed

### "@workspace/query is not in the npm registry"
**This is expected!** `@workspace/*` packages are provided by the host application at runtime. They are `peerDependencies`, not regular dependencies. You don't need to install them - just make sure your plugin is loaded in the Management UI context.

### "Lockfile doesn't match package.json"
**Solution:** Run `pnpm install --no-frozen-lockfile` from the monorepo root when adding a new plugin to the workspace.

### Build succeeds but plugin doesn't load
- Check browser console for errors
- Verify the plugin URL in Developer Mode
- Ensure all `@workspace/*` imports are in `peerDependencies` (not `dependencies`)

## Quick Checklist

After copying the template:
- [ ] Plugin is in `plugins/your-plugin-name/` directory
- [ ] `package.json` updated (name, metadata)
- [ ] `pnpm install --no-frozen-lockfile` run from monorepo root
- [ ] `pnpm build` succeeds
- [ ] Plugin file exists in `dist/your-plugin.mjs`

## Project Structure

```
my-plugin/
├── src/
│   ├── index.ts              # Plugin entry point
│   └── views/
│       └── MyPluginView.tsx  # Main view component
├── package.json              # Package configuration with pluginMetadata
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
└── README.md                 # This file
```

## Plugin Metadata

The `pluginMetadata` in `package.json` is used by the Marketplace:

```json
{
  "pluginMetadata": {
    "id": "my-plugin",
    "name": "My Community Plugin",
    "description": "Description of what this plugin does",
    "category": "feature",
    "icon": "Puzzle",
    "tags": ["example", "community"],
    "workspaceDependencies": {
      "@workspace/plugin-system": ">=1.0.0"
    }
  }
}
```

### Fields

| Field | Description |
|-------|-------------|
| `id` | Unique plugin identifier |
| `name` | Display name in Marketplace |
| `description` | Short description |
| `category` | One of: `feature`, `theme`, `integration`, `utility`, `experimental` |
| `icon` | Icon name from lucide-react |
| `tags` | Search tags |
| `workspaceDependencies` | Version constraints for compatibility |

## Development

### Available Scripts

- `npm run dev` - Build with watch mode
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking

### Using Workspace Packages

Your plugin can use packages from `@workspace/*` and some external libraries:

```typescript
// UI Components
import { Button, Card } from "@workspace/ui/components";

// Data fetching
import { useGetMyEventsQuery } from "@workspace/query";

// Routing
import { useNavigate } from "@workspace/router";

// Translations
import { useI18n } from "@workspace/i18n";

// Icons (available)
import { BarChart3, Calendar } from "lucide-react";
```

**⚠️ Important:** 
- These packages are NOT bundled with your plugin. They are provided by the host application at runtime.
- **Not all npm packages are available!** See [Available Packages Guide](https://github.com/opencast/management-ui/blob/main/docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md) for the complete list.
- If you need a package that's not listed, add it to your `dependencies` (not `peerDependencies`) to bundle it with your plugin.

### GraphQL Extension

To extend core GraphQL queries, add `.graphql` files to your `src/` directory:

```graphql
# src/gql/my-fields.graphql
fragment MyPluginFields on Event {
  myCustomField
  anotherField
}
```

These fragments are automatically extracted during build and registered with the FragmentRegistry.

## JAR Deployment Notes

If you package this plugin into an Opencast JAR (Http-Alias/Http-Classpath):

- Copy both the `.mjs` and `.css` from `dist/` into the JAR under `static/plugins/<plugin-id>/`.
- If you import assets with `?url` (e.g. SVGs), also copy `dist/assets/**` to
  `static/plugins/<plugin-id>/assets/`.
- The Management UI will automatically load `<plugin-id>.css` next to `<plugin-id>.mjs`
  when the plugin is loaded.
- If you provide translations, place them under `locales/<namespace>/<lng>.json` and set
  the `Management-Plugin-I18n` header in your backend bundle. The core will then load
  those namespaces from `/static/plugins/<plugin-id>/locales/`.

### Optional Backend Module

This template includes an optional backend module under `backend/` that:
- Copies `dist/` into the JAR under `static/plugins/<plugin-id>/`
- Copies `dist/assets/**` into `static/plugins/<plugin-id>/assets/`
- Copies `locales/**` into `static/plugins/<plugin-id>/locales/`
- Sets `Management-Plugin` and `Management-Plugin-I18n` headers

Update `pluginId` and `pluginI18nNamespaces` in `backend/pom.xml` to match your plugin.

### JAR Build Checklist

- [ ] `pnpm build` produced `dist/<plugin-id>.mjs` and `dist/<plugin-id>.css`
- [ ] JAR copies those files to `static/plugins/<plugin-id>/`
- [ ] JAR copies `dist/assets/**` to `static/plugins/<plugin-id>/assets/` (if any)
- [ ] (If i18n) JAR copies `locales/**` to `static/plugins/<plugin-id>/locales/`
- [ ] `jar tf <jar-file> | grep static/plugins/<plugin-id>/<plugin-id>.mjs` returns a match
- [ ] After deploy, `GET /management-ui/static/plugins/<plugin-id>/<plugin-id>.mjs` returns 200

## Publishing

### GitHub Releases + jsDelivr

1. **Create a GitHub repository** for your plugin

2. **Push your code:**
   ```bash
   git push origin main
   ```

3. **Create a release tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Your plugin is now available at:**
   ```
   https://cdn.jsdelivr.net/gh/YOUR_ORG/YOUR_REPO@v1.0.0/dist/my-plugin.mjs
   ```

5. **Register in the community registry:**
   Submit a PR to the [Management UI Registry](https://github.com/opencast/management-ui-registry).

### Automated Releases

Use the included GitHub Action (`.github/workflows/release.yml`) to automatically build and upload on tag push.

## Best Practices

1. **Namespace your registrations** to avoid conflicts:
   ```typescript
   manager.registerObject("sidebar:nav-items", "my-org:my-feature", {...});
   ```

2. **Handle errors gracefully** - don't crash the host application

3. **Use the host's UI components** for consistent styling

4. **Test with multiple themes** to ensure compatibility

5. **Keep bundle size small** - don't bundle large dependencies

6. **Document your extension points** if you create any

## License

MIT
