# Backend bundles

For developers touching the server side. Afterwards you'll know what each backend bundle does, how a plugin JAR is discovered, and which manifest header decides what.

Reference — read the part you need. Management UI ships to Opencast as **three OSGi bundles** aggregated by one Karaf feature. Two are Java services; the third is the compiled frontend.

## The three bundles and the feature

The feature `opencast-management-ui` ([`assemblies/management-ui-feature/src/main/feature/feature.xml`](../../assemblies/management-ui-feature/src/main/feature/feature.xml)) lists all three, so a deployment installs one feature rather than three JARs:

| Bundle | Maven artifact | Source | Role |
|---|---|---|---|
| Config | `management-ui-config` | [`backend/management-config/`](../../backend/management-config/) | Discovers plugin JARs, serves `plugins.json` |
| GraphQL | `management-ui-graphql` | [`backend/management-graphql/`](../../backend/management-graphql/) | The `Mui*` schema extensions and mutations |
| Frontend | `management-ui-core` | [`apps/shell/`](../../apps/shell/) | The built SPA, served as static files |

Every bundle takes its symbolic name from its Maven artifact id (`<Bundle-SymbolicName>${project.artifactId}</Bundle-SymbolicName>` in the root `pom.xml`).

## The frontend is a bundle too

[`apps/shell/pom.xml`](../../apps/shell/pom.xml) runs `pnpm run build --filter=shell` during `generate-resources`, copies `dist/` into `target/classes/ui`, and then hands four Felix instructions to the bundle plugin. There is no servlet and no Java in this bundle — the headers are consumed by Opencast's static-resource handler, outside this repo:

| Instruction | Value | Effect |
|---|---|---|
| `Http-Alias` | `/management-ui` | The URL prefix the bundle's files appear under |
| `Http-Classpath` | `/ui` | The JAR-internal directory served at that alias |
| `Http-Spa-Redirect` | `true` | Serves the SPA entry for unknown sub-paths instead of 404 — a reload on a client-side route survives |
| `Http-Welcome` | `index.html` | The directory index |

Plugin JARs use the same `Http-Alias` / `Http-Classpath` mechanism to publish their own assets; only the alias differs.

## The config bundle — plugin discovery

[`PluginBundleTracker`](../../backend/management-config/src/main/java/org/opencastproject/management/ui/config/PluginBundleTracker.java) is an OSGi `BundleTracker` watching every bundle in the `RESOLVED` or `ACTIVE` state. A bundle is a Management UI plugin if — and only if — it carries the `Management-Plugin` header. `PluginManager` opens the tracker at activation and also sweeps bundles that were already installed, so a plugin JAR present before Management UI still gets picked up.

### The headers

| Header | Read when | Meaning |
|---|---|---|
| `Management-Plugin` | always | The marker that triggers discovery. Its **value is also the directory name** the tracker looks inside: `/static/plugins/<value>/` in the JAR |
| `Http-Alias` | always | The URL prefix every emitted script, stylesheet, and locale URL is built on. Without it the plugin is discovered but has no loadable URLs |
| `Management-Plugin-Css` | fallback only | Stylesheet filename, when it isn't `<plugin>.css` |
| `Management-Plugin-I18n` | fallback only | Comma-separated i18n namespace list |

The header value also becomes the plugin's **scope**: `management_ui_plugin_` plus the name with every character outside `[A-Za-z0-9_ ]` replaced by `_`. That string is what appears in `plugins.json` and what a dev-mounted plugin names in `replacesJarScopes` — see [Distribution](./distribution.md).

### Two discovery strategies, and which wins

The tracker tries the manifest first and falls back to filenames:

1. **Manifest-driven.** If `/static/plugins/<name>/plugin.json` exists in the JAR *and parses*, it is authoritative. The tracker reads `id`, `name`, `namespace`, `locales`, `i18nNamespaces`, and — if present — a `modules` array, emitting one entry per module with its own `id`, `type`, `entry`, `css`, and optional per-module `locales` / `i18nNamespaces` overriding the root values. Script and stylesheet URLs are `Http-Alias` plus the **basename** of `entry` / `css`, because the Maven build flattens `dist/` into the static directory. The locale URL is `Http-Alias` plus the `locales` field, or plus `locales` when only `i18nNamespaces` is declared.
2. **Filename convention.** Used when `plugin.json` is absent, or present and unparseable — a parse failure is logged as a warning and silently degrades to this path. Every `*.mjs` directly inside the static directory becomes an entry; when none is found, `<name>.mjs` is assumed. A stylesheet is matched by `Management-Plugin-Css`, else by the same stem as the module, else by being the only `.css` present. The module id is the plain plugin name for a single canonical entry (`<name>.mjs` or `plugin-<name>.mjs`) and `<name>/<stem>` otherwise; a stem of `<name>-<suffix>` or `plugin-<name>-<suffix>` sets the entry's `type` to `<suffix>`.

::: warning Precedence trap
`Management-Plugin-Css` and `Management-Plugin-I18n` are read **only** on the fallback path. A JAR that ships a `plugin.json` *and* sets those headers gets its headers ignored — the manifest's `css` and `i18nNamespaces` decide. Org plugin POMs commonly set both, which is harmless but misleading: change the manifest, not the header. Tracked as [#351](https://github.com/academic-moodle-cooperation/management-ui/issues/351).
:::

### What the shell receives

[`PluginEndpoint`](../../backend/management-config/src/main/java/org/opencastproject/management/ui/config/rest/PluginEndpoint.java) publishes the aggregated list as JSON at:

```
GET /management-tool/ui/config/plugins.json
```

Each entry is a `PluginConfig`: `id`, `name`, `path`, `scope`, `namespace`, `type`, `scriptUrl`, `cssUrl`, `localesUrl`, `i18nNamespaces`. Nulls are serialized rather than omitted. How the shell filters and loads that list is in [Distribution](./distribution.md).

## The GraphQL bundle — what `Mui*` adds

Opencast ships its own GraphQL schema; this bundle extends it through `graphql-java-annotations` type extensions rather than replacing anything. `GraphQLProvider` registers as a `GraphQLExtensionProvider` and also holds the activated configuration in a static field, which is how the plain data classes reach it.

| Extension | Grafts onto | Adds |
|---|---|---|
| `MuiEventExtension` | `GqlEvent` | `muiEventInfo` |
| `MuiSeriesExtension` | `GqlSeries` | `muiSeriesInfo` |
| `MuiMutationExtension` | root `Mutation` | `mui` — hence every UI mutation is nested in `mui { … }` |

`MuiEventInfo` carries four fields, each answering a question the stock schema can't:

- **`thumbnailUrl`** — the first attachment whose flavor matches the configured thumbnail flavor, on the configured publication channel. The stock schema exposes publications; picking the preview image out of them is the work.
- **`publishUrl`** — the URI of the publication on the configured channel, i.e. where a viewer would watch it.
- **`isPublic`** — true when the access policy contains an *allow* entry granting `read` to `ROLE_ANONYMOUS`. This drives the Access column; an unparseable policy answers `false` rather than erroring.
- **`managedAclId`** — the id of the first managed ACL, in the configured priority order, whose entries are all contained in the event's own policy. This is how the UI shows a named ACL ("public", "authenticated", …) instead of a raw entry list. `null` means no managed ACL matched.

`MuiSeriesInfo` is the same idea for series and carries `isPublic` and `managedAclId` only.

Mutations in `MuiMutation` wrap Opencast's commands to apply configured workflows: metadata and ACL updates trigger the republish workflow, and `deleteEvent` branches on whether a trash workflow is configured — with one, delete is reversible; without one, it is Opencast's permanent delete. That single switch is the operator's decision, documented at [Backend configuration](../operate/backend-config.md).

## Configuration

Both behaviours above read `MuiConfig`, an OSGi metatype interface on the PID `org.opencastproject.mui`. Method names map to dotted property names (`thumbnail_channel_id()` ↔ `thumbnail.channel.id`). Shipped values live in [`OSGI-INF/configurator/mui.json`](../../backend/management-graphql/src/main/resources/OSGI-INF/configurator/mui.json), applied by Opencast's configurator at install time; the keys and what each one changes are in [Backend configuration](../operate/backend-config.md).

Two details worth knowing before you edit either file. `trash_workflow_id()` is the one method **without** a Java `default` — it is only ever set by the configurator resource, so a deployment that removes it from `mui.json` gets `null` and permanent deletes ([#342](https://github.com/academic-moodle-cooperation/management-ui/issues/342)). And the resource declares `":configurator:symbolic-name": "org.opencastproject.management.config"`, which matches neither bundle's actual symbolic name (`management-ui-graphql`, the bundle that ships the file, or `management-ui-config`); it works today, but do not treat that string as a reliable pointer ([#352](https://github.com/academic-moodle-cooperation/management-ui/issues/352)).

## See also

- [Add a GraphQL field](./graphql-field.md) — the authoring path through this bundle, end to end.
- [Distribution](./distribution.md) — building a plugin JAR with the headers above, and how the shell consumes `plugins.json`.
- [Full local setup](../contribute/local-backend.md) — deploying these bundles into a local Opencast.
