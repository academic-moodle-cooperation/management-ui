# __PLUGIN_NAME__ — Maven build

Builds and packages this plugin as a deployable OSGi JAR that Opencast loads at runtime through its `PluginBundleTracker`.

## Build

```bash
mvn package
```

This runs `pnpm install && pnpm build` in the plugin root (one level up from this directory) to produce `dist/__PLUGIN_NAME__.mjs` (and optionally `.css` / `assets/` / `locales/`), then packages everything as a JAR at `target/__PLUGIN_NAME__-1.0.0-SNAPSHOT.jar`.

### Skip the frontend build

If you already ran `pnpm build` yourself (e.g. in a CI step that builds the frontend separately, or while iterating):

```bash
mvn package -Dskip.frontend.build=true
```

The Maven build then just copies the existing `dist/` into the bundle.

## Deploy

Drop the JAR into Opencast's `deploy/` directory:

```bash
cp target/__PLUGIN_NAME__-1.0.0-SNAPSHOT.jar $OPENCAST_HOME/deploy/
```

Opencast picks it up immediately — no restart needed, no extra configuration.

### One-step deploy

To copy the JAR straight into `$OPENCAST_HOME/deploy/` as part of `mvn install`:

```bash
mvn install -DdeployTo=/path/to/opencast/home
```

Without `-DdeployTo`, the copy step is a no-op.

## How Opencast finds the plugin

The packaged JAR carries OSGi headers:

- `Management-Plugin: __PLUGIN_NAME__` — Opencast's tracker scans every bundle for this header.
- `Http-Alias: /management-ui/static/plugins/__PLUGIN_NAME__` — URL prefix the plugin assets are served at.
- `Http-Classpath: /static/plugins/__PLUGIN_NAME__` — directory inside the JAR that maps to that URL.

The tracker then reads `static/plugins/__PLUGIN_NAME__/plugin.json` (copied from your plugin root) to discover the plugin's modules and i18n namespaces. It emits the result in `plugins.json`, which the Management UI shell fetches at boot to load each plugin's `.mjs`.

## Don't

- **Don't move this `backend/` directory** without also updating the relative paths in `pom.xml` (`${project.basedir}/..` is hardcoded as the plugin root).
- **Don't rename `Management-Plugin` or `Http-Alias` headers** unless you're sure Opencast's tracker has been updated to recognise the new name.
- **Don't bundle `react`, `@oc-mui/*`, or other shared runtime deps into the JAR** — they're provided by the host. See [`docs/reference/contracts.md` § 5](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/docs/reference/contracts.md#5-shared-runtime-dependencies) for the full list.

## See also

- [`docs/extend/distribution.md`](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/docs/extend/distribution.md) — comparison of the four distribution paths (in-tree, `.local-plugins/`, JAR, CDN).
- [`docs/reference/contracts.md`](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/docs/reference/contracts.md) — manifest, runtime API, theme, config, and shared-runtime-deps contracts.
