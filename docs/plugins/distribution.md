# Distributing a plugin

How plugins get from your editor to a running shell. Pick the path that matches how your plugin will be operated.

## The four paths

| Path | Used for | Where the code lives | How the shell finds it |
|------|----------|----------------------|------------------------|
| **In-tree** | Core plugins shipped with this repo | `plugins/<name>/` | Bundled into `@oc-mui/plugins`, statically imported at app startup |
| **`.local-plugins/` dev mount** | Dev-time iteration on an org plugin | `.local-plugins/<name>/` (gitignored) | Vite dev server serves the plugin's `dist/`; shell fetches `/local-plugins/manifest.json` |
| **JAR** | Production deploy with an Opencast backend | One JAR per org plugin in `$OPENCAST_HOME/deploy/` | Backend exposes `/management-tool/ui/config/plugins.json` |
| **CDN / community registry** | Plugins users install themselves at runtime | Any HTTPS URL serving an ESM bundle | Marketplace "Developer Mode" or the future registry |

All four paths end at the same place: `@oc-mui/remote-plugin-loader` fetches the `.mjs`, rewires its bare imports to shared modules, injects the CSS, and registers the plugin with `PluginManager`. The differences are only in **how the URL list is produced**.

## Available packages (the import contract)

A loaded plugin runs inside the host page and **shares modules** with it. You can import from this list — everything else must be bundled into your plugin's `dist/`:

- `react`, `react-dom`, `react/jsx-runtime`
- `lucide-react`
- `@oc-mui/plugin-system`
- `@oc-mui/ui/components`, `@oc-mui/ui/components/icons`, `@oc-mui/ui/lib`, `@oc-mui/ui/lib/utils`
  — note that `@oc-mui/ui/components/icons` carries only `@oc-mui/ui`'s own
  hand-drawn `Icons`. For lucide icons import `lucide-react` directly: the host
  shares the complete module, so you get every icon, not a curated subset.
- `@oc-mui/query`, `@oc-mui/router`, `@oc-mui/utils`, `@oc-mui/i18n`

Authoritative source: [`packages/remote-plugin-loader/src/transform.ts`](../../packages/remote-plugin-loader/src/transform.ts) (`SHARED_MODULE_NAMES`). Adding a name there is a public-API change and needs a changeset.

The plugin's `vite.config.ts` (scaffolded by `pnpm create-plugin`) marks these as `external`. If you add new dependencies, put them in `dependencies` (bundled) — not `peerDependencies` (which only works for already-shared modules).

## Path 1 — in-tree

Plugins under `plugins/<name>/` are exported from [`plugins/index.ts`](../../plugins/index.ts) and loaded at startup, filtered by `app.enabledPlugins` and `config.plugins[id].enabled`.

Workflow:

1. `pnpm create-plugin my-plugin --in-tree`.
2. Add the export to `plugins/index.ts`.
3. Add the namespace to `app.enabledPlugins` in your config.
4. Open a PR.

No build step at distribution time — the shell's Vite build bundles it.

## Path 2 — `.local-plugins/` (dev only)

Each `.local-plugins/<name>/` is its own git repo, gitignored from this monorepo. `pnpm-workspace.yaml` includes it, so `@oc-mui/*` dependencies resolve normally.

Workflow:

```bash
# In the plugin repo
pnpm --filter @oc-mui/plugin-my-plugin build

# In the shell
pnpm --filter @oc-mui/shell dev
```

The Vite dev plugin at [`packages/vite-config/src/plugins/local-plugins-dev.ts`](../../packages/vite-config/src/plugins/local-plugins-dev.ts) scans every `.local-plugins/<name>/dist/` for `*.mjs` and exposes:

- The bundle at `/local-plugins/<name>/<file>.mjs` (and its `.css` sibling).
- A manifest at `/local-plugins/manifest.json` listing every discovered bundle.

The shell fetches that manifest, filters by `app.enabledPlugins`, and loads each entry through `@oc-mui/remote-plugin-loader`. Add the folder name to `app.enabledPlugins` to enable a plugin.

This path is **dev only**. Production never reads `.local-plugins/`.

### Developing a plugin that's also deployed as a JAR

When you dev-mount a plugin under `.local-plugins/` **and** point the dev
shell at a backend that already has the same plugin deployed as a JAR
(Path 3), the shell sees *both* — and tries to load the JAR's `.mjs` from
the dev server, which doesn't serve it. You get a duplicate in the
marketplace and a console error like:

```
[ERROR] Failed to load plugin from /management-ui/static/plugins/<id>/<id>.mjs
        → "Plugin URL returned HTML (404 or SPA fallback)"
[WARN]  PluginInitializer: JAR plugin "<id>" failed to load
```

(The JAR's static assets live on the backend under its own base path, not
on your dev server — so this error is a dev/remote mismatch, not a broken
JAR.)

To make the dev shell **use your local build and skip the JAR**, declare
the JAR's scope in your `plugin.json`:

```jsonc
{
  "id": "demo-local",
  "namespace": "demo-local",
  // The backend plugins.json lists this JAR under `scope`. Naming it here
  // makes the dev shell skip the JAR and load your local build instead.
  "replacesJarScopes": ["management_ui_plugin_demo_local"]
}
```

On the next reload the console shows `Skipping JAR plugin(s) replaced by
.local-plugins` instead of the error, and only your local copy loads.
`replacesJarScopes` is **dev-only metadata** — it has no effect in
production (which never reads `.local-plugins/`), so it's safe to ship in
the manifest. Find the scope to use in the backend's
`/management-tool/ui/config/plugins.json` (`scope` field) or the
marketplace's "Organization (JAR)" card.

## Path 3 — JAR (production)

For deployments that already ship an Opencast backend, plugins are packaged as JARs and dropped into Opencast's `deploy/` directory. The backend's `PluginBundleTracker` discovers them automatically and exposes a `plugins.json` the shell fetches at boot. This is how the Management UI itself ships — it's an Opencast plugin too.

### Scaffolding

`pnpm create-plugin <name>` (the default `.local-plugins/<name>/` mode) **includes a `backend/` Maven layout by default**. Every org plugin eventually deploys as a JAR, so the scaffold ships ready to build:

```
.local-plugins/my-plugin/
├── package.json, plugin.json, src/, locales/   ← the frontend
└── backend/
    ├── pom.xml                                 ← the Maven config
    ├── README.md                               ← build + deploy how-to
    ├── .gitignore                              ← ignores target/
    └── src/main/java/                          ← optional plugin-side Java
```

Skip the Maven layout with `--no-pom` for plugins that will only ever be distributed via CDN (Path 4). In-tree plugins (`--in-tree`, scaffolded under `plugins/`) never get a `backend/` — they're bundled into the shell's own JAR rather than shipping as their own.

### Build

From inside the plugin's `backend/` directory:

```bash
mvn package
```

This runs in three steps:

1. **Frontend** — installs Node + pnpm under the plugin root and runs `pnpm install && pnpm run build`, producing `dist/<plugin-id>.mjs` (and optionally `.css`, `assets/`).
2. **Resource copy** — copies `dist/`, `plugin.json`, and `locales/` into `target/classes/static/plugins/<plugin-id>/`.
3. **OSGi bundle** — packages everything as a JAR with the headers the tracker reads:

   | Header | Value | Required? |
   |--------|-------|-----------|
   | `Management-Plugin` | `<plugin-id>` | Yes — marker that triggers discovery |
   | `Http-Alias` | `/management-ui/static/plugins/<plugin-id>` | Yes — URL prefix |
   | `Http-Classpath` | `/static/plugins/<plugin-id>` | Yes — JAR-internal directory served at the alias |
   | `Include-Resource` | `static/=target/classes/static` | Yes — embeds the assets in the JAR |
   | `Management-Plugin-Css` | filename stem if not `<plugin-id>.css` | Optional |
   | `Management-Plugin-I18n` | comma-separated namespace list | Optional |

If you already built the frontend separately (e.g. a CI pipeline that builds JS and JAR independently), skip the Node toolchain:

```bash
mvn package -Dskip.frontend.build=true
```

The Maven build will only run the copy + bundle steps.

### Deploy

Drop the JAR into Opencast's `deploy/` directory. No restart needed — Karaf picks it up immediately:

```bash
cp target/<plugin-id>-1.0.0-SNAPSHOT.jar $OPENCAST_HOME/deploy/
```

Or have Maven copy it for you on `mvn install`:

```bash
mvn install -DdeployTo=$OPENCAST_HOME
```

Without `-DdeployTo`, the copy step is a no-op.

### Discovery & load

Backend ([`backend/management-config/.../PluginBundleTracker.java`](../../backend/management-config/src/main/java/org/opencastproject/management/ui/config/PluginBundleTracker.java)) tracks every OSGi bundle that carries the `Management-Plugin` header. For each, it reads `static/plugins/<plugin-id>/plugin.json` (the canonical source of truth) and emits a `PluginConfig` per module declared in the manifest. If `plugin.json` is missing, the tracker falls back to filename-convention discovery: every `*.mjs` in the static directory becomes its own entry.

The aggregated list is served at `GET /management-tool/ui/config/plugins.json`, which the shell ([`apps/shell/src/services/jarPluginLoader.ts`](../../apps/shell/src/services/jarPluginLoader.ts)) fetches at boot. Matching `config`-type plugins load first, runtime config is re-merged, then the rest load filtered by `app.enabledPlugins` and `config.plugins[id].enabled`.

A single JAR can ship multiple `.mjs` entry modules (one folder, many bundles). Declare them in `plugin.json`'s `modules` array; the tracker will emit one entry per module.

See [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) for the full filtering model.

### What the POM does (and doesn't)

The scaffolded POM inherits from `org.opencastproject:base:20-SNAPSHOT` directly. This matches what the Management UI itself does (`apps/shell/pom.xml`). External plugin authors need Opencast's Maven repository reachable from their build environment.

The POM:

- Pins Node 24 and pnpm 10.28 (matching the workspace).
- Skips checkstyle (the suppressions file lives in this repo, not in the plugin's repo).
- Compiles Java for the JDK 21 target Opencast uses.
- Exposes `-DdeployTo=...` and `-Dskip.frontend.build=true` as the two knobs you'll routinely tweak.

The POM does **not**:

- Bundle React, `@oc-mui/*`, `lucide-react`, or any other shared runtime dep into the JAR. Those are provided by the host shell. See [`architecture/CONTRACTS.md` § 5](../architecture/CONTRACTS.md#5-shared-runtime-dependencies).
- Publish the plugin to a Maven repository. If you want a public Maven artifact, add `distributionManagement` and run `mvn deploy` yourself.

## Path 4 — CDN / community registry

For plugins distributed publicly:

1. **Build**: `pnpm build` in your plugin repo produces `dist/<name>.mjs` (+ `.mjs.map`, optional `.css`).
2. **Host**: Push to a GitHub repo, tag a release, and serve via jsDelivr:
   ```
   https://cdn.jsdelivr.net/gh/<org>/<repo>@v1.0.0/dist/<name>.mjs
   ```
   Or any CDN/object store that serves with correct CORS headers.
3. **Install**: Inside the running shell, open the Marketplace → Developer Mode → paste the URL → "Install" persists it in `localStorage`. On reload the marketplace loads it through the same `remote-plugin-loader`.

> **Remote loading is opt-in.** Because Path 4 fetches and executes third-party
> code at runtime, it is **off by default**. An administrator must enable it in
> `config.json`, and may restrict which hosts a plugin URL can be fetched from:
>
> ```json
> {
>   "plugins": {
>     "admin-marketplace": {
>       "remotePlugins": { "enabled": true, "allowedDomains": ["cdn.jsdelivr.net"] }
>     }
>   }
> }
> ```
>
> While disabled, the Community and Developer sections show how to turn it on and
> the loader refuses every remote load (including previously-installed plugins).
> Paths 1–3 (bundled, in-tree, JAR) are unaffected. The marketplace routes are
> also admin-only. Note the allowlist authenticates the *host*, not the code's
> author, so keep it to hosts you trust. Matching is suffix-based (a domain
> admits its subdomains), which is why bare `github.io` is not a default — it
> would admit every GitHub user's Pages site. To serve plugins from your own
> GitHub Pages, allow your subdomain explicitly (e.g. `"my-org.github.io"`).

A first-party community registry is planned but not yet shipped.

## Picking between JAR and CDN

| | JAR | CDN |
|---|-----|-----|
| Needs backend code? | Optional — JARs *can* include Java | No |
| Production-ready? | Yes — same origin as the shell | Yes, but depends on CDN uptime + CORS |
| Versioning | One JAR per release | URL-pinned (`@v1.0.0`) |
| Updates | Replace JAR, restart Opencast | Live; users re-install when notified |
| Air-gapped deploys | Works | Doesn't |

Most production orgs ship JARs. CDN is the route when the plugin has no backend, the user installs it themselves, or you want a low-friction "try it" link.

## Cross-cutting concerns

### CSS

`@oc-mui/remote-plugin-loader` auto-requests `<module>.css` next to every loaded `<module>.mjs`. Build your CSS to the same stem as your bundle. Load order: plugin CSS is inserted **before** host CSS — see [`styling.md`](./styling.md).

### Versioning

JAR-bundled and CDN-distributed plugins should align their `package.json` and `plugin.json` versions to the same semver string, and tag the git release accordingly. The shell does not enforce this, but tooling assumes it.

### CORS

CDN-served plugins need permissive CORS on the `.mjs` (and `.css`). jsDelivr does this by default; raw `https://github.com/...` URLs do not.

## See also

- [`creating-a-plugin.md`](./creating-a-plugin.md) — the upstream of all four paths.
- [`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md) — `enabledPlugins` filtering and the layered config model.
- [`packages/remote-plugin-loader/README.md`](../../packages/remote-plugin-loader/README.md) — the loader's public API.
- [`apps/shell/src/services/jarPluginLoader.ts`](../../apps/shell/src/services/jarPluginLoader.ts) — JAR loading source.
- [`packages/vite-config/src/plugins/local-plugins-dev.ts`](../../packages/vite-config/src/plugins/local-plugins-dev.ts) — `.local-plugins/` dev mount.
