# Full local setup (UI + backend + plugins)

The complete development stack on one Linux or macOS machine: the Management
UI dev server talking to a **real Opencast** with the Management UI backend
bundles deployed, plugins included. This is the setup you want for working on anything
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
| `management-ui-core` (JAR) | Serves the built SPA at `/management-ui/` (`Http-Alias`; the JAR-internal `/ui` classpath is not part of the URL) | Optional in dev (Vite serves the UI); needed for prod-style serving |
| OpenSearch 1.x | Opencast's search index | Container (podman) |
| The UI itself | `http://127.0.0.1:3000/management-ui/` | `pnpm dev` in this repo |

> **Version note.** The backend bundles currently build against
> `org.opencastproject:base:19-SNAPSHOT`, so the branch you need is Opencast
> **`r/19.x`** — not `develop`, which has already moved on to the next major
> version. That parent POM is not on Maven Central, so building Opencast from
> source first (which installs it into your local `~/.m2`) is a hard
> prerequisite. Once the backend targets a released Opencast, prebuilt
> container images become an option; that switch is tracked in
> [operations/open-followups.md](../operations/open-followups.md).

## Prerequisites

- git, **JDK 21**, **Maven ≥ 3.6** — `mvn -version` must report Java 21
- **Node ≥ 20**, **pnpm ≥ 10** (`corepack enable`)
- **podman** (for OpenSearch)
- ffmpeg (Opencast runtime dependency), netcat (`bin/stop-opencast` needs `nc`)
- ~8 GB free RAM, ~15 GB disk (the Opencast build is large)

Opencast's own developer docs still name JDK 17; use **21** here, since the
Management UI backend bundles compile against Java 21 and one JDK has to serve
both builds.

On a fresh Ubuntu:

```bash
sudo apt update
sudo apt install -y git curl ffmpeg netcat-openbsd openjdk-21-jdk maven podman
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable      # plain `corepack enable` fails with EACCES on a system-wide Node
```

Then check `mvn -version` (Java 21), `node -v` and `pnpm -v` before continuing.

On macOS (Apple Silicon, Homebrew) — git and `nc` already ship with macOS:

```bash
brew install openjdk@21 maven podman ffmpeg node pnpm
```

`openjdk@21` is keg-only: it lands outside the PATH, and
`/usr/libexec/java_home -v 21` does **not** find it either (that would need the
`sudo ln -sfn …` symlink from Homebrew's caveats). The sudo-free route is to
export `JAVA_HOME` in the shell that runs the builds:

```bash
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

Homebrew's Maven follows `JAVA_HOME`, so after this the same `mvn -version` →
Java 21 check applies. Homebrew's `node` formula is the current major (26 at
the time of writing), not the LTS the Ubuntu instructions install — that works,
including a harmless deprecation warning it triggers (see troubleshooting).

## 1. OpenSearch via podman

On macOS, podman runs containers inside a Linux VM that does not exist until
you create it — once, before the first `podman run`:

```bash
podman machine init
podman machine start
```

After that the commands below work as written: the VM forwards `:9200` to
localhost, and the `:Z` label is fine there too (the VM is Fedora CoreOS,
which runs SELinux).

```bash
podman volume create opensearch-data
podman run -d --name opensearch \
  -p 9200:9200 \
  -e discovery.type=single-node \
  -e plugins.security.disabled=true \
  -e OPENSEARCH_JAVA_OPTS="-Xms512m -Xmx512m" \
  -v opensearch-data:/usr/share/opensearch/data:Z \
  docker.io/opensearchproject/opensearch:1.3.20

# Opencast's index mappings use the icu_folding filter, which the stock
# image does not ship — without it, index creation fails and half of
# Opencast (including /graphql) silently stays down. Not optional:
podman exec opensearch bin/opensearch-plugin install analysis-icu
podman restart opensearch

curl -s http://localhost:9200 | head -3   # should answer with version JSON
```

(The `:Z` volume label matters on SELinux distros like Fedora.)

## 2. Build and start Opencast 19

```bash
git clone --branch r/19.x --recurse-submodules \
  https://github.com/opencast/opencast.git
cd opencast
mvn clean install -DskipTests    # long: 30–60 min on first run
cd build
tar xf opencast-dist-allinone-*.tar.gz
cd opencast-dist-allinone
```

`--recurse-submodules` is not optional: `modules/admin`, `modules/editor` and
`modules/studio` are git submodules, and the build fails without them. `mvn
install` (rather than `package`) is what puts the `19-SNAPSHOT` artifacts into
`~/.m2` for step 3.

Enable the GraphQL plugin — in
`etc/org.opencastproject.plugin.impl.PluginManagerImpl.cfg`, change the line

```properties
opencast-plugin-graphql = off
```

to

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

`./bin/start-opencast` starts an **interactive Karaf console** and expects to
keep a terminal. If you background it instead (`nohup … &`, a CI job, any
detached stdin), the console immediately reads EOF — which Karaf treats as
`<ctrl-d>`, i.e. shutdown — and Opencast dies seconds after starting, leaving
a misleading `Invalid BundleContext` stack trace as the last log entry. For a
backgrounded or scripted start, use server mode, which starts no local
console:

```bash
./bin/start-opencast server
```

Stopping works the same either way: `./bin/stop-opencast` (or `<ctrl-d>` in
the interactive console).

That last call must print a `{"data":…}` object. A body of exactly `null` —
with HTTP 200 — means Opencast built no GraphQL schema for the organization;
see the troubleshooting table.

## 3. Build + deploy the Management UI backend bundles

Clone this repository if you haven't yet (skip if you already followed
[Installation](./installation.md)):

```bash
git clone https://github.com/academic-moodle-cooperation/management-ui.git
```

Then build the backend bundles (the Opencast build above already put the
`19-SNAPSHOT` parent into `~/.m2`). `OPENCAST_DIST` is the directory you
unpacked in step 2 — with the clone layout used above, that is
`~/opencast/build/opencast-dist-allinone`:

```bash
export OPENCAST_DIST=~/opencast/build/opencast-dist-allinone

cd management-ui
mvn install -DskipTests
cp backend/management-config/target/management-ui-config-*.jar \
   backend/management-graphql/target/management-ui-graphql-*.jar \
   "$OPENCAST_DIST/deploy/"
```

Karaf hot-loads JARs dropped into `deploy/` — no restart needed. Verify — an
empty `plugins` array is the correct answer here, it only fills once you deploy
plugin JARs in step 5:

```bash
curl -s -u admin:opencast \
  http://localhost:8080/management-tool/ui/config/plugins.json   # → {"plugins":[]}
```

## 4. Run the UI

```bash
pnpm install
pnpm dev            # proxy target defaults to http://localhost:8080
```

Open **http://127.0.0.1:3000/management-ui/**, log in as `admin` /
`opencast`. Events, series, upload, and ACL editing now run against your real
backend.

Two things look broken on first run but aren't. On a cold start the dev server
prints a `pre-bundling dependencies …` hint and then goes quiet until its
`ready in … ms` line — Vite is pre-bundling the workspace's dependencies, and
inside a VM that silence is easily 1–2 minutes. And the first page load is
slow and heavy (10 MB+): dev serves unbundled, unminified ES modules. Both are
one-time costs per cache; subsequent starts and loads are fast.

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
| `/graphql` answers HTTP 200 with a body of exactly `null`, GraphiQL says "Error fetching schema" | No schema was built for the organization. Opencast reports this as an error result whose `toSpecification()` returns `null`, so the endpoint swallows the message — the real cause is only in the log: `grep -i "GraphQL schema" data/log/opencast.log`, then read the stack trace after `Error building GraphQL schema` |
| Log: `"Query" must define one or more fields` when building the GraphQL schema | The schema's fields come from Opencast's `IndexService`-backed provider — this error means the index services never came up. Look **earlier** in the log for the root cause; the usual one is the `icu_folding` failure below |
| Log: `Custom Analyzer [autocomplete_analyzer] failed to find filter under name [icu_folding]`, `_cat/indices` empty, services `assetmanager`/`search`/`ingest`/`workflow` marked offline | `analysis-icu` missing from OpenSearch (step 1's `opensearch-plugin install`). Install it, restart OpenSearch, then restart Opencast — the offline services do not recover on their own |
| Event/series lists error, other screens fine | `management-ui-graphql` JAR missing from `deploy/` (the UI queries `muiEventInfo`/`muiSeriesInfo`) |
| `plugins.json` returns HTTP 403 "Access Denied" | Unauthenticated request — Opencast's security config rejects anonymous access to this path. Pass `-u admin:opencast` when checking with `curl`; the browser uses its login session |
| Terminal shows a friendly 502 notice | Nothing listening on the proxy target — Opencast down or wrong `VITE_PROXY_TARGET` |
| Login loops back to the form | Host-header mismatch: access Opencast via exactly the host in `org.opencastproject.server.url` |
| Opencast dies seconds after a backgrounded start; last log entry is an `IllegalStateException: Invalid BundleContext` stack trace | The interactive Karaf console read EOF from its detached stdin and shut Opencast down again. Start with `./bin/start-opencast server` instead (step 2) |
| `pnpm dev` prints ``DeprecationWarning: `module.register()` is deprecated`` (`DEP0205`) | Warning from the dev tooling's TypeScript loader on current (non-LTS) Node majors, e.g. Homebrew's Node 26 — harmless, the dev server works normally |
| Opencast startup errors about the index | OpenSearch not reachable on `:9200`, or volume permissions (rootless podman: keep the `:Z` label) |
| `mvn install` in management-ui fails resolving `base:19-SNAPSHOT` | Opencast build (step 2) not completed on this machine — it installs the parent POM locally, and only `r/19.x` has that version |
| Opencast build fails in `modules/admin`, `modules/editor` or `modules/studio` with missing sources | Cloned without `--recurse-submodules` — run `git submodule update --init --recursive` and resume |
| Opencast build fails during `npm ci` with `ETIMEDOUT` | Registry timeouts, not a code problem — raise npm's retry limits (below) and resume |
| `npm WARN EBADENGINE` during the Opencast build | Warning only: the frontend submodules pin older Node ranges. Only `npm ERR!` and Maven's final `BUILD FAILURE` mean the build failed |

A failed Maven module does not mean starting over: Maven prints a `-rf` resume
command at the end of the error output, e.g.

```bash
mvn install -DskipTests -rf :opencast-lti
```

For repeated registry timeouts during the Opencast build, raise npm's retry and
timeout settings in `~/.npmrc` first:

```ini
fetch-retries=10
fetch-retry-factor=2
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=180000
fetch-timeout=600000
```
