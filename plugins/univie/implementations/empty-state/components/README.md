# Univie Empty State Implementation

This plugin provides a custom empty state component specifically designed for the University of Vienna (Univie).

## Migration Status

✅ **New plugin for Univie, following the plugin architecture**

**Location**: `plugins/univie/implementations/empty-state/`

## Features

### Custom Content

- **University-specific links**: Directs users to Univie administration and guides
- **Internationalization**: Supports both English and German
- **Consistent UI**: Matches the look and feel of other Univie plugins

### Links

- **u:stream administration**: Direct link to Univie capture UI
- **Registration and administration guide**: Direct link to Univie user guides

## Extension Point

- `component-override:series:empty-state` - Replaces the default empty state for series

## Translations

Supports multiple languages via the plugin translation system:

- English (`en.json`)
- German (`de.json`)

## Usage

The plugin is automatically loaded when the `univie` namespace is included in the plugin configuration:

```typescript
pluginNamespace: ["core", "univie"];
```

## Technical Details

- Uses `usePluginTranslation` for translation support
- Uses `Trans` and `LinkText` for rich translation content with links
- Registered as a component override for the series empty state

This empty state implementation provides a Univie-specific experience for users when no series are available.
