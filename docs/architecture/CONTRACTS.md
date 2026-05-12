# Public Contracts

**Status:** Frozen baseline for the 1.x plugin API.
**Last Updated:** 2026-04-16

This document lists everything a third-party plugin author or downstream app may rely on. Anything not listed here is internal and may change without notice.

There are **four contracts**:

1. [Plugin Manifest Contract](#1-plugin-manifest-contract) - the shape of `plugin.json`.
2. [Plugin Runtime API Contract](#2-plugin-runtime-api-contract) - what a plugin receives from the host at runtime and the API version semantics.
3. [Theme Contract](#3-theme-contract) - CSS tokens and rules for styling.
4. [Config Contract](#4-config-contract) - how plugins declare and consume configuration (full model: [`CONFIGURATION.md`](./CONFIGURATION.md)).

Each contract has its own version. Breaking changes to any of them require a major version bump of `@<scope>/plugin-system`.

The Manifest 1.1 and Runtime API 1.0 contracts are **mechanically verified** by the contract-test harness in [`@oc-mui/plugin-testing`](../../packages/plugin-testing/README.md); see [`docs/TESTING.md`](../TESTING.md) for the test pyramid and harness usage.

## 1. Plugin Manifest Contract

**Authoritative schema:** [`packages/plugin-system/src/schemas/plugin.schema.json`](../../packages/plugin-system/src/schemas/plugin.schema.json)
**Runtime validator:** [`packages/plugin-system/src/utils/pluginMetadataValidator.ts`](../../packages/plugin-system/src/utils/pluginMetadataValidator.ts)
**Contract version:** 1.0

The JSON Schema at the path above is the single source of truth. The runtime validator enforces the subset needed for loading; the schema is what editors and the registry validate against.

**Stability rules:**

- **Required fields** (`id`, `name`, `version`, `description`, `author`, `namespace`) are frozen. They will not be removed or semantically changed within the 1.x API.
- **Optional fields** may gain new entries in minor versions. Existing field semantics will not change.
- Removing or renaming any documented field is a **major** change.
- Adding a new enum value to `category` is a **minor** change; removing one is **major**.
- Adding a new top-level field requires both: (a) schema update, (b) runtime validator update, (c) documentation in this file's changelog.

## 2. Plugin Runtime API Contract

**Authoritative entry point:** `@<scope>/plugin-system` package's `"."` export.
**Contract version (`apiVersion`):** 1.0

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

`apiVersion` declares the **minimum** plugin-runtime-API version the plugin requires. The host refuses to load a plugin whose `apiVersion` major is higher than the host's own runtime API major.

Examples:

| Plugin's `apiVersion` | Host API | Load? |
|-----------------------|----------|-------|
| `1.0.0`               | `1.3.0`  | yes   |
| `1.2.0`               | `1.3.0`  | yes   |
| `1.4.0`               | `1.3.0`  | no (plugin asks for a newer host) |
| `2.0.0`               | `1.3.0`  | no (major mismatch) |
| (absent)              | any      | yes (plugin opts into "1.0.0 or later"; warn in dev) |

The host exposes its own API version via a constant `PLUGIN_API_VERSION` exported from `@<scope>/plugin-system`. Version bumps follow semver:

- **Patch:** no behaviour change observable to plugins.
- **Minor:** new capabilities, new optional inputs, new exports; existing plugins still work unchanged.
- **Major:** a removal or a behaviour change that could break an existing plugin.

Plugins should pin the minor they need (`">=1.2"`) in `workspaceDependencies` if they rely on features newer than 1.0.

### Public API surface

The `"."` export of `@<scope>/plugin-system` is the public surface. These members are **frozen** for 1.x:

| Member              | Kind                             |
|---------------------|----------------------------------|
| `Plugin`            | interface                        |
| `PluginManager`     | class                            |
| `createPlugin`      | factory                          |
| `PluginProvider`    | React component                  |
| `PluginComponent`   | React component                  |
| `ComponentResolver` | React component                  |
| `useRegistry`       | React hook                       |
| `objectRegistry`    | plugin module                    |
| `appRegistry`       | plugin module                    |
| `renderer`          | plugin module                    |

**Known debt (to fix in Phase 2):**
The package currently also exposes `"./src/*": "./src/*"` in its `exports` field, which leaks all internals. This escape hatch will be removed before the 1.0 open-source release. Do not rely on imports that go through `/src/`.

Any other module path (subpath imports, deep imports into `src/`) is **not** public and may change.

## 3. Theme Contract

**Authoritative document:** [`docs/PLUGIN_STYLING_CONTRACT.md`](../PLUGIN_STYLING_CONTRACT.md) version 2.0.0 (this document will move to `docs/THEME_CONTRACT.md` during Phase 3 doc consolidation without content changes).
**Contract version:** 2.0

### Summary of guarantees

- The **semantic CSS tokens** listed in the styling contract are stable across 1.x. Adding new tokens is **minor**; removing or renaming is **major**.
- The **CSS layer order** (`theme, base, components, utilities, plugin-overrides`) is stable.
- The **load order rule** (remote/JAR plugin CSS inserted before host shell CSS) is stable.
- Orgs provide themes by **overriding token values only** (via CSS custom properties under `:root` and optional `.dark`). They must not rely on targeting internal class names.
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
