# Configuration

> **Reference — look it up, don't read it through.** This page is the complete configuration model, consulted a section at a time. Task-shaped guidance lives under [Extend](../extend/index.md) and [Contribute](../contribute/index.md).

**Status:** Canonical. Supersedes the deleted `docs/CONFIG_ORDER.md` and
`docs/CONFIG_GENERATION.md`.
**Last updated:** 2026-08-12.
**Stability:** The layer model and the `definePluginConfig` API are
stable for the 1.x host. Plugin-side slice shapes are owned by each
plugin; see that plugin's `src/config.ts` for the Zod schema it commits
to. The Config Contract in
[Contracts](./contracts.md#4-config-contract) lists what the core
guarantees.

This document is the single source of truth for how configuration flows
through the shell and its plugins. Anything that used to live in
`CONFIG_ORDER.md` or `CONFIG_GENERATION.md` is either captured here or
intentionally dropped (those files described a build-time merge that no
longer exists; see the [Migration notes](#migration-notes) below).

## The shape

```ts
// packages/ui-config/src/types.ts
interface AppConfig {
  productionConfigUrl: string;
  productionAppPluginUrl: string;
  downloadBaseUrl?: string | undefined;
  matomo: MatomoConfig;
  app: {
    // Language the UI starts in. A default, not a lock: a user's own pick
    // from the language switcher is remembered and wins on later visits.
    locale: string;
    HtmlDocumentTitle: string; // <title> of the document
    logoUrl?: string;
    orgLogoUrl?: string;
    faviconUrl?: string;
    theme: string;

    // Ship filter — only plugins whose namespace is listed here are
    // allowed to load at all. The default ships the OSS core plus two
    // integration hooks (`admin` for the bundled marketplace, `config`
    // for the `.local-plugins/config/` loader).
    enabledPlugins: string[];
  };
  // Where to send users to log in / out. Dev variants override when
  // running `pnpm dev`. See getting-started/configuration.md → Authentication.
  auth: {
    loginUrl: string;
    logoutUrl: string;
    loginUrlDev?: string;
    logoutUrlDev?: string;
  };

  // Opaque map of plugin-owned slices keyed by plugin id
  // (PluginsConfig = Record<string, unknown>).
  plugins: PluginsConfig;

  api: { baseUrl: string; graphqlEndpoint: string };

  // Deployments may carry extra top-level keys we don't model; they pass
  // through untyped rather than failing validation.
  [key: string]: unknown;
}
```

> **Pruned in the OSS cleanup (pre-1.0):** `app.title`, `app.appTitle`,
> `app.version`, `app.organizationUrls`, `auth.tokenRefreshUrl`, and
> `api.timeout` were removed — none had any reader in the codebase. They
> were never part of the [Config Contract](./contracts.md#4-config-contract)
> (which freezes only `app.theme`, `app.locale`, `app.enabledPlugins`,
> `config.plugins[id]`, and the merge order/reader), so this is not a
> contract break. A deployment `config.json` may still carry them — the
> `[key: string]: unknown` index keeps them from failing validation; they
> just aren't read.

### What the top-level keys mean

| Key | What it does |
| --- | --- |
| `productionConfigUrl` | Where the shell fetches `config.json` from. Default `/ui/config/management-ui/config.json`. Read from the **baked-in** `defaultConfig`, *not* from the fetched file — so a deployment cannot relocate its own config path via `config.json`. |
| `productionAppPluginUrl` | Where the shell fetches the deployed-plugin manifest (`plugins.json`). |
| `downloadBaseUrl` | Optional base URL for media downloads. |
| `matomo` | Matomo analytics settings (`enabled: false` by default). |
| `api` | API endpoints: `baseUrl`, `graphqlEndpoint`. |
| `app.*` | Shell settings: `theme`, `locale`, the `enabledPlugins` ship filter, and the branding keys `HtmlDocumentTitle`, `logoUrl`, `orgLogoUrl`, `faviconUrl`. |
| `auth.*` | Where the shell sends users to log in / out — see below. |
| `plugins[id]` | A per-plugin slice, owned by that plugin. |

`auth.loginUrl` / `auth.logoutUrl` apply in production; `auth.loginUrlDev` /
`auth.logoutUrlDev` are optional overrides used when running `pnpm dev`, and
**fall back to `loginUrl` / `logoutUrl` when unset**. The shipped defaults are
`/Shibboleth.sso/Login?target=/management-ui/` and
`/Shibboleth.sso/Logout?return=/management-ui/`. A `j_spring_security_*` URL
makes the shell render its own themed form and POST the credentials to
`/j_spring_security_check`; any other URL is redirected to verbatim. The
admin-facing version of this, with the Opencast-side wiring, is
[Configure → Login](../operate/configure.md#login).

The core knows **nothing** about individual plugin slices. Each plugin
owns the shape of `config.plugins[<id>]` and exposes a typed reader via
`definePluginConfig` (see below). The core only guarantees that the
`plugins` map is an object keyed by plugin id; everything else is
plugin territory.

## Layered merge

There are exactly three layers and one merge order. Both the React hook
(`useAppConfig`) and the sync snapshot (`getAppConfigSync`) compose the
same layers the same way, in dev and in prod:

```
  app:config:defaults          ← lowest,  plugin-contributed
       ⊕
  base = defaultConfig ⊕ config.json
       ⊕
  app:config                   ← highest, runtime overlays
```

- **`app:config:defaults`** is a registry extension point. Plugins
  register their slice defaults here inside `initialize()` (usually via
  `xxxConfig.register(manager)` — see below). Multiple plugins can
  contribute; entries are deep-merged in registration order.
- **`base`** is `defaultConfig` from `@oc-mui/ui-config` merged with
  the fetched `config.json` (deployments' customization file). When no
  `config.json` is configured the base is just `defaultConfig`.
- **`app:config`** is a second registry extension point used for
  runtime overlays — the `.local-plugins/config/` loader registers
  org-specific config here so per-deployment values can still override
  what individual plugins declared as defaults.

Merge behaviour (implemented in
[`packages/utils/src/deepMerge.ts`](../../packages/utils/src/deepMerge.ts)):

- **Objects:** deep-merged key by key.
- **Arrays:** replaced (never concatenated — predictable for lists like
  `enabledPlugins`).
- **Primitives:** replaced.
- **Undefined values:** skipped (so plugins can leave fields out of
  their defaults without nuking an overlay).

## Plugin-owned slices

Plugins declare their slice once with `definePluginConfig` and get back
a reader that bundles everything they need: the id, a Zod schema,
defaults, a `register(manager)` helper, a `use()` hook, and a
`read(config)` imperative accessor.

```ts
// plugins/core-episodes/src/config.ts
import { z } from "zod";
import { definePluginConfig } from "@oc-mui/query";

export const EPISODES_PLUGIN_ID = "episodes";

export const episodesConfigSchema = z.object({
  episodeInfo: z
    .object({ metadata: z.array(metadataFieldSchema).optional() })
    .optional(),
  // …
});

export const episodesConfigDefaults: z.infer<typeof episodesConfigSchema> = {
  /* … */
};

export const episodesConfig = definePluginConfig({
  id: EPISODES_PLUGIN_ID,
  schema: episodesConfigSchema,
  defaults: episodesConfigDefaults,
});
```

Registering defaults happens once in `initialize()`:

```ts
// plugins/core-episodes/src/index.ts
initialize(manager) {
  episodesConfig.register(manager);
}
```

Consuming the slice from a component:

```tsx
const cfg = episodesConfig.use();         // Zod-validated, typed slice
const metadata = cfg.episodeInfo?.metadata ?? [];
```

Or imperatively (outside React):

```ts
const cfg = episodesConfig.read(config);  // same validation, same fallback
```

Before validating, the reader deep-merges the raw slice **on top of the
plugin's registered defaults** (objects merge, arrays replace — the same
semantics as every other config layer). A deployment therefore only sets
the keys it wants to change; required fields it omits are satisfied by
the defaults. Without this, a partial override would fail the schema's
required-field checks and silently do nothing (#256).

If the merged slice still fails schema validation the reader logs a
single `plugin:<id> config validation failed` warning (with the Zod
issues attached) and returns the plugin's defaults. The shell keeps
rendering — a bad `config.json` key never crashes the app.

### Why not access `config.plugins[id]` directly?

Two reasons:

1. **Validation.** Direct reads bypass the Zod schema. Typos and stale
   keys from a hand-edited `config.json` would silently feed bogus
   values into the UI.
2. **Decoupling.** Every plugin should only read its own slice. If a
   plugin needs to know about another plugin's config (e.g. the
   `admin-marketplace` listing all plugins for its settings UI), the
   cross-plugin reader is that other plugin's *exported* reader
   object, not raw map lookup. That keeps ownership explicit and makes
   the "who reads what" graph tractable.

A lint rule that forbids `config.plugins[...]` outside
`definePluginConfig` was deferred from Commit 4 because the
`admin-marketplace` case still has to be designed. Until that rule
lands, treat direct reads as a review-time red flag.

## `enabledPlugins` vs. `config.plugins[id].enabled`

The two switches do different things on purpose:

| | `app.enabledPlugins: string[]` | `config.plugins[id].enabled?: boolean` |
|-|-|-|
| **What it gates** | Whether a plugin namespace is allowed to load at all. | Whether an already-enabled plugin actually runs this request. |
| **When it's evaluated** | Before the plugin is registered with the manager. | Before the plugin is registered, after the base + overlay merge. |
| **Granularity** | One entry per namespace (e.g. `core`, `admin`, `episodes`). | Per plugin slice (`config.plugins.episodes.enabled = false`). |
| **How to change it** | Edit `config.json` / a config plugin. Requires a reload. | Same — but doesn't require touching the namespace list. |
| **Default** | `["core", "episodes", "series", "upload", "admin", "config"]` — OSS core + marketplace + local-config hook. | Missing = enabled. Only `=== false` deactivates. |

Typical usage:

- **OSS shell out of the box:** leaves `enabledPlugins` at its default.
  All core plugins + marketplace load.
- **An org wants to drop a feature for a deployment:** set
  `config.plugins.series.enabled = false` in the deployed
  `config.json`. Shell ships the same bundle, skips that plugin at
  load time.
- **An org ships extra plugins:** their `.local-plugins/<org>/` config
  plugin extends `enabledPlugins` (e.g. `[...default, "my-org"]`) and
  the namespace becomes available for loading.

Plugin authors do **not** need to add `enabled` to their Zod schema.
Zod's default `.strip()` behaviour keeps validation passing when the
field is present in the raw slice, and the shell loader reads the raw
slice (not the validated output) when it decides whether to skip the
plugin.

## Loading phases

`PluginInitializer` (`apps/shell/src/components/PluginInitializer.tsx`)
runs this sequence:

1. Register the three built-in plugins (`objectRegistry`, `renderer`,
   `appRegistry`).
2. Load every static plugin bundled via `@oc-mui/plugins`.
3. Register the config plugins (`<ns>:config`) first so they can
   contribute both defaults and overlays before anything else runs.
4. Compute the merged config snapshot.
5. Register the rest of the static plugins, applying the
   `enabledPlugins` ship filter and the per-slice `enabled` runtime
   switch in that order.
6. Load JAR plugins in two phases: (1) matches the pre-merge filter,
   (2) re-merges the config (because the JAR config plugin may have
   contributed more namespaces) and loads the rest.
7. Load `.local-plugins/` manifest entries the same way — two phases
   so `.local-plugins/config/` can inject org namespaces before
   org-specific plugins are considered.
8. Mark the manager as ready.

Both phase-2 passes use the same layered merge as the hook, so the
view the loader sees and the view React sees are identical.

## `config.json` — where it comes from

A deployment customizes the shell by placing a JSON file at
`config.productionConfigUrl` (default
`/ui/config/management-ui/config.json`). The shell fetches it on boot
and treats it as the **base** layer — shell defaults fill in anything
it leaves out, plugin defaults contribute their slices below it, and
`.local-plugins`/JAR config plugins overlay it above.

A committed default lives at
[`apps/shell/public/ui/config/management-ui/config.json`](../../apps/shell/public/ui/config/management-ui/config.json).
Vite copies it into the build output, so the Opencast JAR ships it at the
production path; deployments mount their own file over it (no rebuild).

How it's served depends on context:

| Context | Serves `config.json` |
| --- | --- |
| Production | The JAR's bundled file, or the deployment's mounted override at the same path. |
| `pnpm dev` (no backend) | A dev-only Vite middleware (`localConfigDevPlugin`) serves the committed file at the exact fetch path, re-read each request — **edit + reload, no backend**. The proxy leaves the config path alone in this mode (see `packages/vite-config/src/proxy.ts`). |
| `VITE_PROXY_TARGET=… pnpm dev` | The config path is proxied to that backend; its real `config.json` wins and the local file is ignored. |
| `VITE_PROXY_TARGET=… VITE_LOCAL_CONFIG=true pnpm dev` | `localConfigDevPlugin` serves the committed file for **config only**; all other endpoints (GraphQL, auth, …) still proxy to the backend. Override config locally against live data. `forceLocalConfig` (driven by `VITE_LOCAL_CONFIG`) tells `createProxyConfig` to skip proxying the config path. |

> `VITE_LOCAL_CONFIG` only affects the config path; all other endpoints follow
> `VITE_PROXY_TARGET`. **Restart the dev server after changing either** — the
> environment is read once at startup.

There is no build-time merge. The old `generateConfigPlugin`
and `PLUGIN_CONFIGS` array were removed in Phase 2b Commit 1.
Deployments produce a single `config.json` by hand or via CI (merging
whatever org snippets they want into one file) and drop it on the
Opencast config path.

## Migration notes

### For deployments that still use legacy keys

- **`app.pluginNamespace` → `app.enabledPlugins`** (Phase 2b Commit 5).
  The field is a flat `string[]` now — the object-form entries
  (`{ <ns>: { types: […] } }`) were never used by any first-party
  plugin and are gone. If you need to deactivate a specific module
  without removing its namespace, use `config.plugins[<id>].enabled =
  false` instead.
- **`config.plugins["management-ui-series" | "management-ui-episodes"
  | "management-ui-upload"]` → `config.plugins.series` / `.episodes`
  / `.upload`** (Phase 2b Commit 2). The same slice shapes apply; only
  the key is shorter.
- **The build-time `generateConfigPlugin` is gone.** If your build
  pipeline imported
  `@oc-mui/vite-config/src/generate-config-plugin` or referenced
  `PLUGIN_CONFIGS` in a `vite.config.ts`, delete those lines. Produce a
  `config.json` by hand or via CI and drop it on the Opencast config
  path.

### Follow-ups owned by this repo

The two scaffolding scripts that also grepped for `"pluginNamespace"`
(`scripts/export-plugin-to-local.js` and
`scripts/extract-module-to-plugin.mjs`) were retired in the same drop
that introduced `pnpm create-plugin` (Phase 7 sub-task 3), so the
legacy-grep concern there is moot — git history has the previous
behaviour if anyone needs to consult it.

The shell itself does **not** carry a back-compat shim. The new loader
reads only `enabledPlugins`; the old field is silently ignored. That
was a deliberate choice: adding a shim would freeze the transition
half-done and guarantee that someone ends up with both fields set to
different values.

### Follow-ups owned by org plugins

Follow-ups for organization-specific plugins are tracked in the private
repository that hosts them, not here.

## See also

- [Contracts § Config Contract](./contracts.md#4-config-contract)
  — what the core promises to keep stable.
- [`ADR-003 Shell + Core Plugins`](./decisions/003-shell-plus-core-plugins.md)
  — why the shell stays plugin-agnostic at the type level.
- [`packages/query/src/config/definePluginConfig.ts`](../../packages/query/src/config/definePluginConfig.ts)
  — the reference implementation of the reader.
- [`packages/query/src/hooks/useAppConfig.ts`](../../packages/query/src/hooks/useAppConfig.ts)
  — where the layered merge actually happens.
- [`apps/shell/src/components/PluginInitializer.tsx`](../../apps/shell/src/components/PluginInitializer.tsx)
  — where `enabledPlugins` and `.enabled` are enforced during load.
