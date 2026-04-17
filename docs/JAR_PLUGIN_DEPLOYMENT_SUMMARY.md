# JAR Plugin Generation and Deployment — Summary

How plugin JARs are built, deployed, and loaded by the Management UI.

## Flow Overview

```
1. Build frontend (one or more dist/*.mjs + optional CSS/assets)
2. Build backend JAR (Maven copies dist/ into JAR, sets OSGi headers)
3. Deploy JAR to Opencast deploy/
4. Backend scans JARs for Management-Plugin header and bundle contents → builds plugins.json
5. Frontend fetches plugins.json → loads each plugin via RemoteLoader
```

## 1. JAR generation (build)

- **Frontend:** In the plugin repo you run `pnpm build`. Output: one or more `dist/*.mjs` files and optional CSS/assets.
- **Backend module:** A Maven module (e.g. `.local-plugins/my-org-plugin/backend/`) does two things:
  - **Copy frontend into the JAR:** `maven-resources-plugin` copies `dist/*.mjs` and `dist/*.css` into `target/classes/static/plugins/<plugin-id>/`.
  - **Set OSGi headers:** `maven-bundle-plugin` sets:
    - `Management-Plugin: <plugin-id>` — so the backend discovers this bundle as a Management UI plugin.
    - `Http-Alias: /management-ui` — base path for serving UI assets.
    - `Http-Classpath: /static/plugins/<plugin-id>` — directory inside the JAR from which static files are served.
- **Output:** One JAR (e.g. `my-org-plugin-backend-1.0-SNAPSHOT.jar`) containing Java code (if any) and `static/plugins/<plugin-id>/...` frontend assets. A single JAR may contain multiple frontend plugin entry modules.

## 2. Deployment

- Copy the JAR to Opencast’s deploy directory: `$OPENCAST_HOME/deploy/`.
- Opencast (OSGi) loads the bundle. No extra config needed.

## 3. Backend discovery (`plugins.json`)

- **PluginBundleTracker** (in `backend/management-config`) tracks OSGi bundles that have the **Management-Plugin** manifest header.
- For each such bundle it scans `static/plugins/<Management-Plugin value>/` inside the bundle and emits one **PluginConfig** per discovered `*.mjs` module. Each config includes `id`, `name`, `path`, `scope`, `namespace`, optional `type`, and explicit asset URLs such as `scriptUrl` and `cssUrl`.
- **PluginEndpoint** exposes `GET /management-tool/ui/config/plugins.json`, which returns `{ "plugins": [ ... ] }`.

So: **JAR generation** puts frontend files in the JAR and sets `Management-Plugin`; **deployment** is copying the JAR to `deploy/`; **backend discovery** is the tracker reading that header and exposing the list as `plugins.json`.

## 4. Frontend loading

- **Core** (not the marketplace) loads JAR plugins. In `apps/management-ui-core`, **PluginInitializer** calls `loadJarPlugins()` from `src/services/jarPluginLoader.ts`:
  - Fetches `/management-tool/ui/config/plugins.json` (using app base URL in dev, or `productionAppPluginUrl` in prod).
  - Loads matching `config` entries first, re-merges runtime config, then loads the remaining JAR entries whose `namespace` matches `app.enabledPlugins`. Per-slice `config.plugins[<id>].enabled === false` is also honoured as a runtime switch. See [`architecture/CONFIGURATION.md`](./architecture/CONFIGURATION.md) for the full model.
- For each plugin URL, the core calls **loadAndRegister(url, manager, { skipUrlValidation: true })** from `@workspace/remote-plugin-loader`.
- The shared loader fetches the `.mjs`, transforms imports to use host shared modules, loads the module, injects a `<link>` for the matching `.css`, and registers the plugin with the PluginManager.

So: **JAR deployment** means the backend serves `plugins.json`; the **core** discovers and loads each JAR plugin’s `.mjs` (and `.css`) from the same origin. The marketplace is optional and does not handle JAR loading.

## Reference

- Full steps and `pom.xml` examples: [COMMUNITY_PLUGIN_DEVELOPMENT.md](./COMMUNITY_PLUGIN_DEVELOPMENT.md) — section **A3: Package plugin as JAR and deploy to production**.
- Backend: `PluginBundleTracker.java`, `PluginManager.java`, `PluginEndpoint.java` in `backend/management-config`.
- Frontend: `jar-plugin-loader.ts`, `admin-marketplace/src/index.ts`, `remote-loader.ts`.
