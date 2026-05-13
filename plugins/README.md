# Plugins Directory

This directory contains **core plugins** that are bundled with the Management UI. University/organization-specific plugins should be developed separately and deployed as Community Plugins or JAR bundles.

## Directory Structure

```
plugins/
├── assets/                    # Default/fallback assets (favicon, fonts)
├── core/                      # Extension-point definitions + shared core modules
├── core-episodes/             # Core feature plugin: /episodes route + sidebar nav
├── core-series/               # Core feature plugin: /series route + toolbar action
├── core-upload/               # Core feature plugin: /upload route (incl. /:seriesId)
├── admin-marketplace/         # Plugin + theme marketplace (activation UI)
└── example/                   # Minimal reference plugin for new contributors
```

See [ADR-003](../docs/architecture/decisions/003-shell-plus-core-plugins.md) for why feature code lives here instead of under `apps/`.

**Note:** University-specific plugins (e.g. univie, tuwien) have been moved out of this repository. Use `.local-plugins/<name>/` for local development (with `themes/<name>.css` for org themes) or deploy via Registry/JAR. See [Creating a plugin](../docs/plugins/creating-a-plugin.md) and [Distribution](../docs/plugins/distribution.md).

## Where to Develop: /plugins vs .local-plugins

| Path | When to use | Build required? | How to test |
|------|-------------|------------------|-------------|
| **`/plugins`** | Prototyping, core/org plugins in repo | No (library) or yes (standalone) | Barrel export + config; core Vite bundles it |
| **`.local-plugins`** | Complete org plugin, preparing for community/JAR | Yes (`pnpm build`) | Add namespace to config; core loads from manifest |

See [Creating a plugin](../docs/plugins/creating-a-plugin.md) for the full step-by-step guide and quick start.

## Plugin Types

### Core Plugins
- **Location:** `plugins/core/`, `plugins/admin-marketplace/`
- **Status:** Always included in the main repository
- **Distribution:** Bundled with the Management UI

### Community Plugins
- **Location:** Separate repositories or `.local-plugins/` for development
- **Status:** Developed independently
- **Distribution:** Via Community Registry, CDN, or JAR deployment
- **See:** [Creating a plugin](../docs/plugins/creating-a-plugin.md) and [Distribution](../docs/plugins/distribution.md)

## Assets Customization

The build system automatically copies assets from the `plugins/assets/` directory to the final build output. This allows universities to override default assets by placing their custom files in the appropriate plugin directories.

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

## Example: Organization plugin in .local-plugins

```bash
# Use .local-plugins/ for org-specific plugins (e.g. tuwien, univie)
mkdir -p .local-plugins/my-org/assets/favicon/
# Add your custom favicon.svg, favicon.ico, and site.webmanifest

mkdir -p .local-plugins/my-org/themes/
# Add themes/my-org.css for org theme (loaded in dev from /local-plugins/my-org/themes/my-org.css)
# Example theme-only folders (compact, rounded, minimal, warm) can live here for dev and appear in Admin → Marketplace → Themes when registered in the admin-marketplace plugin. See .local-plugins/README-THEMES.md when present.
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

1. Plugin-specific assets (e.g., from Community Plugins or JAR bundles)
2. Default plugin assets (e.g., `plugins/assets/`)

This allows for both university-specific customizations and fallback to default assets.

## Development

For developing new plugins:

1. **`pnpm create-plugin <name>`** — scaffolds an org/community plugin under `.local-plugins/<name>/` with all the wiring (package.json, plugin.json, tsconfig, vitest, contract test, README). This is the default and what most authors should use.
2. **`pnpm create-plugin <name> --in-tree`** — scaffolds a built-in plugin under `plugins/<name>/` instead, for core contributors adding something that ships with the OSS repo. After scaffolding, also add it to the [`plugins/index.ts`](./index.ts) barrel.
3. **Local development:** the local-plugin loader discovers anything under `.local-plugins/` automatically when the core runs in dev.

Example:

```bash
pnpm create-plugin audience-poll                # → .local-plugins/audience-poll/
pnpm create-plugin admin-dashboard --in-tree    # → plugins/admin-dashboard/
```

See [AGENTS.md](../AGENTS.md) (repo root) for the full plugin authoring rules, and [Creating a plugin](../docs/plugins/creating-a-plugin.md) for the longer-form lifecycle walkthrough.
