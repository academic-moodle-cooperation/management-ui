# @opencast-mui/i18n

Translation layer. Wraps `i18next` and `react-i18next` behind a single workspace import, plus the plugin-aware `usePluginTranslation` hook that auto-loads namespaces.

**Contract**: 1.x. Public API surface tracked in [`etc/i18n.api.md`](./etc/i18n.api.md).

## The wrapper rule

This package is the **only place in the workspace allowed to import from `i18next` and `react-i18next`**. Plugins and other packages import translation primitives from here. The rule is enforced by `no-restricted-imports` in `@opencast-mui/eslint-config` with an explicit exception for this directory.

## Usage

### In a plugin component

```tsx
import { usePluginTranslation } from "@opencast-mui/i18n";

export function MyView() {
  const { t } = usePluginTranslation(["my-plugin"]);
  return <h1>{t("my-plugin:welcome")}</h1>;
}
```

`usePluginTranslation` auto-loads the listed namespaces on first render and re-loads them when the language changes. Plain `useTranslation` works too, but the namespace must already be loaded.

### Locale layout

```
my-plugin/
├── plugin.json           # i18nNamespaces: ["my-plugin"]
└── locales/
    └── my-plugin/
        ├── en.json
        └── de.json
```

Files are flat JSON, one key per phrase. The contract test's `expectI18nKeyParity()` fails when locale files for the same namespace drift apart.

## Surface

| Symbol | Purpose |
|--------|---------|
| `usePluginTranslation(namespaces, autoLoad?)` | The hook plugins should use. Auto-loads namespaces; respects host locale switching. |
| `useTranslation`, `useI18n` (alias) | Plain `react-i18next` hook, re-exported. Caller must load the namespace. |
| `loadNamespace(namespace, language?)` | Imperative namespace loader. Idempotent. |
| `i18next` | The configured singleton, for advanced callers. |
| `I18nextProvider`, `Trans` | Re-exports of the underlying React provider/component. |
| `createNamespacedKey`, `createOrganizationNamespace` | Helpers for building consistent namespace strings. |

For the exhaustive surface, see [`etc/i18n.api.md`](./etc/i18n.api.md).

The shell ships a base set of locales (`packages/i18n/src/locales/`) for `common`, `episodes`, `series`, `upload`, etc. Plugins ship their own under `<plugin>/locales/<namespace>/<lng>.json`.

## Layer

Foundation. Depends on nothing in the workspace.

## See also

- [`docs/plugins/i18n.md`](../../docs/plugins/i18n.md) — plugin-author guide.
- [`packages/plugin-testing/README.md`](../plugin-testing/README.md) — `expectI18nKeyParity` test assertion.
- [`etc/i18n.api.md`](./etc/i18n.api.md) — committed API surface.
