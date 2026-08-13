# Troubleshooting

For Opencast admins facing a deployment that misbehaves. Afterwards you'll have matched the symptom to its cause and its fix.

This is a lookup page, not a walkthrough — find your symptom, apply the fix. Symptoms while *building* Opencast itself belong to [Full local setup](../getting-started/local-backend.md#troubleshooting); everything below is about a deployed Management UI.

## The UI does not load, or loads empty

| Symptom | Cause and fix |
|---|---|
| You land on Opencast's own login page instead of the UI | Expected on a stock Opencast: `etc/security/mh_default_org.xml` lists `/management-ui/**` in its `redirectingPathPatterns`, so anonymous requests are redirected before the SPA can load. Logging in there returns the user to `/management-ui`. Want the shell's themed form instead? Allow anonymous access to `/management-ui/**` in that file ([Install](./install.md#point-login-at-your-backend)) |
| Login succeeds but the user stays signed out, looping back to the form | Either a host-header mismatch — Opencast requires the host you call it on to match `org.opencastproject.server.url` in `etc/custom.properties` — or a reverse proxy that rescoped the session cookie to a path or domain the UI never sends it back on |
| The sidebar renders but every table stays empty or errors | The `opencast-plugin-graphql` plugin is off. Every data query goes through `/graphql`, which only exists with that plugin enabled ([Install → Prerequisites](./install.md#prerequisites)) |
| `/graphql` returns HTTP 404 | Same cause: set `opencast-plugin-graphql = on` in `etc/org.opencastproject.plugin.impl.PluginManagerImpl.cfg` and restart Opencast |
| `/graphql` answers HTTP 200 with a body of exactly `null`; GraphiQL says "Error fetching schema" | No GraphQL schema was built **for that organization**. Opencast returns an error result whose specification serializes to `null`, so the endpoint swallows the message — the real cause is only in the log: `grep -i "GraphQL schema" data/log/opencast.log` and read the stack trace after `Error building GraphQL schema` |
| The log says `"Query" must define one or more fields` while building the schema | The schema's fields come from Opencast's index-backed provider, so this means the index services never came up. Look **earlier** in the log for the root cause — usually the search-index one below |
| Search-index services (`assetmanager`, `search`, `ingest`, `workflow`) are offline and the log names a missing `icu_folding` filter | Opencast's index mappings need the ICU analysis plugin in the search backend. Install it, restart the search backend, then restart Opencast — the offline services do not recover on their own |
| The video and series screens error while other screens are fine | The `management-ui-graphql` JAR is missing from `deploy/`. Those screens query the `mui*` extensions it provides |
| A deployed `management-ui-*` bundle stays unresolved, with `missing requirement … osgi.wiring.package=…` and a version range | The JAR was built against a different Opencast major than the one it runs on. OSGi import ranges are fixed at compile time — rebuild the bundles against the target major ([Upgrade](./upgrade.md)) |
| `/management-tool/ui/config/plugins.json` returns HTTP 403 "Access Denied" | The request was unauthenticated; Opencast's security config rejects anonymous access to that path. Authenticate (`curl -u …`); a browser uses its login session |
| A `curl` check or a proxy in front of Opencast fails on the TLS certificate | The certificate chain is not trusted by that client. Install your CA in the caller's trust store — for the Node-based dev proxy specifically, `NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.pem` |

## A change had no effect

| Symptom | Cause and fix |
|---|---|
| A `config.json` edit looks ignored | Most likely the silent fallback: an invalid plugin slice reverts *wholesale* to that plugin's defaults and only logs `plugin:<id> config validation failed` to the browser console. Reload with the console open ([Configure](./configure.md#when-a-change-does-not-take)) |
| A `config.json` edit looks ignored and the console is clean | The browser served a cached file, or the deployment overrides the value at a higher layer — an organization config plugin's overlay wins over `config.json` ([`architecture/CONFIGURATION.md`](../architecture/CONFIGURATION.md#layered-merge)) |
| A feature disappeared after a re-deploy | `-DdeployTo` replaced your edited `config.json` with the shipped default ([Install](./install.md#build-and-deploy)). Restore your backup |
| An `org.opencastproject.mui` change had no effect | The file name must match the PID exactly — `etc/org.opencastproject.mui.cfg`. A typo creates a second, unread configuration instead of an error ([Backend configuration](./backend-config.md#applying-a-change)) |
| Deleting a video destroyed it although you expected a trash | `trash.workflow.id` was unset, so the mutation took the plain-delete branch. This is the single most consequential backend key — [Backend configuration](./backend-config.md#delete-is-reversible-only-if-this-key-is-set) |
| Deleting a video fails with a workflow error | The opposite case: `trash.workflow.id` names a workflow definition the server does not have (an empty value counts). Set it to a definition that exists, or unset it deliberately |
| A plugin's screen is gone from the sidebar | Its namespace is missing from `app.enabledPlugins`, which **replaces** the default list rather than extending it ([Configure](./configure.md#a-worked-example)) |

## Metadata fields: shown, editable, saved

Two independent layers decide what happens to a metadata field, and they answer different questions. Confusing them is the usual reason a field "cannot be saved" or "will not appear".

| Layer | Question it answers | Where it lives |
|---|---|---|
| **UI config** — `plugins.episodes.episodeInfo.metadata`, `plugins.series.seriesInfo.metadata` | *Should this deployment display or edit the field?* | `config.json` — a display preference |
| **Opencast catalog policy** — `etc/org.opencastproject.ui.metadata.CatalogUIAdapterFactory-*.cfg`, per organization | *Does the backend accept the field as input at all?* | The Opencast host, not this project |

The UI-config layer pairs each field id with `show` and `readonly`. **Both keys are required on every entry** — `{ "show": false }` alone fails validation, and a failed validation silently reverts the entire slice. The `metadata` array also **replaces** the default list wholesale, so if you set it at all, list every field you want, in the order you want it.

```jsonc
"plugins": {
  "episodes": {
    "episodeInfo": {
      "metadata": [
        { "title":    { "show": true,  "readonly": false } },
        { "location": { "show": true,  "readonly": true  } },  // display, never edit
        { "source":   { "show": false, "readonly": false } }   // hide entirely
      ]
    }
  }
}
```

The catalog-policy layer is the enforcing one: Opencast derives its GraphQL metadata input types per organization from the catalog UI adapter config, so a property marked `readOnly` there is excluded from the input type and GraphQL rejects it outright. Typical cases are a `creator` or `location` field owned by a legal rule or by the capture pipeline. **The UI adapts on its own** — it reads each field's per-organization flag and introspects the input type once per session, so backend-locked fields are displayed but never submitted, and the create-series dialog hides fields the organization does not accept. Mirroring the catalog policy in `config.json` is optional and purely cosmetic.

In practice: hide or lock a field **for one deployment's UI** → UI config. Make it non-writable **organization-wide, enforced by the backend** → catalog config on the Opencast host. On a multi-tenant server the catalog config is per organization, so the same field can be writable for one organization and locked for another; the UI resolves that at runtime.

## Starting Opencast

| Symptom | Cause and fix |
|---|---|
| Opencast dies seconds after a backgrounded start; the last log entry is an `IllegalStateException: Invalid BundleContext` | `bin/start-opencast` runs an interactive Karaf console that reads EOF from a detached stdin and treats it as shutdown. Start with `bin/start-opencast server`, which starts no local console |
| Opencast dies at startup with `Unable to resolve root: missing requirement …`, root-caused by `osgi.ee; filter:="(&(osgi.ee=JavaSE)(version=21))"` | Karaf started on a JDK older than 21. It resolves its JVM through `JAVA_HOME` (or the platform's Java home lookup), **not** your `PATH`, so a stale registered JDK wins over the Java 21 that `java -version` prints. Export `JAVA_HOME` in the shell that runs `bin/start-opencast` |
| Opencast logs index errors at startup | The search backend is not reachable, or its data volume is not writable |
| `mvn install` in this repository fails resolving `base:20-SNAPSHOT` | The Opencast build that installs that parent POM into `~/.m2` has not run on this machine, and only the matching `r/NN.x` line carries that version ([Install → Prerequisites](./install.md#prerequisites)) |
