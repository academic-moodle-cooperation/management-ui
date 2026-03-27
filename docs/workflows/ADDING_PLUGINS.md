# Adding New Plugins to Management UI

**Last Updated:** 2025-11-12

## Overview

This guide walks through creating a new university plugin for the Management UI system. Plugins enable institutions to customize the system without modifying core code. Each plugin can provide branding, custom components, workflows, and even complete applications.

## Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- Understanding of [Plugin System](/plugins/README.md)
- Familiarity with extension points
- Knowledge of [Package Ecosystem](/packages/README.md)

## Quick Start: Choose Your Path

Use **`/plugins`** for fast prototyping or core/org plugins in the repo. Use **`.local-plugins`** for a complete, tested org plugin or to prepare for publishing as a community plugin.

| Path | When to use | Build required? | How to test |
|------|-------------|------------------|-------------|
| **`/plugins`** | Prototyping, core/org plugins in repo | No (library) or yes (standalone) | Barrel export + config; core Vite bundles it |
| **`.local-plugins`** | Complete org plugin, preparing for community/JAR | Yes (`pnpm build`) | Add namespace to config; core loads from manifest |

- **For prototyping:** Copy `example-university` to `plugins/my-plugin`, export from barrel, add namespace to config.
- **For org/community:** Run `pnpm plugin:create-local my-plugin --wire-config`, then build and run the core.

## Before You Start

### 0. Choose Plugin Type

First, determine which type of plugin you need:

| Plugin Type        | Use When                                      | Has Vite Build | Can Run Standalone |
| ------------------ | --------------------------------------------- | -------------- | ------------------ |
| **Standalone/App** | Full customization, standalone testing needed | Yes            | Yes                |
| **Library**        | Only exports code for other apps to consume   | No             | No                 |

**Standalone/App plugins** (like `plugin-tuwien`, `plugin-univie`):

- Have `index.html`, `main.tsx`, and `vite.config.ts`
- Can be developed and tested independently at their own port
- Use `createPluginAppViteConfig` for vite configuration

**Library plugins** (like `@workspace/plugin-playlists`):

- Only have `index.ts` exporting plugin code
- No vite build - source files exported directly
- Consumed by other apps that handle bundling

**This guide focuses on Standalone/App plugins.** For library plugins, follow the `@workspace/plugin-system` pattern with direct source exports.

### 1. Understand Plugin Capabilities

Plugins can provide:

- **Custom Components** - Replace headers, footers, sidebars
- **Branding** - Colors, logos, typography
- **Workflows** - Custom approval processes
- **Metadata Fields** - Additional data capture
- **Applications** - Complete standalone apps
- **Configuration** - University-specific settings

### 2. Study Existing Plugins

Review examples:

- [`/plugins/core/`](/plugins/core/README.md) - Core extension points
- [`/plugins/example-university/`](/plugins/example-university/README.md) - Reference implementation
- Org plugins (e.g. univie, tuwien) live in `.local-plugins/` or separate repos; see [Community Plugin Development](/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md).

### 3. Plan Your Plugin

Consider:

- **University name** - Full and abbreviated
- **Extension points needed** - What to customize?
- **Branding requirements** - Colors, logos, fonts
- **Custom apps** - Any university-specific applications?
- **Port number** - For standalone mode (3005, 3006, 3007+)

## Step-by-Step Guide

### Step 1: Create Plugin Directory

```bash
# From monorepo root
mkdir -p plugins/[university-name]
cd plugins/[university-name]
```

**Naming Convention:**

- Use lowercase, kebab-case
- Use university abbreviation if common: `tuwien`, `univie`
- Or full name: `stanford`, `mit`, `example-university`

### Step 2: Create Plugin Structure

```bash
# Create directory structure
mkdir -p implementations
mkdir -p apps
mkdir -p assets/favicon
mkdir -p assets/logo
```

Complete structure:

```
plugins/[university-name]/
├── implementations/         # Extension point implementations
│   ├── config/             # University configuration
│   │   ├── config.ts
│   │   └── index.ts
│   ├── header/             # Custom header
│   │   ├── components/
│   │   ├── locales/
│   │   ├── index.ts
│   │   └── README.md
│   ├── footer/             # Custom footer
│   │   └── ...
│   ├── sidebar/            # Custom sidebar
│   │   └── ...
│   └── index.ts            # Implementation registry
├── apps/                    # University-specific apps (optional)
│   ├── [app-name]/
│   │   ├── src/
│   │   ├── services/        # DO NOT use names starting with 'api' (proxy conflict)
│   │   ├── package.json
│   │   └── README.md
│   └── [app-name]-plugin.ts
├── assets/                  # University assets
│   ├── favicon/
│   │   ├── favicon.svg
│   │   └── favicon.ico
│   ├── logo.svg
│   └── logo.png
├── index.ts                 # Main plugin entry point
├── package.json
├── tsconfig.json
├── vite.config.ts          # For standalone mode
├── index.html              # For standalone mode
└── README.md                # Plugin documentation
```

**CRITICAL Naming Note:** Never name a top-level directory with a path that **starts with `api`** in a standalone plugin (e.g., `api/`, `api-client/`, `api-utils/`). The Vite proxy for the backend intercepts all paths starting with `/api`, causing 404 errors during development as source file requests get proxied to the backend. Use `services`, `backend`, or `lib` instead.

### Step 3: Initialize package.json

```bash
pnpm init
```

Edit `package.json`:

```json
{
  "name": "@workspace/plugin-[university-name]",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "clean": "rm -rf .turbo && rm -rf dist && rm -rf node_modules",
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "check-types": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@workspace/plugin-system": "workspace:*",
    "@workspace/ui": "workspace:*",
    "@workspace/i18n": "workspace:*",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0 || ^19.0.0",
    "@types/react-dom": "^18.0.0 || ^19.0.0",
    "@workspace/eslint-config": "workspace:*",
    "@workspace/typescript-config": "workspace:*",
    "eslint": "^9.20.0",
    "typescript": "^5.3.3",
    "vite": "^6.1.4"
  }
}
```

### Step 4: Create TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "extends": "@workspace/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 5: Create Main Plugin Entry

Create `index.ts`:

```typescript
import { createPlugin } from '@workspace/plugin-system';

// Import all implementations
import * as implementations from './implementations';

/**
 * [University Name] Plugin
 *
 * Provides [University Name]-specific customizations including:
 * - Custom branding and theming
 * - University header and footer
 * - Custom workflows
 * - [Other features]
 */
export const [UniversityName]Plugin = createPlugin({
  namespace: '[university-name]',
  type: 'university-extension',
  version: '1.0.0',

  initialize(manager) {
    console.log('[University Name] plugin initializing...');

    // Register all implementations
    Object.values(implementations).forEach((impl) => {
      if (typeof impl.register === 'function') {
        impl.register(manager);
      }
    });

    console.log('[University Name] plugin initialized');
  },

  activate() {
    console.log('[University Name] plugin activated');
  },

  deactivate() {
    console.log('[University Name] plugin deactivated');
  }
});

// Export implementations for direct use if needed
export * from './implementations';
```

### Step 6: Create University Configuration

Create `implementations/config/config.ts`:

```typescript
import { AppConfig } from '@workspace/ui-config';

/**
 * [University Name] Configuration
 *
 * This configuration provides university-specific settings that will be
 * merged with the default configuration at build time (production) or
 * runtime (development).
 */
export const [universityName]Config: Partial<AppConfig> = {
  // Application Settings
  appName: '[University Name] Video Platform',

  // Branding
  branding: {
    primaryColor: '#hexcolor',     // University primary color
    secondaryColor: '#hexcolor',   // University secondary color
    accentColor: '#hexcolor',      // Accent color
    logoUrl: '/assets/logo.svg',   // Path to logo
    faviconUrl: '/assets/favicon.svg',
    // orgLogoUrl (sidebar logo): use path without app base, e.g. "local-plugins/univie/assets/logo.png" (dev) or "static/plugins/univie/assets/logo.png" (prod), so resolveAssetUrl can prepend base once
  },

  // Features
  features: {
    enableAdvancedSearch: true,
    enableComments: false,
    enableTranscripts: true,
    // Custom feature flags
  },

  // URLs
  urls: {
    helpUrl: 'https://[university].edu/help',
    supportEmail: 'support@[university].edu',
    privacyPolicyUrl: 'https://[university].edu/privacy',
  },

  // University-specific settings
  university: {
    name: '[University Name]',
    abbreviation: '[UNIV]',
    domain: '[university].edu',
    // Custom settings
  },
};
```

Create `implementations/config/index.ts`:

```typescript
import { PluginManager } from '@workspace/plugin-system';
import { [universityName]Config } from './config';

export function register(manager: PluginManager) {
  // Register configuration object
  manager.registerObject('app:config', '[university-name]-config', [universityName]Config);

  console.log('[University Name] configuration registered');
}

export { [universityName]Config };
```

### Step 7: Create Custom Header Implementation

Create `implementations/header/components/UniversityHeader.tsx`:

```typescript
import React from 'react';
import { useTranslation } from '@workspace/i18n';

export interface UniversityHeaderProps {
  user?: {
    name: string;
    email: string;
  };
}

export const UniversityHeader: React.FC<UniversityHeaderProps> = ({ user }) => {
  const { t } = useTranslation('[university-name]');

  return (
    <header className="bg-primary text-primary-foreground p-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* University Logo */}
        <div className="flex items-center space-x-4">
          <img
            src="/assets/logo.svg"
            alt="[University Name]"
            className="h-8"
          />
          <span className="text-xl font-bold">
            {t('header.title')}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex space-x-4">
          <a href="/series" className="hover:underline">
            {t('header.nav.series')}
          </a>
          <a href="/episodes" className="hover:underline">
            {t('header.nav.episodes')}
          </a>
          <a href="/upload" className="hover:underline">
            {t('header.nav.upload')}
          </a>
        </nav>

        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-2">
            <span>{user.name}</span>
          </div>
        )}
      </div>
    </header>
  );
};
```

Create `implementations/header/index.ts`:

```typescript
import { PluginManager } from "@workspace/plugin-system";
import { UniversityHeader } from "./components/UniversityHeader";

export function register(manager: PluginManager) {
  // Register custom header with high priority (overrides default)
  manager.registerComponent("app:header", UniversityHeader, {
    priority: 10,
    metadata: {
      name: "[University Name] Header",
      description: "Custom header with university branding",
    },
  });

  console.log("[University Name] header registered");
}

export { UniversityHeader };
```

Create `implementations/header/locales/en.json`:

```json
{
  "[university-name]": {
    "header": {
      "title": "[University Name] Video Platform",
      "nav": {
        "series": "Series",
        "episodes": "Episodes",
        "upload": "Upload"
      }
    }
  }
}
```

Create `implementations/header/README.md` following [`IMPLEMENTATION_README_TEMPLATE.md`](/docs/templates/IMPLEMENTATION_README_TEMPLATE.md).

### Step 8: Create Implementations Registry

Create `implementations/index.ts`:

```typescript
/**
 * [University Name] Plugin Implementations
 *
 * This file exports all plugin implementations for registration.
 */

// Configuration
export * as config from "./config";

// Layout Components
export * as header from "./header";
export * as footer from "./footer";
export * as sidebar from "./sidebar";

// Feature Implementations
// export * as [feature] from './[feature]';

// Add more implementations as needed
```

### Step 9: Add University Assets

Add branding assets:

```bash
# Add logos
cp /path/to/university-logo.svg plugins/[university-name]/assets/logo.svg
cp /path/to/university-logo.png plugins/[university-name]/assets/logo.png

# Add favicon
cp /path/to/favicon.svg plugins/[university-name]/assets/favicon/favicon.svg
```

Or create placeholder assets during development.

### Step 10: Create Vite Configuration (for standalone mode)

Create `vite.config.ts`:

```typescript
import { defineConfig, loadEnv } from "vite";
import { createPluginAppViteConfig } from "@workspace/vite-config";

const packageName = "plugin-[university-name]";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return createPluginAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname,
  });
});
```

### Step 11: Create HTML Entry Point (for standalone mode)

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/assets/favicon/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>[University Name] Plugin</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.ts"></script>
  </body>
</html>
```

### Step 12: Test Standalone Mode

```bash
# From plugin directory
pnpm dev
```

**Access:** `http://127.0.0.1:30XX`

This allows you to test your plugin implementations in isolation.

### Step 13: Register Plugin in Core

Update the plugin registry to include your plugin:

```typescript
// plugins/index.ts
import { [UniversityName]Plugin } from './[university-name]';

export const plugins = [
  // ... other plugins
  [UniversityName]Plugin,
];
```

### Step 14: Test in Core Application

```bash
# From monorepo root
cd apps/management-ui-core
pnpm dev
```

**Access:** `http://127.0.0.1:3000`

**Verify:**

- Custom header appears
- Branding is applied
- Plugin console logs show initialization
- Customizations override defaults

### Step 15: Create Plugin Documentation

**CRITICAL:** Create comprehensive README.md

```bash
# Copy template
cp docs/templates/PLUGIN_README_TEMPLATE.md plugins/[university-name]/README.md
```

Follow template sections:

1. **Purpose** - What this plugin provides
2. **Features** - What's included
3. **Plugin Structure** - Directory layout
4. **Implementations** - Extension points implemented
5. **Configuration** - University settings
6. **Development** - How to work with it
7. **Extension Points** - What can be customized
8. **Branding & Theming** - Colors and assets
9. **Deployment** - Build and deploy

**See examples:**

- [Example University Plugin](/plugins/example-university/README.md)
- [Community Plugin Development](/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md) (for .local-plugins or separate repos)

### Step 16: Create Implementation Documentation

For each implementation, create a README:

```bash
cp docs/templates/IMPLEMENTATION_README_TEMPLATE.md plugins/[university-name]/implementations/header/README.md
```

Document:

- Extension point used
- Component behavior
- Props interface
- Customization options
- Testing approach

### Step 17: Update Plugins Documentation

Update [`/plugins/README.md`](/plugins/README.md) to include your plugin in the examples or university list.

### Step 18: Add Custom Applications (Optional)

If your plugin includes custom apps:

```bash
mkdir -p apps/[app-name]
cd apps/[app-name]
```

Follow [Adding Apps Guide](/docs/workflows/ADDING_APPS.md) to create the app, then register it in your plugin:

```typescript
// apps/[app-name]-plugin.ts
import { createPlugin } from "@workspace/plugin-system";
import { MyCustomApp } from "./src/App";

export const MyAppPlugin = createPlugin({
  namespace: "[university-name]",
  type: "app",
  version: "1.0.0",

  initialize(manager) {
    manager.registerObject("apps:definitions", "[app-id]", {
      id: "[app-id]",
      name: "[App Name]",
      routePath: "/[route]",
      component: MyCustomApp,
      navigation: {
        title: "[App Name]",
        icon: "icon-name",
        order: 200,
        permissions: ["app.access"],
      },
    });
  },
});
```

### Step 19: Validate Plugin

Run all validation checks:

```bash
# From plugin directory
pnpm check-types
pnpm lint
pnpm build

# From monorepo root
pnpm check-types
pnpm lint
pnpm build
```

### Step 20: Commit Changes

```bash
# Stage all changes
git add plugins/[university-name]
git add plugins/README.md
git add plugins/index.ts

# Commit
git commit -m "feat(plugins): add [University Name] plugin

- Custom header and footer
- University branding
- Configuration
- [Other features]
- Documentation complete
- Port: 30XX
"
```

## Common Implementation Patterns

### Pattern: Custom Empty State

```typescript
// implementations/empty-state/components/CustomEmptyState.tsx
export const CustomEmptyState: React.FC<EmptyStateProps> = ({ message, action }) => {
  return (
    <div className="text-center py-12">
      <UniversityIcon className="mx-auto h-12 w-12 text-muted" />
      <h3 className="mt-2 text-sm font-semibold">{message}</h3>
      {action && <Button className="mt-4">{action}</Button>}
    </div>
  );
};

// implementations/empty-state/index.ts
export function register(manager: PluginManager) {
  manager.registerComponent('app:empty-state', CustomEmptyState);
  manager.registerComponent('series:empty-state', CustomEmptyState);
  manager.registerComponent('episodes:empty-state', CustomEmptyState);
}
```

### Pattern: Custom Metadata Fields

```typescript
// implementations/metadata/components/CustomMetadataFields.tsx
export const CustomMetadataFields: React.FC = () => {
  return (
    <>
      <Input label="Course Code" name="courseCode" pattern="^[A-Z]{3}\d{3}$" />
      <Select label="Department" name="department">
        <option value="cs">Computer Science</option>
        <option value="math">Mathematics</option>
      </Select>
      <Checkbox label="Exam Relevant" name="examRelevant" />
    </>
  );
};

// implementations/metadata/index.ts
export function register(manager: PluginManager) {
  manager.registerObject('metadata:fields', 'university-fields', {
    courseCode: {
      type: 'text',
      label: 'Course Code',
      required: true,
      pattern: '^[A-Z]{3}\\d{3}$'
    },
    department: {
      type: 'select',
      label: 'Department',
      options: [
        { value: 'cs', label: 'Computer Science' },
        { value: 'math', label: 'Mathematics' }
      ]
    }
  });
}
```

### Pattern: Custom Workflow

```typescript
// implementations/workflow/index.ts
export function register(manager: PluginManager) {
  manager.registerObject("workflows:definitions", "university-approval", {
    name: "University Content Approval",
    steps: [
      {
        name: "Created",
        status: "draft",
        description: "Content created by instructor",
      },
      {
        name: "Department Review",
        status: "dept-review",
        permissions: ["department.review"],
        timeout: "7d",
      },
      {
        name: "Published",
        status: "published",
        permissions: ["content.publish"],
      },
    ],
  });
}
```

## Troubleshooting

### Plugin Not Loading

**Solutions:**

1. Verify plugin is registered in `plugins/index.ts`
2. Check console for initialization logs
3. Verify `package.json` dependencies
4. Run `pnpm install` from root

### Customizations Don't Appear

**Solutions:**

1. Check extension point naming
2. Verify priority number (lower = higher priority)
3. Check if default has different priority
4. Verify component is exported

### Styling Conflicts

**Solutions:**

1. Use Tailwind CSS classes
2. Check for CSS specificity issues
3. Use university-specific class prefixes
4. Verify theme variables

### Build Failures

**Solutions:**

1. Check TypeScript errors: `pnpm check-types`
2. Verify imports are correct
3. Check for missing dependencies
4. Run `pnpm clean && pnpm install`

## Checklist

Before considering a plugin complete:

- [ ] Plugin directory created in `plugins/`
- [ ] `package.json` with correct dependencies
- [ ] Main `index.ts` with plugin definition
- [ ] Configuration in `implementations/config/`
- [ ] At least one implementation (header, footer, or sidebar)
- [ ] Translation files for all text
- [ ] University assets (logos, favicons)
- [ ] Comprehensive README.md following template
- [ ] Implementation READMEs for each feature
- [ ] Standalone mode works (test at dedicated port)
- [ ] Integrated mode works (test in core)
- [ ] `/plugins/README.md` updated
- [ ] Plugin registered in `plugins/index.ts`
- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] Committed with descriptive message

## Related Documentation

- [Plugin System Overview](/plugins/README.md) - Plugin architecture
- [Plugin Template](/docs/templates/PLUGIN_README_TEMPLATE.md) - Documentation template
- [Implementation Template](/docs/templates/IMPLEMENTATION_README_TEMPLATE.md) - Implementation docs
- [Extension Points](/plugins/core/README.md) - Available extension points
- [AI Development Guide](/docs/AI_DEVELOPMENT_GUIDE.md) - AI navigation

## Examples

**Excellent Examples:**

- `plugins/example-university` - Reference implementation (in-repo)
- `.local-plugins/<name>` - Org-specific plugins (univie, tuwien, etc.); see [Community Plugin Development](/docs/COMMUNITY_PLUGIN_DEVELOPMENT.md)

## Best Practices

1. **Start minimal** - Begin with config and one component
2. **Document thoroughly** - Every implementation needs README
3. **Test both modes** - Standalone and integrated
4. **Follow naming** - Consistent extension point naming
5. **Use priority wisely** - Lower numbers override
6. **Provide fallbacks** - Default behavior if plugin disabled
7. **Think reusable** - Other universities might copy your pattern

## Getting Help

- **Extension points?** Read [Core Plugin README](/plugins/core/README.md)
- **Plugin system?** Read [Plugin System Docs](/plugins/README.md)
- **Components?** Read [UI Package](/packages/ui/README.md)
- **Examples?** Look at existing plugins

---

**Remember:** Good plugins are modular, well-documented, provide clear extension points, and respect the core system's architecture.
