# @workspace/i18n

**Version:** 0.0.0  
**Type:** Foundation / Internationalization  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@workspace/i18n` package provides a unified internationalization system for the Management UI. Built on **i18next** and **react-i18next**, it supports multiple languages, namespaced translation files, and dynamic loading of translations—essential for the platform's plugin architecture.

**In Scope:**

- Centralized i18next instance and React context provider.
- Dynamic loading of translation namespaces (`loadNamespace`).
- Enhanced hooks for plugin-specific translations (`usePluginTranslation`).
- Standardized translation file structure (JSON).
- Helpers for organization-based namespacing.

**Out of Scope:**

- Management of the actual translation files (these are stored in `src/locales` or within plugins).
- Server-side translation storage.
- UI components for language switching (belongs in `@workspace/ui`).

## Architecture & Design Decisions

### Design Principles

- **On-Demand Loading:** Translations for specific features or plugins are only loaded when needed.
- **Namespace Isolation:** Each app or plugin should use its own namespace to prevent translation key collisions.
- **Organization Support:** Built-in helpers for organization-specific overrides (e.g., `univie:footer.text`).

### Key Concepts

#### Namespaces
Translation files are organized into namespaces (e.g., `common`, `series`, `episodes`). This allows for smaller initial bundles and better organization of keys.

#### `usePluginTranslation`
An enhanced version of the standard `useTranslation` hook that automatically ensures the requested namespaces are loaded from the backend before trying to use them.

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ @workspace/i18n Architecture            │
├─────────────────────────────────────────┤
│ [ I18nextProvider ]                     │
│         ↓                               │
│ [ usePluginTranslation Hook ]           │
│         ↓                               │
│ [ Dynamic Namespace Loader ]            │
│         ↓                               │
│ [ Locale JSON Files (src/locales/*) ]   │
└─────────────────────────────────────────┘
```

## API Surface (Public Exports)

### Core API

#### `I18nextProvider`
**Purpose:** Wraps the app to provide i18next context.

#### `usePluginTranslation(namespaces, autoLoad)`
**Purpose:** Hook for using translations with automatic namespace loading.
**Parameters:**
- `namespaces` (string[]): Array of namespaces to use.
- `autoLoad` (boolean): Whether to automatically fetch missing namespaces.

#### `loadNamespace(namespace, language)`
**Purpose:** Programmatically loads a translation bundle.

## Dependencies & Coupling

### Dependency Graph

```
@workspace/i18n
└── External Dependencies
    ├── i18next (^23.10.0)
    ├── i18next-browser-languagedetector (^7.2.0)
    ├── i18next-http-backend (^2.5.0)
    └── react-i18next (^14.0.5)
```

### Dependency Layer

**Layer:** Foundation

**Allowed to depend on:** External dependencies only.

## Usage Examples

### Basic Usage

```typescript
import { useTranslation } from "@workspace/i18n";

const MyComponent = () => {
  const { t } = useTranslation("common");
  return <button>{t("actions.save")}</button>;
};
```

### Plugin Usage (Auto-loading)

```typescript
import { usePluginTranslation } from "@workspace/i18n";

const PluginComponent = () => {
  const { t } = usePluginTranslation(["my-plugin-namespace"]);
  return <h1>{t("welcome_message")}</h1>;
};
```

## File Structure

```
packages/i18n/
├── src/
│   ├── locales/                # Core translation JSON files
│   │   ├── common/             # Shared keys
│   │   ├── series/             # Series-app specific
│   │   └── ...
│   ├── translationLoader.ts    # Logic for dynamic loading
│   ├── useTranslation.tsx      # Custom React hooks
│   └── index.ts                # Public API exports
├── package.json
└── README.md                   # This file
```

---

## Contributing

1. **New Keys:** Add shared keys to `src/locales/common/`. Add app-specific keys to their respective folders.
2. **Naming:** Use lowercase snake_case for keys (e.g., `button_label`).
3. **Hierarchy:** Keep JSON files shallow where possible for better readability.
4. **Plugins:** Plugins should define their own namespaces and use `usePluginTranslation` to ensure they are available at runtime.
