# @oc-mui/remote-plugin-loader

Loads remote ES module plugins by URL: fetch, transform bare imports to `window.__SHARED_MODULES__`, import via blob URL, inject CSS, register GraphQL fragments, and register with the PluginManager.

Plugin CSS is injected before the host shell stylesheets so generic plugin utilities do not accidentally override shared UI. If a plugin needs to intentionally restyle host components, follow the [Theme & styling contract](../../docs/plugins/styling.md).

## Who uses it

- **`@oc-mui/shell`** – Loads JAR plugins (backend-derived URLs) after built-in plugins. Uses `loadJarPlugins()` from the shell's `jarPluginLoader` and `loadAndRegister(url, manager, { skipUrlValidation: true })` from this package.
- **admin-marketplace** – Loads registry and local plugins. Validates URL and version first, then calls this package’s `loadAndRegister`. Persistence and security stay in the marketplace plugin.

## API

### `loadAndRegister(url, manager, options?)`

Loads the plugin at `url`, transforms it, and registers it with `manager`.

- **url** – URL to the plugin `.mjs` file.
- **manager** – `PluginManager` from `@oc-mui/plugin-system`.
- **options** (`LoadOptions`) – Optional:
  - `forceReload` – Bypass HTTP and module cache.
  - `cssUrl` – Explicit CSS URL when the stylesheet name does not match the module name.
  - `skipUrlValidation` – Caller has already validated the URL (e.g. core for JAR URLs). This package does not validate URLs; the flag is for API clarity.
  - `skipPluginNames` – `Set` of plugin names to load but **not** register; the plugin object is still returned in `LoadResult.plugin` so the caller can keep it for discovery (e.g. the marketplace's "disabled" list).

Returns a `Promise<LoadResult>` with `{ success, pluginId?, error?, warnings, skipped?, plugin? }` — `skipped` is true when the name was in `skipPluginNames`, and `plugin` is the loaded `Plugin` object (always set on success, even when skipped).

The host app must call `exposeSharedModules()` (e.g. in `main.tsx`) so `window.__SHARED_MODULES__` is set before loading remote plugins.

### `isSameOriginUrl(url)`

Returns whether `url` is same-origin. Can be used by the core when trusting backend-derived JAR URLs.

### `transformModuleSource(source)` / `SHARED_MODULE_NAMES`

Exported for tests. Transform replaces bare imports of shared modules (react, @oc-mui/*) with references to the shim; `SHARED_MODULE_NAMES` in `src/transform.ts` is the list of those modules. For the full list of packages community plugins can import, see [docs/plugins/distribution.md](../../docs/plugins/distribution.md#available-packages-the-import-contract).

## Security

- This package does **not** enforce URL allowlists or HTTPS. Callers (e.g. marketplace) must validate URLs and versions before calling `loadAndRegister` for user-supplied or registry URLs.
- For JAR plugins, the shell calls `loadAndRegister` with `skipUrlValidation: true` because URLs come from the backend (`plugins.json`).

## Layer

Integration. Depends on `@oc-mui/plugin-system`, `@oc-mui/utils`.

## See also

- [`docs/plugins/distribution.md`](../../docs/plugins/distribution.md) — the four distribution paths and how each uses this loader.
- [`docs/plugins/styling.md`](../../docs/plugins/styling.md) — Theme Contract; explains the CSS load-order rule this loader enforces.
- [`apps/shell/src/services/jarPluginLoader.ts`](../../apps/shell/src/services/jarPluginLoader.ts) — the shell's JAR-loading caller.
- [`plugins/admin-marketplace/src/services/remote-loader.ts`](../../plugins/admin-marketplace/src/services/remote-loader.ts) — the marketplace's validating wrapper.
