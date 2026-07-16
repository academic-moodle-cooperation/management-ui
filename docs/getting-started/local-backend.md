# Full local setup (UI + backend + plugins)

The complete development stack on one Linux machine: the Management UI dev
server talking to a **real Opencast** with the Management UI backend bundles
deployed, plugins included. This is the setup you want for working on anything
that touches live data (events/series lists, ACLs, uploads, auth).

If you only need the shell and mocked data — plugin authoring, UI work — you
don't need any of this: see the lighter options in
[Installation → Configure the backend](./installation.md#configure-the-backend).

## The moving parts

| Part | What it provides | Where it comes from |
|---|---|---|
| Opencast core | Auth (`/info/me.json`), ingest, data | Built from source (see version note) |
| `opencast-plugin-graphql` | The `/graphql` endpoint | Ships **with** Opencast ≥ 17, **disabled by default** |
| `management-ui-config` (JAR) | `/management-tool/ui/config/plugins.json` + plugin discovery | Built from this repo's `backend/` |
| `management-ui-graphql` (JAR) | The `mui*` GraphQL extensions | Built from this repo's `backend/` — **required**: the event/series screens query `muiEventInfo`/`muiSeriesInfo` and all mutations go through `mui { … }` |
| `management-ui-core` (JAR) | Serves the built SPA at `/management-ui/ui/` | Optional in dev (Vite serves the UI); needed for prod-style serving |
| OpenSearch 1.x | Opencast's search index | Container (podman) |
| The UI itself | `http://127.0.0.1:3000/management-ui/` | `pnpm dev` in this repo |

> **Version note.** The backend bundles currently build against
> `org.opencastproject:base:19-SNAPSHOT` — i.e. **Opencast `develop`**. That
> parent POM is not on Maven Central, so building Opencast from source first
> (which installs it into your local `~/.m2`) is a hard prerequisite. Once the
> backend targets a released Opencast, prebuilt container images become an
> option; that switch is tracked in
> [operations/open-followups.md](../operations/open-followups.md).

## Prerequisites (Linux)

- git, **JDK 17**, **Maven ≥ 3.6**
- **Node ≥ 20**, **pnpm ≥ 10** (`corepack enable`)
- **podman** (for OpenSearch)
- ffmpeg (Opencast runtime dependency; from your distro's repos)
- ~8 GB free RAM, ~15 GB disk (the Opencast build is large)

## 1. OpenSearch via podman

```bash
podman volume create opensearch-data
podman run -d --name opensearch \
  -p 9200:9200 \
  -e discovery.type=single-node \
  -e plugins.security.disabled=true \
  -e OPENSEARCH_JAVA_OPTS="-Xms512m -Xmx512m" \
  -v opensearch-data:/usr/share/opensearch/data:Z \
  docker.io/opensearchproject/opensearch:1.3.20

curl -s http://localhost:9200 | head -3   # should answer with version JSON
```

(The `:Z` volume label matters on SELinux distros like Fedora. Opencast also
needs the `analysis-icu` plugin for some setups — see the Opencast admin docs
if indexing errors mention it.)

## 2. Build and start Opencast (develop)

```bash
git clone https://github.com/opencast/opencast.git
cd opencast                      # develop branch = 19-SNAPSHOT
mvn clean install -DskipTests    # long: 30–60 min on first run
cd build
tar xf opencast-dist-allinone-*.tar.gz && cd opencast-dist-allinone-*
```

Enable the GraphQL plugin (off by default) — in
`etc/org.opencastproject.plugin.impl.PluginManagerImpl.cfg`:

```properties
opencast-plugin-graphql = on
```

Leave `org.opencastproject.server.url` at its default
`http://localhost:8080` (`etc/custom.properties`) — Opencast is strict about
the Host header matching this URL during login, so access it exactly via
`localhost:8080`.

```bash
./bin/start-opencast          # first boot takes a few minutes
curl -s http://localhost:8080/info/me.json | head -1   # → anonymous user JSON
curl -s -u admin:opencast -X POST http://localhost:8080/graphql \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ currentUser { username } }"}'         # → {"data":…}
```

Default credentials: `admin` / `opencast`.

## 3. Build + deploy the Management UI backend bundles

From your management-ui clone (the Opencast build above already put the
`19-SNAPSHOT` parent into `~/.m2`):

```bash
cd management-ui
mvn install -DskipTests
cp backend/management-config/target/management-ui-config-*.jar \
   backend/management-graphql/target/management-ui-graphql-*.jar \
   <opencast-dist-dir>/deploy/
```

Karaf hot-loads JARs dropped into `deploy/` — no restart needed. Verify:

```bash
curl -s http://localhost:8080/management-tool/ui/config/plugins.json   # → {"plugins":[…]}
```

## 4. Run the UI

```bash
pnpm install
pnpm dev            # proxy target defaults to http://localhost:8080
```

Open **http://127.0.0.1:3000/management-ui/**, log in as `admin` /
`opencast`. Events, series, upload, and ACL editing now run against your real
backend.

## 5. Plugins

- **In-tree plugins** (episodes, series, upload, …) are part of the dev shell —
  nothing to do.
- **Your own plugin, hot-reloading:** scaffold with `pnpm create-plugin
  my-plugin` and build it; the dev shell serves `.local-plugins/*/dist/`
  automatically. See [Creating a plugin](../plugins/creating-a-plugin.md).
- **Org/community plugins as JARs:** drop the plugin JAR into the same
  `deploy/` directory; `management-ui-config` discovers it and the shell loads
  it from `plugins.json`. Full details: [Distribution](../plugins/distribution.md).

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `/graphql` returns 404 | GraphQL plugin not enabled — step 2's `PluginManagerImpl.cfg` line, then restart Opencast |
| Event/series lists error, other screens fine | `management-ui-graphql` JAR missing from `deploy/` (the UI queries `muiEventInfo`/`muiSeriesInfo`) |
| Terminal shows a friendly 502 notice | Nothing listening on the proxy target — Opencast down or wrong `VITE_PROXY_TARGET` |
| Login loops back to the form | Host-header mismatch: access Opencast via exactly the host in `org.opencastproject.server.url` |
| Opencast startup errors about the index | OpenSearch not reachable on `:9200`, or volume permissions (rootless podman: keep the `:Z` label) |
| `mvn install` in management-ui fails resolving `base:19-SNAPSHOT` | Opencast build (step 2) not completed on this machine — it installs the parent POM locally |
