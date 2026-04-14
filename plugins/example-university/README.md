# Example University Plugin

A **complete reference implementation** for creating university plugins. Use this as a starting point for your own university plugin.

## Purpose

This plugin demonstrates:

- How to structure a university plugin
- How to implement extension points
- How to provide university configuration
- How to run in standalone mode for development
- How to integrate with the core shell

**Note:** This plugin is for development and learning. It is not loaded in production environments.

## Quick Start

### Create Your Own Plugin

```bash
# 1. Copy this plugin
cp -r plugins/example-university plugins/my-university

# 2. Update package name in package.json
# 3. Modify modules/config/config.ts
# 4. Add your logo to assets/
# 5. Register in plugins/index.ts

# 6. Install dependencies
pnpm install

# 7. Run standalone development
cd plugins/my-university
pnpm dev
```

### Run This Plugin Standalone

```bash
cd plugins/example-university
pnpm dev
# Access at http://127.0.0.1:3007
```

## Directory Structure

```
plugins/example-university/
├── modules/              # Extension point implementations
│   ├── config/                  # University configuration
│   │   ├── config.ts           # Configuration values
│   │   └── index.ts            # Config plugin registration
│   ├── sidebar/                 # Sidebar navigation items
│   │   └── index.ts
│   ├── university-header-example.ts  # Header logo
│   └── index.ts                 # Implementation exports
├── apps/                        # University-specific apps
│   └── ExampleUniversityApp.tsx # Demo app for standalone mode
├── assets/                      # University assets
│   ├── favicon/
│   │   └── favicon.svg
│   └── logo.svg
├── index.ts                     # Main plugin entry point
├── main.tsx                     # Standalone entry point
├── index.html                   # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vite-env.d.ts
└── README.md                    # This file
```

## Modules

### Configuration (`modules/config/`)

Provides university-specific settings:

```typescript
// modules/config/config.ts
export const config = {
  app: {
    theme: "example-university",
    orgLogoUrl: "assets/example-university/logo.svg",
    organizationName: "Example University",
    organizationUrl: "https://example-university.edu",
    supportEmail: "support@example-university.edu",
    features: {
      enableTranscripts: true,
      enableComments: false,
    },
    pluginNamespace: [
      "core",
      "episodes",
      "series",
      "upload",
      { "example-university": { types: ["config", "header", "sidebar"] } },
    ],
  },
};
```

### Header (`modules/university-header-example.ts`)

Adds university logo to the header:

```typescript
manager.registerObject("app:header-logo", "example-university-logo", {
  src: "/assets/example-university-logo.png",
  alt: "Example University",
  width: 120,
  height: 40,
  href: "https://example-university.edu",
});
```

### Sidebar Navigation (`modules/sidebar/`)

Adds custom navigation items:

```typescript
// Custom navigation item
manager.registerObject("sidebar:nav-items", "example-courses", {
  title: "Courses",
  path: "/courses",
  icon: GraduationCap,
  order: 50,
  permissions: ["courses.view"],
});

// Help link
manager.registerObject("sidebar:help-items", "example-docs", {
  title: "Documentation",
  path: "https://docs.example-university.edu",
  icon: BookOpen,
  order: 10,
  external: true,
});
```

## Extension Points Used

| Extension Point      | Implementation                   | Purpose             |
| -------------------- | -------------------------------- | ------------------- |
| `app:config`         | `exampleUniversityConfigPlugin`  | University settings |
| `app:header-logo`    | `universityHeaderExample`        | Header logo         |
| `sidebar:nav-items`  | `exampleUniversitySidebarPlugin` | Navigation items    |
| `sidebar:help-items` | `exampleUniversitySidebarPlugin` | Help links          |

## Development

### Standalone Mode

Run the plugin independently for rapid development:

```bash
cd plugins/example-university
pnpm dev
```

**Port:** 3007  
**URL:** http://127.0.0.1:3007

### Integrated Mode

Test within the core shell:

```bash
# From monorepo root
cd apps/management-ui-core
pnpm dev
```

**URL:** http://127.0.0.1:3000

### Type Checking

```bash
pnpm check-types
```

### Linting

```bash
pnpm lint
```

### Building

```bash
pnpm build
```

## Customization Guide

### Step 1: Update Configuration

Edit `modules/config/config.ts`:

- Change `organizationName` to your university
- Update `organizationUrl` with your website
- Set `supportEmail` to your support address
- Enable/disable features in `features` object
- Update `theme` to match your CSS theme file

### Step 2: Add Your Logo

1. Create your logo as SVG (recommended) or PNG
2. Place in `assets/logo.svg` or `assets/logo.png`
3. Update `orgLogoUrl` in config.ts
4. Update `modules/university-header-example.ts` with correct path

### Step 3: Customize Navigation

Edit `modules/sidebar/index.ts`:

- Modify existing navigation items
- Add new navigation items
- Update help links
- Set appropriate permissions

### Step 4: Add More Modules

Create new modules for other extension points:

```bash
# Create footer module
mkdir -p modules/footer
# Create components and index.ts following the pattern
```

Export in `modules/index.ts`:

```typescript
export { myUniversityFooterPlugin } from "./footer";
```

### Step 5: Update README

Document your plugin's features, configuration, and usage.

## Assets

### Favicon

Place custom favicon files in `assets/favicon/`:

- `favicon.svg` - Modern SVG favicon (recommended)
- `favicon.ico` - Fallback for older browsers

### Logo

Place your logo in `assets/`:

- `logo.svg` - Vector logo (scales cleanly)
- `logo.png` - Raster logo (if SVG not available)

## Dependencies

```json
{
  "@workspace/app-runtime": "workspace:*", // Standalone execution
  "@workspace/i18n": "workspace:*", // Internationalization
  "@workspace/plugin-system": "workspace:*", // Plugin infrastructure
  "@workspace/ui": "workspace:*", // UI components
  "react": "^18.0.0 || ^19.0.0"
}
```

## Related Documentation

- [Core Plugin](/plugins/core/README.md) - Extension point catalog
- [Adding Plugins Guide](/docs/workflows/ADDING_PLUGINS.md) - Step-by-step instructions
- [Plugin System Overview](/plugins/README.md) - Architecture overview
- Org plugins (univie, tuwien, etc.) live in `.local-plugins/` or separate repos; see [Community Plugin Development](/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md)

## Checklist for New Plugins

Use this checklist when creating your own plugin:

- [ ] Copied this directory to `plugins/[university-name]`
- [ ] Updated `package.json` name and description
- [ ] Modified `modules/config/config.ts` with university settings
- [ ] Added university logo to `assets/`
- [ ] Updated header implementation with correct logo path
- [ ] Customized sidebar navigation items
- [ ] Created comprehensive README.md
- [ ] Registered in `plugins/index.ts`
- [ ] Tested standalone mode (`pnpm dev`)
- [ ] Tested integrated mode (core shell)
- [ ] Ran `pnpm check-types`
- [ ] Ran `pnpm lint`
- [ ] Built successfully (`pnpm build`)

## Troubleshooting

### Plugin Not Loading

1. Check console for initialization logs
2. Verify export in `plugins/index.ts`
3. Check `pluginNamespace` in config.ts includes your plugin
4. Run `pnpm install` from monorepo root

### Logo Not Appearing

1. Verify file path in `app:header-logo` registration
2. Check file exists in `assets/`
3. For standalone mode, ensure path starts with `/assets/`

### Styles Not Applied

1. Create CSS theme file in `plugins/themes/[university-name].css`
2. Update `theme` in config.ts to match filename
3. Check CSS variable names match theme system

### Build Errors

1. Run `pnpm check-types` for TypeScript errors
2. Check import paths are correct
3. Verify dependencies in package.json
4. Run `pnpm install` from monorepo root
