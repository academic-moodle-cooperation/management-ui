# @oc-mui/plugin-system

The runtime every plugin runs on. Provides `createPlugin()`, the `PluginManager`, extension-point resolution, and the React context that exposes them to components.

**Contract**: Manifest 1.1 and Runtime API 1.0 are frozen for the 1.x line. See [`docs/architecture/CONTRACTS.md`](../../docs/architecture/CONTRACTS.md). API surface is mechanically tracked in [`etc/plugin-system.api.md`](./etc/plugin-system.api.md).

## Usage

```ts
import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

export const myPlugin = createPlugin({
  namespace: "my-namespace",
  type: "app",
  version: "1.0.0",

  initialize(manager: PluginManager) {
    manager.registerObject("apps:definitions", "my-app", {
      id: "my-app",
      name: "My App",
      routePath: "/my-app",
      component: MyAppComponent,
    });
  },

  activate() {},
  deactivate() {},
});
```

The full plugin-authoring walkthrough lives at [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md).

## API

| Symbol | Purpose |
|--------|---------|
| `createPlugin(options)` | The entry point. Builds a plugin from `{ namespace, type, version, initialize, activate, deactivate }`. |
| `createPluginManager()` | Factory for a fresh `PluginManager`. Used by the shell at boot and by the test harness. |
| `PluginProvider`, `usePluginManager()` | React context for accessing the manager from components. |
| `ComponentResolver<P>` | Looks up a component registered on an extension point and renders it with `componentProps`. Falls back to `defaultComponent` if none registered. |
| `getAllApps(manager)`, `getAppById(manager, id)` | Read helpers over the `apps:definitions` registry. |
| `createAppRegistryPlugin()`, `createObjectRegistryPlugin()`, `createRendererPlugin()` | The three built-in plugins the shell wires up before any user plugins. |
| `fragmentRegistry`, `FragmentRegistryService` | GraphQL fragment registry used by `@oc-mui/query`. |
| `checkApiVersionCompatibility(required, host?)`, `parseSemver(input)` | Runtime checks for the host-vs-plugin API version handshake. |
| `validatePluginMetadata(json)` | Zod-backed runtime validation against the manifest schema. |

For the exhaustive type-level signature, read [`etc/plugin-system.api.md`](./etc/plugin-system.api.md) — it's committed and CI-checked.

## Architecture

```
PluginManager
├── Object registry      (registerObject, getObjects, removeObject)
├── Component registry   (registerComponent — resolved by ComponentResolver)
├── Function registry    (addFunction, executeFunction)
├── Event bus            (emit, on, off)
└── App registry         (built-in; populated via apps:definitions)
```

Built-in plugins live in [`src/builtins/`](./src/builtins/) — the renderer, app registry, and object registry are registered by the shell before any user plugin runs. They're public exports so the test harness can wire them up too.

## Layer

Foundation. Depends only on `@oc-mui/utils` and React. Higher-layer packages (`@oc-mui/query`, `@oc-mui/router`, `@oc-mui/ui`, etc.) depend on this one — never the other way around.

## See also

- [`docs/architecture/CONTRACTS.md`](../../docs/architecture/CONTRACTS.md) — Manifest and Runtime API contract guarantees.
- [`docs/plugins/creating-a-plugin.md`](../../docs/plugins/creating-a-plugin.md) — plugin-author walkthrough.
- [`AGENTS.md`](../../AGENTS.md) — operational rules for plugin work.
- [`packages/plugin-testing/README.md`](../plugin-testing/README.md) — test harness built on top of this runtime.
