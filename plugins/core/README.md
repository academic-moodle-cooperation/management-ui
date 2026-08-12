# @oc-mui/plugin-core

Core plugin. Declares the extension points other plugins build on and ships default implementations of the header, footer, and home navigation entry. Every plugin may import from `@oc-mui/plugin-core` — it's the one cross-plugin exception in the boundaries rule.

## What it provides

### Extension-point declarations

The plugins under [`extension-points/`](./extension-points/) register documentation entries on `extension-points:documentation` so the marketplace and contract harness know they exist. They don't render anything themselves — they're the "schema" for what other plugins can populate.

| Extension point | Declared in | Purpose |
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
| `table-sidebar:tabs` | `tableSidebarExtensionPoints` | Detail panels for table rows (generic). |
| `table-sidebar:episodes:tabs` | `tableSidebarExtensionPoints` | Detail-panel tabs on the episodes table. |
| `table-sidebar:series:tabs` | `tableSidebarExtensionPoints` | Detail-panel tabs on the series table. |
| `series:table:toolbar-end-actions` | `seriesExtensionPoints` | Buttons in the series-table toolbar. Used by `core-series` for Create Series. |
| `series:create-series:acl-editor` | `seriesExtensionPoints` | Optional ACL editor in the create-series dialog. |
| `upload:acl-editor` | `uploadExtensionPoints` | ACL editor in the upload flow. |
| `upload:metadata-editor` | `uploadExtensionPoints` | Metadata editor in the upload flow. |
| `upload:workflow-selector` | `uploadExtensionPoints` | Workflow picker in the upload flow. |
| `upload:pre-upload-validation` | `uploadExtensionPoints` | Validation hook that runs before the upload starts. |

### Centrally consumed extension points

Three further points are not declared here but are consumed by the platform itself — plugins register on them all the same:

| Extension point | Consumed by | Purpose |
|------|------|------|
| `apps:definitions` | app registry builtin (`@oc-mui/plugin-system`) + the shell's router | A route + component pair mounted under `/<routePath>`. |
| `app:config:defaults` | config merge (`@oc-mui/query` / shell boot) | A `Partial<AppConfig>` slice merged below `config.json`. |
| `appshell:header` | `AppShell` (`@oc-mui/ui`) | The complete header component (see below). |

### Default implementations

Exported from [`modules/`](./modules/index.ts):

| Plugin | What it renders |
|------|------|
| `coreHeaderImplementation` | Registers `DefaultHeader` on `appshell:header` with `key: "default-header"`, `order: 100`. Renders `ThemeModeToggle`, `LangSwitcher`, `LoginButton`. |
| `coreFooterImplementation` | Default footer. Locales in `modules/footer/locales/core-footer/`. |
| `coreDefaultImplementations` | The Home sidebar entry (`sidebar:nav-items`, order 10). |

`LangSwitcher` and `LoginButton` are also exported directly so org plugins can reuse them in a custom header.

### Overriding a default — lowest `order` wins

When several components are registered on the same point and one must be resolved, the renderer picks the **lowest `order` number** (ascending sort, `Math.min`; unset `order` counts as 100). So an org plugin overrides the default header by registering with a *lower* order:

```ts
// Core registers the default header at order 100…
manager.registerComponent("appshell:header", DefaultHeader, {
  key: "default-header",
  order: 100,
});

// …an org plugin overrides it by registering with a lower order.
manager.registerComponent("appshell:header", OrgHeader, {
  key: "org-header",
  order: 50,
});
```

Two registrations with the same winning order log a warning and the first registered is used.

## Why every plugin may import this

The boundaries rule blocks cross-plugin imports — but `@oc-mui/plugin-core` is the exception, because plugins need its extension-point declarations to wire themselves up correctly. See [`@oc-mui/eslint-config`](../../packages/eslint-config/base.js) for the exception.

## Layer

In-tree plugin. Depends on `@oc-mui/i18n`, `@oc-mui/plugin-system`, `@oc-mui/query`, `@oc-mui/router`, `@oc-mui/ui`.

## See also

- [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md) — how to register on these extension points.
- [`docs/architecture/CONTRACTS.md`](../../docs/architecture/CONTRACTS.md) — Manifest and Runtime API contract.
- [`AGENTS.md`](../../AGENTS.md) — operational rules.
