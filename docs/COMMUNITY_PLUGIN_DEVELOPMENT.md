# Community Plugin Development Guide

**Version:** 1.0.0  
**Last Updated:** 2026-01-21

For a full list of plugin-related docs (JAR deploy, registry, loading), see [Plugin Development Index](PLUGIN_DEVELOPMENT_INDEX.md).

## Overview

This guide explains how to create, test, and publish community plugins for the Management UI. Community plugins are dynamically loaded ES modules that extend the application at runtime without requiring a rebuild of the core application.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Management UI Core                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Plugin      │  │ Fragment    │  │ Security            │  │
│  │ Manager     │  │ Registry    │  │ Service             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         ▲                ▲                    ▲              │
│         │                │                    │              │
│         │    ┌───────────┴────────────────────┤              │
│         │    │                                │              │
│  ┌──────┴────┴────────────────────────────────┴──────────┐  │
│  │                    Remote Loader                       │  │
│  │  - URL validation      - Fragment auto-registration    │  │
│  │  - Version checking    - Plugin persistence            │  │
│  └───────────────────────────────────────────────────────┘  │
│                            ▲                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ dynamic import()
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                   Community Plugin                           │
│  ┌─────────────────────────┴─────────────────────────────┐  │
│  │  plugin.mjs (ES Module)                                │  │
│  │  - default export: Plugin object                       │  │
│  │  - __injected_fragments__: GraphQL fragments           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  External Dependencies (NOT bundled):                        │
│  - react, react-dom                                          │
│  - @workspace/plugin-system                                  │
│  - @workspace/ui                                             │
│  - @workspace/query                                          │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Use the Template

```bash
# Clone the community plugin template
git clone https://github.com/opencast/community-plugin-template my-plugin
cd my-plugin

# Install dependencies
npm install

# Build the plugin
npm run build
```

**⚠️ Before you start:** Read the [Available Packages Guide](./COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md) to understand which packages you can import. Not all npm packages are available!

### 2. Edit Plugin Configuration

Update `package.json`:

```json
{
  "name": "@community/my-plugin",
  "version": "1.0.0",
  "pluginMetadata": {
    "id": "my-plugin",
    "name": "My Amazing Plugin",
    "description": "Does amazing things",
    "category": "feature",
    "icon": "Star",
    "tags": ["analytics", "dashboard"],
    "workspaceDependencies": {
      "@workspace/plugin-system": ">=1.0.0"
    }
  }
}
```

### 3. Implement Your Plugin

Edit `src/index.ts`:

```typescript
import { createPlugin } from "@workspace/plugin-system";
import { MyView } from "./views/MyView";

export default createPlugin({
  namespace: "my-plugin",
  type: "app",
  version: "1.0.0",

  initialize(manager) {
    // Register your app
    manager.registerObject("apps:definitions", "my-plugin-app", {
      id: "my-plugin-app",
      name: "My Plugin",
      routePath: "/my-plugin",
      component: MyView,
    });

    // Register sidebar navigation
    manager.registerObject("sidebar:nav-items", "my-plugin-nav", {
      title: "My Plugin",
      path: "/my-plugin",
      order: 100,
    });
  },

  activate() {},
  deactivate() {},
});
```

### 4. Test Locally

```bash
# Build with watch mode
npm run dev

# In another terminal, serve the plugin
npx http-server dist --cors -p 5173

# Your plugin is now available at:
# http://127.0.0.1:5173/my-plugin.mjs
```

In the Management UI:
1. Go to Admin > Marketplace
2. In the Developer Mode section, enter: `http://127.0.0.1:5173/my-plugin.mjs`
3. Click "Try" to test, or "Install" to persist

### 5. Local Development with Hot Reload

When developing plugins locally, you can use the Marketplace's Developer Mode for hot reloading:

1. **Start your plugin in watch mode:**
   ```bash
   npm run dev
   ```

2. **In the Marketplace, add your plugin URL:**
   - Go to Admin > Marketplace
   - In "Local Development Plugins" section, the plugin should appear automatically
   - Or manually enter: `http://127.0.0.1:5173/my-plugin.mjs`

3. **Hot Reload:**
   - Vite automatically reloads when you save changes
   - The Marketplace will detect and reload the plugin automatically
   - No manual refresh needed!

**Note:** For local plugins, you can store them in `localStorage` via the Marketplace UI, or they'll be discovered automatically if served from `127.0.0.1`.

## Plugin Structure

### Recommended Directory Structure

```
my-plugin/
├── src/
│   ├── index.ts              # Plugin entry point (required)
│   ├── views/                # View components
│   │   └── MyView.tsx
│   ├── components/           # Reusable components
│   ├── hooks/                # Custom hooks
│   ├── services/             # Business logic
│   └── gql/                  # GraphQL fragments (optional)
│       └── my-fields.graphql
├── package.json              # With pluginMetadata
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### A1: Developing a plugin inside the management-ui monorepo (with own CSS)

For fast iteration you can also develop a plugin **directly inside the monorepo** and still keep it cleanly separated from OSS core and production builds.

#### A1.1 Create the plugin from the template

In the monorepo root:

```bash
cp -r plugins/community-plugin-template plugins/my-org-plugin
```

The template already provides:

- `plugins/my-org-plugin/index.ts` (or `.local-plugins/my-org-plugin/index.ts`) → re-exports everything from `./src`
- `plugins/my-org-plugin/src/index.ts` → plugin entry point (default export is the plugin object)
- `plugins/my-org-plugin/src/styles/index.css` + `tailwind.config.ts` + `postcss.config.mjs`  
  → the plugin builds and owns **its own Tailwind CSS**, independent of the host app.

#### A1.2 Register the plugin in the barrel

Edit `plugins/index.ts` in the monorepo and add a single export:

```ts
export * from "./core";
export * from "./admin-marketplace";
export * from "./example-university";
export * from "./my-org-plugin"; // local A1 plugin
```

**Note:** The template includes a root `index.ts` that re-exports from `./src`, so you can import from the plugin directory directly. TypeScript will resolve types correctly through this forwarder.

This makes the plugin visible as part of `@workspace/plugins`, so the existing loader (`loadPlugins.ts`) can pick it up.

#### A1.3 Adjust namespace, route and sidebar entry

In `plugins/my-org-plugin/src/index.ts`:

- Set a meaningful namespace and route:

```ts
const myPlugin = createPlugin({
  namespace: "my-org",   // your organisation or feature area
  type: "app",
  version: "1.0.0",
  // ...
  initialize(manager) {
    manager.registerObject("apps:definitions", "my-org:app", {
      id: "my-org-app",
      name: "My Org Plugin",
      routePath: "/my-org",
      component: MyPluginView,
    });

    manager.registerObject("sidebar:nav-items", "my-org:nav", {
      title: "My Org Plugin",
      path: "/my-org",
      // icon: YourIcon,
      order: 100,
    });
  },
});
```

- Make sure your `AppConfig` enables the namespace (via `pluginNamespace`, e.g. `["core", "admin", "my-org"]`).

#### A1.4 Use Tailwind classes in your views

Because `src/index.ts` imports `./styles/index.css`, you can freely use Tailwind classes in your plugin’s React components (e.g. `MyPluginView.tsx`) without touching the host app’s Tailwind config:

```tsx
export const MyPluginView: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Org Dashboard</h1>
      <p className="text-muted-foreground">
        This view is styled using the plugin's own Tailwind build.
      </p>
      {/* ... */}
    </div>
  );
};
```

Tailwind scans only the plugin’s own `src/**/*.{ts,tsx}` according to `tailwind.config.ts`, so gitignored or external plugin files do not affect the main app’s build.

#### A1.5 Run and test

Start the core app as usual:

```bash
pnpm dev --filter=management-ui-core
```

Then open the route you configured (e.g. `/management-ui/my-org`).  
The plugin behaves like any other built-in app, but:

- its code lives under `plugins/my-org-plugin/`,
- its styles are fully isolated in its own Tailwind build,
- you can later move it out into a standalone repo and use it as a remote/community plugin without changing its internal structure.

### A2: Build plugin locally and test via URL (127.0.0.1)

After developing your plugin directly in the monorepo (A1), you can test it as a **standalone remote plugin** without removing it from the monorepo. This validates that it works when loaded dynamically via URL, just like it would in production.

#### A2.1 Remove plugin from the barrel (temporarily)

Edit `plugins/index.ts` and **comment out or remove** the A1 export:

```ts
export * from "./core";
export * from "./admin-marketplace";
export * from "./example-university";
// export * from "./my-org-plugin"; // Temporarily disabled for A2 testing
```

This ensures the plugin is **not** loaded as a built-in plugin, so you can test it as a remote module instead.

#### A2.2 Build the plugin

In the plugin directory:

```bash
cd plugins/my-org-plugin
pnpm build
```

This creates:
- `dist/my-plugin.mjs` - The ES module bundle
- `dist/my-plugin.css` - The compiled Tailwind CSS (if you use Tailwind)

**Note:** The build uses the plugin's own `vite.config.ts`, which:
- Externalizes React and `@workspace/*` packages (provided by host)
- Bundles your plugin code and styles
- Outputs a single `.mjs` file ready for remote loading

#### A2.3 Serve the plugin via HTTP

In a separate terminal, serve the `dist` directory:

```bash
# From plugins/my-org-plugin
npx http-server dist --cors -p 5173
```

Or use any other static file server with CORS enabled. The plugin is now available at:

```
http://127.0.0.1:5173/my-plugin.mjs
```

**Important:** The Marketplace allows loading from `127.0.0.1` in development mode for security reasons.

#### A2.4 Load plugin via Marketplace Developer Mode

1. **Start the Management UI Core:**
   ```bash
   pnpm dev --filter=management-ui-core
   ```

2. **Open the Marketplace:**
   - Navigate to Admin > Marketplace
   - Scroll to the "Developer Mode" section

3. **Enter your plugin URL:**
   ```
   http://127.0.0.1:5173/my-plugin.mjs
   ```

4. **Test the plugin:**
   - Click **"Try"** to load it temporarily (not persisted)
   - Or click **"Install"** to save it to `localStorage` (persists across page reloads)

5. **Verify it works:**
   - Check the browser console for any errors
   - Navigate to your plugin's route (e.g., `/management-ui/my-plugin`)
   - Verify the UI renders correctly with your Tailwind styles
   - **Note:** The plugin's CSS (`my-plugin.css`) is automatically loaded alongside the JS module

**Important:** If you previously installed the plugin (clicked "Install"), it will be **automatically loaded from localStorage** on the next page refresh, even before you manually add it again. To test a fresh load, use "Try" or clear `localStorage` first.

#### A2.5 Hot reload during development

For faster iteration, you can use watch mode:

```bash
# Terminal 1: Build plugin in watch mode
cd plugins/my-org-plugin
pnpm dev  # Runs: vite build --watch

# Terminal 2: Serve the dist directory
npx http-server dist --cors -p 5173

# Terminal 3: Run Management UI Core
pnpm dev --filter=management-ui-core
```

When you save changes:
- Vite rebuilds the plugin automatically
- The Marketplace detects changes and reloads the plugin
- No manual refresh needed!

**Note:** The Marketplace's Developer Mode automatically adds cache-busting (`?_t=timestamp`) in development, so changes are picked up immediately.

**CSS Loading:** When you load a plugin via URL, the RemoteLoader automatically tries to load the corresponding CSS file (e.g., `my-plugin.css` alongside `my-plugin.mjs`). This ensures your plugin's Tailwind styles are applied correctly, even when the plugin is gitignored and loaded remotely.

#### A2.6 Persist plugin in localStorage (optional)

If you click "Install" in the Marketplace, the plugin URL is saved to `localStorage` under the key `installed_plugins`. The plugin will be automatically loaded on the next page refresh, even if you close and reopen the browser.

To remove it later:
- Go back to Marketplace > Developer Mode
- Click "Uninstall" next to the installed plugin URL

**Auto-loading on startup:** Installed plugins are automatically loaded from `localStorage` when the Management UI Core starts. This happens in `admin-marketplace/src/index.ts` during plugin initialization, so you don't need to manually load them again after a page refresh.

### Phase 2: Move plugin to its own repository (clean separation)

After successfully testing your plugin locally (A2), you should move it out of the monorepo into its own repository. This provides:

- ✅ **Clean separation:** Plugin is no longer part of the core monorepo
- ✅ **Independent versioning:** Plugin can have its own release cycle
- ✅ **Own CI/CD:** Plugin can have its own build and deployment pipeline
- ✅ **Private repositories:** University-specific plugins can live in private repos
- ✅ **Community distribution:** Ready for A4 (Community Registry) or A3 (JAR deployment)

#### Phase 2.1 Remove plugin from monorepo barrel

**Permanently remove** the plugin export from `plugins/index.ts`:

```ts
export * from "./core";
export * from "./admin-marketplace";
export * from "./example-university";
// export * from "./my-org-plugin"; // REMOVED - now in own repo
```

**Important:** This ensures the plugin is **never** loaded as a built-in plugin anymore. From now on, it will only be loaded as a remote/JAR/Registry plugin.

#### Phase 2.2 Copy plugin to new repository

**Option A: New standalone repository (recommended for community plugins)**

```bash
# Create new repository
mkdir my-org-plugin
cd my-org-plugin
git init

# Copy plugin files from monorepo
cp -r /path/to/mui-25-ai/plugins/my-org-plugin/* .

# Remove monorepo-specific files (if any)
# Keep: src/, package.json, vite.config.ts, tailwind.config.ts, etc.
# Remove: any monorepo workspace references

# Commit and push
git add .
git commit -m "Initial commit: My Org Plugin"
git remote add origin https://github.com/your-org/my-org-plugin.git
git push -u origin main
```

**Option B: Move to `.local-plugins/` (for private university repos)**

If you want to keep it in the monorepo but separate it from core plugins:

```bash
# Create .local-plugins directory (gitignored)
mkdir -p .local-plugins

# Move plugin there
mv plugins/my-org-plugin .local-plugins/my-org-plugin

# Update .gitignore to ensure .local-plugins is ignored
echo ".local-plugins/" >> .gitignore
```

**Automatic discovery (dev only):** When you run the Management UI Core in **development** (`pnpm dev --filter=management-ui-core`), the Vite dev server:

1. **Scans** `.local-plugins/` for subdirectories that contain a `dist/` folder with a `*.mjs` file (i.e. you must run `pnpm build` in each plugin first).
2. **Serves** each plugin's `dist/` at `/local-plugins/<plugin-dir-name>/` (e.g. `http://127.0.0.1:5173/management-ui/local-plugins/my-org-plugin/my-plugin.mjs`).
3. **Exposes** a manifest at `/local-plugins/manifest.json` listing all discovered plugins.

The **core** (PluginInitializer) fetches this manifest on startup in dev and loads each listed plugin. You do **not** need the Admin Marketplace — just build the plugin, put it in `.local-plugins/<name>/`, start the core in dev, and refresh the app. (The Marketplace is optional for browsing/installing other plugins.)

**Workflow for Option B:**

```bash
# 1. Build the plugin (from .local-plugins/my-org-plugin)
cd .local-plugins/my-org-plugin
pnpm build

# 2. Start Management UI Core (from monorepo root)
pnpm dev --filter=management-ui-core
```

Plugins in `.local-plugins/` are then loaded automatically. To add or update a plugin, rebuild it and refresh the browser.

**Activating without the Marketplace:** You do **not** need the Admin Marketplace. The core (PluginInitializer) fetches `/local-plugins/manifest.json` in dev and loads plugins listed there. So: build the plugin in `.local-plugins/<name>/`, start the core in dev (`pnpm dev --filter=management-ui-core`), and refresh — the plugin is active if its namespace is enabled (see below). The Marketplace is optional (for browsing/installing other plugins).

**Selective loading (which .local-plugins load):** Loading is filtered by **`config.app.pluginNamespace`**. The folder name under `.local-plugins/` is treated as the plugin **namespace** (e.g. `.local-plugins/univie/` → namespace `univie`). Only manifest entries whose `namespace` is in the enabled list are loaded. So:

- Add the namespace to `pluginNamespace` to load that folder (e.g. `["core", "episodes", "series", "upload", "univie"]`). This is usually done by a **config plugin** (e.g. `univie:config`) that merges its namespace into the app config.
- If `pluginNamespace` is missing or empty, all discovered .local-plugins are loaded (backward compatible).
- Same config drives built-in plugin filtering (e.g. `univie:sidebar` loads only when `univie` is in `pluginNamespace`).

**Config plugin first (two-phase load):** The default config includes **`"config"`** in `pluginNamespace`. Put a small plugin in **`.local-plugins/config/`** that only registers `app:config` (theme, logo, and **which other namespaces to load**, e.g. `pluginNamespace: [..., "univie", "tuwien"]`). The core loads .local-plugins in two phases: (1) load entries matching current config (so `.local-plugins/config/` loads); (2) re-merge config from the manager (your config plugin has now registered) and load remaining .local-plugins (e.g. univie, tuwien). That way the config plugin is not inside univie and doesn’t depend on univie being loaded first.

**Split bundles (multiple .mjs per folder):** You can put **multiple** `.mjs` files in one folder’s `dist/` (e.g. `dist/plugin-univie.mjs`, `dist/plugin-univie-footer.mjs`). The manifest gets one entry per `.mjs`; each entry has the same `namespace` (the folder name). When that namespace is enabled, **all** of those bundles are loaded. Use names **`plugin-<namespace>-<type>.mjs`** so the manifest gets a **type** from the filename; only bundles whose type is in the config's types for that namespace are loaded (e.g. `univie: { types: ["sidebar", "footer"] }` loads only those .mjs files). This keeps initial load smaller.

**Note:** `.local-plugins/` is gitignored, so this is only for local development. For production, you'd still deploy via JAR (A3) or Registry (A4).

**`.local-plugins/` as its own repository (another way):** Yes. You can make `.local-plugins/` a **separate git repo** containing your personal or org plugins (e.g. univie, tuwien, config). Clone it into `.local-plugins/` on each dev machine or in CI. Then:

- **Dev:** Build each plugin, run core; the Vite dev server serves from `.local-plugins/` and the manifest lists them.
- **Production:** Either (a) build from that clone and package plugins as JARs (see A3 and "Packaging univie as JAR" below), or (b) use that repo only for development and use JAR / Registry for production.

This gives you versioned, shareable plugin code without putting it in the main monorepo.

#### Phase 2.3 Update plugin configuration

In the new repository, ensure your plugin is self-contained:

**`package.json`:**
```json
{
  "name": "@community/my-org-plugin",
  "version": "1.0.0",
  "private": false,  // Set to false if publishing to npm/registry
  "scripts": {
    "build": "vite build",
    "dev": "vite build --watch",
    "prepublishOnly": "pnpm build"
  }
}
```

**`plugin-metadata.json`:**
```json
{
  "id": "my-org-plugin",
  "name": "My Org Plugin",
  "description": "Plugin for my organization",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "category": "feature",
  "repositoryUrl": "https://github.com/your-org/my-org-plugin",
  "workspaceDependencies": {
    "@workspace/plugin-system": ">=1.0.0",
    "@workspace/ui": ">=1.0.0"
  }
}
```

#### Phase 2.4 Set up independent build workflow

The plugin now has its own:
- ✅ **Tailwind build** (via `tailwind.config.ts`)
- ✅ **Vite build** (via `vite.config.ts`)
- ✅ **TypeScript config** (via `tsconfig.json`)
- ✅ **Release workflow** (via GitHub Actions, GitLab CI, etc.)

**Example GitHub Actions workflow (`.github/workflows/release.yml`):**

```yaml
name: Release Plugin

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-artifact@v3
        with:
          name: plugin-dist
          path: dist/
```

#### Phase 2.5 Test plugin from new location

1. **Build the plugin:**
   ```bash
   cd /path/to/my-org-plugin
   pnpm build
   ```

2. **Serve it (for testing):**
   ```bash
   npx http-server dist --cors -p 5173
   ```

3. **Load via Marketplace:**
   - Go to Admin > Marketplace > Developer Mode
   - Enter: `http://127.0.0.1:5173/my-plugin.mjs`
   - Click "Try" or "Install"

4. **Verify it works:**
   - Plugin should load and function exactly as before
   - No more dependency on monorepo barrel exports

#### Phase 2.6 Clean up monorepo (optional)

After confirming the plugin works from its new location:

```bash
# Remove plugin from monorepo (if you moved it, not copied)
rm -rf plugins/my-org-plugin

# Commit the removal
git add plugins/index.ts
git commit -m "Remove my-org-plugin - now in own repository"
```

**Important:** The plugin is now **completely independent** of the monorepo. It can be:
- Deployed as a JAR (A3)
- Published to Community Registry (A4)
- Served from a CDN
- Loaded from any URL

### A3: Package plugin as JAR and deploy to production

After moving your plugin to its own repository (Phase 2), you can package it as a **JAR file** that includes both frontend and backend (if needed) for production deployment.

#### A3.1 Build the frontend plugin

First, ensure your frontend plugin is built:

```bash
cd /path/to/my-org-plugin
pnpm build
```

This creates:
- `dist/my-plugin.mjs` - The ES module bundle
- `dist/my-plugin.css` - The compiled Tailwind CSS

#### A3.2 Create a backend module (optional, for backend features)

If your plugin needs backend functionality (GraphQL extensions, REST endpoints, etc.), create a Maven module in the monorepo or in your plugin repository:

**Structure** (plugin in `.local-plugins/` or own repo):
```
.local-plugins/my-org-plugin/backend/
├── pom.xml
└── src/main/java/org/opencastproject/myorg/plugin/
    └── (Java classes)
```

**Example `.local-plugins/my-org-plugin/backend/pom.xml`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <parent>
    <groupId>org.amc.management</groupId>
    <artifactId>management-backend</artifactId>
    <version>1.0-SNAPSHOT</version>
    <relativePath>../../../backend</relativePath>
  </parent>
  <modelVersion>4.0.0</modelVersion>

  <artifactId>my-org-plugin-backend</artifactId>
  <packaging>bundle</packaging>

  <name>My Org Plugin :: Backend</name>

  <build>
    <plugins>
      <!-- Copy frontend plugin to resources -->
      <plugin>
        <artifactId>maven-resources-plugin</artifactId>
        <executions>
          <execution>
            <id>copy-frontend-plugin</id>
            <phase>generate-resources</phase>
            <goals>
              <goal>copy-resources</goal>
            </goals>
            <configuration>
              <outputDirectory>${basedir}/target/classes/static/plugins/my-org</outputDirectory>
              <resources>
                <resource>
                  <directory>${basedir}/../dist</directory>
                  <includes>
                    <include>my-plugin.mjs</include>
                    <include>my-plugin.css</include>
                  </includes>
                  <filtering>false</filtering>
                </resource>
              </resources>
              <skipIfMissing>true</skipIfMissing>
            </configuration>
          </execution>
        </executions>
      </plugin>
      
      <plugin>
        <groupId>org.apache.felix</groupId>
        <artifactId>maven-bundle-plugin</artifactId>
        <configuration>
          <instructions>
            <!-- WICHTIG: Dieser Header sagt dem Backend, dass dies ein Frontend-Plugin ist -->
            <Management-Plugin>my-org</Management-Plugin>
            <!-- Statische Dateien servieren -->
            <Http-Alias>/management-ui</Http-Alias>
            <Http-Classpath>/static/plugins/my-org</Http-Classpath>
          </instructions>
        </configuration>
      </plugin>
    </plugins>
  </build>

  <dependencies>
    <!-- Add your backend dependencies here -->
    <!-- Example: Opencast GraphQL, OSGi, etc. -->
  </dependencies>
</project>
```

**Key points:**
- `Management-Plugin: my-org` header tells the backend to expose this plugin
- `Http-Classpath: /static/plugins/my-org` serves files from the JAR
- Frontend files are copied to `target/classes/static/plugins/my-org/` during build

**Backend POM path fixes (when backend is in `.local-plugins/<plugin>/backend`):**
- Copy-resources directory must point to the frontend `dist` sibling: `<directory>${basedir}/../dist</directory>` (not a path under `.local-plugins/` from repo root).
- If you use the exec plugin to run `pnpm build`, set `workingDirectory` to `${project.basedir}/..` (frontend root) and use `${project.basedir}/../../../node` for node/pnpm so it works when built with `mvn -f .local-plugins/<plugin>/backend/pom.xml`.
- Checkstyle suppressions path from backend: `${project.basedir}/../../../docs/checkstyle/checkstyle-suppressions.xml`.

#### A3.3 Build the JAR

```bash
# From .local-plugins/my-org-plugin/backend
mvn clean install
```

This creates:
- `.local-plugins/my-org-plugin/backend/target/my-org-plugin-backend-1.0-SNAPSHOT.jar`

The JAR contains:
- Your backend Java classes (if any)
- `static/plugins/my-org/my-plugin.mjs` (frontend module)
- `static/plugins/my-org/my-plugin.css` (frontend styles)

#### A3.4 Deploy the JAR

Copy the JAR to your Opencast deployment directory:

```bash
cp .local-plugins/my-org-plugin/backend/target/my-org-plugin-backend-1.0-SNAPSHOT.jar \
   $OPENCAST_HOME/deploy/
```

Opencast will automatically:
- Detect and load the OSGi bundle
- Scan for `Management-Plugin` header
- Generate `/management-tool/ui/config/plugins.json` entry

#### A3.5 Verify backend detection

Check that the backend recognizes your plugin:

```bash
# Check Opencast logs for bundle activation
# Or query the plugins.json endpoint:
curl http://your-opencast-server/management-tool/ui/config/plugins.json
```

Expected response:
```json
{
  "plugins": [
    {
      "name": "my-org-plugin-backend",
      "path": "/static/plugins/my-org",
      "scope": "management_ui_plugin_my_org"
    }
  ]
}
```

#### A3.6 Frontend automatically loads JAR plugins

The Management UI Core automatically:
1. Fetches `/management-tool/ui/config/plugins.json` on startup (via `admin-marketplace` plugin)
2. Converts backend config to plugin URLs (e.g., `/static/plugins/my-org/my-plugin.mjs`)
3. Loads plugins via `RemoteLoader` (same mechanism as A2)
4. Loads CSS files automatically (e.g., `/static/plugins/my-org/my-plugin.css`)

**No manual Marketplace action needed!** JAR plugins are loaded automatically on page load when the `admin-marketplace` plugin initializes.

**Implementation:** The `admin-marketplace` plugin calls `loadJarPlugins()` during its `initialize()` phase and loads all discovered JAR plugins via `RemoteLoader.loadAndRegister()`. This happens automatically after built-in plugins are loaded.

#### A3.7 Verify plugin works

1. **Start Management UI Core:**
   ```bash
   pnpm dev --filter=management-ui-core
   ```

2. **Check browser console:**
   - Should see plugin loading messages
   - No errors related to plugin loading

3. **Navigate to your plugin route:**
   - URL: `/management-ui/my-org` (or whatever you configured)
   - UI should render with your Tailwind styles

#### A3.8 Production deployment

For production:
1. Build frontend: `cd .local-plugins/my-org-plugin && pnpm build`
2. Build backend: `cd .local-plugins/my-org-plugin/backend && mvn clean install`
3. Deploy JAR to `$OPENCAST_HOME/deploy/`
4. Restart Opencast (or wait for hot deployment)
5. Plugin is automatically available - no Marketplace configuration needed!

**Advantages of JAR deployment:**
- ✅ Single deployment unit (frontend + backend)
- ✅ Automatic discovery by backend
- ✅ No manual URL configuration
- ✅ Works in production without CDN/Registry
- ✅ Can include backend GraphQL extensions, REST endpoints, etc.

#### Packaging univie (multi-entry plugin) as JAR

The univie plugin in `.local-plugins/univie/` builds **multiple** `.mjs` files:

- `dist/plugin-univie-sidebar.mjs`
- `dist/plugin-univie-footer.mjs`
- `dist/plugin-univie-landing-page.mjs`
- `dist/plugin-univie-app.mjs`

It also has `themes/univie.css`, `implementations/*/locales/**/*`, and `assets/logo.png`. To package it as a JAR:

1. **Backend module** – Create a Maven module (e.g. `.local-plugins/univie/backend/`) with:
   - **Parent:** Same as other plugin backends (e.g. `management-backend` with `relativePath` to repo `backend/`).
   - **copy-resources:** Copy `../dist/*.mjs` and `../themes/*.css` to `target/classes/static/plugins/univie/`. Optionally copy `../implementations/*/locales/**/*` to a `locales/` subpath and `../assets/**/*` to `assets/univie/` if the UI expects them under the plugin path.
   - **maven-bundle-plugin:** `Management-Plugin: univie`, `Http-Classpath: /static/plugins/univie` (or equivalent so the JAR serves files under `/static/plugins/univie/`).
   - **exec-maven-plugin (optional):** Run `pnpm build` in `../` (frontend root) before copy-resources; use `workingDirectory` `${project.basedir}/..` and pnpm from the monorepo (or from plugin repo if self-contained).

2. **One .mjs URL per JAR plugin (current limitation)** – The backend exposes **one** plugin entry per JAR (path `/static/plugins/univie`). The frontend `jarPluginLoader` builds **one** URL per plugin: `{path}/{pluginDir}.mjs`, e.g. `/static/plugins/univie/univie.mjs`. So either:
   - **Option A:** Add a single entry point `univie.mjs` in the univie build that imports (or dynamic-imports) the four chunks; put that file in `dist/` and have the JAR copy it so the backend serves `/static/plugins/univie/univie.mjs`. Then the core loads one URL and the plugin loads the rest internally.
   - **Option B:** Extend the backend and/or frontend so one JAR can expose multiple modules (e.g. backend lists each `.mjs` under the bundle, or frontend fetches a small manifest from the plugin path and loads each URL). Not implemented today.

3. **Build order** – From repo root: build frontend first (`cd .local-plugins/univie && pnpm build`), then build the backend JAR (`mvn -f .local-plugins/univie/backend/pom.xml clean install`). Deploy the resulting JAR to Opencast `deploy/`.

#### Production options: advantages and disadvantages

| Option | Advantages | Disadvantages |
|--------|-------------|----------------|
| **In-repo** (`plugins/`) | No extra deploy step; always in sync with core; simple CI. | Plugins live in main repo; not suitable for private/org-only code. |
| **`.local-plugins/` as own repo** | Versioned, shareable, separate from core; dev uses same clone, prod can build JARs from it. | Need to clone two repos (core + plugins); CI must checkout plugins repo into `.local-plugins/` to build JARs. |
| **JAR deployment** | Single deploy unit; backend discovers plugins; no CDN/registry; can include backend Java. | One .mjs URL per JAR today (multi-entry like univie needs a single loader .mjs or backend/frontend extension); requires Maven and Opencast deploy. |
| **Registry + URL (A4)** | Community distribution; users install from Marketplace; independent versioning. | Need to host plugin (CDN or server) and maintain registry; version/compat checks on client. |
| **Baked-in registry** | Fixed set of prod URLs shipped with app; no external registry. | Plugin list is part of app build; updates need app redeploy or config override. |

### A4: Publish to Community Registry

After moving your plugin to its own repository (Phase 2), you can publish it to the **Community Registry** to make it available to all Management UI users.

**Note:** A4 is documented later in this guide. See the "Publishing to the Registry" section below.

### Required Exports

Your `src/index.ts` must export:

```typescript
// Default export - the plugin object (REQUIRED)
export default createPlugin({...});

// Optional: __injected_fragments__ is auto-generated if you have .graphql files
```

### Plugin Metadata

Every community plugin should include a `plugin-metadata.json` file in its root directory. This file provides essential information about your plugin for the Marketplace and Registry.

**Required fields:**
- `id`: Unique plugin identifier (lowercase, alphanumeric, hyphens only)
- `name`: Human-readable plugin name
- `description`: Short description of what the plugin does
- `version`: Semantic version (MAJOR.MINOR.PATCH)
- `author`: Author information (at least `name` required)
- `category`: One of: `feature`, `theme`, `integration`, `utility`, `experimental`

**Example `plugin-metadata.json`:**
```json
{
  "id": "my-plugin",
  "name": "My Community Plugin",
  "description": "Short description of what this plugin does.",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com",
    "url": "https://example.com"
  },
  "category": "feature",
  "icon": "Puzzle",
  "tags": ["example", "community"],
  "repositoryUrl": "https://github.com/your-org/your-plugin",
  "homepageUrl": "https://example.com/your-plugin",
  "license": "MIT",
  "workspaceDependencies": {
    "@workspace/plugin-system": ">=1.0.0",
    "@workspace/ui": ">=1.0.0"
  }
}
```

**Validation:**
Use the validator to check your metadata:
```bash
# From the monorepo root
pnpm ts-node packages/plugin-system/src/utils/pluginMetadataValidator.ts
```

See the [Plugin Metadata Schema](../../packages/plugin-system/src/schemas/plugin-metadata.schema.json) for the complete specification.

## Using Workspace Packages

Community plugins have access to all `@workspace/*` packages. These are provided by the host application at runtime and should NOT be bundled with your plugin.

**⚠️ Important:** See [Available Packages Guide](./COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md) for a complete list of packages you can import. Not all npm packages are available - only those explicitly exposed by the host application.

### UI Components

```typescript
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Input,
  Select,
  // ... all shadcn/ui components
} from "@workspace/ui/components";
```

### Data Fetching

```typescript
import { useGetMyEventsQuery, useGetSeriesListQuery } from "@workspace/query";

function MyComponent() {
  const { data, isLoading, error } = useGetMyEventsQuery({ limit: 20 });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <EventList events={data?.currentUser?.myEvents?.nodes} />;
}
```

### Routing

```typescript
import { useNavigate, Link } from "@workspace/router";

function MyComponent() {
  const navigate = useNavigate();

  return (
    <Button onClick={() => navigate("/episodes")}>
      Go to Episodes
    </Button>
  );
}
```

### Translations

```typescript
import { useI18n } from "@workspace/i18n";

function MyComponent() {
  const { t } = useI18n();
  return <h1>{t("my-plugin:title")}</h1>;
}
```

**Note:** For translations, you'll need to include locale files in your plugin and register them. See the Translations section below.

## Extension Points

### Registering a View/App

```typescript
manager.registerObject("apps:definitions", "unique-id", {
  id: "unique-id",
  name: "Display Name",
  routePath: "/your-route",
  component: YourComponent,
});
```

### Registering Sidebar Navigation

```typescript
manager.registerObject("sidebar:nav-items", "unique-id", {
  title: "Menu Title",
  path: "/your-route",
  icon: IconComponent, // From lucide-react
  order: 100, // Lower = higher position
  permissions: ["required.permission"],
  featureFlags: ["required-flag"],
  category: "main", // or "admin", "settings"
});
```

### Overriding Components

```typescript
// Override the landing page
manager.registerComponent("component-override:landing-page", MyLandingPage);

// Override the header
manager.registerComponent("component-override:appshell:header", MyHeader);

// Override the footer
manager.registerComponent("component-override:appshell:footer", MyFooter);
```

## GraphQL Extension

You can extend core GraphQL queries by adding fields through fragments.

### 1. Create Fragment Files

```graphql
# src/gql/event-fields.graphql
fragment MyPluginEventFields on Event {
  myCustomField
  anotherField {
    nestedValue
  }
}
```

### 2. Automatic Registration

The build system automatically extracts fragments from `.graphql` files and bundles them as `__injected_fragments__`. The RemoteLoader registers them with the FragmentRegistry when your plugin loads.

### 3. Server Requirements

For custom fields to work, your Opencast server must:
1. Have a GraphQL schema that includes these fields
2. Have resolvers implemented for these fields

## Security

### Allowed Domains

By default, plugins can only be loaded from:
- `cdn.jsdelivr.net` - Primary CDN
- `raw.githubusercontent.com` - GitHub raw content
- `*.github.io` - GitHub Pages
- `127.0.0.1` (development only)

### Version Constraints

Define compatible versions in your `package.json`:

```json
{
  "pluginMetadata": {
    "workspaceDependencies": {
      "@workspace/plugin-system": ">=1.0.0",
      "@workspace/ui": ">=1.0.0"
    }
  }
}
```

The Marketplace will warn users if their Management UI version is incompatible.

## Publishing

### Option 1: GitHub Releases + jsDelivr (Recommended)

1. **Create a GitHub repository**

2. **Push your code**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-org/your-plugin
   git push -u origin main
   ```

3. **Create a release**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Your plugin is available at:**
   ```
   https://cdn.jsdelivr.net/gh/your-org/your-plugin@v1.0.0/dist/my-plugin.mjs
   ```

### Option 2: Automated Releases

Add the GitHub Action (`.github/workflows/release.yml` from the template) to automatically build and create releases when you push a tag.

### Register in Community Registry

Submit a PR to the [Management UI Registry](https://github.com/opencast/management-ui-registry):

```json
{
  "id": "your-plugin",
  "name": "Your Plugin Name",
  "description": "What it does",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "url": "https://your-website.com"
  },
  "url": "https://cdn.jsdelivr.net/gh/your-org/your-plugin@v1.0.0/dist/my-plugin.mjs",
  "category": "feature",
  "tags": ["tag1", "tag2"],
  "workspaceDependencies": {
    "@workspace/plugin-system": ">=1.0.0"
  }
}
```

### Export to Registry

Before submitting your plugin to the Community Registry, generate a registry-compliant entry:

```bash
# From your plugin directory
pnpm ts-node ../../packages/plugin-system/scripts/export-registry.ts ./plugin-metadata.json
```

This will:
1. Validate your `plugin-metadata.json` against the schema
2. Output a formatted JSON entry ready for the registry
3. Include a placeholder for the CDN URL (replace `<ADD_CDN_URL_HERE>`)

**Example output:**
```json
{
  "id": "my-plugin",
  "name": "My Community Plugin",
  "description": "Short description",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "url": "<ADD_CDN_URL_HERE>",
  "category": "feature",
  "icon": "Puzzle",
  "tags": ["example"],
  "workspaceDependencies": {
    "@workspace/plugin-system": ">=1.0.0"
  },
  "verified": false
}
```

Copy this entry and add it to the registry's `registry.json` file when submitting your PR.

## Best Practices

### 1. Namespace Everything

Avoid conflicts by prefixing all registrations:

```typescript
// Good
manager.registerObject("sidebar:nav-items", "myorg:analytics", {...});

// Bad - may conflict with other plugins
manager.registerObject("sidebar:nav-items", "analytics", {...});
```

### 2. Handle Errors Gracefully

Don't crash the host application:

```typescript
initialize(manager) {
  try {
    // Your initialization code
  } catch (error) {
    console.error("My Plugin failed to initialize:", error);
    // Fail gracefully, don't re-throw
  }
}
```

### 3. Clean Up Resources

Implement `deactivate()` to clean up:

```typescript
let intervalId: number;

activate() {
  intervalId = setInterval(() => {...}, 1000);
}

deactivate() {
  if (intervalId) {
    clearInterval(intervalId);
  }
}
```

### 4. Keep Bundle Size Small

- Don't import large libraries
- Use the host's components instead of bundling your own
- Tree-shake unused code

### 5. Test with Multiple Themes

Your plugin should look good with different themes. Test with at least:
- Default theme
- Dark mode

### 6. Provide Good Documentation

Include a README with:
- What the plugin does
- How to configure it
- Screenshots/demos
- Support contact

## Troubleshooting

### "Failed to load plugin: Domain not allowed"

Your plugin URL is not from an allowed domain. Options:
- Use jsDelivr CDN
- In development, use 127.0.0.1
- Ask the administrator to add your domain to the allowlist

### "Invalid plugin format"

Your plugin must export a default object with an `initialize` function:

```typescript
export default createPlugin({
  initialize(manager) {...},
  activate() {},
  deactivate() {},
});
```

### "React hooks error" / "Invalid hook call"

This usually means React is being bundled twice. Ensure your `vite.config.ts` has:

```typescript
rollupOptions: {
  external: ['react', 'react-dom', 'react/jsx-runtime']
}
```

### Plugin loads but UI doesn't appear

1. Check browser console for errors
2. Verify your route registration is correct
3. Check if sidebar item permissions match user permissions

## Examples

### Analytics Dashboard Plugin

```typescript
import { createPlugin } from "@workspace/plugin-system";
import { BarChart3 } from "lucide-react";
import { AnalyticsDashboard } from "./views/AnalyticsDashboard";

export default createPlugin({
  namespace: "analytics",
  type: "app",
  version: "1.0.0",

  initialize(manager) {
    manager.registerObject("apps:definitions", "analytics:dashboard", {
      id: "analytics-dashboard",
      name: "Analytics",
      routePath: "/analytics",
      component: AnalyticsDashboard,
    });

    manager.registerObject("sidebar:nav-items", "analytics:nav", {
      title: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      order: 50,
      permissions: ["analytics.view"],
    });
  },

  activate() {},
  deactivate() {},
});
```

### Theme Plugin

```typescript
import { createPlugin } from "@workspace/plugin-system";

export default createPlugin({
  namespace: "my-theme",
  type: "theme",
  version: "1.0.0",

  initialize(manager) {
    // Inject CSS variables
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --primary: 220 90% 56%;
        --primary-foreground: 0 0% 100%;
      }
    `;
    document.head.appendChild(style);
  },

  activate() {},
  deactivate() {
    // Remove injected styles
  },
});
```

## Resources

- [Management UI Documentation](https://github.com/opencast/management-ui)
- [Plugin System API](/packages/plugin-system/README.md)
- [UI Components](/packages/ui/README.md)
- [Community Plugin Template](https://github.com/opencast/community-plugin-template)
- [Management UI Registry](https://github.com/opencast/management-ui-registry)
