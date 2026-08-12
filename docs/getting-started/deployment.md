# Deployment

For Opencast admins. Afterwards you'll have Management UI running on your Opencast: three JARs deployed, one `config.json` in place, login working.

Looking to run the UI from a source checkout for development instead? That's [Run from source](./installation.md); the complete contributor stack (including a local Opencast) is [Full local setup](./local-backend.md).

## The artifacts

A deployment is three OSGi bundles, plus an optional Karaf feature that groups them:

| Artifact | Built from | What it does |
|---|---|---|
| `management-ui-config` | [`backend/management-config/`](../../backend/management-config/) | Serves `/management-tool/ui/config/plugins.json` and discovers plugin JARs dropped next to it |
| `management-ui-graphql` | [`backend/management-graphql/`](../../backend/management-graphql/) | Adds the `mui*` GraphQL extensions the UI queries — **required**, the event/series screens and all mutations depend on it |
| `management-ui-core` | [`apps/shell/`](../../apps/shell/) | Contains the built SPA and serves it at `/management-ui` (OSGi `Http-Alias`) |
| `management-ui-feature` | [`assemblies/management-ui-feature/`](../../assemblies/management-ui-feature/) | Karaf feature (`opencast-management-ui`) aggregating the three bundles, for feature-based installs from a Maven repository |

On the Opencast side, one prerequisite: the **`opencast-plugin-graphql`** plugin must be enabled. It ships with Opencast ≥ 17 but is off by default — set `opencast-plugin-graphql = on` in `etc/org.opencastproject.plugin.impl.PluginManagerImpl.cfg`.

## Getting the artifacts

There are **no prebuilt JAR downloads yet**: no release has been published so far, and the release automation creates version tags and GitHub Releases but does not attach JAR files. Today you build the bundles from source:

- **JDK 21** and **Maven** — `mvn -version` must report Java 21. Node and pnpm are *not* prerequisites: the root `pom.xml` downloads pinned versions and builds the frontend itself.
- The bundles build against Opencast's `19-SNAPSHOT` parent POM, which is not on Maven Central — build Opencast `r/19.x` from source once so the parent lands in your local `~/.m2`. [Full local setup](./local-backend.md) walks through that build.

```bash
git clone https://github.com/academic-moodle-cooperation/management-ui.git
cd management-ui
mvn install -DskipTests
```

The JARs land in `backend/management-config/target/`, `backend/management-graphql/target/`, and `apps/shell/target/`.

Which source version to build for which Opencast — release lines, tags, and the product-version ↔ Opencast mapping — is covered in [Upgrading](./upgrading.md) and [Releases & versioning](../operations/release.md).

## Install into Opencast

The build has a deploy step built in: pass `-DdeployTo` pointing at your Opencast directory and it copies the three JARs into the hot-deploy folder *and* installs the shipped default `config.json`:

```bash
mvn install -DskipTests -DdeployTo="$OPENCAST_HOME"
```

- JARs → `$OPENCAST_HOME/deploy/` — Karaf hot-loads them, no restart needed.
- Default config → `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json`. Careful on re-deploys: the copy step can replace a `config.json` you have edited (it only skips the copy when your file is newer than the one in the checkout) — keep your config in version control or back it up.

To copy by hand instead:

```bash
cp backend/management-config/target/management-ui-config-*.jar \
   backend/management-graphql/target/management-ui-graphql-*.jar \
   apps/shell/target/management-ui-core-*.jar \
   "$OPENCAST_HOME/deploy/"
```

## Configure

The UI reads one file on the Opencast host:

```
$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json
```

Opencast serves it at `/ui/config/management-ui/config.json`; the shell fetches it at boot. Edit the file in place — no rebuild, no restart, just reload the browser. Every key (themes, locale, enabled plugins, auth URLs, per-plugin slices) is documented in [Configuration](./configuration.md).

Example — switch from the default theme to one of the shipped showcase themes:

```json
{
  "app": {
    "theme": "forest-sage"
  }
}
```

Anything the file omits falls back to built-in defaults, so it only needs to carry what your deployment overrides.

## Verify it works

1. Open `https://<your-opencast>/management-ui/` — the UI loads and login works. Authentication is your Opencast's (Shibboleth, form login, …); the UI only needs the `auth.*` URLs in `config.json` to match — see [Configuration → Authentication](./configuration.md#authentication).
2. The plugin endpoint answers (an empty list is correct until you deploy plugin JARs; anonymous requests get HTTP 403, so authenticate):

   ```bash
   curl -s -u <admin-user> "https://<your-opencast>/management-tool/ui/config/plugins.json"
   # → {"plugins":[]}
   ```

## Next

- [Configuration](./configuration.md) — every `config.json` key, merge order, branding.
- [Upgrading](./upgrading.md) — moving between versions, release lines, JAR ↔ Opencast mapping.
- [Distribution](../plugins/distribution.md) — deploying org plugins as JARs alongside these bundles.
- [Run from source](./installation.md) / [Full local setup](./local-backend.md) — the developer paths.
