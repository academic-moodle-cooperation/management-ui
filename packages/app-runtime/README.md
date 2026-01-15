# @workspace/app-runtime

**Version:** 0.0.0  
**Type:** Application Layer  
**Last Updated:** 2025-11-12

## Purpose & Scope

The `app-runtime` package provides the runtime infrastructure for standalone application execution in the Management UI system. It enables applications to run both independently (for development) and integrated within the core shell, providing all necessary context (plugins, routing, queries, i18n) regardless of execution mode.

**In Scope:**

- Standalone app bootstrapping
- Provider hierarchy setup (plugins, query, router, i18n)
- Context detection (standalone vs integrated)
- Adaptive component wrapping
- Runtime configuration injection

**Out of Scope:**

- Business logic (belongs in apps)
- UI components (belongs in `@workspace/ui`)
- Data fetching (belongs in `@workspace/query`)
- Routing definitions (belongs in apps)

## Architecture & Design Decisions

### Design Principles

- **Dual-Mode Execution** - Apps work standalone AND integrated
- **Provider Composition** - Layer providers for full context
- **Configuration Injection** - Pass config, don't hardcode
- **Detection Over Convention** - Detect mode, adapt behavior
- **Zero App Changes** - Mode switch requires no code changes

### Key Concepts

#### Concept 1: Standalone Bootstrapping

Applications can run independently with full system context:

```typescript
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

bootstrapStandaloneApp(App, "root", {
  baseUrl: "/episodes",
  appName: "management-ui-episodes",
});
```

This single call provides:

- Plugin system initialization
- Query client setup
- Router configuration
- I18n provider
- Authentication context
- Theme provider

#### Concept 2: Adaptive App Wrapper

Components adapt to execution context:

```typescript
import { AdaptiveAppWrapper } from '@workspace/app-runtime';

function App() {
  return (
    <AdaptiveAppWrapper>
      <MyAppContent />
    </AdaptiveAppWrapper>
  );
}
```

**Standalone Mode:** Provides full provider hierarchy  
**Integrated Mode:** Uses existing providers from shell

#### Concept 3: Context Detection

Runtime detects execution mode automatically:

- Standalone: App is root of React tree
- Integrated: App is child within core shell
- Detection based on provider availability

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│ App Entry Point (main.tsx)                     │
│ ├─ bootstrapStandaloneApp(App, config)         │
├─────────────────────────────────────────────────┤
│ AppRuntimeProvider                              │
│ ├─ PluginProvider (plugin system)              │
│ │  └─ QueryProvider (data fetching)            │
│ │     └─ RouterProvider (navigation)           │
│ │        └─ I18nProvider (translations)        │
│ │           └─ ThemeProvider (styling)         │
│ │              └─ App Component                 │
├─────────────────────────────────────────────────┤
│ AdaptiveAppWrapper (inside App)                │
│ ├─ Detects: Standalone vs Integrated           │
│ ├─ Standalone: Uses providers above             │
│ ├─ Integrated: Uses shell's providers           │
│ └─ Renders: App content with correct context   │
└─────────────────────────────────────────────────┘
```

### Technology Choices

- **React Context** - Provider composition pattern
- **Tanstack Router** - Application routing
- **Tanstack Query** - Data fetching client
- **i18next** - Internationalization

These are composed and injected, enabling future swapping.

## API Surface (Public Exports)

### Exports Structure

```typescript
// Main exports
export { bootstrapStandaloneApp } from "./index";
export { AppRuntimeProvider } from "./AppRuntimeProvider";
export { AdaptiveAppWrapper } from "./StandaloneAppWrapper";

// Types
export type { AppConfig, StandaloneConfig } from "./types";
```

### Core API

#### bootstrapStandaloneApp

**Purpose:** Initialize and render a standalone application with full context

**Signature:**

```typescript
function bootstrapStandaloneApp(
  App: React.ComponentType,
  rootElementId: string,
  config: StandaloneConfig,
): void;
```

**Parameters:**

- `App` (React.ComponentType): The root application component
- `rootElementId` (string): DOM element ID to mount to (usually "root")
- `config` (StandaloneConfig): Application configuration
  - `baseUrl` (string): Base URL path for the app (e.g., "/episodes")
  - `appName` (string): Application name (e.g., "management-ui-episodes")
  - Additional runtime options as needed

**Example:**

```typescript
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

bootstrapStandaloneApp(App, "root", {
  baseUrl: "/series",
  appName: "management-ui-series",
});
```

#### AppRuntimeProvider

**Purpose:** Provide runtime context (plugins, query, router, i18n)

**Signature:**

```typescript
function AppRuntimeProvider({ children, config }: AppRuntimeProviderProps): JSX.Element;
```

**Parameters:**

- `children` (React.ReactNode): Child components
- `config` (StandaloneConfig): Runtime configuration

**Example:**

```typescript
<AppRuntimeProvider config={{ baseUrl: "/episodes", appName: "episodes" }}>
  <App />
</AppRuntimeProvider>
```

#### AdaptiveAppWrapper

**Purpose:** Wrap app content with adaptive context detection

**Signature:**

```typescript
function AdaptiveAppWrapper({ children }: { children: React.ReactNode }): JSX.Element;
```

**Example:**

```typescript
function App() {
  return (
    <AdaptiveAppWrapper>
      <div className="container">
        <h1>My App</h1>
        {/* App content */}
      </div>
    </AdaptiveAppWrapper>
  );
}
```

### Types & Interfaces

```typescript
export interface StandaloneConfig {
  baseUrl: string; // Base URL path (e.g., "/episodes")
  appName: string; // Application name
  // Additional config options
}

export interface AppRuntimeProviderProps {
  children: React.ReactNode;
  config: StandaloneConfig;
}
```

## Dependencies & Coupling

### Dependency Graph

```
@workspace/app-runtime
├── External Dependencies
│   ├── react (peer) - UI framework
│   ├── react-dom (peer) - DOM rendering
│   └── @tanstack/react-router - Routing
└── Workspace Dependencies
    ├── @workspace/query - Data fetching
    ├── @workspace/ui - Component library
    ├── @workspace/plugin-system - Plugin infrastructure
    └── @workspace/router - Routing configuration
```

### Dependency Layer

**Layer:** Application (highest layer)

**Allowed to depend on:** All lower layers (Integration, Foundation, Core Infrastructure)

**Rules:**

- Can import from any workspace package
- Should inject dependencies rather than create them
- Should not be depended on by lower layers

### Coupling Analysis

- **Tight Coupling:** Intentional orchestration layer
- **Loose Coupling:** Dependencies are injected via props/config
- **Abstraction Points:** Configuration object abstracts implementation details

### Why These Dependencies?

- **@workspace/query:** Provides QueryProvider for data fetching context
- **@workspace/ui:** Provides theme and UI context
- **@workspace/plugin-system:** Provides PluginProvider for extension points
- **@workspace/router:** Provides RouterProvider for navigation
- **@tanstack/react-router:** Direct dependency for router creation

### Replacement Strategy

To replace this package:

1. Create new runtime provider with same exports
2. Maintain same `bootstrapStandaloneApp` signature
3. Maintain same `AdaptiveAppWrapper` behavior
4. Test all standalone apps still work
5. Swap package reference in apps

**Interface Stability:** High - Apps depend heavily on this. Breaking changes require migration across all apps.

## Usage Examples

### Basic Usage (Standalone App)

```typescript
// apps/management-ui-series/src/main.tsx
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

const config = {
  baseUrl: "/series",
  appName: "management-ui-series",
};

bootstrapStandaloneApp(App, "root", config);
```

### App Component with Adaptive Wrapper

```typescript
// apps/management-ui-series/src/App.tsx
import { AdaptiveAppWrapper } from '@workspace/app-runtime';
import { SeriesList } from './components/SeriesList';

function App() {
  return (
    <AdaptiveAppWrapper>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Video Series</h1>
        <SeriesList />
      </div>
    </AdaptiveAppWrapper>
  );
}

export default App;
```

### Integration with Data Fetching

```typescript
// Inside app component - query context available
import { useSeries } from '@workspace/query';

function SeriesList() {
  const { data, isLoading } = useSeries();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.map(series => (
        <SeriesCard key={series.id} series={series} />
      ))}
    </div>
  );
}
```

### Common Patterns

#### Pattern 1: Standalone Development

```typescript
// Development entry point
import { bootstrapStandaloneApp } from "@workspace/app-runtime";
import App from "./App";

// Run independently at dedicated port
bootstrapStandaloneApp(App, "root", {
  baseUrl: "/my-app",
  appName: "management-ui-my-app",
});
```

**When to use:** Focused development on single app

#### Pattern 2: Integrated Deployment

```typescript
// Core shell loads app
import { lazy } from 'react';

const SeriesApp = lazy(() => import('../apps/management-ui-series/src/App'));

// App uses AdaptiveAppWrapper internally
// No bootstrapStandaloneApp needed
<Route path="/series" component={SeriesApp} />
```

**When to use:** Production deployment within shell

## Testing Strategy

### Unit Tests

Test provider composition and configuration:

```typescript
import { render } from '@testing-library/react';
import { AppRuntimeProvider } from '@workspace/app-runtime';

describe('AppRuntimeProvider', () => {
  it('provides plugin context', () => {
    const { getByText } = render(
      <AppRuntimeProvider config={{ baseUrl: "/test", appName: "test" }}>
        <TestComponent />
      </AppRuntimeProvider>
    );
    expect(getByText('Plugin Context Available')).toBeInTheDocument();
  });
});
```

### Integration Tests

Test full bootstrap process:

```typescript
describe("bootstrapStandaloneApp", () => {
  it("mounts app successfully", () => {
    const div = document.createElement("div");
    div.id = "root";
    document.body.appendChild(div);

    bootstrapStandaloneApp(TestApp, "root", {
      baseUrl: "/test",
      appName: "test-app",
    });

    expect(div.querySelector(".app")).toBeInTheDocument();
  });
});
```

## Extension Points

This package doesn't provide extension points but enables them by:

1. **Loading PluginProvider** - Makes extension points available
2. **Providing Context** - Apps can use ComponentResolver
3. **Configuration** - Plugins can register based on appName

## Migration Guide

### Version History

#### v0.0.0 (Current)

Initial implementation with:

- `bootstrapStandaloneApp` function
- `AppRuntimeProvider` component
- `AdaptiveAppWrapper` component

## File Structure

```
packages/app-runtime/
├── src/
│   ├── index.ts                    # Main exports and bootstrap function
│   ├── AppRuntimeProvider.tsx      # Provider composition
│   ├── StandaloneAppWrapper.tsx    # Adaptive wrapper component
│   └── types.ts                    # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md                       # This file
```

## Development

### Setup

```bash
# From monorepo root
pnpm install

# Check types
cd packages/app-runtime
pnpm check-types
```

### Commands

```bash
pnpm lint         # Lint the code
pnpm check-types  # Type check without building
pnpm clean        # Clean artifacts
```

### Adding New Features

1. Consider if it belongs in app-runtime (orchestration only)
2. Add to appropriate file (`index.ts`, `AppRuntimeProvider.tsx`, etc.)
3. Export from `src/index.ts`
4. Update this README with:
   - API Surface documentation
   - Usage example
   - Any new dependencies
5. Test with at least one standalone app

## Performance Considerations

- **Bundle Size:** ~5KB (orchestration code only)
- **Runtime Performance:** Minimal - one-time setup during mount
- **Memory Usage:** Negligible - thin provider wrappers

## Known Limitations

- **Single Instance:** Designed for one app per page (not micro-frontends)
- **React Only:** Tightly coupled to React (by design)
- **Router Dependency:** Currently tied to TanStack Router

## Related Packages

- [`@workspace/providers`](/packages/providers/README.md) - Used by core shell for integrated mode
- [`@workspace/query`](/packages/query/README.md) - Provides data fetching context
- [`@workspace/router`](/packages/router/README.md) - Provides routing configuration
- [`@workspace/plugin-system`](/packages/plugin-system/docs/README.md) - Provides plugin infrastructure

## Further Reading

- [Application Architecture](/apps/README.md) - How apps use app-runtime
- [Adding Apps Guide](/docs/workflows/ADDING_APPS.md) - Creating new apps
- [ADR-003: Standalone Apps](/docs/architecture/ADR-003-standalone-apps.md) - Architecture decision

## Contributing

When contributing to this package:

1. Understand it's an orchestration layer
2. Keep it thin - delegate to other packages
3. Maintain both standalone and integrated modes
4. Test with multiple apps
5. Update this documentation
6. Consider impact on all apps

## License

[License information - inherits from project root]

---

**Remember:** This package enables dual-mode execution. Changes here affect all applications. Test thoroughly in both standalone and integrated modes.
