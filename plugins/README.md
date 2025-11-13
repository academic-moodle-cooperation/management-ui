# Plugin Assets Customization

This document explains how universities can customize their favicons and fonts through the plugin system.

## How It Works

The build system automatically copies assets from the `plugins/assets/` directory to the final build output. This allows universities to override default assets by placing their custom files in the appropriate plugin directories.

## Directory Structure

```
plugins/
├── assets/                    # Default/fallback assets
│   ├── favicon/
│   │   ├── favicon.svg
│   │   ├── favicon.ico
│   │   └── site.webmanifest
│   └── fonts/
│       └── roboto/
│           ├── roboto-v20-latin-100.woff
│           ├── roboto-v20-latin-100.woff2
│           └── ... (other font files)
├── tuwien/                    # TU Wien plugin
│   └── assets/
│       ├── favicon/
│       │   └── favicon.svg    # TU Wien custom favicon
│       └── fonts/
│           └── custom-fonts/ # TU Wien custom fonts
└── univie/                    # University of Vienna plugin
    └── assets/
        ├── favicon/
        │   └── favicon.svg    # UniVie custom favicon
        └── fonts/
            └── custom-fonts/  # UniVie custom fonts
```

## Customizing Favicons

To customize favicons for a specific university:

1. Create the favicon files in your plugin's `assets/favicon/` directory:
   - `favicon.svg` - Modern SVG favicon
   - `favicon.ico` - Fallback for older browsers
   - `site.webmanifest` - Web app manifest

2. The build system will automatically use these files instead of the default ones.

## Customizing Fonts

To customize fonts for a specific university:

1. Place your custom font files in your plugin's `assets/fonts/` directory
2. Update your CSS to reference the fonts using the `/management-ui/assets/fonts/` path
3. The build system will copy your custom fonts to the build output

## Example: TU Wien Customization

```bash
# Create TU Wien custom favicon
mkdir -p plugins/tuwien/assets/favicon/
# Add your custom favicon.svg, favicon.ico, and site.webmanifest

# Create TU Wien custom fonts
mkdir -p plugins/tuwien/assets/fonts/custom-fonts/
# Add your custom font files
```

## Build Process

The `viteStaticCopy` plugin in `packages/vite-config/src/shell.config.ts` handles copying assets:

```typescript
{
  src: path.resolve(monorepoRootPath, 'plugins/assets/*'),
  dest: 'assets'
}
```

This copies all files from `plugins/assets/` to the build output's `assets/` directory.

## Accessing Assets

In your application, reference assets using the base path:

- Favicons: `/management-ui/assets/favicon/favicon.svg`
- Fonts: `/management-ui/assets/fonts/roboto/roboto-v20-latin-regular.woff2`

## Priority Order

The system uses the following priority order for assets:

1. Plugin-specific assets (e.g., `plugins/tuwien/assets/`)
2. Default plugin assets (e.g., `plugins/assets/`)

This allows for both university-specific customizations and fallback to default assets.