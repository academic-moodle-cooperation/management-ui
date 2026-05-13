# @oc-mui/providers

**Version:** 0.0.0  
**Type:** Application Layer / Orchestration  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@oc-mui/providers` package is the orchestration layer that composes all foundational React context providers into a single, unified `AppProviders` component. It ensures that the application's infrastructure (runtime, plugins, auth, and routing) is initialized in the correct order.

**In Scope:**

- Composition of global context providers.
- Defining the official "Provider Stack" order.
- Initializing the `AppRuntimeConfig`.
- Global error boundary wrapping.

**Out of Scope:**

- Implementing the logic of individual providers (this belongs in their respective packages like `@oc-mui/router` or `@oc-mui/plugin-system`).
- Providing the `QueryProvider` (typically provided at the root before this package).

## Architecture & Design Decisions

### Design Principles

- **Single Entry Point:** Apps should only need to import `AppProviders` to get the full infrastructure stack.
- **Strict Ordering:** The order of providers is intentional and critical for dependency resolution (e.g., Auth needs the Runtime).
- **Fail-Safe:** The entire stack is wrapped in an `ErrorBoundary` to prevent white-screen-of-death scenarios.

### Key Concepts

#### The Provider Stack
The stack is organized from "most fundamental" to "most specific":
1.  **`ErrorBoundary`**: Catches unhandled errors in any provider or child component.
2.  **`AppRuntimeProvider`**: Sets the core environment flags (standalone mode, base URL).
3.  **`RendererProvider`**: Initializes the plugin system's rendering context.
4.  **`AuthProvider`**: Provides the authentication state.
5.  **`AuthInitializer`**: Blocks rendering until the initial user session is resolved.
6.  **`RouterProvider`**: The final layer that enables navigation based on the resolved state.

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ @oc-mui/providers Stack              │
├─────────────────────────────────────────┤
│ [ ErrorBoundary ]                       │
│    ↓                                    │
│ [ AppRuntimeProvider ]                  │
│    ↓                                    │
│ [ RendererProvider (Plugin System) ]    │
│    ↓                                    │
│ [ AuthProvider ]                        │
│    ↓                                    │
│ [ AuthInitializer ]                     │
│    ↓                                    │
│ [ RouterProvider ]                      │
└─────────────────────────────────────────┘
```

## API Surface (Public Exports)

### Core API

#### `AppProviders`
**Purpose:** The main component that wraps the application.
**Props:**
- `router` (AnyRouter): The TanStack Router instance.

## Dependencies & Coupling

### Dependency Graph

```
@oc-mui/providers
└── Workspace Dependencies
    ├── @oc-mui/app-runtime - Orchestration
    ├── @oc-mui/plugin-system - Extensibility
    ├── @oc-mui/router - Navigation & Auth
    └── @oc-mui/ui - Error components
```

### Dependency Layer

**Layer:** Application Layer

**Allowed to depend on:** Any other layer. This is an orchestration package.

## Usage Examples

### Integration in an App

```typescript
import { createRouter } from "@oc-mui/router";
import { AppProviders } from "@oc-mui/providers";
import { QueryProvider } from "@oc-mui/query";

const router = createRouter({ ... });

const Root = () => (
  <QueryProvider>
    <AppProviders router={router} />
  </QueryProvider>
);
```

## File Structure

```
packages/providers/
├── src/
│   ├── AppProviders.tsx        # The provider composition
│   └── index.ts                # Public API exports
├── package.json
└── README.md                   # This file
```

---

## Contributing

1. **Ordering:** Do not change the order of providers in `AppProviders.tsx` without understanding the impact on dependent context (e.g., a provider using `useAuth` must be below `AuthProvider`).
2. **Lean Logic:** Avoid adding business logic to this package. It should only compose existing providers.
3. **New Providers:** If a new global infrastructure provider is added to the monorepo, it should be integrated here.
