# Install

For Opencast admins. Afterwards you'll have Management UI running on your Opencast: the bundles deployed, a config in place, login working.

Throughout this page, `$OPENCAST_HOME` is your Opencast installation directory — the one containing `etc/`, `deploy/`, and `bin/`.

## Prerequisites

On the Opencast host:

- **Opencast 19 or 20 — and you must build from the matching release line.** There is one line per supported Opencast major: `r/19.x` builds against `base:19-SNAPSHOT`, `r/20.x` against `base:20-SNAPSHOT`. A bundle built for one major refuses to start on another, because the OSGi import ranges are fixed at compile time. Note your major now; step one of the build checks that branch out. More on lines: [Upgrade](./upgrade.md#which-version-am-i-running).
- **The `opencast-plugin-graphql` plugin enabled.** It ships with Opencast but is off by default: in `$OPENCAST_HOME/etc/org.opencastproject.plugin.impl.PluginManagerImpl.cfg` set `opencast-plugin-graphql = on`, then restart Opencast if it was already running.

On the machine you build on — it does not have to be the Opencast host:

- **JDK 21 or newer and Maven.** `mvn -version` must report Java 21+. No Maven installed? The repo ships `./mvnw`; substitute it for `mvn` below. Node and pnpm are *not* prerequisites — the root `pom.xml` downloads pinned versions and builds the frontend itself.
- **Opencast's own `NN-SNAPSHOT` parent POM in your local `~/.m2`**, for the same major. It is not on Maven Central, so build Opencast's matching `r/NN.x` branch from source once and it lands there ([Full local setup](../getting-started/local-backend.md#2-build-and-start-opencast-20) walks through it for 20).

## The artifacts

| Artifact | Built from | What it does |
|---|---|---|
| `management-ui-config` | `backend/management-config/` | Serves `/management-tool/ui/config/plugins.json` and discovers plugin JARs dropped next to it |
| `management-ui-graphql` | `backend/management-graphql/` | Adds the `mui*` GraphQL extensions — **required**: the video and series screens and every mutation depend on them |
| `management-ui-core` | `apps/shell/` | Carries the built SPA and serves it at `/management-ui` (OSGi `Http-Alias`) |
| `management-ui-feature` | `assemblies/management-ui-feature/` | Karaf feature `opencast-management-ui` aggregating the three, for feature-based installs from a Maven repository |

## Build and deploy

There are **no prebuilt JAR downloads**: the release automation creates version tags and GitHub Releases, but attaches no JAR files. You build from source — and the build deploys for you when you pass `-DdeployTo`. Checking out the release line first is not optional: a fresh clone lands on the integration branch, which targets the newest major, and bundles built there install but never resolve on an older Opencast.

```bash
git clone https://github.com/academic-moodle-cooperation/management-ui.git
cd management-ui
git checkout r/20.x          # ← the line matching YOUR Opencast major: r/19.x or r/20.x
mvn install -DskipTests -DdeployTo="$OPENCAST_HOME"
```

- **JARs → `$OPENCAST_HOME/deploy/`.** With Opencast running, Karaf hot-loads them — no restart. With Opencast stopped, they load on the next start.
- **Default config → `$OPENCAST_HOME/etc/ui-config/mh_default_org/management-ui/config.json`.** Careful on re-deploys: this copy replaces a `config.json` you have edited unless your file is newer than the one in the checkout. Keep your config in version control.
- **Check that the copy landed.** The deploy step is deliberately non-fatal, so a mistyped `-DdeployTo` still ends in `BUILD SUCCESS` — with the JARs sitting in a directory tree it just created at whatever path you named. Confirm with `ls "$OPENCAST_HOME"/deploy/management-ui-*.jar`.

Without `-DdeployTo` the JARs stay in each module's `target/`; copy the three into `deploy/` yourself and create the config file at the path above.

## Point login at your backend

The shipped default sends users to Shibboleth. On a stock Opencast without an identity provider, use the Spring form-login endpoints instead:

```json
{ "auth": { "loginUrl": "/j_spring_security_login", "logoutUrl": "/j_spring_security_logout" } }
```

Users still meet **Opencast's own login page** first: `etc/security/mh_default_org.xml` lists `/management-ui/**` in its `redirectingPathPatterns`, so anonymous requests are redirected to `/login.html` before the SPA can load. That works — after logging in there, they land back in `/management-ui`. To get the shell's own themed form instead, additionally allow anonymous access to `/management-ui/**` in that file. Everything else the config file can do: [Configure](./configure.md).

## Verify

1. Open `https://opencast.example.org/management-ui/` and log in. You land in Management UI, and the sidebar shows the entries the enabled plugins contribute — with the defaults: **Videos**, **Series**, **Upload**.
2. The plugin endpoint answers: `curl -s -u <admin-user> "https://opencast.example.org/management-tool/ui/config/plugins.json"` returns `{"plugins":[]}`. The empty list is correct until you deploy plugin JARs; anonymous requests get HTTP 403, hence the credentials.

If the UI loads but the tables error out, the GraphQL prerequisite above is unmet — every data query goes through `/graphql`. Other symptoms: [Troubleshooting](./troubleshooting.md).
