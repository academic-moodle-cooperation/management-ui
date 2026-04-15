# Community Plugins - Next Steps & Status

**Date:** 2026-01-21  
**Status:** Core Implementation Complete ✅ | Local Registry for Dev ✅ | External Registry Repo Optional

## ✅ What's Already Done

### Core Implementation (Complete)
1. **Plugin Loading System** ✅
   - `RemoteLoader` with module transformation
   - Shared modules exposure (`window.__SHARED_MODULES__`)
   - GraphQL fragment auto-registration
   - Security validation (URL allowlist, version checking)
   - Plugin persistence (localStorage)

2. **Marketplace UI** ✅
   - Community plugins browsing
   - Search and filtering
   - Install/Uninstall/Try functionality
   - Developer Mode for custom URLs
   - Table and card view modes (with persistence)
   - Pending changes notifications

3. **Registry Fetcher** ✅
   - Multi-registry support (public + private)
   - **In dev: tries local `public/registry.json` first** (no external repo required for testing)
   - Caching (5-minute TTL)
   - Deduplication
   - Update checking
   - Error handling

4. **Local registry for development** ✅
   - `apps/management-ui-core/public/registry.json` — sample registry (add plugin entries here to test Marketplace)
   - In DEV, the fetcher uses this file first; production still uses configured registry URL(s)

5. **Documentation** ✅
   - Community Plugin Development Guide
   - Template repository structure
   - Build configuration examples

## Deployment model: JAR vs config, i18n, assets, theme

**Does “build JARs locally and copy to server” work?** Yes. The server does **not** need to build JARs. Build JARs once (locally or in CI), deploy them to the server (e.g. `$OPENCAST_HOME/deploy/`). The backend serves plugin static files from the JAR under `/management-ui/static/plugins/<name>/`.

**Config merging:** The merged config (default + univie etc.) is **not** inside the JAR. It is a **separate file** you deploy to the Opencast config path (e.g. `/opt/opencast/etc/ui-config/mh_default_org/management-ui/config.json`). You merge default + org config (e.g. univie) manually or in CI and deploy that file. So you have two deployment artifacts: (1) JARs (plugin code + static files), (2) merged `config.json` (theme, pluginNamespace, orgLogoUrl, etc.).

**Theme CSS:** Already supported. Set `config.app.theme` (e.g. `"univie"`); the core loads `<base>/static/plugins/<themeName>/<themeName>.css`. The JAR must include the theme file (e.g. copy `themes/*.css` into the JAR); univie/tuwien POMs already do this.

**Assets (logos, etc.):** To use plugin assets from JARs (e.g. `orgLogoUrl`), put them **inside the JAR** at `static/plugins/<name>/assets/` (add copy-resources in the plugin backend POM). In config, use a path **without** the app base (e.g. `orgLogoUrl: "static/plugins/univie/assets/logo.png"`) so the UI’s `resolveAssetUrl` can prepend the base once; a full URL would be double-prefixed and break. In dev, use e.g. `local-plugins/univie/assets/logo.png`.

**i18n (plugin translation files):** To use plugin locales from JARs, put them **inside the JAR** at `static/plugins/<name>/locales/` (add copy-resources in the plugin backend POM). The app’s i18n currently has a single `loadPath`; to support plugin namespaces from JARs, the app would need to load additional namespaces from the plugin path (e.g. `/management-ui/static/plugins/univie/locales/{{ns}}/{{lng}}.json`) or register them when the plugin loads. Today the core app does not dynamically add plugin locale paths; that can be added if needed.

**Summary:** JARs = plugin code + theme + (optionally) assets and locales, all built once and deployed. Config = merged JSON deployed separately. Server never builds JARs.

---

## What's Next (A4: Community Distribution)

### JAR deployment for .local-plugins

Each plugin under `.local-plugins/` that should be deployable as a JAR has a **backend** module with:

- **pnpm install (repo root)** and **pnpm build (plugin dir)** in the POM (like episodes), so `mvn -f .local-plugins/<name>/backend/pom.xml install` builds the frontend and packages it into the JAR.
- **Copy-resources** from `../dist` (and `../themes` where applicable) into `target/classes/static/plugins/<name>`.
- **maven-bundle-plugin** with `Management-Plugin: <name>` so the backend exposes the plugin and the core loads it from `plugins.json`.

**Plugins with backend JAR POMs (as of now):**

| Plugin | Backend path | Build output (main) |
|--------|--------------|---------------------|
| config | `.local-plugins/config/backend/pom.xml` | `plugin-config.mjs` |
| univie | `.local-plugins/univie/backend/pom.xml` | `plugin-univie-*.mjs` + shared theme |
| tuwien | `.local-plugins/tuwien/backend/pom.xml` | `plugin-tuwien.mjs` + theme |
| quiz-plugin | `.local-plugins/quiz-plugin/backend/pom.xml` | `quiz.mjs` (+ Java backend) |
| my-org-plugin | `.local-plugins/my-org-plugin/backend/pom.xml` | `my-org.mjs` |
| feedback-plugin | `.local-plugins/feedback-plugin/backend/pom.xml` | `feedback.mjs` |
| stats-dashboard-plugin | `.local-plugins/stats-dashboard-plugin/backend/pom.xml` | `stats-dashboard.mjs` |

**Build (from monorepo root):**

1. Ensure node is available at repo root (run `mvn initialize` from root once, or have node/pnpm on PATH).
2. Build a single plugin JAR:
   ```bash
   mvn -f .local-plugins/univie/backend/pom.xml clean install
   ```
3. Deploy the JAR to Opencast `deploy/` (e.g. `$OPENCAST_HOME/deploy/`).

The POM runs **pnpm install** from repo root and **pnpm build** from the plugin directory, so no separate `pnpm install` or `pnpm build` is required before `mvn install`.

**JAR loader (simplified, server-driven list):** The core fetches `plugins.json` from the URL in config (`productionAppPluginUrl`) and builds plugin script URLs using the app base from config (`config.api.baseUrl`). So the same deployed config drives both the UI and plugin URLs — no extra config fetch and no dependence on build-time `BASE_URL`. `PluginInitializer` passes the merged config into `loadJarPlugins(mergedConfig)`.

**Theme and styles in production:** When `config.app.theme` is set (e.g. to `"univie"`), the core loads the theme CSS from the same path as the JAR plugin: `<base>/static/plugins/<themeName>/<themeName>.css` (e.g. `/management-ui/static/plugins/univie/univie.css`). The backend JAR must include the theme file (e.g. copy `themes/*.css` into the JAR); the current univie/tuwien backend POMs already do this.

**Assets (locales, logos) and the JAR loader:** The JAR loader only fetches the plugin **.mjs** from the backend; it does not copy files to the server. All plugin static files (theme CSS, locales, logos) must be **inside the JAR** so the backend serves them from the same path as the plugin (e.g. `/management-ui/static/plugins/univie/`). So:

- **JARs do not need to be built on the backend server.** Build JARs once (e.g. in CI or locally) and deploy them to the server (e.g. `$OPENCAST_HOME/deploy/`). The "correct location" for assets is **inside the JAR** at `static/plugins/<name>/`; the backend then serves everything under that path.
- To have **locales** and **logos** available in production, the backend POM must **copy** them into the JAR at build time (e.g. copy `modules/*/locales/**/*` to `static/plugins/<name>/locales/` and `assets/**/*` to `static/plugins/<name>/assets/`). The frontend can then load them from that path. Use `orgLogoUrl` as a path **without** the app base (e.g. `static/plugins/univie/assets/logo.png`) so the app’s `resolveAssetUrl` prepends the base once.
- Today the univie/tuwien backend POMs copy only `dist/*.mjs` and `themes/*.css`. To support logos and i18n from JARs, add copy-resources for `../assets/**` and `../modules/*/locales/**` (or equivalent) and use full URLs in config (e.g. `orgLogoUrl`) or add resolution so the app loads plugin assets from the plugin’s base path.

### Making .local-plugins a separate repository

You can turn `.local-plugins/` into its **own git repo** (e.g. `management-ui-local-plugins`) and clone it into the monorepo as `.local-plugins/`.

**Steps:**

1. **Create the plugins repo:**
   ```bash
   mkdir management-ui-local-plugins
   cd management-ui-local-plugins
   git init
   ```

2. **Copy .local-plugins contents** (from the monorepo) into the new repo root (so `univie/`, `config/`, `tuwien/`, etc. are at repo root).

3. **Add a root `package.json` and `pnpm-workspace.yaml`** so `pnpm install` at repo root installs all plugins:
   - `package.json`: name e.g. `@local/plugins-root`, workspaces: `["univie", "config", "tuwien", "quiz-plugin", "feedback-plugin", "stats-dashboard-plugin", "my-org-plugin"]` (or use `"*"` if you want to include all subdirs with package.json).
   - `pnpm-workspace.yaml`: `packages: ["*"]` or list plugin dirs.

4. **In the monorepo:** Clone the plugins repo into `.local-plugins`:
   ```bash
   cd /path/to/mui-25-ai
   git clone https://github.com/your-org/management-ui-local-plugins.git .local-plugins
   ```
   (Or add `.local-plugins` as a submodule, or document that developers clone it manually.)

5. **Building JARs when .local-plugins is a separate repo:**
   - From the **monorepo** root (where `backend/` and `node/` exist): run `mvn -f .local-plugins/<name>/backend/pom.xml clean install`.
   - The backend POMs use `relativePath>../../../backend</relativePath>` and `../../../node` — they assume the plugin lives at `monorepo/.local-plugins/<name>/`, so the plugins repo must be checked out **inside** the monorepo as `.local-plugins/`.
   - Ensure the monorepo has run `mvn initialize` at least once (so `node/` and pnpm are present). Then `pnpm install` in the POM will run from monorepo root and install monorepo workspace + `.local-plugins` packages.

6. **CI:** In your pipeline, clone both the monorepo and the plugins repo (into `monorepo/.local-plugins/`), then run `mvn -f .local-plugins/<name>/backend/pom.xml install` for each plugin you want to deploy.

See also [COMMUNITY_PLUGIN_DEVELOPMENT.md](COMMUNITY_PLUGIN_DEVELOPMENT.md) (JAR deployment and “.local-plugins as its own repo”).

### Option A: Keep Using Local Registry (Testing / Single Instance)
- Edit `apps/management-ui-core/public/registry.json`: add entries with `id`, `name`, `description`, `version`, `author`, `url` (to `.mjs`), `category`, `workspaceDependencies`.
- Build your plugin, serve the `dist/` (e.g. via CDN or same host), point `url` to the bundle.
- Open Admin → Marketplace; install from the list.

### Option B: Create the Official Registry Repository (Production / Community)
**Current default URL (used when no registry URLs are configured):**
```
https://raw.githubusercontent.com/opencast/management-ui-registry/main/registry.json
```
**That repository may not exist yet.** To enable community distribution:

#### Option A: Create the Official Registry Repository

1. **Create GitHub Repository:**
   ```bash
   # Create: opencast/management-ui-registry (or your org)
   # Make it public
   # Add a README explaining the registry format
   ```

2. **Create Initial `registry.json`:**
   ```json
   {
     "version": "1.0.0",
     "name": "Opencast Management UI Community Plugin Registry",
     "description": "Official registry for community-developed plugins",
     "plugins": [
       {
         "id": "example-plugin",
         "name": "Example Plugin",
         "description": "An example plugin to demonstrate the registry",
         "version": "1.0.0",
         "author": {
           "name": "Example Author",
           "url": "https://example.com"
         },
         "url": "https://cdn.jsdelivr.net/gh/org/repo@v1.0.0/dist/plugin.mjs",
         "category": "feature",
         "workspaceDependencies": {
           "@workspace/plugin-system": ">=1.0.0"
         },
         "tags": ["example", "demo"],
         "verified": false
       }
     ]
   }
   ```

3. **Add GitHub Actions for Validation:**
   - Create `.github/workflows/validate.yml` (see `docs/registry-repo-contents/.github/workflows/validate.yml` for an example)
   - Validate JSON schema
   - Check plugin URLs are accessible
   - Prevent duplicate IDs

#### Local registry (already set up)
- In development, the fetcher **already tries** `public/registry.json` first (see `registry-fetcher.ts`).
- Edit `apps/management-ui-core/public/registry.json` and add plugin entries to test the Marketplace without an external repo.
- Example entry:
  ```json
  {
    "id": "my-org-plugin",
    "name": "My Org Plugin",
    "description": "Local test plugin",
    "version": "1.0.0",
    "author": { "name": "You" },
    "url": "http://127.0.0.1:3000/management-ui/local-plugins/my-org-plugin/my-plugin.mjs",
    "category": "feature",
    "workspaceDependencies": { "@workspace/plugin-system": ">=1.0.0" }
  }
  ```
  (Use a URL that serves your plugin bundle — e.g. local-plugins dev server or a CDN.)

### 2. Configure Registry URLs (Optional Enhancement)

**Current Status:** Registry URLs are hardcoded. You can add configuration support:

#### Option A: Environment Variables
```typescript
// In registry-fetcher.ts initialization
const REGISTRY_URLS = import.meta.env.VITE_PLUGIN_REGISTRIES
  ? import.meta.env.VITE_PLUGIN_REGISTRIES.split(',').map(url => url.trim())
  : [];
```

#### Option B: Config File
Create `public/plugin-registries.json`:
```json
{
  "registries": [
    "https://raw.githubusercontent.com/opencast/management-ui-registry/main/registry.json",
    "https://your-internal-registry.example.com/registry.json"
  ]
}
```
Replace the second URL with your organization's private registry if needed. Then load it in the marketplace initialization.

### 3. Test the Complete Flow

1. **Build a test plugin:**
   ```bash
   cd plugins/community-plugin-template
   pnpm install
   pnpm build
   ```

2. **Serve the plugin:**
   ```bash
   npx http-server dist --cors -p 5173
   ```

3. **Create local registry:**
   - Add entry to `public/registry.json` pointing to `http://127.0.0.1:5173/my-plugin.mjs`

4. **Test in Marketplace:**
   - Open Admin > Marketplace
   - Should see your test plugin in "Community Plugins" section
   - Try installing it

### 4. Migration Tasks (From Implementation Plan)

#### Phase 4: Migrate univie/tuwien (Done)
- [x] Remove `plugins/univie/` and `plugins/tuwien/` from main repository (open-source core kept clean)
- [x] Org themes (`univie.css`, `tuwien.css`) removed from `plugins/themes/`; use `.local-plugins/<name>/themes/` in dev
- [ ] Optional: Export as separate repositories and publish to CDN / registry
- **To use univie/tuwien locally:** Copy from git history or a backup into `.local-plugins/univie/` and `.local-plugins/tuwien/` (each with `themes/<name>.css`). Build and run core in dev; plugins and themes load from `.local-plugins/`.

#### Phase 5: Marketplace Enhancements (Optional)
- [ ] Plugin details page
- [ ] Update notifications
- [ ] Ratings/Reviews
- [ ] Download statistics

## Current Registry Behavior

The `RegistryFetcher` service:

1. **Fetches from:** `DEFAULT_COMMUNITY_REGISTRY` if no URLs configured
2. **Falls back gracefully:** If registry fetch fails, shows empty list (no crash)
3. **Caches results:** 5-minute TTL to reduce API calls
4. **Supports multiple registries:** Can merge plugins from multiple sources
5. **Deduplicates:** Later registries override earlier ones (by plugin ID)

## Testing Checklist

- [ ] Create registry repository OR local registry file
- [ ] Test registry fetch (should load plugins)
- [ ] Test plugin installation from registry
- [ ] Test plugin updates (version comparison)
- [ ] Test multiple registries (if configured)
- [ ] Test error handling (invalid registry URL)
- [ ] Test caching (refresh should use cache)

## Quick Start: Local Testing

1. **Create local registry:**
   ```bash
   echo '{
     "version": "1.0.0",
     "plugins": [{
       "id": "my-test-plugin",
       "name": "My Test Plugin",
       "description": "Testing the registry",
       "version": "1.0.0",
       "author": { "name": "You" },
       "url": "http://127.0.0.1:5173/my-plugin.mjs",
       "category": "feature",
       "workspaceDependencies": { "@workspace/plugin-system": ">=1.0.0" }
     }]
   }' > apps/management-ui-core/public/registry.json
   ```

2. **Update registry fetcher** (temporary, for local testing):
   ```typescript
   // In registry-fetcher.ts, line 236:
   if (allUrls.length === 0) {
     // For local testing, use local registry
     allUrls.push('/registry.json');
     // allUrls.push(DEFAULT_COMMUNITY_REGISTRY); // Comment out for now
   }
   ```

3. **Build and serve a test plugin:**
   ```bash
   cd plugins/community-plugin-template
   pnpm build
   npx http-server dist --cors -p 5173
   ```

4. **Test in UI:**
   - Start the Management UI
   - Go to Admin > Marketplace
   - Your test plugin should appear in "Community Plugins"

## Summary

**You're almost done!** The core implementation is complete. The main missing piece is:

1. **Create the registry repository** (or use local registry for testing)
2. **Add some test plugins** to the registry
3. **Test the complete flow**

The code is already trying to load the registry - it just needs the registry file to exist at the configured URL.
