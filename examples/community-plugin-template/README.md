# Community Plugin Template

This is a template for creating plugins for the Management UI.

## Quick Start

### Option 1: Within the Monorepo (Recommended)

1. **Copy the template:**
   ```bash
   cp -r plugins/community-plugin-template plugins/my-plugin
   cd plugins/my-plugin
   ```

2. **Update `plugin.json`** — this is the canonical plugin manifest:
   - Set `id`, `name`, `namespace`, `description`
   - Set `author` and `repositoryUrl`
   - See [plugin.schema.json](../../packages/plugin-system/src/schemas/plugin.schema.json) for all fields

3. **Update `package.json`:**
   - Change `name` to `@community/your-plugin-name`

4. **Install dependencies (from monorepo root):**
   ```bash
   cd ../..
   pnpm install --no-frozen-lockfile
   ```

5. **Build the plugin:**
   ```bash
   cd plugins/my-plugin
   pnpm build
   ```

### Option 2: Standalone (Outside Monorepo)

1. **Copy/clone the template**
2. **Update `plugin.json` and `package.json`** (same as above)
3. **Install only devDependencies:**
   ```bash
   pnpm install --ignore-workspace --no-frozen-lockfile
   ```
4. **Build:** `pnpm build`
5. **Test locally:**
   ```bash
   npx http-server dist --cors -p 5173
   # Load in Management UI Developer Mode: http://127.0.0.1:5173/my-plugin.mjs
   ```

`@workspace/*` packages are **peerDependencies** — provided by the host at runtime, not installed during build.

## Project Structure

```
my-plugin/
├── src/
│   ├── index.ts              # Plugin entry point (default export)
│   ├── styles/index.css       # Plugin Tailwind CSS
│   └── views/
│       └── MyPluginView.tsx   # Main view component
├── plugin.json                # Plugin manifest (source of truth)
├── package.json               # npm package config
├── vite.config.ts             # Build configuration
├── tailwind.config.ts         # Plugin Tailwind config
└── backend/                   # Optional: JAR packaging for production
    └── pom.xml
```

## Plugin Manifest (`plugin.json`)

The manifest is the source of truth for the runtime, marketplace, and registry:

```json
{
  "$schema": "../../packages/plugin-system/src/schemas/plugin.schema.json",
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What this plugin does.",
  "author": { "name": "Your Name" },
  "namespace": "my-plugin",
  "type": "app",
  "category": "feature",
  "apiVersion": ">=1.0.0",
  "entry": "dist/my-plugin.mjs",
  "css": "dist/my-plugin.css",
  "workspaceDependencies": {
    "@workspace/plugin-system": ">=1.0.0",
    "@workspace/ui": ">=1.0.0"
  }
}
```

| Field | Description |
|-------|-------------|
| `id` | Globally unique plugin identifier |
| `namespace` | Org/feature namespace for activation filtering |
| `type` | Plugin type: `app`, `sidebar`, `footer`, `config`, `theme`, etc. |
| `apiVersion` | Minimum core API version required |
| `entry` | Built .mjs entry point |
| `modules` | For multi-entry plugins (replaces `entry`/`type`) |

## Development

### Available Scripts

- `pnpm dev` — Build with watch mode
- `pnpm build` — Production build
- `pnpm lint` — Run ESLint
- `pnpm typecheck` — TypeScript type checking

### Using Workspace Packages

```typescript
import { Button, Card } from "@workspace/ui/components";
import { useGetMyEventsQuery } from "@workspace/query";
import { useNavigate } from "@workspace/router";
import { useI18n } from "@workspace/i18n";
import { BarChart3 } from "lucide-react";
```

These are NOT bundled — provided by the host at runtime.

See [Available Packages Guide](../../docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md) for the complete list.

### Styling

Follow the [Plugin Styling Contract](../../docs/PLUGIN_STYLING_CONTRACT.md):
- Use semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.)
- Use shared UI components from `@workspace/ui`
- Never hardcode colors

## JAR Deployment

The optional `backend/` module packages the plugin as an OSGi JAR:
- Copies `dist/*.mjs` and `dist/*.css` into the JAR
- Sets `Management-Plugin` header for backend discovery
- See [Community Plugin Development Guide](../../docs/COMMUNITY_PLUGIN_DEVELOPMENT.md) for full JAR deployment instructions

## Publishing

1. Push to GitHub, tag a release (`git tag v1.0.0`)
2. Plugin available via jsDelivr: `https://cdn.jsdelivr.net/gh/ORG/REPO@v1.0.0/dist/my-plugin.mjs`
3. Register in the [Community Registry](https://github.com/opencast/management-ui-registry)

Use `.github/workflows/release.yml` for automated builds on tag push.

## License

MIT
