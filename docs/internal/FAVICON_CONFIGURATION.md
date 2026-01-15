# Favicon and HTML Title Configuration

This document explains how to configure favicons and HTML titles through the application configuration system.

## Overview

Both favicon URLs and HTML document titles can now be configured through the application configuration, allowing universities to customize these elements without rebuilding the application.

## Configuration Structure

### Default Configuration

```typescript
{
  "app": {
    "faviconUrl": "/management-ui/assets/favicon/favicon.svg",
    "HtmlDocumentTitle": "Management UI"
  }
}
```

### University-Specific Override

Universities can override these settings in their plugin configuration:

```typescript
// plugins/tuwien/implementations/config/config.ts
export const config = {
  app: {
    faviconUrl: "/management-ui/assets/favicon/tuwien-favicon.svg",
    HtmlDocumentTitle: "TU Wien Video Management",
    // ... other config
  },
};
```

## How It Works

### 1. **Favicon Loading**

- The application loads with a default favicon from `index.html`
- Once the configuration is loaded, the favicon is dynamically replaced
- The system automatically handles both SVG and ICO formats
- Falls back to ICO if SVG is not available

### 2. **HTML Title**

- The document title is set dynamically when the configuration loads
- Includes development mode prefix `[DEV]` when running in development
- Can be overridden by university-specific configurations

## Configuration Options

### `faviconUrl` (Optional)

- **Type**: `string`
- **Default**: `"/management-ui/assets/favicon/favicon.svg"`
- **Description**: URL to the favicon file (SVG preferred)
- **Example**: `"/management-ui/assets/favicon/university-logo.svg"`

### `HtmlDocumentTitle` (Required)

- **Type**: `string`
- **Default**: `"Management UI"`
- **Description**: The HTML document title
- **Example**: `"TU Wien Video Management"`

## University Customization Examples

### TU Wien Example

```typescript
export const config = {
  app: {
    faviconUrl: "/management-ui/assets/favicon/tuwien-favicon.svg",
    HtmlDocumentTitle: "TU Wien Video Management",
    theme: "tuwien",
  },
};
```

### University of Vienna Example

```typescript
export const config = {
  app: {
    faviconUrl: "/management-ui/assets/favicon/univie-favicon.svg",
    HtmlDocumentTitle: "UniVie Video Platform",
    theme: "univie",
  },
};
```

## Asset Management

### Favicon Files

Universities should place their favicon files in the plugin assets directory:

```
plugins/
├── tuwien/
│   └── assets/
│       └── favicon/
│           ├── favicon.svg
│           ├── favicon.ico
│           └── site.webmanifest
└── univie/
    └── assets/
        └── favicon/
            ├── favicon.svg
            ├── favicon.ico
            └── site.webmanifest
```

### File Requirements

- **SVG Favicon**: Modern, scalable, preferred format
- **ICO Favicon**: Fallback for older browsers
- **Web Manifest**: Optional, for PWA features

## Runtime Behavior

### Development Mode

- Title includes `[DEV]` prefix
- Favicon can be changed without rebuild
- Configuration is loaded from local development server

### Production Mode

- Title uses exact configuration value
- Favicon is served from production assets
- Configuration is loaded from production endpoint

## Best Practices

1. **Use SVG favicons** for better quality and scalability
2. **Provide ICO fallback** for older browser compatibility
3. **Keep titles concise** but descriptive
4. **Test favicon loading** in different browsers
5. **Use consistent branding** across favicon and title

## Troubleshooting

### Favicon Not Loading

1. Check that the favicon file exists at the specified URL
2. Verify the path includes the base path (`/management-ui/`)
3. Ensure the file is properly copied to the build output
4. Check browser developer tools for 404 errors

### Title Not Updating

1. Verify the configuration is loading correctly
2. Check that `HtmlDocumentTitle` is set in the config
3. Ensure the configuration merge is working properly
4. Check for JavaScript errors in the console

## Migration from Static Configuration

If you're migrating from static favicon configuration:

1. **Remove hardcoded favicon links** from `index.html`
2. **Add `faviconUrl` to your configuration**
3. **Update university-specific configs** with their custom favicons
4. **Test the dynamic loading** in development and production

## API Reference

### Configuration Interface

```typescript
interface AppConfig {
  app: {
    faviconUrl?: string;
    HtmlDocumentTitle: string;
    // ... other app config
  };
}
```

### Dynamic Loading

The favicon is loaded dynamically in `main.tsx`:

- Removes existing favicon links
- Creates new favicon link element
- Appends to document head
- Handles both SVG and ICO formats
