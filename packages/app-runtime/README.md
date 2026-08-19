# @oc-mui/app-runtime

Runtime infrastructure that lets a component run **inside the shell** or **standalone** (for plugin dev and contract tests) with the same code path. Wraps the component in the right provider hierarchy depending on what it detects at boot.

## Usage

### Inside the shell

The shell mounts `AppRuntimeProvider` once at the root. Plugin-registered apps get it for free — no extra wiring.

### Standalone (a plugin running solo)

```tsx
import { bootstrapStandaloneApp } from "@oc-mui/app-runtime";
import { MyApp } from "./MyApp";

bootstrapStandaloneApp(MyApp, "root", {
  // optional runtime overrides (appName, baseUrl, …)
  appName: "my-app",
});
```

`bootstrapStandaloneApp(AppComponent, containerId, config)` mounts the full provider tree into the container element and renders the component as the only route (plus a catch-all). Useful for the playground and for plugin authors iterating on a single app without the shell.

## Surface

| Symbol | Purpose |
|--------|---------|
| `AppDefinition` (type) | The shape registered on `apps:definitions`. Same type used by `@oc-mui/plugin-system`. |
| `AppRuntimeConfig`, `AppRuntimeContext` | Runtime config shape (base URL, env, etc.) and the React context it surfaces. |
| `AppRuntimeProvider`, `useAppRuntime()` | Provider + hook. Mounted by the shell at boot; consumed by deep components that need to know "am I standalone or integrated?". |
| `bootstrapStandaloneApp(AppComponent, containerId?, config)` | One-call entry point for running a single app outside the shell. |
| `StandaloneAppWrapper`, `AdaptiveAppWrapper` | The component wrappers used internally; exported for advanced callers. |

## Layer

Application. Depends on `@oc-mui/plugin-system`, `@oc-mui/query`, `@oc-mui/router`, `@oc-mui/ui`, `@oc-mui/utils`.

## See also

- [`apps/playground/`](../../apps/playground/) — uses `bootstrapStandaloneApp` as its mounting strategy.
- [`docs/reference/decisions/003-shell-plus-core-plugins.md`](../../docs/reference/decisions/003-shell-plus-core-plugins.md) — why we have a single shell plus plugins instead of multiple top-level apps.
