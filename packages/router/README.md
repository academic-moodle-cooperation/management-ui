# @oc-mui/router

Routing layer. Wraps TanStack Router behind a single workspace import, plus auth context, route guards, and the shell's dynamic-router glue for plugin-registered apps.

**Contract**: 1.x. Public API surface tracked in [`etc/router.api.md`](./etc/router.api.md).

## The wrapper rule

This package is the **only place in the workspace allowed to import from `@tanstack/react-router`**. Apps, plugins, and other packages must import routing primitives (`createRouter`, `Link`, `Outlet`, `useNavigate`, `AnyRouter`, …) from here. The rule is enforced by `no-restricted-imports` in `@oc-mui/eslint-config` with an explicit exception for this directory.

Until we ship a hand-crafted facade type layer, the re-exported types are structurally identical to TanStack Router's. Treat the surface as "owned by `@oc-mui/router`" — we may tighten it over time.

## Usage

```tsx
import { RouterProvider, Link } from "@oc-mui/router";

<RouterProvider router={router} />;

<Link to="/episodes">Episodes</Link>;
```

### Authentication

```tsx
import { AuthProvider, useAuth, ProtectedRoute } from "@oc-mui/router";

<AuthProvider>
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
</AuthProvider>;
```

`AuthInitializer` runs once at boot to populate the auth context from the host (typically Opencast). `useAuthActions()` returns `signIn` / `signOut` helpers. `createLoginRoute()` and `createLogoutRoute()` build the route definitions the shell mounts.

## Surface

| Symbol | Purpose |
|--------|---------|
| `RouterProvider` | The root provider. Mounted once by the shell. |
| `Link`, `Outlet`, `useNavigate`, `createRouter`, … | Re-exports of the underlying TanStack Router API, scoped to this package. |
| `AuthProvider`, `useAuth`, `AuthContextType` | Auth context exposed to the rest of the app. |
| `AuthInitializer` | Boot-time auth wiring; runs before the router renders. |
| `useAuthActions()` | `signIn` / `signOut` mutations. |
| `ProtectedRoute` | Component-level guard. Redirects unauthenticated users. |
| `createLoginRoute()`, `createLogoutRoute()` | Route-builder helpers for the auth pages. |
| Route-protection utilities | Programmatic checks for plugin code that needs to gate at the loader level. |

Full surface: [`etc/router.api.md`](./etc/router.api.md).

## Layer

Integration. Depends on `@oc-mui/plugin-system`, `@oc-mui/query` (for user/auth state), `@oc-mui/utils`.

## See also

- [`etc/router.api.md`](./etc/router.api.md) — committed API surface.
- [`docs/architecture/decisions/003-shell-plus-core-plugins.md`](../../docs/architecture/decisions/003-shell-plus-core-plugins.md) — why the shell mounts every route through plugin registrations.
