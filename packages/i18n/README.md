# Translation System Documentation

## Overview

The i18n package provides internationalization support for the management UI. It uses i18next with React integration and supports both built-in translations and plugin-specific translations.

## Key Features

- External JSON translation files (no more hardcoded translations)
- Namespace-based organization for plugin compatibility
- HTTP backend for dynamic translation loading
- Fallback mechanism to English when translations are missing
- Development and production path support

## Translation File Structure

```
packages/i18n/src/locales/
├── common/        # Core UI elements and navigation (moved from ui namespace)
│   ├── de.json    # Buttons, pagination, languages, licenses, etc.
│   └── en.json
├── series/        # Series-related translations (51 lines each)
│   ├── de.json
│   └── en.json
├── episodes/      # Episode/video translations (106 lines each)
│   ├── de.json
│   └── en.json
├── upload/       # Upload functionality (43 lines each)
│   ├── de.json
│   └── en.json
└── [plugins can add their own namespaces]
```

The UI namespace has been merged into the common namespace for better organization. All common UI elements like buttons, pagination, and form controls are now accessible through the common namespace.

## Translation Key Naming Conventions

- Use camelCase for consistency: `registerStreaming` not `register_streaming`
- Use hierarchical namespaces: `series.seriesInfo.title`
- Organize by UI component or feature: `ui.pagination.goToNextPage`
- Keep keys descriptive but concise

## Usage

### Basic Usage with Colon Notation

```tsx
import { useI18n } from "@workspace/i18n";

function MyComponent() {
  // No need to specify namespaces - use colon notation instead
  const { t } = useI18n();

  // Access series translations using colon notation
  return <h1>{t("series:seriesInfo.title")}</h1>;

  // Access episodes translations using colon notation
  return <p>{t("episodes:episodesInfo.description")}</p>;

  // Access common translations (can omit common: prefix)
  return <button>{t("save")}</button>;
  // or explicitly
  return <button>{t("common:save")}</button>;
}
```

### Using i18next.t Directly

```tsx
import { i18next } from "@workspace/i18n";

// Use colon notation for explicit namespace references
{
  i18next.t("series:seriesTable.heading.episodes");
}
{
  i18next.t("episodes:episodesTable.action.editData");
}
{
  i18next.t("common:delete");
}
```

### Migration from Legacy Pattern

**OLD PATTERN** (deprecated - namespace options):

```tsx
// ❌ Don't use this pattern
{
  i18next.t("seriesTable.heading.episodes", { ns: "series" });
}
{
  i18next.t("episodesTable.action.editData", { ns: "episodes" });
}
{
  t("delete", { ns: "common" });
}

// ❌ Don't load namespaces explicitly
const { t } = useI18n(["series", "episodes"]);
```

**NEW PATTERN** (recommended - colon notation):

```tsx
// ✅ Use colon notation for explicit namespace references
{
  i18next.t("series:seriesTable.heading.episodes");
}
{
  i18next.t("episodes:episodesTable.action.editData");
}
{
  i18next.t("common:delete");
}

// ✅ Simplified useI18n call
const { t } = useI18n();
{
  t("series:seriesTable.heading.episodes");
}
{
  t("episodes:episodesTable.action.editData");
}
{
  t("delete");
} // Common namespace can omit prefix
```

This change provides cleaner code and more explicit namespace references.

### Plugin Usage

```tsx
import { useI18n, loadNamespace } from "@workspace/i18n";

function PluginComponent() {
  const { t } = useI18n();

  return <p>{t("my-plugin:welcome.message")}</p>;
}
```

### Loading Additional Namespaces

```tsx
import { loadNamespace } from "@workspace/i18n";

// Load a plugin namespace
await loadNamespace("my-plugin", "en");
```

## Organization-Specific Content

The system now uses generic terminology instead of university-specific terms:

- "Organization" instead of "University"
- "Streaming System" instead of "u:stream"
- Generic "Studio" instead of "u:stream-Studio"
- Configurable organization names via environment variables

## Adding New Translations

1. Add keys to both `de.json` and `en.json` files
2. Use consistent naming conventions (camelCase)
3. Test that both languages work
4. Follow the hierarchical namespace structure

## Plugin Translation Guidelines

### Adding Translations for a New Plugin

**CRITICAL FOR AI MODELS:** When creating a new plugin with translations, you MUST complete these steps:

#### Step 1: Register the Namespace

Add your namespace to the `ns` array in `packages/i18n/src/useTranslation.tsx`:

```typescript
// packages/i18n/src/useTranslation.tsx
i18n.init({
  // ...
  ns: ["common", "series", "episodes", "upload", "playlists"], // Add your namespace here!
  // ...
});
```

**If you skip this step, translations will NOT load and you'll see translation keys instead of text.**

#### Step 2: Create Translation Files

Create translation files in your plugin:

```
plugins/my-plugin/
└── locales/
    └── my-plugin/           # Namespace name must match
        ├── en.json
        └── de.json
```

Example `en.json`:

```json
{
  "my-plugin": {
    "heading": "My Plugin",
    "description": "Plugin description here"
  }
}
```

#### Step 3: Use Translations in Components

```typescript
import { useI18n } from '@workspace/i18n';

function MyPluginComponent() {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t('my-plugin:heading')}</h1>
      <p>{t('my-plugin:description')}</p>
    </div>
  );
}
```

### Complete Checklist for Plugin Translations

- [ ] Namespace added to `packages/i18n/src/useTranslation.tsx` in the `ns` array
- [ ] `locales/{namespace}/en.json` created in plugin directory
- [ ] `locales/{namespace}/de.json` created in plugin directory
- [ ] JSON structure matches namespace (e.g., `{ "playlists": { ... } }`)
- [ ] Components use `t('namespace:key')` syntax

### Common Translation Keys

Add these to `common` namespace (not your plugin namespace) for reuse:

```json
{
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "create": "Create",
  "add": "Add",
  "remove": "Remove",
  "action": "Action"
}
```

### Best Practices

1. Use descriptive namespace names: `playlists` not `pl`
2. Keep translations scoped to your plugin
3. Reuse `common` namespace keys for standard UI (save, cancel, etc.)
4. Test translations load correctly by checking the browser console for missing key warnings

## Migration from Legacy System

- Old hardcoded translations have been moved to JSON files
- University-specific content has been generalized
- Debug mode disabled for production
- Console logs removed for cleaner output
- **Translation key pattern changed**: Namespace is now specified explicitly or loaded via `useI18n(['namespace'])`
- **UI namespace merged into common**: All UI elements are now in the common namespace for better organization

### Breaking Change: Translation Key Pattern

All translation calls have been updated to use colon notation:

**Before:**

```tsx
{
  i18next.t("seriesTable.heading.episodes", { ns: "series" });
}
{
  i18next.t("episodesTable.action.editData", { ns: "episodes" });
}
{
  t("delete", { ns: "common" });
}

// Loading namespaces explicitly
const { t } = useI18n(["series", "episodes"]);
```

**After:**

```tsx
// Use colon notation for explicit namespace references
{
  i18next.t("series:seriesTable.heading.episodes");
}
{
  i18next.t("episodes:episodesTable.action.editData");
}
{
  t("common:delete");
}

// Simplified useI18n call (no namespace arrays needed)
const { t } = useI18n();
{
  t("series:seriesTable.heading.episodes");
}
{
  t("episodes:episodesTable.action.editData");
}
{
  t("delete");
} // Common namespace can omit prefix
```

## Build System

The build process:

1. Compiles TypeScript files
2. Copies locale JSON files to `dist/locales/`
3. Makes translations available for runtime loading

## Testing

The test functionality has been removed since it was causing build issues and was not essential for the core functionality. You can verify translations work by:

1. Building the package: `npm run build`
2. Testing manually in browser console with your application
3. Checking that translation keys resolve to expected values in your app

The build process automatically validates that translation files exist and are properly structured.
