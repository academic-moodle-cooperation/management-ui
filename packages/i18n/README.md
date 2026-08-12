# @oc-mui/i18n

Translation layer. Wraps `i18next` and `react-i18next` behind a single workspace import, plus the plugin-aware `usePluginTranslation` hook that auto-loads namespaces.

Public API surface tracked in [`etc/i18n.api.md`](./etc/i18n.api.md).

## The wrapper rule

This package is the **only place in the workspace allowed to import from `i18next` and `react-i18next`**. Plugins and other packages import translation primitives from here. The rule is enforced by `no-restricted-imports` in `@oc-mui/eslint-config` with an explicit exception for this directory.

## Usage

### In a plugin component

```tsx
import { usePluginTranslation } from "@oc-mui/i18n";

export function MyView() {
  const { t } = usePluginTranslation(["my-plugin"]);
  return <h1>{t("my-plugin:welcome")}</h1>;
}
```

`usePluginTranslation` auto-loads the listed namespaces on first render and re-loads them when the language changes. Plain `useTranslation` works too, but the namespace must already be loaded.

### Locale layout — the org-plugin i18n mechanism

Externally distributed plugins ship their translations by declaring namespaces in `plugin.json` and laying out locale files **inside a namespace directory**:

```
my-plugin/
├── plugin.json           # "i18nNamespaces": ["my-plugin"]
└── locales/
    └── my-plugin/        # one directory per namespace — not flat under locales/
        ├── en.json
        └── de.json
```

At load time the shell passes the manifest's `i18nNamespaces` plus the plugin's locales URL to `registerPluginI18nNamespaces`, and the HTTP backend fetches `<localesUrl>/<namespace>/<language>.json` on demand. This is the load-bearing path for org plugins distributed as JARs; in-tree plugins mostly ship their strings in the shell's base locales instead and rarely declare `i18nNamespaces` — that is fine, and it does not make the mechanism unused.

Files are flat JSON, one key per phrase. The contract test's `expectI18nKeyParity()` fails when locale files for the same namespace drift apart.

## Surface

| Symbol | Purpose |
|--------|---------|
| `usePluginTranslation(namespaces, autoLoad?)` | The hook plugins should use. Auto-loads namespaces; respects host locale switching. |
| `useTranslation`, `useI18n` (alias) | Plain `react-i18next` hook, re-exported. Caller must load the namespace. |
| `loadNamespace(namespace, language?)` | Imperative namespace loader. Idempotent. |
| `registerPluginI18nNamespaces(namespaces, localesUrl)` | Maps a plugin's declared namespaces to its locales base URL so the HTTP backend can fetch them. Called by the shell's plugin initializer for JAR-distributed plugins. |
| `i18next`, `i18nConfig` (alias) | The configured singleton, for advanced callers. |
| `I18nextProvider`, `Trans` | Re-exports of the underlying React provider/component. |
| `selectedLanguage` | The `{ code: label }` map of shipped UI languages (`de`, `en`) — drives the language switcher. |
| `LinkText` | Tiny anchor component for use inside `<Trans>` interpolations. |
| `createNamespacedKey`, `createOrganizationNamespace` | Helpers for building consistent namespace strings. |

For the exhaustive surface, see [`etc/i18n.api.md`](./etc/i18n.api.md).

The shell ships a base set of locales (`packages/i18n/src/locales/`) for `common`, `episodes`, `series`, `upload`, etc. Plugins ship their own under `<plugin>/locales/<namespace>/<lng>.json`.

## Layer

Foundation. Depends on nothing in the workspace.

## See also

- [`docs/plugins/i18n.md`](../../docs/plugins/i18n.md) — plugin-author guide.
- [`packages/plugin-testing/README.md`](../plugin-testing/README.md) — `expectI18nKeyParity` test assertion.
- [`etc/i18n.api.md`](./etc/i18n.api.md) — committed API surface.
