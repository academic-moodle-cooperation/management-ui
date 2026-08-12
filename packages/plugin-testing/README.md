# @oc-mui/plugin-testing

Contract-test harness for plugins that target the `@oc-mui/plugin-system`
runtime. Boots a minimal manager with the three built-in plugins
(`objectRegistry`, `renderer`, `appRegistry`), registers the plugin under
test, and returns a small set of `expect*` assertion helpers tailored to the
manifest and runtime-API contracts documented in
[`docs/architecture/CONTRACTS.md`](../../docs/architecture/CONTRACTS.md).

## Public API

```ts
import { loadPluginInHarness, readPluginManifest } from "@oc-mui/plugin-testing";
```

- `loadPluginInHarness(plugin, options?)` — returns a `TestHarness` handle.
  Always call `harness.dispose()` in your `afterAll`.
- `readPluginManifest(pluginDir)` — reads `<pluginDir>/plugin.json`, validates
  it with the shared runtime validator, and returns the parsed manifest.

## Example

```ts
import { describe, it, beforeAll, afterAll } from "vitest";
import { resolve } from "node:path";
import {
  loadPluginInHarness,
  readPluginManifest,
  type TestHarness,
} from "@oc-mui/plugin-testing";
import { myPlugin } from "./index";

describe("my-plugin contract", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    const pluginDir = resolve(__dirname, "..");
    harness = await loadPluginInHarness(myPlugin, {
      manifest: await readPluginManifest(pluginDir),
      pluginDir,
      i18nLocales: ["en", "de"],
    });
  });

  afterAll(() => harness.dispose());

  it("activates cleanly", () => harness.expectActivated());
  it("registers all manifest extension points", () =>
    harness.expectAllManifestRegistrationsSucceed());
  it("has i18n parity across en/de", () => harness.expectI18nKeyParity());
  it("renders without console errors", () => harness.expectCleanRender());
});
```

## Assertion reference

| Method | Intent |
| --- | --- |
| `expectActivated()` | The plugin is in `manager.plugins` after `register()`. |
| `expectRegistered([...eps])` | Each listed extension point has ≥ 1 entry. |
| `expectAllManifestRegistrationsSucceed()` | Same as above, fed by `manifest.extensionPoints`. |
| `expectI18nKeyParity(locales?)` | Every locale under each `i18nNamespaces` folder exposes the same flattened key set. |
| `expectCleanRender({ render? })` | No `console.error` / `console.warn` since the last call (optionally renders a React tree first). |

## Breaking-change policy

This package is part of the test tooling, not the shipped runtime. It follows
the project's general semver discipline:

- New `expect*` helpers: **minor**.
- Adding new optional fields to `HarnessOptions` or `TestHarness`: **minor**.
- Removing or renaming anything on the public surface: **major**.
- Tightening what counts as a harness failure (e.g. treating warnings as
  errors when they previously were ignored): **major**.

Tests written against the harness should rely only on the exports re-exported
from `./src/index.ts`.

## Scope

MVP ships only the plugin-system provider in `HarnessPluginProvider`. Query / i18n / router wrappers are added per test when needed; if a common stack emerges, it will be promoted here.

## Layer

Integration. Depends on `@oc-mui/plugin-system` (the runtime under test) and `@oc-mui/utils`. Not shipped to consumers — it's a workspace dev-only package.

## See also

- [`docs/plugins/testing.md`](../../docs/plugins/testing.md) — plugin-author entry point.
- [`docs/operations/testing.md`](../../docs/operations/testing.md) — full test strategy + follow-up list.
- [`docs/architecture/CONTRACTS.md`](../../docs/architecture/CONTRACTS.md) — the contracts this harness verifies.
