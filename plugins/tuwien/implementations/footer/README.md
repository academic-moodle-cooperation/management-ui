# TU Wien Footer Implementation

This plugin provides a custom footer component specifically designed for TU Wien (Vienna University of Technology).

## Migration Status

✅ **Successfully migrated from old extension system**

**Original Location**: `migrate/extensions/src/tuwien/src/plugins/footer/`

**New Location**: `plugins/tuwien/implementations/footer/`

## Features

### Custom Styling

- **External Link Icons**: Automatically adds small external link icons to https/http links
- **Email Link Support**: Special styling for mailto links
- **Hover Effects**: Color transitions on link hover (gray to white)
- **Responsive Layout**: Flexible layout that adapts to different screen sizes

### TU Wien Branding

- Uses TU Wien theme colors (`var(--color-footer)`)
- Custom font sizing (13px) for footer links
- Right-aligned link layout following TU Wien design standards

### Links

- **Support**: Direct email link to LectureTube support
- **Imprint**: Official TU Wien legal notice page
- **Privacy**: Data protection declaration (LectureTube specific)
- **Help**: Internal help page (reuses core translation)

## Extension Point

- `component-override:appshell:footer` - Replaces the default footer component

## Translations

Supports multiple languages via the plugin translation system:

### German (`de.json`)

- Support → Support
- Impressum → TU Wien legal notice
- Datenschutzerklärung → LectureTube privacy policy

### English (`en.json`)

- Support → Support
- Imprint → TU Wien legal notice
- Privacy Policy → LectureTube privacy policy

## Usage

The plugin is automatically loaded when the `tuwien` namespace is included in the plugin configuration:

```typescript
pluginNamespace: ["core", "tuwien"];
```

## Migration Changes

### From Old System

- ✅ **Translation System**: Migrated from `useI18n` to `usePluginTranslation`
- ✅ **CSS Approach**: Converted from separate CSS file to inline styles
- ✅ **Theme Integration**: Now uses TU Wien theme variables
- ✅ **Plugin Registration**: Updated to new plugin architecture

### Preserved Features

- ✅ **External Link Icons**: SVG-based external link indicators
- ✅ **Layout Structure**: Three-column layout (empty, empty, links)
- ✅ **Link Styling**: Original hover effects and color scheme
- ✅ **University Links**: All TU Wien specific URLs maintained

## Technical Details

### Styling Approach

Uses `dangerouslySetInnerHTML` to inject CSS styles, preserving the complex external link icon system with SVG data URLs and CSS filters.

### Color Scheme

- Link Color: `#bdbdbd` (light gray)
- Hover Color: `#fff` (white)
- Background: `var(--color-footer)` (TU Wien theme)

### External Link Icons

- SVG-based icons with CSS filters for color manipulation
- Automatic detection of external links (`href^="https://"`, `href^="http://"`)
- Hover state color changes using CSS filter transformations

## Dependencies

- `@workspace/plugin-system` - Core plugin framework
- `@workspace/i18n` - Translation system with university namespace support
- `@workspace/ui` - UI utilities (cn function)

This footer implementation maintains TU Wien's unique visual identity while integrating seamlessly with the new plugin architecture.
