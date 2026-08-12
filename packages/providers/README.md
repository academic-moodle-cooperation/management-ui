# @oc-mui/providers

Composes the shell's foundational React providers into a single `AppProviders` component. The shell mounts it once so the initialization order stays consistent.

## Usage

`AppProviders` takes the router and mounts `RouterProvider` itself — it renders the app through the route tree and accepts no children:

```tsx
import { AppProviders } from "@oc-mui/providers";

createRoot(document.getElementById("root")!).render(
  <AppProviders router={router} />,
);
```

## What it wires up

In order, from outermost to innermost (see [`src/AppProviders.tsx`](src/AppProviders.tsx)):

1. `ErrorBoundary` (`@oc-mui/ui`) — top-level error UI.
2. `AppRuntimeProvider` (`@oc-mui/app-runtime`) — runtime config context (`isStandalone: false`, base URL, router).
3. `RendererProvider` (`@oc-mui/plugin-system`) — extension-point renderer context.
4. `AuthProvider` + `AuthInitializer` (`@oc-mui/router`) — auth context and the initial session check.
5. `RouterProvider` (`@oc-mui/router`) — mounts the TanStack Router instance the caller passes in.

## Layer

Application. Depends on `@oc-mui/app-runtime`, `@oc-mui/plugin-system`, `@oc-mui/router`, `@oc-mui/ui`; `@oc-mui/query` is a peer dependency.

## See also

- [`packages/app-runtime/README.md`](../app-runtime/README.md), [`packages/plugin-system/README.md`](../plugin-system/README.md), [`packages/router/README.md`](../router/README.md) — the underlying providers.
- [`apps/shell/`](../../apps/shell/) — the only production consumer (`src/main.tsx`).
