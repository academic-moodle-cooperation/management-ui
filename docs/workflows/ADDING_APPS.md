# Adding New Applications to Management UI

**Last Updated:** 2025-11-12

## Overview

This guide walks through creating a new application in the Management UI monorepo. Applications in this system support **dual-mode execution** - they can run both standalone (for development) and integrated (within the core shell).

## Prerequisites

- Node.js >= 20
- pnpm >= 10.4.1
- Understanding of [Application Architecture](/apps/README.md)
- Familiarity with workspace packages

## Before You Start

### 1. Determine if You Need a New App

Ask yourself:

- **Is this distinct functionality?** Apps are for separate domains (series, episodes, upload)
- **Could it be a plugin?** University-specific features should be plugins
- **Could it extend an existing app?** Check if functionality fits elsewhere

### 2. Plan the Application

Consider:

- **Primary purpose** - What domain does this manage?
- **User workflow** - What tasks will users complete?
- **Data model** - What entities does it manage?
- **Integration points** - How does it connect to other apps?
- **Plugin customization** - What should universities be able to customize?

### 3. Choose a Port Number

Applications use dedicated ports for standalone mode:

- 3000: management-ui-core (shell)
- 3001: management-ui-series
- 3002: management-ui-episodes
- 3003: management-ui-upload
- 3004: management-ui-test
- **Your app: 3005+** (choose next available)

## Step-by-Step Guide

### Step 1: Create Application Directory

```bash
# From monorepo root
mkdir -p apps/management-ui-[app-name]
cd apps/management-ui-[app-name]
```

**Naming Convention:**

- Prefix with `management-ui-`
- Use kebab-case: `management-ui-[app-name]`
- Examples: `management-ui-series`, `management-ui-episodes`

### Step 2: Initialize package.json

```bash
pnpm init
```

Create `package.json`:

```json
{
  "name": "management-ui-[app-name]",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "clean": "rm -rf .turbo && rm -rf dist && rm -rf target && rm -rf node_modules",
    "check-types": "tsc --noEmit -p tsconfig.json"
  },
  "dependencies": {
    "@workspace/app-runtime": "workspace:*",
    "@workspace/i18n": "workspace:*",
    "@workspace/plugin-system": "workspace:*",
    "@workspace/query": "workspace:*",
    "@workspace/router": "workspace:*",
    "@workspace/ui": "workspace:*",
    "@workspace/vite-config": "workspace:*",
    "@tanstack/react-router": "^1.115.8",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.7",
    "@tanstack/router-devtools": "^1.125.6",
    "@types/react": "^18.0.0 || ^19.0.0",
    "@types/react-dom": "^18.0.0 || ^19.0.0",
    "@vitejs/plugin-react-swc": "^3.9.0",
    "@workspace/eslint-config": "workspace:*",
    "@workspace/typescript-config": "workspace:*",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.20.0",
    "postcss": "^8.5.3",
    "tailwindcss": "^4.1.7",
    "typescript": "~5.5.4",
    "vite": "^6.1.4"
  }
}
```

### Step 3: Create TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "extends": "@workspace/typescript-config/react-application.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Step 4: Create Vite Configuration

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { createAppConfig } from '@workspace/vite-config';

// https://vitejs.dev/config/
export default defineConfig(
  createAppConfig({
    appName: 'management-ui-[app-name]',
    port: 30XX,  // Your chosen port
    baseUrl: '/[route-path]',
  })
);
```

### Step 5: Create Application Structure

```bash
mkdir -p src/components
mkdir -p src/hooks
mkdir -p public
```

Create directory structure:

```
apps/management-ui-[app-name]/
├── src/
│   ├── components/        # React components
│   │   └── [Component].tsx
│   ├── hooks/             # Custom hooks
│   │   └── use[Hook].ts
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── vite-env.d.ts      # Vite types
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── eslint.config.js
├── postcss.config.mjs
└── README.md               # Documentation
```

### Step 6: Create Entry Point (main.tsx)

Create `src/main.tsx` - this enables standalone mode:

```typescript
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

const config = {
  baseUrl: "/[route-path]", // e.g., "/series", "/episodes"
  appName: "management-ui-[app-name]",
};

bootstrapStandaloneApp(App, "root", config);
```

**What this provides:**

- Plugin system initialization
- Query client setup (TanStack Query)
- Router configuration
- I18n setup (internationalization)
- Authentication context
- Theme provider

### Step 7: Create Main App Component

Create `src/App.tsx`:

```typescript
import { AdaptiveAppWrapper } from '@workspace/app-runtime';
import { Button } from '@workspace/ui';

function App() {
  return (
    <AdaptiveAppWrapper>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">
          [App Name]
        </h1>

        {/* Your app content here */}
        <Button>Example Button</Button>
      </div>
    </AdaptiveAppWrapper>
  );
}

export default App;
```

**What AdaptiveAppWrapper does:**

- Detects standalone vs integrated mode
- Provides appropriate context
- Handles routing differences
- Manages base URL paths

### Step 8: Create HTML Template

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Management UI - [App Name]</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 9: Create PostCSS Configuration

Create `postcss.config.mjs`:

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### Step 10: Create ESLint Configuration

Create `eslint.config.js`:

```javascript
import reactInternal from "@workspace/eslint-config/react-internal";

export default [...reactInternal];
```

### Step 11: Install Dependencies

```bash
# From monorepo root
pnpm install
```

### Step 12: Test Standalone Mode

```bash
# From app directory
cd apps/management-ui-[app-name]
pnpm dev
```

**Access:** `http://127.0.0.1:30XX`

**Verify:**

- App loads successfully
- No console errors
- Basic rendering works
- Tailwind CSS styling works

### Step 13: Create Components

Now implement your application features:

```typescript
// src/components/ExampleList.tsx
import { Button } from '@workspace/ui';
import { useTranslation } from '@workspace/i18n';

export function ExampleList() {
  const { t } = useTranslation('[app-name]');

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{t('list.title')}</h2>
      {/* List implementation */}
    </div>
  );
}
```

### Step 14: Add Data Fetching

Use workspace query hooks or create custom hooks:

```typescript
// src/hooks/useMyData.ts
import { useQuery } from '@tanstack/react-query';

export function useMyData() {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: async () => {
      const response = await fetch('/api/my-data');
      return response.json();
    },
  });
}

// Usage in component
import { useMyData } from '../hooks/useMyData';

function MyComponent() {
  const { data, isLoading, error } = useMyData();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return <div>{/* Render data */}</div>;
}
```

### Step 15: Add Plugin Extension Points

Allow universities to customize your app:

```typescript
// In your component
import { ComponentResolver } from '@workspace/plugin-system';
import { DefaultEmptyState } from '@workspace/ui';

function ListView() {
  const items = []; // Your data

  return (
    <div>
      {items.length === 0 ? (
        <ComponentResolver
          componentType="[app-name]:empty-state"
          defaultComponent={DefaultEmptyState}
          componentProps={{
            message: 'No items found',
            action: 'Create New'
          }}
        />
      ) : (
        <ItemList items={items} />
      )}
    </div>
  );
}
```

**Common Extension Points:**

- `[app-name]:empty-state` - Custom empty state
- `[app-name]:header` - Custom app header
- `[app-name]:action-buttons` - Custom actions
- `[app-name]:metadata-fields` - Custom metadata
- `[app-name]:list-item` - Custom list rendering

### Step 16: Add Internationalization

Create translation files in plugin packages or in i18n package:

```json
// In plugins/*/implementations/[feature]/locales/en.json
{
  "[app-name]": {
    "title": "[App Name]",
    "list": {
      "title": "Items",
      "empty": "No items found"
    },
    "actions": {
      "create": "Create New",
      "edit": "Edit",
      "delete": "Delete"
    }
  }
}
```

Use in components:

```typescript
import { useTranslation } from '@workspace/i18n';

function Component() {
  const { t } = useTranslation('[app-name]');

  return <h1>{t('title')}</h1>;
}
```

### Step 17: Register in Core Shell

To make the app accessible in integrated mode, register it in the core shell:

Option 1: Add route in core app

```typescript
// apps/management-ui-core/src/shared/commonRoutes.tsx
{
  path: '/[route-path]',
  component: lazy(() => import('../../[app-name]/src/App')),
}
```

Option 2: Register via plugin system

```typescript
// In a plugin
manager.registerObject("apps:definitions", "[app-name]", {
  id: "[app-name]",
  name: "[App Display Name]",
  routePath: "/[route-path]",
  component: MyAppComponent,
  navigation: {
    title: "[App Name]",
    icon: "icon-name",
    order: 100,
    permissions: ["app.access"],
  },
});
```

### Step 18: Test Integrated Mode

```bash
# From monorepo root
pnpm dev
```

**Access:** `http://127.0.0.1:3000/[route-path]`

**Verify:**

- App loads within core shell
- Navigation works
- Plugin customizations appear
- Shared state works
- Authentication works

### Step 19: Create Documentation

**CRITICAL:** Create comprehensive README.md

```bash
# Copy template
cp docs/templates/APP_README_TEMPLATE.md apps/management-ui-[app-name]/README.md
```

Follow the template sections:

1. **Purpose** - What this app does
2. **Key Features** - Main capabilities
3. **Architecture** - How it's structured
4. **Dependencies & Coupling** - What it uses
5. **Development** - How to work with it
6. **User Interface** - Main views and components
7. **Data Management** - Data models and fetching
8. **Plugin Integration** - Extension points
9. **Testing** - Test strategy
10. **Deployment** - Build and deploy

**See examples:**

- [episodes README](/apps/management-ui-episodes/README.md) - Comprehensive example

### Step 20: Update Applications Documentation

Update [`/apps/README.md`](/apps/README.md):

1. **Add to application catalog:**

```markdown
| Application                  | Purpose   | Port | Route      | Documentation                                |
| ---------------------------- | --------- | ---- | ---------- | -------------------------------------------- |
| **management-ui-[app-name]** | [Purpose] | 30XX | `/[route]` | [README](management-ui-[app-name]/README.md) |
```

2. **Update port list** if using new port range

### Step 21: Add Testing

Create tests for your components:

```bash
mkdir -p src/__tests__
```

```typescript
// src/__tests__/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders app title', () => {
    render(<App />);
    expect(screen.getByText('[App Name]')).toBeInTheDocument();
  });
});
```

Add test dependencies and scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^1.0.0"
  }
}
```

### Step 22: Validate Application

Run all validation checks:

```bash
# Type checking
pnpm check-types

# Linting
pnpm lint

# Build
pnpm build

# From monorepo root - verify integration
cd ../..
pnpm check-types
pnpm lint
pnpm build
```

### Step 23: Commit Changes

```bash
# Stage all changes
git add apps/management-ui-[app-name]
git add apps/README.md

# Commit
git commit -m "feat(apps): add [app-name] application

- Implements [primary feature]
- Supports standalone and integrated modes
- Provides extension points for plugin customization
- Documented with comprehensive README
- Port: 30XX
- Route: /[route-path]
"
```

## Common Patterns

### Pattern: Data Table App

```typescript
import { DataTable } from '@workspace/ui';
import { useMyItems } from './hooks/useMyItems';

function App() {
  const { data, isLoading } = useMyItems();

  const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'status', header: 'Status' },
  ];

  return (
    <AdaptiveAppWrapper>
      <DataTable
        data={data}
        columns={columns}
        searchable
        sortable
        pagination
      />
    </AdaptiveAppWrapper>
  );
}
```

### Pattern: Form-Based App

```typescript
import { Button, Input } from '@workspace/ui';
import { useState } from 'react';

function App() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic
  };

  return (
    <AdaptiveAppWrapper>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Name"
        />
        <Input
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Email"
          type="email"
        />
        <Button type="submit">Submit</Button>
      </form>
    </AdaptiveAppWrapper>
  );
}
```

### Pattern: Master-Detail App

```typescript
import { useState } from 'react';

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: items } = useMyItems();
  const { data: detail } = useMyItemDetail(selectedId);

  return (
    <AdaptiveAppWrapper>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <ItemList items={items} onSelect={setSelectedId} />
        </div>
        <div className="col-span-2">
          {selectedId && <ItemDetail item={detail} />}
        </div>
      </div>
    </AdaptiveAppWrapper>
  );
}
```

## Troubleshooting

### App Doesn't Load in Standalone Mode

**Solutions:**

1. Check port number - is it in use?
2. Verify `bootstrapStandaloneApp` call
3. Check Vite configuration
4. Check for console errors
5. Verify all dependencies are installed

### App Doesn't Load in Integrated Mode

**Solutions:**

1. Verify route registration in core
2. Check base URL configuration
3. Verify import paths
4. Check for console errors

### Styling Doesn't Work

**Solutions:**

1. Verify PostCSS configuration
2. Check Tailwind CSS is imported
3. Verify `@workspace/ui` is installed
4. Check browser dev tools for CSS issues

### Plugin Customizations Don't Appear

**Solutions:**

1. Verify ComponentResolver usage
2. Check extension point naming
3. Verify plugin is loaded
4. Check plugin priority

## Checklist

Before considering an app complete:

- [ ] App directory created in `apps/`
- [ ] `package.json` with correct dependencies
- [ ] `vite.config.ts` with port and base URL
- [ ] `src/main.tsx` with `bootstrapStandaloneApp`
- [ ] `src/App.tsx` with `AdaptiveAppWrapper`
- [ ] Standalone mode works (test at dedicated port)
- [ ] Integrated mode works (test in core shell)
- [ ] Plugin extension points provided
- [ ] Internationalization support
- [ ] Comprehensive README.md following template
- [ ] `/apps/README.md` updated
- [ ] Tests for key functionality
- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] Committed with descriptive message

## Related Documentation

- [Application Architecture](/apps/README.md) - Overview of app ecosystem
- [App Template](/docs/templates/APP_README_TEMPLATE.md) - Documentation template
- [Plugin System](/plugins/README.md) - How to provide extension points
- [AI Development Guide](/docs/AI_DEVELOPMENT_GUIDE.md) - AI navigation

## Examples

**Excellent Examples:**

- `management-ui-episodes` - Comprehensive, well-documented
- `management-ui-series` - Clean architecture
- `management-ui-upload` - Complex functionality

## Best Practices

1. **Start with standalone mode** - Easier to develop and test
2. **Document as you build** - Update README continuously
3. **Provide extension points** - Think about plugin customization
4. **Use workspace packages** - Don't reinvent the wheel
5. **Follow patterns** - Look at existing apps
6. **Test both modes** - Standalone AND integrated
7. **Think mobile-first** - Responsive design
8. **Accessibility matters** - WCAG 2.1 AA compliance

## Getting Help

- **Architecture questions?** Read [Applications README](/apps/README.md)
- **Package questions?** Read [Packages README](/packages/README.md)
- **Plugin questions?** Read [Plugins README](/plugins/README.md)
- **Stuck?** Look at existing app implementations

---

**Remember:** Good applications are focused, well-documented, support dual-mode execution, and provide extension points for customization.
