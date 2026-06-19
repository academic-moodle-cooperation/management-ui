# Testing

**Status:** Canonical. This is the only document that describes the testing strategy.
**Last Updated:** 2026-04-29

This document explains the three test layers, how to add a test of each kind, what runs in CI, and the deferred work that the current MVP does not yet cover.

## Test pyramid

```mermaid
flowchart TD
    E2E["E2E (Playwright)<br/>tests/e2e/*.spec.ts<br/>black-box, real browser"]
    Contract["Plugin Contract Tests (Vitest)<br/>plugins/*/src/*.contract.test.ts<br/>harnessed plugin runtime, no UI"]
    Unit["Unit Tests (Vitest)<br/>packages/*/src/*.test.ts<br/>jsdom or node, mock-friendly"]

    E2E --> Contract --> Unit
```

We run **many unit tests, several contract tests per plugin, and a handful of end-to-end specs** — the classic pyramid. CI fails fast on the bottom and only escalates upward when the lower layers are green.

## Unit tests (Vitest)

The default. Anything that is not a plugin contract or a real-browser flow should land here.

- Live next to the code: `packages/<name>/src/foo.test.ts`, `plugins/<name>/src/foo.test.ts`.
- Run via `pnpm test` (per-package, fan-out through Turbo).
- Default environment is `jsdom` — see the root [vitest.config.ts](../../vitest.config.ts).
- Coverage runs via `pnpm test:coverage` and uploads to Codecov in CI. **No coverage thresholds are enforced today** — see follow-up #3.

## Contract tests

The contract layer asserts that a plugin honours the public contracts from [docs/architecture/CONTRACTS.md](../architecture/CONTRACTS.md) — Runtime API 1.0 and Manifest 1.1. Each plugin gets exactly **one** contract test file, conventionally named `plugin.contract.test.ts`.

### What it checks

The harness lives in [@oc-mui/plugin-testing](../../packages/plugin-testing/README.md). It boots a minimal `PluginManager`, registers the built-in plugins (`objectRegistry`, `renderer`, `appRegistry`), loads the plugin under test, and exposes a small handle:

| Assertion | What it proves |
|---|---|
| `expectActivated()` | The plugin appears in the manager's registry after `initialize()` and `activate()` ran without throwing. |
| `expectAllManifestRegistrationsSucceed()` | Every entry in `plugin.json`'s `extensionPoints` has at least one registered object after activation. Drift is caught at the manifest level. |
| `expectRegistered([...ids])` | Same idea but with an explicit list — useful if a plugin has no manifest declaration yet. |
| `expectI18nKeyParity(locales?)` | All locales declared in `i18nNamespaces` have the same set of translation keys. |
| `expectCleanRender(componentId?)` | Activation (and optionally rendering a registered component) produces zero `console.error` and `console.warn` calls. |

### Reference template

[plugins/core-episodes/src/plugin.contract.test.ts](../../plugins/core-episodes/src/plugin.contract.test.ts) is the canonical pattern. Copy it into a new plugin and adjust the import:

```ts
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  loadPluginInHarness,
  readPluginManifest,
  type TestHarness,
} from "@oc-mui/plugin-testing";

import { myPlugin } from "./index";

const pluginDir = resolve(fileURLToPath(import.meta.url), "..", "..");

describe("my-plugin contract", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await loadPluginInHarness(myPlugin, {
      manifest: await readPluginManifest(pluginDir),
      pluginDir,
    });
  });

  afterAll(() => harness.dispose());

  it("activates cleanly", () => harness.expectActivated());
  it("populates every extension point declared in plugin.json", () =>
    harness.expectAllManifestRegistrationsSucceed());
  it("does not log errors or warnings during activation", () =>
    harness.expectCleanRender());
  it("has i18n key parity across shipped locales", () =>
    harness.expectI18nKeyParity());
});
```

### Manifest-driven vs. test-declared

Two ways to tell the harness which extension points a plugin must populate:

- **Manifest-driven (preferred).** Add an `extensionPoints` array to `plugin.json` and call `expectAllManifestRegistrationsSucceed()`. The manifest stays the single source of truth for tooling (marketplace listings, generated docs, this test). When the plugin gains or loses an extension point, you only edit the manifest.
- **Test-declared.** Pass an explicit array to `expectRegistered([...])`. Acceptable while a plugin's manifest hasn't been updated to Manifest 1.1, but converge to manifest-driven as soon as practical.

### Adding a contract test to a plugin

1. Add `@oc-mui/plugin-testing` to the plugin's `devDependencies` (`workspace:*`).
2. Add a `test:contract` script: `"test:contract": "vitest run plugin.contract"`.
3. Drop the test file next to `index.ts` using the template above.
4. Add `extensionPoints: [...]` to `plugin.json` if you opted for manifest-driven assertions.

The package will be picked up by `pnpm test:contract` automatically.

### `localStorage` in the contract harness

Node 25+ exposes a global `localStorage` placeholder (intended for use with `--localstorage-file`) that surfaces as `{}` and shadows jsdom's working `Storage`. Any contract test running under jsdom that touches `localStorage` would otherwise blow up with `localStorage.removeItem is not a function`. The shared [vitest.setup.ts](../../vitest.setup.ts) installs an in-memory `Storage` shim on `globalThis` and clears it after each test — no per-plugin work needed.

## End-to-end tests (Playwright)

The single smoke spec at [tests/e2e/smoke.spec.ts](../../tests/e2e/smoke.spec.ts) drives a real Chromium against `apps/shell`'s Vite dev server. The repo ships no backend, so the spec stubs the four endpoints the shell touches during boot (config.json, plugins.json, /info/me.json, /graphql) and then asserts the sidebar renders without console errors.

### Run locally

```bash
# one-time per machine
pnpm test:e2e:install

# headless run — Playwright auto-starts the shell on :3000 if not already running
pnpm test:e2e

# interactive UI mode for debugging
pnpm test:e2e:ui
```

### Add an E2E test

Drop a new `*.spec.ts` next to `smoke.spec.ts`. The base URL is `http://127.0.0.1:3000/management-ui/`, so use relative `page.goto("...")` paths or absolute paths starting with `/management-ui/`. If your test exercises a feature that talks to the backend, mirror the route-mocking pattern from [smoke.spec.ts](../../tests/e2e/smoke.spec.ts) — one `page.route("**/<endpoint>", ...)` per call site.

## CI layout

The test workflow ([.github/workflows/test.yml](../../.github/workflows/test.yml)) splits into four jobs that run in dependency order:

```mermaid
flowchart LR
    L["lint-types<br/>pnpm lint + check-types"] --> U["unit<br/>pnpm test + coverage"]
    U --> C["contract<br/>pnpm test:contract"]
    U --> E["e2e<br/>pnpm test:e2e"]
```

| Job | What fails it |
|---|---|
| `lint-types` | ESLint warning, real TypeScript error (auto-generated shadcn errors are filtered). |
| `unit` | Any `*.test.ts` in any package; Codecov upload is best-effort. |
| `contract` | Any `*.contract.test.ts` in any plugin. |
| `e2e` | Any spec in `tests/e2e/`. The Playwright HTML report is uploaded as an artifact (7-day retention) on failure. |

`unit` is the gate before `contract` and `e2e` so a broken Vitest suite never costs us a Chromium download.

## Before pushing

Run the same chain locally to find failures before review:

```bash
pnpm verify
```

This runs `lint` → `check-types` → `build` → `test` → `test:contract` → `test:e2e`, with `--filter='!./.local-plugins/*'` so org-plugin checkouts in your local `.local-plugins/` don't false-positive the run (CI sees an empty `.local-plugins/`). Run `pnpm test:e2e:install` once on a new machine to download Chromium.

Including `build` in the chain is intentional: `vite dev` warns where `vite build` errors out, so a missing static-copy target or a stale alias only surfaces in production builds. `pnpm verify` catches that class of bug locally.

## Follow-ups

Every plugin now ships a `plugin.contract.test.ts`, and on top of the mocked smoke E2E there is a real-backend [integration tier](../../tests/integration/README.md) and a [visual-regression tier](../../tests/visual/README.md). The following work is still deferred and tracked here so it doesn't silently fall off the radar:

1. **E2E suites per feature (mocked)** — the smoke spec is a sanity check, not a real flow. The standard mocked project should grow per-feature flows (upload, series, episodes, marketplace-activation) next to `smoke.spec.ts`, reusing the route-mock pattern. (Real-backend versions of several of these already live in [`tests/integration/`](../../tests/integration/).)
2. **Coverage gates — extend to remaining packages** — the core-infra packages (`utils`, `plugin-system`, `store`) now enforce no-regression thresholds in their `vitest.config.ts` (floors set a few points below current coverage, so a real drop fails `pnpm test:coverage`). Extend the same ratchet to the foundation/integration packages (`i18n`, `query`, `router`, `ui`, …) and the apps, working toward the master-plan target of **80%** for foundation/integration packages and **60%** for apps. Codecov already ingests uploads from CI.
3. **Playground as plugin runner** — [apps/playground](../../apps/playground) is a static placeholder today. Phase 4 of the master plan calls for a `?plugin=<id>` query-driven runner that loads any single plugin in isolation, enabling per-plugin visual debugging and reusable E2E fixtures.
4. **Marketplace metadata cleanup** — [plugins/admin-marketplace/src/services/plugin-metadata.ts](../../plugins/admin-marketplace/src/services/plugin-metadata.ts) currently hard-codes which extension points each plugin advertises. Once every core plugin declares `extensionPoints` in its manifest, the marketplace can read straight from the manifest and the hard-coded map disappears.
5. **Visual regression — expand + promote to CI** — the [visual tier](../../tests/visual/README.md) (`pnpm test:visual`) snapshots the shell landing in light + dark today. Extend it to an alternate showcase theme and the key data screens (episodes/series tables), and promote it from an opt-in command to a CI job rendered in a fixed container for byte-stable baselines.
6. **Remote turbo cache** — the CI jobs each rebuild the workspace today. Enabling Turbo Remote Cache would let `unit`, `contract`, and `e2e` share artefacts from `lint-types`, cutting overall pipeline time substantially.

When you tackle one of these, delete the entry from this list and reference the resulting commit in the deletion's commit body.

## Every manual run feeds automation

When a release-protocol run finds a bug, the bug is telling you which automated test was missing. Convert it, don't just fix it:

- **Pure logic bug** (formatter, sort field, config parse) → write a failing **unit test**, then fix.
- **Plugin not registering / manifest drift / console error on load** → strengthen that plugin's `plugin.contract.test.ts`.
- **Broken user flow** → add an **E2E spec** (the `EventOrderByInput` sort regression is the canonical example of something that should be a permanent E2E test).
- **Only-a-real-backend bug** → add/refine an **integration-E2E** spec in [`tests/integration/`](../../tests/integration/) and/or a row in [`test-protocol.md`](./test-protocol.md).

The rule: every protocol run either converts a found bug into a permanent automated test, or adds/refines a checklist row — so the manual protocol shrinks every release instead of being a recurring slog.

## See also

- [docs/architecture/CONTRACTS.md](../architecture/CONTRACTS.md) — the public contracts the harness verifies.
- [packages/plugin-testing/README.md](../../packages/plugin-testing/README.md) — full harness API reference.
- [tests/e2e/README.md](../../tests/e2e/README.md) — quick how-to-run for the Playwright suite.
