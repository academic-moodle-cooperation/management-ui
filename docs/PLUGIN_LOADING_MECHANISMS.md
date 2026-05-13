# Plugin Loading Mechanisms - Complete Overview

**Last Updated:** 2026-01-26

This document lists all possible ways plugins can be loaded in the Management UI system.

## 1. Built-in Plugins (Static Bundled)

**Location:** `plugins/index.ts` → `@oc-mui/plugins`

**How it works:**
- Plugins are statically imported from `plugins/` directory
- Exported via `plugins/index.ts` as `@oc-mui/plugins`
- Loaded during app startup in `loadPlugins.ts`
- Filtered by `app.enabledPlugins` (ship filter) and per-slice `config.plugins[<id>].enabled` (runtime switch). Full model in [`architecture/CONFIGURATION.md`](./architecture/CONFIGURATION.md).
- Backend note: this mode is frontend-bundled. Plugin-specific backend logic is not packaged as part of this loading mechanism.

**Code:**
- `apps/shell/src/loadPlugins.ts` - `loadAllAvailablePlugins()`
- `plugins/index.ts` - Exports core plugins only

**Configuration:**
```json
{
  "app": {
    "enabledPlugins": ["core", "admin"]
  }
}
```

**Status:** ✅ Working

**Test:**
```bash
# Check if core plugins are loaded
# Open browser console, check PluginManager
```

---

## 2. Remote Loader (Community Plugins from URLs)

**Shared package:** `packages/remote-plugin-loader` – `loadAndRegister(url, manager, options?)`

**Marketplace wrapper:** `plugins/admin-marketplace/src/services/remote-loader.ts`

**How it works:**
- **Core loading logic** lives in `@oc-mui/remote-plugin-loader`: fetch module, transform bare imports to `window.__SHARED_MODULES__`, import via blob URL, inject CSS, register GraphQL fragments, register with PluginManager.
- **Marketplace** uses this package for registry and local plugins: validates URL (allowed domains, HTTPS), checks version compatibility, persists to localStorage, then calls the shared `loadAndRegister`.
- JAR plugins are **not** loaded by the marketplace; they are loaded by the core (see §4). The marketplace is optional for JAR deployment.

**Code:**
- `packages/remote-plugin-loader` - `loadAndRegister()`, `transformModuleSource()`, `isSameOriginUrl()`
- `plugins/admin-marketplace/src/services/remote-loader.ts` - `RemoteLoader` (validation + persistence + delegates to package)
- `plugins/admin-marketplace/src/views/MarketplaceDashboard.tsx` - UI integration

**Usage (marketplace – after validating URL/version):**
```typescript
await RemoteLoader.loadAndRegister(
  "https://cdn.jsdelivr.net/gh/org/plugin@v1.0.0/dist/plugin.mjs",
  manager,
  metadata
);
```

**Status:** ✅ Implemented (needs testing)

**Test:**
1. Build a test plugin
2. Serve it via http-server
3. Use Marketplace Developer Mode to load it

---

## 3. Local Plugin Discovery (Removed)

Previously a `localPluginDiscovery` helper read plugin URLs from
`localStorage.getItem("local_plugins")` and was invoked as a side-effect of
`loadAllPlugins()`. With the switch to the `.local-plugins/` manifest served
by the dev-server plugin (see §5) this mechanism was unused and has been
removed. Use `.local-plugins/` for local dev, or the Marketplace Developer
Mode (mechanism 2) for ad-hoc URLs.

---

## 4. JAR Plugin Loader (Backend plugins.json) – Core

**Location:** `apps/shell/src/services/jarPluginLoader.ts` + `apps/shell/src/components/PluginInitializer.tsx`

**How it works:**
- **Core** (not the marketplace) loads JAR plugins. `PluginInitializer` first loads any JAR entries that match the current config (typically `config`), re-merges `app:config`, then loads the remaining JAR entries that match the now-effective `app.enabledPlugins` list.
- Backend generates `plugins.json` from deployed JAR files. It scans the bundle's static plugin directory and emits one entry per discovered `*.mjs` file, so one deployed JAR can expose multiple frontend plugin modules.
- JAR plugins load **even when the marketplace plugin is not loaded**. The marketplace is optional and does not handle JAR loading.
- This is the path to use when a plugin needs its own backend module (e.g. quiz/poll APIs, persistence, QR token validation).

**Code:**
- `apps/shell/src/services/jarPluginLoader.ts` - `loadJarPlugins()`
- `apps/shell/src/components/PluginInitializer.tsx` - calls `loadJarPlugins()` then `loadAndRegister()` from `@oc-mui/remote-plugin-loader`
- `packages/remote-plugin-loader` - shared fetch/transform/register logic
- `backend/management-config/.../PluginEndpoint.java` - Backend endpoint

**Backend Response:**
```json
{
  "plugins": [
    {
      "id": "univie/plugin-univie-sidebar",
      "name": "univie-plugin-backend:sidebar",
      "path": "/static/plugins/univie",
      "scope": "management_ui_plugin_univie",
      "namespace": "univie",
      "type": "sidebar",
      "scriptUrl": "/management-ui/static/plugins/univie/plugin-univie-sidebar.mjs",
      "cssUrl": "/management-ui/static/plugins/univie/univie-plugin.css",
      "localesUrl": "/management-ui/static/plugins/univie/locales",
      "i18nNamespaces": ["univie-sidebar"]
    }
  ]
}
```

**Status:** ✅ Implemented (needs testing)

**Test:**
1. Deploy a JAR with frontend assets
2. Check `/management-tool/ui/config/plugins.json`
3. Verify plugin loads automatically (with or without marketplace)

---

## 5. .local-plugins manifest (dev only)

**Location:** `packages/vite-config/src/plugins/local-plugins-dev.ts` + `apps/shell/src/components/PluginInitializer.tsx` + `apps/shell/src/services/localPluginsManifest.ts`

**How it works:**
- In **development**, the Vite dev server scans `.local-plugins/<name>/dist/` for `*.mjs` files and serves them at `/local-plugins/<name>/<file>.mjs`. It exposes a manifest at `/local-plugins/manifest.json` with one entry per `.mjs` (so one folder can have multiple bundles).
- The **core** (PluginInitializer) fetches this manifest and loads each listed plugin via `loadAndRegister` from `@oc-mui/remote-plugin-loader`.
- Loading is **filtered by `config.app.enabledPlugins`**: only manifest entries whose `namespace` (folder name) is in the enabled list are loaded. If `enabledPlugins` is missing or empty, all discovered .local-plugins are loaded. Same config drives built-in plugin filtering.
- CSS behavior: `loadAndRegister` auto-requests `<module>.css` (same stem as `.mjs`). The local-plugins dev middleware resolves single-file requests from `dist/`, so `dist/<name>.css` is served when present.

**Code:**
- `packages/vite-config/src/plugins/local-plugins-dev.ts` - discovers plugins, serves files, exposes manifest (each entry has `name`, `id`, `url`, `namespace`)
- `apps/shell/src/services/localPluginsManifest.ts` - fetches manifest
- `apps/shell/src/loadPlugins.ts` - `getEnabledPluginNamespaces(config)` + `isPluginEnabledAtRuntime(config, id)` for filtering
- `apps/shell/src/components/PluginInitializer.tsx` - filters manifest by namespace, then loads

**Manifest shape:**
```json
{
  "plugins": [
    {
      "name": "Univie (sidebar)",
      "id": "univie/plugin-univie-sidebar",
      "url": "/management-ui/local-plugins/univie/plugin-univie-sidebar.mjs",
      "namespace": "univie",
      "type": "sidebar"
    }
  ]
}
```

**To load a .local-plugins folder:** Add its folder name to `app.enabledPlugins` (e.g. via a config plugin: `["core", "episodes", "series", "upload", "admin", "config", "univie"]`).

**Troubleshooting styles:** If a plugin renders unstyled, verify:
1. `dist/<plugin>.mjs` exists
2. `dist/<plugin>.css` exists with matching stem
3. Network request to `/local-plugins/<folder>/<plugin>.css` returns 200
4. Core dev server was restarted after loader/config changes

**Status:** ✅ Implemented

---

## 6. Dynamic Modules (Removed)

The shell used to load standalone Vite apps from `apps/management-ui-*` via a
`dynamic-modules.json` manifest and a `@monorepo-apps/*` Vite alias. Phase 3 of
the open-source cleanup migrated every feature app into a core plugin that
registers an `AppDefinition` on the `apps:definitions` extension point (see
ADR-003), so this mechanism has been removed.

**Status:** Removed. Use the plugin-based app registration (mechanism 1) for
new features instead.

---

## 7. Plugin-based Apps (Modern System)

**Location:** `apps/shell/src/components/DynamicRouterProvider.tsx`

**How it works:**
- Plugins register apps via `apps:definitions` extension point
- Router queries `getAllApps(manager)` from PluginManager
- Creates routes from registered app definitions
- This is the **preferred** way for new plugins

**Code:**
- `apps/shell/src/components/DynamicRouterProvider.tsx` - `getPluginBasedApps()`
- `packages/plugin-system/src/plugins/appRegistry/index.ts` - App registry

**Registration:**
```typescript
manager.registerObject("apps:definitions", "my-app", {
  id: "my-app",
  name: "My App",
  routePath: "/my-app",
  component: MyAppComponent,
});
```

**Status:** ✅ Working (preferred method)

**Test:**
- Register an app via plugin
- Check if route appears in router

---

## Summary Table

| # | Mechanism | Type | Status | When to Use |
|---|-----------|------|--------|-------------|
| 1 | Built-in Plugins | Static | ✅ Working | Core plugins (always bundled) |
| 2 | Remote Loader (package + marketplace) | Dynamic | ✅ Implemented | Community plugins from CDN/URL (marketplace validates; core uses same package for JAR) |
| 3 | Local Discovery | — | 🗑 Removed | Superseded by §5 (`.local-plugins` manifest) |
| 4 | JAR Loader (core) | Dynamic | ✅ Implemented | Production JAR deployments (loaded by core; marketplace optional) |
| 5 | .local-plugins manifest (dev) | Dynamic | ✅ Implemented | Dev-only: plugins in `.local-plugins/<name>/`; filtered by `app.enabledPlugins` |
| 6 | Dynamic Modules | Legacy | ⚠️ Deprecated | Old standalone apps |
| 7 | Plugin-based Apps | Modern | ✅ Working | New plugin apps (preferred) |

## Testing Plan

We'll test each mechanism one by one:

1. ✅ **Built-in Plugins** - Already working
2. ⏳ **RemoteLoader** - Test with a sample plugin URL
3. 🗑 **Local Discovery** - Removed (use §5)
4. ⏳ **JAR Loader** - Test with backend plugins.json
5. ✅ **.local-plugins manifest** - Build plugin in `.local-plugins/<name>/`, add namespace to config, run shell in dev
6. 🗑 **Dynamic Modules** - Removed (see ADR-003)
7. ✅ **Plugin-based Apps** - Already working

## Next Steps

1. Create a test plugin for RemoteLoader
2. Test JAR Loader with mock backend response
3. Document any issues found
