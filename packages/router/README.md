# @workspace/router

**Version:** 0.0.0  
**Type:** Foundation / Integration Layer  
**Last Updated:** 2025-01-15

## Purpose & Scope

The `@workspace/router` package provides the routing infrastructure for the Management UI. Built on **TanStack Router**, it handles navigation, route-based data loading, and robust authentication/authorization protection.

It centralizes the routing logic and provides a bridge between the data layer (`@workspace/query`) and the UI navigation.

### Stability contract

This package is the **only place in the monorepo that is allowed to import from `@tanstack/react-router`**. Apps, plugins and other packages must import routing primitives (`createRouter`, `Link`, `Outlet`, `AnyRouter`, ...) from `@workspace/router`.

The rule is enforced by ESLint (`no-restricted-imports` in `packages/eslint-config/base.js`) with an explicit exception for this package.

Why it matters: if we ever need to replace or upgrade the router implementation across a major version, we can do so by changing the internals of `@workspace/router` without breaking plugins or apps. Deep imports into the underlying router would make that impossible.

> Until we have a typed facade, the public types re-exported from here are structurally identical to TanStack Router's types. Treat the API surface as "owned by `@workspace/router`"; we may stabilize it further over time.

**In Scope:**

- Routing configuration and provider.
- Authentication context and state management.
- Route-based authorization (Role-Based Access Control).
- Route guards (`authGuard`) for protecting sensitive pages.
- Integration utilities for TanStack Router.

**Out of Scope:**

- UI navigation components like sidebars or breadcrumbs (belongs in `@workspace/ui`).
- Defining the actual application routes (belongs in the specific apps, e.g., `management-ui-core`).
- Low-level data fetching logic (belongs in `@workspace/query`).

## Architecture & Design Decisions

### Design Principles

- **Declarative Protection:** Route protection is defined at the route configuration level using `beforeLoad` and `staticData`.
- **Centralized Auth State:** Authentication state is managed via `AuthProvider` and accessible globally through `useAuth`.
- **Type-Safe Navigation:** Leverages TanStack Router's type-safety for links and parameters.

### Key Concepts

#### Route Guards (`authGuard`)
The `authGuard` function is designed to be used in the `beforeLoad` hook of a route. It checks the current authentication state and roles before allowing access to the route.

```typescript
const adminRoute = createRoute({
  path: '/admin',
  beforeLoad: authGuard({ 
    requireAuth: true, 
    requiredRoles: ['ROLE_ADMIN'] 
  }),
});
```

#### Authentication Provider
The `AuthProvider` maintains the `user` object and `isAuthenticated` flag. It is typically initialized by the `AuthInitializer` using data from the query layer.

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│ @workspace/router Architecture          │
├─────────────────────────────────────────┤
│ [ RouterProvider (TanStack) ]           │
│         ↓                               │
│ [ AuthProvider (AuthContext) ]          │
│         ↓                               │
│ [ Route Guards (authGuard) ]            │
│         ↓                               │
│ [ ProtectedRoute / Outlet ]             │
└─────────────────────────────────────────┘
```

### Technology Choices

- **TanStack Router:** A powerful, type-safe router that excels in large-scale applications with complex data dependencies.
- **React Context:** Used for the Auth state as it is required across the entire application tree.

## API Surface (Public Exports)

### Exports Structure

```typescript
export { RouterProvider, baseRootRoute } from "./RouterProvider";
export { AuthProvider, useAuth } from "./auth/AuthContext";
export { authGuard, protectionMetadata } from "./route-protection";
export { ProtectedRoute } from "./components/ProtectedRoute";
// Re-exports from @tanstack/react-router
export { Link, useNavigate, useRouter, createRoute, createRouter } from "@tanstack/react-router";
```

### Core API

#### `AuthProvider` / `useAuth`
**Purpose:** Provides and consumes the authentication state.

#### `authGuard(options)`
**Purpose:** Functional guard for route `beforeLoad`.
**Parameters:**
- `requireAuth` (boolean): Default `true`.
- `requiredRoles` (string[]): List of roles that can access the route.
- `redirectTo` (string): Where to redirect if check fails.

#### `protectionMetadata(options)`
**Purpose:** Adds static metadata to a route for UI-level checks (e.g., showing a lock icon in the sidebar).

## Dependencies & Coupling

### Dependency Graph

```
@workspace/router
├── External Dependencies
│   ├── @tanstack/react-router (^1.45.0)
│   └── @tanstack/router-core (^1.120.10)
└── Workspace Dependencies
    └── @workspace/query - Used for auth state and type definitions (UserQuery)
```

### Dependency Layer

**Layer:** Foundation / Integration Layer

**Allowed to depend on:** Core Infrastructure, Integration (Query).

**Rules:**
- Must not depend on UI components.
- Should remain agnostic of specific application layouts.

## Usage Examples

### Defining a Protected Route

```typescript
import { createRoute, authGuard } from "@workspace/router";
import { RootLayout } from "./layout";

export const dashboardRoute = createRoute({
  getParentRoute: () => baseRootRoute,
  path: "/dashboard",
  component: DashboardPage,
  beforeLoad: authGuard({ requireAuth: true }),
});
```

### Checking Auth in a Component

```typescript
import { useAuth } from "@workspace/router";

const UserProfile = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <LoginButton />;
  return <div>Welcome, {user.currentUser.username}</div>;
};
```

## Testing Strategy

### Unit Tests
Located in `src/**/*.test.ts`. Focuses on route guard logic.

```bash
pnpm test
```

### Integration Tests
Auth state integration is tested by mocking the query layer responses.

## File Structure

```
packages/router/
├── src/
│   ├── auth/                   # Authentication logic & context
│   ├── route-protection/       # Guards and protection utilities
│   ├── components/             # Router-specific UI components
│   ├── RouterProvider.tsx      # Main provider wrapper
│   └── index.ts                # Public API exports
├── package.json
└── README.md                   # This file
```

## Related Packages

- [`@workspace/query`](/packages/query/README.md) - Provides the user data for authentication.
- [`@workspace/app-runtime`](/packages/app-runtime/README.md) - Integrates the router into the main application shell.

---

## Contributing

1. When adding auth features, ensure they are compatible with the existing `UserQuery` type from `@workspace/query`.
2. Follow TanStack Router's best practices for type-safe routing.
3. Update the `authGuard` logic if new authorization requirements (e.g., permissions instead of roles) are introduced.
