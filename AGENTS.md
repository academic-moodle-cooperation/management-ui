# AGENTS.md

Operational rules for AI coding agents (Claude, Copilot, Cursor, etc.) working in this repository. Human contributors should read [`CONTRIBUTING.md`](CONTRIBUTING.md) instead — it has the same rules in long form, plus the wider workflow context.

This file is **not** a project tour. For architecture, package layers, and the general "what is this codebase" briefing, start at [`docs/AI_DEVELOPMENT_GUIDE.md`](docs/AI_DEVELOPMENT_GUIDE.md). The rules below assume you have that context.

## TL;DR — Pre-flight checklist

Before you finish a plugin-touching change:

1. Plugin entry uses `createPlugin({...})` from `@workspace/plugin-system`. ✓
2. `plugin.json` exists at the plugin root with the [required Manifest 1.1 fields](docs/architecture/CONTRACTS.md#1-plugin-manifest-contract) (`id`, `name`, `version`, `description`, `author`, `namespace`) and an `extensionPoints` array. ✓
3. Every extension point your `initialize()` populates also appears in `plugin.json`'s `extensionPoints`. ✓
4. A `src/plugin.contract.test.ts` exists, copy-pasted from a sibling plugin and only the import line changed. ✓
5. Plugin imports nothing from `apps/*`, `plugins/<other>/*`, or any external library not already wrapped behind a `@workspace/*` facade. ✓
6. `pnpm verify` passes locally. ✓
7. If a public `@workspace/*` API surface changed, you ran `pnpm api-check` and committed the regenerated `etc/<pkg>.api.md` *and* added a changeset. ✓

If any of those is unchecked, do not declare the change finished.

## Plugin layout (canonical)

```
plugins/<name>/
├── package.json          # name, deps, test/lint/check-types/test:contract scripts
├── plugin.json           # Manifest 1.1: id, name, version, description, author, namespace, extensionPoints
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts          # the plugin entry — exports a `createPlugin({...})` value
    ├── plugin.contract.test.ts
    └── … plugin code
```

Org-specific plugins live under `.local-plugins/<name>/` instead and follow the same shape. They are not part of the OSS release; never add them to `plugins/index.ts`.

## Scaffolding a new plugin

```bash
# Default — scaffolds under .local-plugins/<name>/ (gitignored, for org/community plugins)
pnpm create-plugin my-plugin

# Add --in-tree to scaffold under plugins/<name>/ instead — for core
# contributors adding a built-in plugin shipped with the OSS repo.
pnpm create-plugin my-plugin --in-tree
```

The CLI writes the full layout above plus a working `app:header-logo`
placeholder registration so `pnpm test:contract` passes on first run.
Replace the placeholder, update `plugin.json`'s `extensionPoints`, and
you have a real plugin.

## The plugin entry

```ts
import { createPlugin, type PluginManager } from "@workspace/plugin-system";

export const myPlugin = createPlugin({
  namespace: "my-namespace",  // kebab-case, no colons, matches plugin.json's `namespace`
  type: "app",                // see CONTRACTS.md for the type vocabulary
  version: "1.0.0",

  initialize(manager: PluginManager) {
    // Register data on extension points HERE, not in activate().
    manager.registerObject("apps:definitions", "my-app", { ... });
  },

  activate() { /* side effects only */ },
  deactivate() { /* clean up the side effects from activate() */ },
});
```

**Rule**: all `manager.registerObject(...)` calls go in `initialize()`. `activate()` and `deactivate()` are for one-time side effects (logging, subscribing to events). The harness re-registers plugins between tests; doing registration in `activate()` means the second test sees nothing.

## Extension points — the four you'll usually touch

| Point | What you register | Example |
|---|---|---|
| `apps:definitions` | A route + component pair the shell mounts under `/<routePath>` | `plugins/core-episodes/src/index.ts` |
| `sidebar:nav-items` | An entry in the left navigation | same file |
| `app:config:defaults` | A `Partial<AppConfig>` slice merged below `config.json` | `plugins/core-*/src/config.ts` |
| `app:header-logo` | An `{ src, alt, href, width, height }` object | `plugins/example/modules/header-logo-example.ts` |

For every extension point your plugin touches, add the string key to `plugin.json`'s `extensionPoints` array. The contract test fails when an entry is declared but not populated, and lint fails when a key collides with another plugin's.

## Contract test — required, mechanical

Every plugin under `plugins/` and `.local-plugins/` ships a `plugin.contract.test.ts` matching this template (only the import line and `describe` label change):

```ts
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, it } from "vitest";
import {
  loadPluginInHarness,
  readPluginManifest,
  type TestHarness,
} from "@workspace/plugin-testing";

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

Run with `pnpm test:contract`. The full harness API is documented in [`packages/plugin-testing/README.md`](packages/plugin-testing/README.md); the test pyramid + follow-up backlog live in [`docs/TESTING.md`](docs/TESTING.md).

## Boundaries — what plugins **must not** import

A plugin may import from:

- `@workspace/*` packages
- itself (relative paths within the plugin dir)
- `plugins/core` (a.k.a. `plugin-core`) — the canonical infrastructure plugin that ships the shared extension-point identifiers; allowed for every plugin
- third-party libraries already used by `@workspace/*` (e.g., `react`, `lucide-react`, `zod`)

A plugin must **not** import from:

- `apps/shell` or `apps/playground` — apps consume plugins, not the other way around
- any other plugin under `plugins/<name>/*` or `.local-plugins/<name>/*` — communicate via extension points instead
- A library that has been wrapped behind a `@workspace/*` facade (e.g., import `@workspace/router`, never `@tanstack/react-router` directly; same for `@tanstack/react-query` → `@workspace/query`, `i18next` → `@workspace/i18n`, `jotai` → `@workspace/store`)

The wrapper rule is enforced by `no-restricted-imports` in `@workspace/eslint-config/base.js`. The cross-plugin and cross-app rules are enforced by `eslint-plugin-boundaries` rules in the same config — see the comment block in `packages/eslint-config/base.js` for the full element/rule matrix. The boundaries rule today catches cross-plugin imports written as relative paths (`../../<other-plugin>/...`); workspace-package imports (`@workspace/plugin-<other>`) are not caught yet because of a resolver gap, tracked as a follow-up.

## Config — read your own slice, never anyone else's

Plugins declare their config schema once and consume it through `useConfig`:

```ts
// src/config.ts — declare schema + defaults + reader
import { z } from "zod";
import { definePluginConfig } from "@workspace/query";

const schema = z.object({
  enabled: z.boolean().optional(),
  // …slice fields
});

export const myPluginConfig = definePluginConfig({
  id: "my-plugin",          // matches plugin.json `id`
  schema,
  defaults: { enabled: true },
});

// In a component:
//   const cfg = myPluginConfig.use();
//   cfg.enabled  // typed, validated, falls back to defaults on bad input
```

Reading another plugin's slice (e.g. `useAppConfig().config.plugins["other-plugin"]`) is forbidden — lint catches it. The full config layer model is at [`docs/architecture/CONFIGURATION.md`](docs/architecture/CONFIGURATION.md).

## Theme — CSS variables only

No hex colors, no hardcoded font names, no raw spacing values in plugin code. Use the semantic tokens listed in [`docs/PLUGIN_STYLING_CONTRACT.md`](docs/PLUGIN_STYLING_CONTRACT.md). Org-specific theming lives in a theme plugin (`.local-plugins/<org>-theme/`), not inline in feature plugins.

## i18n

- Translation namespaces are declared in `plugin.json`'s `i18nNamespaces` array (optional).
- Locale files at `<plugin>/locales/<namespace>/<locale>.json`. The contract test's `expectI18nKeyParity` fails when locale files have mismatched key sets.
- Reference keys with `t("namespace:key")` via `useTranslation` from `@workspace/i18n`.

## Versioning a public-API change

If your change touches a `@workspace/*` package's public surface (anything reachable through its `exports` field):

1. Make the code change.
2. `pnpm api-check` regenerates the affected `etc/<pkg>.api.md`. Inspect the diff; commit it if the change was intentional.
3. `pnpm changeset` — pick the affected packages and the bump level (patch / minor / major). The CLI writes a `.changeset/<slug>.md` file; commit it alongside the rest.
4. Major bumps require a `@deprecated` JSDoc tag on the previous version, kept for one full major cycle. See [`CONTRIBUTING.md`](CONTRIBUTING.md#-versioning-changesets-and-deprecations) for the full rule.

CI rejects PRs that change a versioned package without a changeset, and rejects PRs whose `.api.md` snapshots drift without an accompanying regeneration.

## Pre-push gate — `pnpm verify`

This is the canonical command. It runs lint + type-check + build + unit tests + contract tests + api-check + Playwright smoke E2E in the same order CI does. If `pnpm verify` is green locally, CI will be too — modulo network-dependent E2E flakes (caught by retries).

If you only want a fast inner loop while iterating on one plugin:

- `pnpm --filter @workspace/plugin-<name> test` — that plugin's unit tests
- `pnpm --filter @workspace/plugin-<name> test:contract` — that plugin's contract test
- `pnpm test:e2e:ui` — Playwright in interactive mode

## Where to find things

| Looking for | Read |
|---|---|
| Project tour, package layers, plugin model | [`docs/AI_DEVELOPMENT_GUIDE.md`](docs/AI_DEVELOPMENT_GUIDE.md) |
| The four contracts (manifest, runtime API, theme, config) | [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md) |
| Test pyramid + harness API reference | [`docs/TESTING.md`](docs/TESTING.md), [`packages/plugin-testing/README.md`](packages/plugin-testing/README.md) |
| Versioning rules + changeset workflow | [`CONTRIBUTING.md`](CONTRIBUTING.md#-versioning-changesets-and-deprecations) |
| Config layer model + reader API | [`docs/architecture/CONFIGURATION.md`](docs/architecture/CONFIGURATION.md) |
| Theme tokens + CSS rules | [`docs/PLUGIN_STYLING_CONTRACT.md`](docs/PLUGIN_STYLING_CONTRACT.md) |
| Why the architecture is the way it is | [`docs/architecture/ADR-*.md`](docs/architecture/) |
| What's deferred / waiting on upstream / open decisions | [`docs/OPEN_FOLLOWUPS.md`](docs/OPEN_FOLLOWUPS.md) |

## When in doubt

Read a sibling. The five `plugins/core-*` packages are the canonical reference for in-tree plugins; `plugins/example/` is the minimal version. If your code looks structurally different from those, you are probably wrong before you are right.
