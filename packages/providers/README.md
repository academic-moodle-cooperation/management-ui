# @oc-mui/providers

Composes every foundational React context provider into a single `AppProviders` wrapper. The shell mounts it once; apps and tests reuse it so the initialization order stays consistent.

## Usage

```tsx
import { AppProviders } from "@oc-mui/providers";

createRoot(document.getElementById("root")!).render(
  <AppProviders router={router}>
    <App />
  </AppProviders>,
);
```

## What it wires up

In order, from outermost to innermost:

1. `QueryProvider` (`@oc-mui/query`) — TanStack Query client.
2. `PluginProvider` (`@oc-mui/plugin-system`) — the `PluginManager` context.
3. `I18nextProvider` (`@oc-mui/i18n`) — translation engine.
4. `AuthProvider` (`@oc-mui/router`) — auth context.
5. `RouterProvider` (`@oc-mui/router`) — the TanStack Router instance the caller passes in.

The order matters: router depends on auth, auth depends on the query client, every consumer expects i18n and the plugin manager to be available.

## Layer

Application. Depends on `@oc-mui/query`, `@oc-mui/plugin-system`, `@oc-mui/i18n`, `@oc-mui/router`.

## See also

- [`packages/query/README.md`](../query/README.md), [`packages/plugin-system/README.md`](../plugin-system/README.md), [`packages/router/README.md`](../router/README.md), [`packages/i18n/README.md`](../i18n/README.md) — each underlying provider.
- [`apps/shell/`](../../apps/shell/) — the only production consumer.
