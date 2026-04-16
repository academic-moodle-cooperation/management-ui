# Applications Architecture

**Last Updated:** 2025-11-12

## Overview

This directory contains the **domain-specific applications** that compose the Management UI system. Each application handles a distinct area of video content management and can run both **standalone** (for development) and **integrated** (within the core shell).

## Application Ecosystem

### Core Concept: Dual-Mode Execution

Every application in this system is designed for **two modes of operation**:

1. **Standalone Mode** - Independent development server for focused work
2. **Integrated Mode** - Loaded within the core shell for full system functionality

This architecture enables:

- **Fast development** - Work on one app without loading others
- **Independent testing** - Test app behavior in isolation
- **Flexible deployment** - Apps can be deployed separately or together
- **Team productivity** - Multiple teams work on different apps simultaneously

### Application Catalog

| Application                | Purpose                                          | Port | Route       | Documentation                              |
| -------------------------- | ------------------------------------------------ | ---- | ----------- | ------------------------------------------ |
| **management-ui-core**     | Application shell, orchestration, plugin loading | 3000 | `/`         | [README](management-ui-core/README.md)     |
| **management-ui-series**   | Video series management                          | 3001 | `/series`   | [README](management-ui-series/README.md)   |
| **management-ui-episodes** | Individual episode management                    | 3002 | `/episodes` | [README](management-ui-episodes/README.md) |
| **management-ui-upload**   | Content upload and processing                    | 3003 | `/upload`   | [README](management-ui-upload/README.md)   |
| **management-ui-test**     | Testing and QA tools                             | 3004 | `/test`     | [README](management-ui-test/README.md)     |

## Architecture Patterns

### Application Shell Pattern

```
┌───────────────────────────────────────────────────┐
│ Management UI Core (Shell)                        │
│ ┌───────────────────────────────────────────────┐ │
│ │ Header (Plugin-Customizable)                  │ │
│ └───────────────────────────────────────────────┘ │
│ ┌──────────┬────────────────────────────────────┐ │
│ │          │                                    │ │
│ │ Sidebar  │  <Series App>                      │ │
│ │          │  or <Episodes App>                 │ │
│ │ (Plugin- │  or <Upload App>                   │ │
│ │  Custom) │  or <Test App>                     │ │
│ │          │                                    │ │
│ │          │  (Loaded via routing)              │ │
│ └──────────┴────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────┐ │
│ │ Footer (Plugin-Customizable)                  │ │
│ └───────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

### Standalone App Pattern

```
┌───────────────────────────────────────────────────┐
│ Standalone App (e.g., Episodes)                   │
│                                                    │
│ bootstrapStandaloneApp()                          │
│ ├── PluginProvider                                │
│ ├── QueryProvider                                 │
│ ├── RouterProvider                                │
│ ├── I18nProvider                                  │
│ └── App Component                                 │
│     ├── AdaptiveAppWrapper                        │
│     └── Application Content                       │
└───────────────────────────────────────────────────┘
```

## Application Layers

### Layer 1: Core Shell (management-ui-core)

**Purpose:** Orchestration, plugin loading, shared layout

**Responsibilities:**

- Load and initialize plugin system
- Provide authentication context
- Render shared layout (header, sidebar, footer)
- Route to domain-specific apps
- Manage global state

**Dependencies:** All workspace packages

**Key Files:**

- `src/main.tsx` - Entry point
- `src/loadPlugins.ts` - Plugin discovery and loading
- `src/app-router.tsx` - Main routing configuration
- `src/shared/commonRoutes.tsx` - Shared route definitions

### Layer 2: Domain Applications (series, episodes, upload, test)

**Purpose:** Specific business functionality

**Responsibilities:**

- Implement domain-specific features
- Manage domain-specific state
- Provide domain-specific UI
- Integrate with backend APIs
- Support plugin customization

**Dependencies:** Workspace packages (not other apps)

**Key Files:**

- `src/main.tsx` - Standalone bootstrap
- `src/App.tsx` - Main application component
- `src/components/` - Domain-specific components
- `src/hooks/` - Domain-specific hooks

## Dual-Mode Implementation

### Standalone Bootstrap

Every app (except core) uses the standalone runtime:

```typescript
// apps/management-ui-[app-name]/src/main.tsx
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

const config = {
  baseUrl: "/[app-route]",
  appName: "management-ui-[app-name]",
};

bootstrapStandaloneApp(App, "root", config);
```

**What `bootstrapStandaloneApp` provides:**

- Plugin system initialization
- Query client setup
- Router configuration
- I18n setup
- Authentication context (if available)

### Adaptive App Wrapper

Apps use `AdaptiveAppWrapper` to adapt to execution context:

```typescript
// apps/management-ui-[app-name]/src/App.tsx
import { AdaptiveAppWrapper } from '@workspace/app-runtime';

const App = () => (
  <AdaptiveAppWrapper>
    <AppContent />
  </AdaptiveAppWrapper>
);
```

**What `AdaptiveAppWrapper` does:**

- Detects standalone vs integrated mode
- Provides appropriate context
- Handles routing differences
- Manages base URL paths

## Development Workflow

### Standalone Development (Recommended)

```bash
# Navigate to specific app
cd apps/management-ui-[app-name]

# Start development server
pnpm dev

# Access at dedicated port
# Series: http://127.0.0.1:3001
# Episodes: http://127.0.0.1:3002
# Upload: http://127.0.0.1:3003
```

**Benefits:**

- ⚡ Fast hot reload (only one app)
- 🎯 Focused development
- 🧪 Easy testing in isolation
- 🔍 Clear error messages
- 💻 Lower resource usage

### Integrated Development

```bash
# From monorepo root
pnpm dev

# Access all apps through core
# http://127.0.0.1:3000/series
# http://127.0.0.1:3000/episodes
# http://127.0.0.1:3000/upload
```

**Benefits:**

- 🔗 Test full integration
- 🎨 See plugin effects
- 🧭 Test navigation between apps
- 👤 Test authentication flow
- 🌐 Test shared state

### When to Use Each Mode

**Use Standalone When:**

- Developing a specific feature
- Debugging app-specific issues
- Writing unit/integration tests
- Need fast feedback loops
- Working on UI components

**Use Integrated When:**

- Testing app interactions
- Verifying plugin customizations
- Testing navigation flows
- Testing authentication
- Final QA before deployment

## Common Patterns

### Pattern 1: Data Fetching

```typescript
// Use workspace query hooks
import { useSeries } from '@workspace/query';

function SeriesComponent() {
  const { data, isLoading, error } = useSeries();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <SeriesList data={data} />;
}
```

### Pattern 2: Navigation

```typescript
// Use workspace router (never import @tanstack/react-router directly)
import { useNavigate } from '@workspace/router';

function NavigateButton() {
  const navigate = useNavigate();

  return (
    <Button onClick={() => navigate({ to: '/episodes/$id', params: { id: '123' } })}>
      Go to Episode
    </Button>
  );
}
```

### Pattern 3: Plugin Extension Points

```typescript
// Use plugin system for customization
import { ComponentResolver } from '@workspace/plugin-system';
import { DefaultEmptyState } from '@workspace/ui';

function ListView() {
  return (
    <div>
      {items.length === 0 ? (
        <ComponentResolver
          componentType="[app-name]:empty-state"
          defaultComponent={DefaultEmptyState}
          componentProps={{ message: 'No items found' }}
        />
      ) : (
        <ItemList items={items} />
      )}
    </div>
  );
}
```

### Pattern 4: Internationalization

```typescript
// Use i18n for translations
import { useTranslation } from '@workspace/i18n';

function TranslatedComponent() {
  const { t } = useTranslation('[app-name]');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## Application Integration

### Data Flow Between Apps

```
┌────────────────┐
│  Series App    │
│  (List view)   │
└───────┬────────┘
        │ Navigate
        ↓
┌────────────────┐
│  Episodes App  │
│  (Filtered by  │
│   series ID)   │
└───────┬────────┘
        │ Navigate
        ↓
┌────────────────┐
│  Upload App    │
│  (Upload to    │
│   episode)     │
└────────────────┘
```

**Communication Methods:**

1. **URL Parameters** - Pass IDs via route params
2. **Query Strings** - Pass filters/state via query
3. **Shared Store** - Global state via `@workspace/store`
4. **Events** - (If needed) Custom event system

### Shared State Management

```typescript
// Using workspace store for shared state
import { useStore } from '@workspace/store';

function Component() {
  const [selectedSeries, setSelectedSeries] = useStore('selectedSeries');

  return <div>{selectedSeries?.name}</div>;
}
```

## Plugin Integration

### Extension Points in Apps

Apps should provide extension points for university customization:

```typescript
// Define what can be customized
const extensionPoints = {
  "[app-name]:empty-state": "Custom empty state component",
  "[app-name]:action-buttons": "Custom action buttons",
  "[app-name]:metadata-fields": "Custom metadata fields",
  "[app-name]:header": "Custom app header",
};
```

### Using Extension Points

```typescript
// In app component
import { ComponentResolver } from '@workspace/plugin-system';

function AppContent() {
  return (
    <div>
      <ComponentResolver
        componentType="[app-name]:header"
        defaultComponent={DefaultHeader}
      />

      <MainContent />

      <ComponentResolver
        componentType="[app-name]:action-buttons"
        defaultComponent={DefaultActions}
      />
    </div>
  );
}
```

## Application Dependencies

### Required Workspace Packages

All applications typically depend on:

- `@workspace/app-runtime` - Standalone execution
- `@workspace/ui` - Component library
- `@workspace/query` - Data fetching
- `@workspace/router` - Routing
- `@workspace/plugin-system` - Plugin support
- `@workspace/i18n` - Internationalization

### Optional Workspace Packages

- `@workspace/store` - If app needs global state
- `@workspace/ui-config` - If app needs configuration

### Dependency Management

```json
// apps/[app-name]/package.json
{
  "dependencies": {
    "@workspace/app-runtime": "workspace:*",
    "@workspace/ui": "workspace:*",
    "@workspace/query": "workspace:*",
    // ... other workspace packages

    "react": "^19.1.0",
    "react-dom": "^19.1.0"
    // ... external dependencies
  }
}
```

## Testing Strategy

### Unit Testing

Test individual components and functions:

```bash
cd apps/[app-name]
pnpm test
```

### Integration Testing

Test app behavior with mocked backends:

```bash
pnpm test:integration
```

### E2E Testing

Test full user flows:

```bash
pnpm test:e2e
```

### Testing in Standalone Mode

```typescript
// Test standalone app
import { render } from "@testing-library/react";
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

test("app renders in standalone mode", () => {
  // Test implementation
});
```

## Build & Deployment

### Development Build

```bash
# Single app
cd apps/[app-name]
pnpm dev

# All apps
pnpm dev  # from root
```

### Production Build

```bash
# Single app
cd apps/[app-name]
pnpm build

# All apps
pnpm build  # from root
```

### Build Output

```
apps/[app-name]/dist/
├── assets/
│   ├── [hash].js
│   ├── [hash].css
│   └── ...
└── index.html
```

### Deployment Strategies

**Monolith Deployment:**

- Build all apps
- Deploy core shell
- Apps loaded via routing

**Micro-Frontend Deployment:**

- Build apps independently
- Deploy to separate URLs
- Core shell loads remote apps

## Creating a New Application

See detailed guide: [/docs/workflows/ADDING_APPS.md](/docs/workflows/ADDING_APPS.md)

### Quick Start

1. **Create app directory**

   ```bash
   mkdir apps/management-ui-[app-name]
   cd apps/management-ui-[app-name]
   ```

2. **Initialize package**

   ```bash
   pnpm init
   ```

3. **Add dependencies**

   ```json
   {
     "dependencies": {
       "@workspace/app-runtime": "workspace:*",
       "@workspace/ui": "workspace:*",
       "react": "^19.1.0"
     }
   }
   ```

4. **Create entry point**

   ```typescript
   // src/main.tsx
   import { bootstrapStandaloneApp } from "@workspace/app-runtime";
   import App from "./App";

   bootstrapStandaloneApp(App, "root", {
     baseUrl: "/[app-route]",
     appName: "management-ui-[app-name]",
   });
   ```

5. **Create app component**

   ```typescript
   // src/App.tsx
   import { AdaptiveAppWrapper } from '@workspace/app-runtime';

   export default function App() {
     return (
       <AdaptiveAppWrapper>
         <div>My App Content</div>
       </AdaptiveAppWrapper>
     );
   }
   ```

6. **Configure Vite**

   ```typescript
   // vite.config.ts
   import { defineConfig } from 'vite';
   import { createAppConfig } from '@workspace/vite-config';

   export default defineConfig(createAppConfig({
     appName: 'management-ui-[app-name]',
     port: 30XX,
   }));
   ```

7. **Document the app**
   - Follow [APP_README_TEMPLATE.md](/docs/templates/APP_README_TEMPLATE.md)

8. **Register in core** (for integrated mode)
   ```typescript
   // In plugin or core routes
   {
     path: '/[app-route]',
     component: lazy(() => import('@/apps/[app-name]')),
   }
   ```

## Quality Standards

### Application Checklist

Before considering an app production-ready:

- [ ] **Documentation** - Comprehensive README following template
- [ ] **Standalone Mode** - Works independently
- [ ] **Integrated Mode** - Works in core shell
- [ ] **Plugin Support** - Provides extension points
- [ ] **Internationalization** - All text translatable
- [ ] **Accessibility** - WCAG 2.1 AA compliance
- [ ] **Testing** - Unit, integration, and E2E tests
- [ ] **Error Handling** - Graceful error states
- [ ] **Loading States** - Clear loading indicators
- [ ] **TypeScript** - Full type coverage
- [ ] **Performance** - Optimized bundle size
- [ ] **Security** - Proper permission checks

## Troubleshooting

### Issue: App Not Loading in Integrated Mode

**Solution:**

1. Check route registration in core
2. Verify base URL configuration
3. Check for console errors
4. Ensure all dependencies are built

### Issue: Standalone Mode Not Working

**Solution:**

1. Verify `bootstrapStandaloneApp` usage
2. Check Vite configuration
3. Ensure correct port number
4. Check for missing providers

### Issue: Plugin Customizations Not Appearing

**Solution:**

1. Verify plugin is loaded
2. Check extension point naming
3. Verify ComponentResolver usage
4. Check plugin priority

## Related Documentation

- [AI Development Guide](/docs/AI_DEVELOPMENT_GUIDE.md) - AI navigation
- [Package Documentation](/packages/README.md) - Workspace packages
- [Plugin Documentation](/plugins/README.md) - Plugin system
- [Adding Apps Guide](/docs/workflows/ADDING_APPS.md) - Detailed app creation
- [Architecture Decisions](/docs/architecture/) - ADRs for app patterns

## Application Statistics

- **Total Applications:** 5
- **Core Shell:** 1 (management-ui-core)
- **Domain Apps:** 4 (series, episodes, upload, test)
- **Ports Used:** 3000-3004

---

**Remember:** Applications should be independent, well-documented, and support both standalone and integrated execution modes.
