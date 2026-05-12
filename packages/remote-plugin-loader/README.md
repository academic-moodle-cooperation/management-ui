# @oc-mui/remote-plugin-loader

Loads remote ES module plugins by URL: fetch, transform bare imports to `window.__SHARED_MODULES__`, import via blob URL, inject CSS, register GraphQL fragments, and register with the PluginManager.

Plugin CSS is injected before the host shell stylesheets so generic plugin utilities do not accidentally override shared UI. If a plugin needs to intentionally restyle host components, follow the [Plugin Styling Contract](../../docs/PLUGIN_STYLING_CONTRACT.md).

## Who uses it

- **management-ui-core** – Loads JAR plugins (backend-derived URLs) after built-in plugins. Uses `loadJarPlugins()` from the core’s `jarPluginLoader` and `loadAndRegister(url, manager, { skipUrlValidation: true })` from this package.
- **admin-marketplace** – Loads registry and local plugins. Validates URL and version first, then calls this package’s `loadAndRegister`. Persistence and security stay in the marketplace plugin.

## API

### `loadAndRegister(url, manager, options?)`

Loads the plugin at `url`, transforms it, and registers it with `manager`.

- **url** – URL to the plugin `.mjs` file.
- **manager** – `PluginManager` from `@oc-mui/plugin-system`.
- **options** – Optional:
  - `forceReload` – Bypass HTTP and module cache.
  - `skipUrlValidation` – Caller has already validated the URL (e.g. core for JAR URLs). This package does not validate URLs; the flag is for API clarity.

Returns a `Promise<LoadResult>` with `{ success, pluginId?, error?, warnings }`.

The host app must call `exposeSharedModules()` (e.g. in `main.tsx`) so `window.__SHARED_MODULES__` is set before loading remote plugins.

### `isSameOriginUrl(url)`

Returns whether `url` is same-origin. Can be used by the core when trusting backend-derived JAR URLs.

### `transformModuleSource(source)` / `SHARED_MODULE_NAMES`

Exported for tests. Transform replaces bare imports of shared modules (react, @oc-mui/*) with references to the shim; `SHARED_MODULE_NAMES` in `src/transform.ts` is the list of those modules. For the full list of packages community plugins can import, see [docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md](../../docs/COMMUNITY_PLUGIN_AVAILABLE_PACKAGES.md).

## Security

- This package does **not** enforce URL allowlists or HTTPS. Callers (e.g. marketplace) must validate URLs and versions before calling `loadAndRegister` for user-supplied or registry URLs.
- For JAR plugins, the core calls `loadAndRegister` with `skipUrlValidation: true` because URLs come from the backend (`plugins.json`).
