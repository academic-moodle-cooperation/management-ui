# @opencast-mui/plugin-core

Core plugin. Declares the extension points other plugins build on and ships default implementations of the header and footer. Every plugin may import from `@opencast-mui/plugin-core` — it's the one cross-plugin exception in the boundaries rule.

## What it provides

### Extension-point declarations

These plugins register documentation entries on `extension-points:documentation` so the marketplace and contract harness know they exist. They don't render anything themselves — they're the "schema" for what other plugins can populate.

| Extension point | Owner | Purpose |
|------|------|------|
| `app:header-logo` | `appLayoutExtensionPoints` | Logo in the header. **Declared only — no default renderer consumes it in the current shell**, so registering one has no visible effect yet. (It's the scaffold's contract-test placeholder.) |
| `app:header-actions` | `appLayoutExtensionPoints` | Action buttons in the header. |
| `app:footer` | `appLayoutExtensionPoints` | Footer content. |
| `app:branding` | `appLayoutExtensionPoints` | Theme + branding settings. |
| `app:config` | `appLayoutExtensionPoints` | App-wide config overlay (the `enabledPlugins` source). |
| `sidebar:nav-items` | `sidebarExtensionPoints` | Main navigation items. |
| `sidebar:user-items` | `sidebarExtensionPoints` | User actions and settings. |
| `sidebar:admin-items` | `sidebarExtensionPoints` | Admin functions. |
| `sidebar:help-items` | `sidebarExtensionPoints` | Help / support / docs. |
| `sidebar:header-logo` | `sidebarExtensionPoints` | Logo in the sidebar header. |
| `table-sidebar:tabs` | `tableSidebarExtensionPoints` | Detail panels for table rows. |
| `series:table:toolbar-end-actions` | `seriesExtensionPoints` | Buttons in the series-table toolbar. Used by `core-series` for Create Series. |
| `series:create-series:acl-editor` | `seriesExtensionPoints` | Optional ACL editor in the create-series dialog. |
| `upload:acl-editor` | `uploadExtensionPoints` | ACL editor in the upload flow. |
| `upload:metadata-editor` | `uploadExtensionPoints` | Metadata editor in the upload flow. |

### Default implementations

| Plugin | What it renders |
|------|------|
| `coreHeaderImplementation` | Default app header (lang switcher, login button). |
| `coreFooterImplementation` | Default footer. Locales in `modules/footer/locales/core-footer/`. |
| `coreDefaults` | Home sidebar entry. |

Org plugins override by registering their own implementations with **higher priority** on the same extension points; the resolver picks the highest priority.

## Why every plugin may import this

The boundaries rule blocks cross-plugin imports — but `@opencast-mui/plugin-core` is the exception, because plugins need its extension-point declarations to wire themselves up correctly. See [`@opencast-mui/eslint-config`](../../packages/eslint-config/base.js) for the exception.

## Layer

In-tree plugin. Depends on `@opencast-mui/plugin-system`, `@opencast-mui/ui`, `@opencast-mui/utils`, `@opencast-mui/i18n`.

## See also

- [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md) — how to register on these extension points.
- [`docs/architecture/CONTRACTS.md`](../../docs/architecture/CONTRACTS.md) — Manifest and Runtime API contract.
- [`AGENTS.md`](../../AGENTS.md) — operational rules.
