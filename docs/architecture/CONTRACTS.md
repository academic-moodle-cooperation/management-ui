# Public Contracts

**Status:** Frozen baseline for the 1.x plugin API.
**Last Updated:** 2026-08-12

This document lists everything a third-party plugin author or downstream app may rely on. Anything not listed here is internal and may change without notice.

There are **six contracts**:

1. [Plugin Manifest Contract](#1-plugin-manifest-contract) - the shape of `plugin.json`.
2. [Plugin Runtime API Contract](#2-plugin-runtime-api-contract) - what a plugin receives from the host at runtime and the API version semantics.
3. [Theme Contract](#3-theme-contract) - CSS tokens and rules for styling.
4. [Config Contract](#4-config-contract) - how plugins declare and consume configuration (full model: [`CONFIGURATION.md`](./CONFIGURATION.md)).
5. [Shared Runtime Dependencies](#5-shared-runtime-dependencies) - which packages the host provides to every plugin, and which majors are in force.
6. [GraphQL Operation Naming](#6-graphql-operation-naming) - how plugins name their GraphQL operations and fragments to avoid cross-plugin collisions.

Each contract has its own version. Breaking changes to any of them require a major version bump of `@oc-mui/plugin-system`.

The Manifest 1.1 and Runtime API 1.1 contracts are **mechanically verified** by the contract-test harness in [`@oc-mui/plugin-testing`](../../packages/plugin-testing/README.md); see [`docs/operations/testing.md`](../operations/testing.md) for the test pyramid and harness usage.

## 1. Plugin Manifest Contract

**Authoritative schema:** [`packages/plugin-system/src/schemas/plugin.schema.json`](../../packages/plugin-system/src/schemas/plugin.schema.json)
**Runtime validator:** [`packages/plugin-system/src/utils/pluginMetadataValidator.ts`](../../packages/plugin-system/src/utils/pluginMetadataValidator.ts)
**Contract version:** 1.1 (see the 2026-04-17 changelog entry; `PLUGIN_API_VERSION` in [`packages/plugin-system/src/apiVersion.ts`](../../packages/plugin-system/src/apiVersion.ts) is `"1.1.0"`)

The JSON Schema at the path above is the single source of truth. The runtime validator enforces the subset needed for loading; the schema is what editors and the registry validate against.

**Stability rules:**

- **Required fields** (`id`, `name`, `version`, `description`, `author`, `namespace`) are frozen. They will not be removed or semantically changed within the 1.x API.
- **Optional fields** may gain new entries in minor versions. Existing field semantics will not change.
- Removing or renaming any documented field is a **major** change.
- Adding a new enum value to `category` is a **minor** change; removing one is **major**.
- Adding a new top-level field requires both: (a) schema update, (b) runtime validator update, (c) documentation in this file's changelog.

## 2. Plugin Runtime API Contract

**Authoritative entry point:** `@oc-mui/plugin-system` package's `"."` export.
**Contract version (`apiVersion`):** 1.1 — the host constant `PLUGIN_API_VERSION` in [`packages/plugin-system/src/apiVersion.ts`](../../packages/plugin-system/src/apiVersion.ts) is the source of truth.

### Plugin interface

A plugin, in code, implements the shape:

```ts
interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  order?: number;
  initialize?(manager: PluginManager): void | Promise<void>;
  activate(): void;
  deactivate(): void;
}
```

This interface is frozen for 1.x. Adding new optional members is minor; adding required members, removing members, or changing signatures is **major**.

### `apiVersion` in `plugin.json`

`apiVersion` declares the **minimum** plugin-runtime-API version the plugin requires. The check (`checkApiVersionCompatibility` in [`packages/plugin-system/src/apiVersion.ts`](../../packages/plugin-system/src/apiVersion.ts)) refuses to load a plugin when the required **major differs from the host's major in either direction**, or when the required **minor is higher than the host's minor** (the plugin asks for features this host lacks).

Examples:

| Plugin's `apiVersion` | Host API | Load? |
|-----------------------|----------|-------|
| `1.0.0`               | `1.3.0`  | yes   |
| `1.2.0`               | `1.3.0`  | yes   |
| `1.4.0`               | `1.3.0`  | no (plugin asks for a newer minor than the host provides) |
| `2.0.0`               | `1.3.0`  | no (major mismatch) |
| `0.9.0`               | `1.3.0`  | no (major mismatch — the major must match exactly, in both directions) |
| (absent)              | `1.3.0`  | yes — treated as `"1.0.0"` and gated by the same rules as any explicit value |

The host exposes its own API version via a constant `PLUGIN_API_VERSION` exported from `@oc-mui/plugin-system`. Version bumps follow semver:

- **Patch:** no behaviour change observable to plugins.
- **Minor:** new capabilities, new optional inputs, new exports; existing plugins still work unchanged.
- **Major:** a removal or a behaviour change that could break an existing plugin.

To rely on features newer than 1.0, declare the minor you need in `apiVersion` itself (e.g. `"1.1.0"`). `workspaceDependencies` is a different mechanism — it declares shared-runtime package majors ([§5](#5-shared-runtime-dependencies)) and is parsed major-only, so it cannot pin an API minor.

### Public API surface

The `"."` export of `@oc-mui/plugin-system` is the public surface. These members are **frozen** for 1.x:

| Member              | Kind                             |
|---------------------|----------------------------------|
| `Plugin`            | interface                        |
| `PluginManager`     | interface                        |
| `createPluginManager` | factory — the only public way to obtain a `PluginManager` |
| `createPlugin`      | factory                          |
| `PluginProvider`    | React component                  |
| `PluginComponent`   | React component                  |
| `ComponentResolver` | React component                  |
| `useRegistry`       | React hook                       |
| `createObjectRegistryPlugin` | factory (built-in infrastructure plugin) |
| `createAppRegistryPlugin` | factory (built-in infrastructure plugin) |
| `createRendererPlugin` | factory (built-in infrastructure plugin) |

The complete export list is snapshotted in [`packages/plugin-system/etc/plugin-system.api.md`](../../packages/plugin-system/etc/plugin-system.api.md) (regenerated by `pnpm api-check`); the table above is the frozen subset.

**Resolved (2026-08-12):** the `"./src/*": "./src/*"` escape hatch that used to leak internals has been removed — the package's `exports` field exposes only `"."`.

Any other module path (subpath imports, deep imports into `src/`) is **not** public and may change.

## 3. Theme Contract

**Authoritative document:** [`plugins/styling.md`](../plugins/styling.md).
**Contract version:** 2.0

### Summary of guarantees

- The **semantic CSS tokens** listed in the styling contract are stable across 1.x. Adding new tokens is **minor**; removing or renaming is **major**.
- The **CSS layer order** (`theme, base, components, utilities, plugins`, declared in [`packages/ui/src/styles/globals.css`](../../packages/ui/src/styles/globals.css)) is stable.
- The **plugin CSS layering rule** is stable: remote/JAR plugin stylesheets are loaded into the `plugins` cascade layer (`@import … layer(plugins)`, done by `@oc-mui/remote-plugin-loader`). Cascade-layer order — not stylesheet load order — determines precedence: plugin utilities win on the plugin's own DOM, while the host's design tokens stay unlayered and therefore always win. Full model: [`plugins/styling.md`](../plugins/styling.md#load-order).
- Orgs provide themes by **overriding token values only** (via CSS custom properties under `:root` and `.dark`). They must not rely on targeting internal class names.
- **Appearance axis (light/dark/system) is shell-provided and orthogonal to the org theme.** The shell mounts an appearance provider and a header toggle; it applies a `.dark` class on `<html>` that activates the dark token block. A theme should define **both** `:root` (light) and `.dark` (dark) so it looks right in either appearance — the `.dark` block is no longer optional in practice.
- Plugins must not emit hardcoded color, font, or spacing literals. This will become lint-enforced in Phase 4.

## 4. Config Contract

**Authoritative spec:** [`CONFIGURATION.md`](./CONFIGURATION.md) — full layer model, loader phases, and the `definePluginConfig` / `useConfig` reader API.
**Contract version:** 1.0 (stabilized at the end of Phase 2b).

What the core promises plugin authors and downstream apps:

- **Stable core keys:**
  - `config.app.theme: string`
  - `config.app.locale: string`
  - `config.app.enabledPlugins: string[]` — flat namespace list; ship filter.
  - `config.plugins[pluginId]` — opaque per-plugin section; plugins own the sub-shape.
- **Stable runtime switch:** a plugin slice may carry `enabled?: boolean`. The shell loader reads this from the raw slice (before Zod validation) and skips a plugin when it is `=== false`.
- **Stable layered merge order:** `app:config:defaults` ⊕ (`defaultConfig` ⊕ `config.json`) ⊕ `app:config`. Both the React hook and the sync snapshot apply the same order in dev and prod.
- **Stable reader surface:** `definePluginConfig({ id, schema, defaults })` from `@oc-mui/query` returns a reader with `{ id, schema, defaults, register, use, read }`. The reader signature is frozen for 1.x.

Breaking changes to any of these are **major**. Adding new optional top-level keys to `AppConfig.app` is **minor**. Adding new methods to the reader is **minor**. Removing or renaming anything is **major** and requires an ADR.

**Not part of the contract:**

- The exact shape of any individual plugin's slice (owned by that plugin, documented in its `src/config.ts`).
- The specific default namespaces in `enabledPlugins` — those ship as a sensible OSS default and may change.
- The internal representation of the `plugins` registry extension points (`app:config`, `app:config:defaults`).

## 5. Shared Runtime Dependencies

**Authoritative source:** [`packages/plugin-system/src/sharedRuntime.ts`](../../packages/plugin-system/src/sharedRuntime.ts) (`SHARED_RUNTIME_MAJORS`).
**Contract version:** 1.0.

The host loads exactly one copy of certain packages into the page and shares them with every plugin via `window.__SHARED_MODULES__`. Plugins must consume the host's copy — bundling a different major into the plugin's own `.mjs` causes two React contexts in the same tree, broken hooks, and mismatched `@oc-mui/*` types.

### What the host promises

Each name below is shared at the specified major. Patches and minors of a shared dep may roll forward within the same major without breaking the contract.

| Dependency | Major |
|------------|-------|
| `react` | 19 |
| `react-dom` | 19 |
| `react/jsx-runtime` | 19 |
| `lucide-react` | 0 |
| `@oc-mui/plugin-system` | 1 |
| `@oc-mui/app-runtime` | 1 |
| `@oc-mui/ui` | 1 |
| `@oc-mui/query` | 1 |
| `@oc-mui/router` | 1 |
| `@oc-mui/i18n` | 1 |
| `@oc-mui/utils` | 1 |
| `@oc-mui/store` | 1 |
| `@oc-mui/ui-config` | 1 |

The runtime list is exported as `SHARED_RUNTIME_MAJORS` from `@oc-mui/plugin-system`. **Known gap:** it is *not* identical to `SHARED_MODULE_NAMES` in [`@oc-mui/remote-plugin-loader`](../../packages/remote-plugin-loader/src/transform.ts), the list of imports the loader actually rewires to `window.__SHARED_MODULES__`. Two entries — `@oc-mui/store` and `@oc-mui/ui-config` — pass the compatibility gate but are **not** rewired, so a plugin importing them ends up bundling its own copy; do not rely on them being host-provided. `@oc-mui/ui` is rewired only through its subpaths (`@oc-mui/ui/components`, `@oc-mui/ui/components/icons`, `@oc-mui/ui/lib`, `@oc-mui/ui/lib/utils`), never the bare specifier.

### What plugins must do

Declare every shared dep the plugin actually imports in `workspaceDependencies` in `plugin.json`. The lower-bound major of each range must match the host's major for that dep.

```jsonc
{
  "workspaceDependencies": {
    "react": "^19.0.0",
    "@oc-mui/plugin-system": "^1.0.0",
    "@oc-mui/ui": "^1.0.0"
  }
}
```

Compatibility is checked at load time by `checkSharedDependencyCompatibility` (exported from `@oc-mui/plugin-system`). A plugin whose declared major doesn't match the host's is rejected by the loader with a clear `"Plugin requires <name> major X, host provides Y"` error. All three loader paths funnel through this one function: the **marketplace** (via `securityService.checkVersionCompatibility`, which now delegates to it), the **`.local-plugins/` dev** path, and the **JAR** path (both via `passesSharedDependencyGate` in [`apps/shell/src/services/sharedDepsGate.ts`](../../apps/shell/src/services/sharedDepsGate.ts), called from the shell's `PluginInitializer`). A plugin that declares no `workspaceDependencies` is not gated.

### Versioning rules

- **Minor** of `@oc-mui/plugin-system`: adding a new name to `SHARED_RUNTIME_MAJORS`. Existing plugins keep working — they just opted out of the new shared dep and continue to bundle it themselves.
- **Major** of `@oc-mui/plugin-system`: bumping any entry's major (e.g. host adopts React 20), or removing a name. Plugins compiled against the old major are cleanly rejected by the loader.

Removing a name has the same effect as bumping its major from the plugin's perspective — the dep stops being host-provided.

### Not part of the contract

- The exact patch/minor of any shared dep beyond the major. Hosts may roll forward within a major and plugins must not pin to a specific patch.
- Other packages the host happens to use internally. The contract list is exhaustive — `lodash`, `date-fns`, `axios`, etc. are *not* shared and a plugin that needs them must bundle them.

### Enforcement across the three loader paths

All loader paths now share the canonical `checkSharedDependencyCompatibility`:

- **Marketplace** — `securityService.checkVersionCompatibility` (in `plugins/admin-marketplace/`) is now a thin adapter over the canonical function, mapping its result to the marketplace's `{ valid, error, warnings }` shape. Both the install-time load gate and the UI compatibility badge go through it, so they can't diverge.
- **`.local-plugins/` dev** — the dev server surfaces each plugin's `workspaceDependencies` (read from `plugin.json`) into `/local-plugins/manifest.json`, and the shell gates each entry via `passesSharedDependencyGate` before loading.
- **JAR** — the shell applies the same gate to entries from the backend's `plugins.json`. The gate is a no-op until the backend includes `workspaceDependencies` per plugin in `plugins.json` (the shell types are forward-compatible and read it when present); that backend step is tracked in [`operations/open-followups.md` §5.3](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/docs/operations/open-followups.md#53-shared-npm-deps-version-locking).

## 6. GraphQL Operation Naming

**Contract version:** 1.0.

GraphQL operations and fragments declared in a plugin (or in `@oc-mui/query` for shared core operations) must be prefixed with the plugin's namespace, converted to PascalCase. The rule keeps plugin authors from accidentally colliding on operation/fragment names — and gives operators a way to attribute backend load and errors per plugin.

### The rule

For every `query`, `mutation`, `subscription`, and `fragment` you declare in a `gql\`\`` template literal or `.graphql` file:

```
<PascalCaseNamespace><OperationName>
```

The PascalCase namespace is mechanically derived from the kebab-case `namespace` field in `plugin.json` (or in the `createPlugin({ namespace })` call). For shared operations that live in `@oc-mui/query` itself (not in any one plugin), the prefix is `Mui`.

| Plugin `namespace` | Prefix | Example operation | Example fragment |
|--------------------|--------|-------------------|------------------|
| `core` *(see below)* | `Core` | `CoreGetSomething` | `CoreSomethingFields` |
| `episodes` | `Episodes` | `EpisodesGetEpisodeDetails` | `EpisodesEpisodeFields` |
| `series` | `Series` | `SeriesGetMySeries` | `SeriesSeriesFields` |
| `upload` | `Upload` | `UploadGetWorkflows` | `UploadWorkflowFields` |
| `org-a` | `OrgA` | `OrgAGetCourseList` | `OrgACourseListEntry` |
| `my-plugin` | `MyPlugin` | `MyPluginGetSomething` | `MyPluginThingFields` |
| `@oc-mui/query` (shared) | `Mui` | `MuiGetMyEvents` | `MuiCurrentUserFields` |

**Note** on the `core` namespace: there is no single `plugins/core*/` plugin that owns "everything shared". Each core plugin (`episodes`, `series`, `upload`, `admin-marketplace`, …) uses its own namespace. Operations that genuinely live in shared infrastructure (the `@oc-mui/query` package) use `Mui`. Reserve `Core` for the `plugin-core` plugin itself.

### What this enforces

1. **No fragment-name collisions.** GraphQL Codegen reads every `gql\`\`` template across the workspace and emits one big union of typed hooks/fragments. Two plugins each declaring `fragment EpisodeFields` either fail the build or silently overwrite each other depending on file order. Prefixing eliminates the class.
2. **Server-side attribution.** Backend logs and Apollo Studio identify operations by name. `EpisodesGetMyEvents` tells the ops team which plugin issued the call; `GetMyEvents` doesn't.
3. **Cache isolation.** TanStack Query keys are derived from operation names. Two same-named operations with different shapes would compete for the same cache entry; prefixing avoids it.
4. **Future-proofing.** As more plugins ship the cost of "we'll rename it later" rises sharply. The fewer violators, the cheaper the migration.

### What it doesn't cover

- **Schema field and type names.** `type Episode`, `field events: [Event]` — owned by the Opencast backend schema, not the client. Not in this contract.
- **Variables.** Operation variables (`$limit`, `$offset`) are scoped to the operation; collisions are impossible.
- **Internal client-side helpers** that aren't real GraphQL operations.

### Enforcement

**Mechanical: an ESLint rule** (`local/graphql-operation-naming` in [`@oc-mui/eslint-config`](../../packages/eslint-config/rules/graphql-operation-naming.js)) parses every `.graphql` file and every `gql\`\`` template literal inside `.ts` / `.tsx`, walks up to find the owning plugin's `plugin.json` (or detects shared-core via the `packages/query/` path → `Mui` prefix), and fails the lint pass on any operation or fragment that doesn't start with the expected prefix.

Every operation and fragment in [`packages/query/src/queries.graphql`](../../packages/query/src/queries.graphql) now carries the `Mui` prefix. Two inline `gql\`\`` operations elsewhere were renamed in the same migration: `MuiGetCurrentUser` in `packages/query/src/hooks/useGetCurrentUser.ts`, and `plugins/core-upload/` deleted its duplicate inline query and now consumes the central `MuiGetMySeriesNameAndIdDocument` from `@oc-mui/query`. No grandfathered disables remain — `git grep "eslint-disable-next-line local/graphql-operation-naming"` returns zero hits in source.

### Versioning rules

- **Minor**: relaxing the convention (allowing additional valid forms). No plugin breaks.
- **Major**: tightening (e.g. mandating that the namespace also appears in `subscription` names if subscriptions are ever supported), or changing the casing convention. Plugins compiled against the old rule fail lint and must rename.

The contract version lives in this document. A bump is recorded in the changelog at the bottom.

## Contract Change Process

Changing any contract requires:

1. A PR with a dated changelog entry appended to this document.
2. A matching entry in the changeset for the affected package (Phase 5).
3. If it is a major bump, an ADR explaining the break and a migration note in `CONTRIBUTING.md`.
4. CI gate: the API Extractor snapshot (Phase 5) must be updated in the same PR.

No contract change is allowed without the changeset - plugins cannot cope with silent breaks.

## Changelog

- **2026-04-16:** Initial freeze. Manifest 1.0, Runtime API 1.0, Theme 2.0, Config 0.9 (pre-stable).
- **2026-04-17:** Config Contract promoted to 1.0. Stable keys: `app.theme`, `app.locale`, `app.enabledPlugins`, `config.plugins[pluginId]`, `config.plugins[pluginId].enabled`. Layered merge order (`app:config:defaults` ⊕ base ⊕ `app:config`) and the `definePluginConfig` reader API are now frozen for 1.x. See [`CONFIGURATION.md`](./CONFIGURATION.md).
- **2026-04-17:** Manifest Contract bumped to 1.1 (minor). New optional field `extensionPoints: string[]` on the top-level manifest, consumed by the contract-test harness in `@oc-mui/plugin-testing` and reserved for marketplace tooling. Runtime loader behaviour is unchanged, so existing 1.0 manifests remain valid. Host `PLUGIN_API_VERSION` bumped from `1.0.0` to `1.1.0` accordingly. Plugin-system now also exports `validatePluginMetadata` and the `PluginContext` React context so that tooling can validate manifests and inject a pre-configured `PluginManager` without reaching into `src/`.
- **2026-05-13:** Shared Runtime Dependencies Contract 1.0 added. New section [§5](#5-shared-runtime-dependencies) formalises the list of host-provided packages (`SHARED_RUNTIME_MAJORS` in `@oc-mui/plugin-system`) and the rule that a plugin's `workspaceDependencies` lower-bound major must match the host's. New helpers `checkSharedDependencyCompatibility` and `parseRangeMajor` are exported from `@oc-mui/plugin-system`. The runtime check is **not yet wired** into the JAR loader or `.local-plugins/` discovery path — those follow-ups are tracked in [`operations/open-followups.md`](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/docs/operations/open-followups.md#53-shared-npm-deps-version-locking). Existing plugins are unaffected; the contract is additive. *(Superseded: the check is now wired into all three loader paths — see [§5](#5-shared-runtime-dependencies).)*
- **2026-05-14:** GraphQL Operation Naming Contract 1.0 added. New section [§6](#6-graphql-operation-naming) mandates that every `query`/`mutation`/`subscription`/`fragment` declared in a plugin (or in `@oc-mui/query` for shared core operations) be prefixed with the plugin's namespace in PascalCase (`MuiGetMyEvents`, `EpisodesEpisodeFields`, …). Shipping with documentation + manual review only; an ESLint rule that fails CI on violations is the next planned follow-up. Existing operations in `packages/query/src/queries.graphql` are grandfathered and will be renamed in a follow-up batch — see [`operations/open-followups.md`](https://github.com/academic-moodle-cooperation/management-ui/blob/develop/docs/operations/open-followups.md#51-graphql-operation-naming-final-migration-of-legacy-operations). *(Superseded by the two 2026-05-15 entries below: the ESLint rule shipped and the legacy operations were renamed.)*
- **2026-05-15:** Enforcement for the GraphQL Operation Naming Contract is now mechanical. `@oc-mui/eslint-config` ships a new custom rule (`local/graphql-operation-naming`) that parses `.graphql` files and `gql\`\`` template literals inside `.ts` / `.tsx`, walks up to the nearest `plugin.json` (or detects `packages/query/` for shared-core), and fails the lint pass on any operation or fragment that doesn't carry the right PascalCase prefix. Legacy operations grandfathered with `# eslint-disable-next-line` comments which double as the migration tracker — final rename batch follows in 5.1c. *(Superseded by the next entry: the grandfather comments are gone.)*
- **2026-05-15:** Legacy GraphQL operations renamed (5.1c). All 33 operations and fragments in `packages/query/src/queries.graphql` now carry the `Mui` prefix (`MuiGetMyEvents`, `MuiCurrentUserFields`, etc.); the 2 inline `gql\`\`` operations in `packages/query/src/hooks/useGetCurrentUser.ts` and `plugins/core-upload/src/App.tsx` are likewise renamed (the latter now consumes the central `MuiGetMySeriesNameAndIdDocument` rather than defining a duplicate inline). Every `# eslint-disable-next-line local/graphql-operation-naming` grandfather comment is removed; the rule fires on every operation in the workspace without exception. 24 call-site files updated to use the renamed hooks / types.
- **2026-05-28:** `AppConfig` dead-field prune (OSS cleanup, pre-1.0). Removed `app.title`, `app.appTitle`, `app.version`, `app.organizationUrls`, `auth.tokenRefreshUrl`, and `api.timeout` from the type and `defaultConfig` — none had any reader in the workspace. **Not a Config Contract change:** the stable-key list in [§4](#4-config-contract) never included these fields, so the prune touches nothing frozen. The `[key: string]: unknown` index on `AppConfig` means a deployment `config.json` may still carry them without failing validation; they're simply ignored. A committed default `config.json` now lives at `apps/shell/public/ui/config/management-ui/config.json` (served locally in dev when no backend is configured, and shipped in the JAR), which is also what the [release test protocol §6](../operations/test-protocol.md) edits.
- **2026-05-28:** Dark mode wired up + appearance axis formalised in the Theme Contract [§3](#3-theme-contract). The complete `.dark` token block in `globals.css` was previously unreachable; the shell now mounts a `next-themes` provider (`ThemeModeProvider`, exported from `@oc-mui/ui`) defaulting to the OS preference, with a Light/Dark/System header toggle (`ThemeModeToggle`), applying a `.dark` class on `<html>`. Appearance (light/dark/system) is **orthogonal** to the `app.theme` org branding; a theme should ship both `:root` and `.dark`. Additive to the Theme Contract (no token removed/renamed), so it stays 2.0. Plugin guidance in [`plugins/styling.md`](../plugins/styling.md#dark-mode).
- **2026-05-28:** Shipped showcase themes added (Oxford Navy, Modern Slate & Teal, Heritage Burgundy, Forest Sage). Each is a full design language — color, typography, radius, shadows, spacing — overriding only standard tokens, with light + dark, **system fonts only** (no web fonts, for GDPR/offline). They live at `apps/shell/public/plugins/themes/*.css`, served as raw CSS so both the marketplace and `app.theme` apply them in dev and the production build. The marketplace registry was pruned of the six dev-only `.local-plugins` entries.
- **2026-06-01:** Two more showcase themes added — **Aurora** (modern, vivid indigo, large radius, soft shadows, rounded geometric sans, relaxed spacing) and **Press** (editorial, high-contrast monochrome, zero radius, no shadows, bold borders, grotesque sans). Adapted from external design concepts; the concepts' Google-Fonts `@import`s were dropped in favour of GDPR-safe system stacks (SF Pro Rounded / Avenir for Aurora, Helvetica Neue / Arial for Press), keeping the **system-fonts-only** rule intact. Both ship light + dark and override only standard tokens (the concepts' non-contract `--heading-weight`/`--heading-spacing`/`--press-border-strong` tokens were removed as no reader exists). Same `apps/shell/public/plugins/themes/*.css` location and raw-CSS serving; no contract change (still Theme Contract 2.0).
- **2026-08-12:** Documentation errata — no contract change. Corrected this document against the code: Manifest and Runtime API contract versions read 1.1 (matching `PLUGIN_API_VERSION = "1.1.0"`); the frozen Runtime API table lists the real exports (`PluginManager` is an interface, `createPluginManager` obtains one, and the three built-ins are the `create*Plugin` factories — `objectRegistry`/`appRegistry`/`renderer` were never exported names); the `apiVersion` semantics match `checkApiVersionCompatibility` (major must match exactly, minor may not exceed the host's, absent = `"1.0.0"`); the `"./src/*"` export debt is marked resolved; the Theme Contract freezes the real `plugins` cascade layer (the previously documented `plugin-overrides` layer never existed) and the cascade-layer rule replaces the obsolete load-order rule; §5 lists `@oc-mui/app-runtime` and documents the `SHARED_RUNTIME_MAJORS` vs `SHARED_MODULE_NAMES` gap instead of claiming the lists are in sync. Superseded mid-list changelog entries are now marked as such.
