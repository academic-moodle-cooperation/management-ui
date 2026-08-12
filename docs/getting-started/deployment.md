# Deployment

For Opencast admins. Afterwards you'll have Management UI running on your Opencast: three JARs deployed, one `config.json` in place, login working.

Looking to run the UI from a source checkout for development instead? That's [Run from source](./installation.md); the complete contributor stack (including a local Opencast) is [Full local setup](./local-backend.md).

Throughout this page, `$OPENCAST_HOME` is your Opencast installation directory — the one containing `etc/`, `deploy/`, and `bin/`.

## Prerequisites

On the Opencast host:

- **Opencast 20.** The current release line targets Opencast 20; which Management UI version pairs with which Opencast is in [Upgrading](./upgrading.md#which-version-am-i-running).
- **The `opencast-plugin-graphql` plugin enabled.** It ships with Opencast but is off by default: in `$OPENCAST_HOME/etc/org.opencastproject.plugin.impl.PluginManagerImpl.cfg`, set `opencast-plugin-graphql = on`, then restart Opencast if it was already running.

On the machine you build on (any machine — it does not have to be the Opencast host):

- **JDK 21 or newer** (the build targets release 21) and **Maven** — or no Maven at all: the repo ships the `./mvnw` wrapper, so substitute `./mvnw` for `mvn` in every command below. `mvn -version` (or `./mvnw -version`) must report Java 21+. Node and pnpm are *not* prerequisites: the root `pom.xml` downloads pinned versions and builds the frontend itself.
- **The Opencast `20-SNAPSHOT` parent POM in your local `~/.m2`.** It is not on Maven Central — build Opencast `r/20.x` from source once so the parent lands there. [Full local setup → Build and start Opencast 20](./local-backend.md#2-build-and-start-opencast-20) walks through that build.

## The artifacts

A deployment is three OSGi bundles, plus an optional Karaf feature that groups them:

| Artifact | Built from | What it does |
|---|---|---|
| `management-ui-config` | [`backend/management-config/`](../../backend/management-config/) | Serves `/management-tool/ui/config/plugins.json` and discovers plugin JARs dropped next to it |
| `management-ui-graphql` | [`backend/management-graphql/`](../../backend/management-graphql/) | Adds the `mui*` GraphQL extensions the UI queries — **required**, the event/series screens and all mutations depend on it |
| `management-ui-core` | [`apps/shell/`](../../apps/shell/) | Contains the built SPA and serves it at `/management-ui` (OSGi `Http-Alias`) |
| `management-ui-feature` | [`assemblies/management-ui-feature/`](../../assemblies/management-ui-feature/) | Karaf feature (`opencast-management-ui`) aggregating the three bundles, for feature-based installs from a Maven repository |

## Getting the artifacts

There are **no prebuilt JAR downloads yet**: no release has been published so far, and the release automation creates version tags and GitHub Releases but does not attach JAR files. Today you build the bundles from source:

```bash
git clone https://github.com/academic-moodle-cooperation/management-ui.git
cd management-ui
mvn install -DskipTests
```

The JARs land in `backend/management-config/target/`, `backend/management-graphql/target/`, and `apps/shell/target/`.

Which source version to build for which Opencast — release lines, tags, and the product-version ↔ Opencast mapping — is covered in [Upgrading](./upgrading.md) and [Releases & versioning](../operations/release.md#release-lines-and-the-product-version).

## Install into Opencast

The build has a deploy step built in: pass `-DdeployTo` pointing at your Opencast directory and it copies the three JARs into the hot-deploy folder *and* installs the shipped default `config.json`:

```bash
mvn install -DskipTests -DdeployTo="$OPENCAST_HOME"
```

- JARs → `$OPENCAST_HOME/deploy/`. With Opencast running, Karaf hot-loads them — no restart; with Opencast stopped, they're picked up on the next start.
- Default config → `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json`. Careful on re-deploys: the copy step can replace a `config.json` you have edited (it only skips the copy when your file is newer than the one in the checkout) — keep your config in version control or back it up.

To copy by hand instead:

```bash
cp backend/management-config/target/management-ui-config-*.jar \
   backend/management-graphql/target/management-ui-graphql-*.jar \
   apps/shell/target/management-ui-core-*.jar \
   "$OPENCAST_HOME/deploy/"
```

When copying by hand, also create `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json` — start from the minimal examples in [Configure](#configure) below, or copy the shipped default from [`apps/shell/public/ui/config/management-ui/config.json`](../../apps/shell/public/ui/config/management-ui/config.json). (`-DdeployTo` does this step for you.)

## Configure

The UI reads one file on the Opencast host:

```
$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json
```

Opencast serves it at `/ui/config/management-ui/config.json`; the shell fetches it at boot. Edit the file in place — no rebuild, no restart, just reload the browser. Every key (themes, locale, enabled plugins, auth URLs, per-plugin slices) is documented in [Configuration](./configuration.md).

One edit you'll almost certainly need: the shipped default points login at Shibboleth. On a stock Opencast **without** an SSO IdP, point `auth.*` at the Spring form-login endpoints instead:

```json
{
  "auth": {
    "loginUrl": "/j_spring_security_login",
    "logoutUrl": "/j_spring_security_logout"
  }
}
```

Note that on a stock Opencast, users will still see **Opencast's own login page** first: `etc/security/mh_default_org.xml` lists `/management-ui/**` in its `redirectingPathPatterns`, so anonymous requests are 302-redirected to Opencast's `/login.html` before the SPA can load. That works fine — after logging in there, the user lands back in `/management-ui`. If you want the shell's own **themed** login form instead, additionally allow anonymous access to `/management-ui/**` in that security file, so the SPA loads first and presents its form ([Configuration → Authentication](./configuration.md#authentication)).

With an IdP (Shibboleth, OIDC, CAS, …), set `auth.loginUrl` to your IdP's entry URL instead — see [Configuration → Authentication](./configuration.md#authentication). Anything the file omits falls back to built-in defaults, so it only needs to carry what your deployment overrides.

## Verify it works

1. Open `https://<your-opencast>/management-ui/` — the UI loads, and logging in (via Opencast's login page, the shell's themed form, or your IdP — see [Configure](#configure)) lands you back in Management UI with the sidebar showing the nav entries contributed by the enabled plugins (with the defaults: the episodes, series, and upload entries).
2. The plugin endpoint answers (an empty list is correct until you deploy plugin JARs; anonymous requests get HTTP 403, so authenticate):

   ```bash
   curl -s -u <admin-user> "https://<your-opencast>/management-tool/ui/config/plugins.json"
   # → {"plugins":[]}
   ```

If the UI loads but the event/series screens fail, check the `opencast-plugin-graphql` prerequisite ([above](#prerequisites)) — every data query goes through `/graphql`, which only exists with that plugin on.

## Next

- [Configuration](./configuration.md) — every `config.json` key, merge order, branding.
- [Upgrading](./upgrading.md) — moving between versions, release lines, JAR ↔ Opencast mapping.
- [Distribution](../plugins/distribution.md) — deploying org plugins as JARs alongside these bundles.
- [Run from source](./installation.md) / [Full local setup](./local-backend.md) — the developer paths.
