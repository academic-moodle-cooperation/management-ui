# AGENTS.md

Operational rules for AI coding agents (Claude, Copilot, Cursor, etc.) working in this repository. Human contributors should read [`CONTRIBUTING.md`](CONTRIBUTING.md) instead — it has the same rules in long form, plus the wider workflow context.

This file is **not** a project tour. For architecture, package layers, and the general "what is this codebase" briefing, start at [`docs/architecture/overview.md`](docs/architecture/overview.md). The rules below assume you have that context.

## TL;DR — Pre-flight checklist

Before you finish a plugin-touching change:

1. Plugin entry uses `createPlugin({...})` from `@oc-mui/plugin-system`. ✓
2. `plugin.json` exists at the plugin root with the [required manifest fields](docs/architecture/CONTRACTS.md#1-plugin-manifest-contract) (`id`, `name`, `version`, `description`, `author`, `namespace`) and an `extensionPoints` array. Applies to every plugin **except `plugins/core`** — the infrastructure plugin ships no `plugin.json`. ✓
3. Every extension point your `initialize()` populates also appears in `plugin.json`'s `extensionPoints`. ✓
4. A `src/plugin.contract.test.ts` exists — the file `pnpm create-plugin` scaffolds, with only the import line and the `describe` label changed. Every plugin except `plugins/core` ships one. ✓
5. Plugin imports nothing from `apps/*`, `plugins/<other>/*`, or any external library not already wrapped behind a `@oc-mui/*` facade. ✓
6. `pnpm verify` passes locally. ✓
7. **Changeset committed.** If you changed *any* versioned package, you ran `pnpm changeset`, picked the bump level, and **committed** the `.changeset/*.md` file. "Versioned" = every package under `packages/*` and `plugins/*`, **including private (`"private": true`) ones** — the *only* exemptions are those listed in `.changeset/config.json`'s `ignore` (currently just `shell` and `playground`). This is **not** limited to public-API changes: a dev-server tweak, an internal bug fix, a new asset MIME type all need one. An uncommitted changeset does **not** count — CI runs `changeset status` against the committed tree. When unsure, run `pnpm changeset status --since=origin/<base-branch>` (green = covered). If the change *also* touched a public `@oc-mui/*` API surface, additionally run `pnpm api-check` and commit the regenerated `etc/<pkg>.api.md`. ✓
8. **Docs stay in sync.** Any doc your change makes stale is updated in the same PR. If you renamed a public symbol, fix every doc that names it; if you changed an extension point's contract, fix [`docs/plugins/`](docs/plugins/) and [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md); if you changed how something is built or released, fix [`docs/operations/`](docs/operations/). Use the "Where to find things" table at the bottom of this file to find every doc that mentions what you touched. ✓

If any of those is unchecked, do not declare the change finished.

## Plugin layout (canonical)

```
plugins/<name>/
├── package.json          # name, deps, test/lint/check-types/test:contract scripts
├── plugin.json           # plugin manifest: id, name, version, description, author, namespace, extensionPoints
├── tsconfig.json
├── vitest.config.ts
└── src/
    ├── index.ts          # the plugin entry — exports a `createPlugin({...})` value
    ├── plugin.contract.test.ts
    └── … plugin code
```

Org-specific plugins live under `.local-plugins/<name>/` instead and follow the same shape. They are not part of the OSS release; never add them to `plugins/index.ts`.

The one exception to this layout is `plugins/core`: it is the infrastructure plugin (shared extension-point identifiers and defaults), not a feature plugin — it has no `plugin.json`, no contract test, and uses `modules/` + `extension-points/` instead of `src/`. Do not model a new plugin on it.

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
import { createPlugin, type PluginManager } from "@oc-mui/plugin-system";

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

For every extension point your plugin touches, add the string key to `plugin.json`'s `extensionPoints` array. The contract test fails when an entry is declared but not populated. Registration ids are namespaced by plugin name at registration time (`registerObject` prefixes un-namespaced ids with `<plugin>:`), which is what keeps ids from colliding across plugins — no lint rule checks for collisions.

## Contract test — required, mechanical

Every plugin under `plugins/` and `.local-plugins/` — except `plugins/core`, the infrastructure plugin — ships a `plugin.contract.test.ts`. The canonical template is the file `pnpm create-plugin` generates ([`scripts/templates/create-plugin/src/plugin.contract.test.ts.tpl`](scripts/templates/create-plugin/src/plugin.contract.test.ts.tpl)); only the import line and the `describe` label change. As generated, for a plugin exporting `myPlugin`:

```ts
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  loadPluginInHarness,
  readPluginManifest,
  type TestHarness,
} from "@oc-mui/plugin-testing";

import defaultExport, { myPlugin } from "./index";

const pluginDir = resolve(fileURLToPath(import.meta.url), "..", "..");

describe("my-plugin plugin contract", () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await loadPluginInHarness(myPlugin, {
      manifest: await readPluginManifest(pluginDir),
      pluginDir,
    });
  });

  afterAll(() => harness.dispose());

  // The remote-plugin loader registers via `module.default`. A named-only
  // export builds and passes the harness below, but is silently never
  // loaded at runtime — so assert the default export explicitly.
  it("exposes the plugin as the default export (required by the loader)", () => {
    expect(defaultExport).toBe(myPlugin);
  });

  it("activates cleanly", () => harness.expectActivated());

  it("populates every extension point declared in plugin.json", () =>
    harness.expectAllManifestRegistrationsSucceed());

  it("does not log errors or warnings during activation", () =>
    harness.expectCleanRender());

  it("has i18n key parity across shipped locales", () =>
    harness.expectI18nKeyParity());
});
```

Run with `pnpm test:contract`. The full harness API is documented in [`packages/plugin-testing/README.md`](packages/plugin-testing/README.md); the test pyramid + follow-up backlog live in [`docs/operations/testing.md`](docs/operations/testing.md).

## Boundaries — what plugins **must not** import

A plugin may import from:

- `@oc-mui/*` packages
- itself (relative paths within the plugin dir)
- `plugins/core` (a.k.a. `plugin-core`) — the canonical infrastructure plugin that ships the shared extension-point identifiers; allowed for every plugin
- third-party libraries already used by `@oc-mui/*` (e.g., `react`, `lucide-react`, `zod`)

A plugin must **not** import from:

- `apps/shell` or `apps/playground` — apps consume plugins, not the other way around
- any other plugin under `plugins/<name>/*` or `.local-plugins/<name>/*` — communicate via extension points instead
- A library that has been wrapped behind a `@oc-mui/*` facade (e.g., import `@oc-mui/router`, never `@tanstack/react-router` directly; same for `@tanstack/react-query` → `@oc-mui/query`, `i18next` → `@oc-mui/i18n`, `jotai` → `@oc-mui/store`)

The wrapper rule is enforced by `no-restricted-imports` in `@oc-mui/eslint-config/base.js`. The cross-plugin and cross-app rules are enforced by `eslint-plugin-boundaries` rules in the same config — see the comment block in `packages/eslint-config/base.js` for the full element/rule matrix. The boundaries rule today catches cross-plugin imports written as relative paths (`../../<other-plugin>/...`); workspace-package imports (`@oc-mui/plugin-<other>`) are not caught yet because of a resolver gap, tracked as a follow-up.

## Config — read your own slice, never anyone else's

Plugins declare their config schema once and consume it through `useConfig`:

```ts
// src/config.ts — declare schema + defaults + reader
import { z } from "zod";
import { definePluginConfig } from "@oc-mui/query";

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

Reading another plugin's slice (e.g. `useAppConfig().config.plugins["other-plugin"]`) is forbidden — no lint rule enforces this today, so reviews do. The full config layer model is at [`docs/architecture/CONFIGURATION.md`](docs/architecture/CONFIGURATION.md).

## Theme — CSS variables only

No hex colors, no hardcoded font names, no raw spacing values in plugin code. Use the semantic tokens listed in [`docs/plugins/styling.md`](docs/plugins/styling.md). Org-specific theming lives in a theme plugin (`.local-plugins/<org>-theme/`), not inline in feature plugins.

## i18n

- Translation namespaces are declared in `plugin.json`'s `i18nNamespaces` array. This declaration is load-bearing: the contract test's `expectI18nKeyParity` resolves the namespaces to check from it, so declare every namespace you ship.
- Locale files live in one directory per namespace: `<plugin>/locales/<namespace>/<locale>.json`. The harness discovers them under the plugin dir (the manifest's optional `locales` field can point the root elsewhere). `expectI18nKeyParity` fails when a namespace's locale files have mismatched key sets.
- The in-tree plugins ship few translations; org plugins are the primary users of this mechanism — in practice each of their modules declares its own namespace. Never treat `i18nNamespaces` as unused based on in-tree usage.
- Reference keys with `t("namespace:key")` via `usePluginTranslation` from `@oc-mui/i18n` — it auto-loads your declared namespaces. See [`docs/plugins/i18n.md`](docs/plugins/i18n.md).

## Versioning — changesets (every versioned package) and public-API changes

**The changeset rule is broad, and this trips people up: _any_ change to a versioned package needs a committed changeset — not just public-API changes.** "Versioned" means every package under `packages/*` and `plugins/*`, **including private (`"private": true`) ones**. The *only* exceptions are the packages listed in `.changeset/config.json`'s `ignore` array (currently `shell` and `playground`). A dev-only config tweak, a bug fix in an internal package, a new asset MIME type — all of them need a changeset. "It's private, so it doesn't need one" is wrong; private packages still get versioned and only the `ignore` list is exempt.

For any versioned-package change:

1. Make the code change.
2. `pnpm changeset` — pick the affected packages and the bump level (patch / minor / major). The CLI writes a `.changeset/<slug>.md` file. Changeset texts land in published CHANGELOGs: use generic wording for organizations (no customer or org names).
3. **Commit the `.changeset/*.md` file.** `changeset status` (which CI runs) reads the committed tree — an unstaged or uncommitted changeset still fails the check, which is the classic "I added it but CI still says no changesets were found" trap.
4. Verify locally with `pnpm changeset status --since=origin/<base-branch>` (e.g. `--since=origin/develop` — match the branch your PR targets, since CI runs `changeset status --since=origin/$BASE`). Green means every changed-and-versioned package is covered. A bare `pnpm changeset status` compares against the configured `baseBranch` (`develop`); if your PR targets a different branch (e.g. a maintenance `r/NN.x` branch), pass `--since` explicitly.

If the change *also* touches a `@oc-mui/*` package's public surface (anything reachable through its `exports` field), additionally:

5. `pnpm api-check` regenerates the affected `etc/<pkg>.api.md`. Inspect the diff; commit it if the change was intentional.
6. Major bumps require a `@deprecated` JSDoc tag on the previous version, kept for one full major cycle. See [`docs/operations/release.md` → Deprecations](docs/operations/release.md#deprecations) for the full rule.

CI rejects PRs that change a versioned package without a changeset (`.github/workflows/changeset.yml`), and rejects PRs whose `.api.md` snapshots drift without an accompanying regeneration.

## Pre-push gate — `pnpm verify`

This is the canonical command. It runs lint + type-check + build + unit tests + contract tests + api-check + the Playwright E2E suite (incl. smoke) in the same order CI does. If `pnpm verify` is green locally, CI will be too — modulo network-dependent E2E flakes (caught by retries).

If you only want a fast inner loop while iterating on one plugin:

- `pnpm --filter @oc-mui/plugin-<name> test` — that plugin's unit tests
- `pnpm --filter @oc-mui/plugin-<name> test:contract` — that plugin's contract test
- `pnpm test:e2e:ui` — Playwright in interactive mode

## Where to find things

| Looking for | Read |
|---|---|
| Project tour, package layers, plugin model | [`docs/architecture/overview.md`](docs/architecture/overview.md) |
| The six contracts | [`docs/architecture/CONTRACTS.md`](docs/architecture/CONTRACTS.md) |
| Test pyramid + harness API reference | [`docs/operations/testing.md`](docs/operations/testing.md), [`packages/plugin-testing/README.md`](packages/plugin-testing/README.md) |
| Versioning rules + changeset workflow | [`docs/operations/release.md`](docs/operations/release.md); walkthrough in [`CONTRIBUTING.md`](CONTRIBUTING.md#5-add-a-changeset) |
| Config layer model + reader API | [`docs/architecture/CONFIGURATION.md`](docs/architecture/CONFIGURATION.md) |
| Theme tokens + CSS rules | [`docs/plugins/styling.md`](docs/plugins/styling.md) |
| Why the architecture is the way it is | [`docs/architecture/decisions/`](docs/architecture/decisions/) |
| What's deferred / waiting on upstream / open decisions | [`docs/operations/open-followups.md`](docs/operations/open-followups.md) |

## When in doubt

Read a sibling. The three `plugins/core-{episodes,series,upload}` packages are the canonical reference for in-tree feature plugins; `plugins/example/` is the minimal version. (`plugins/core` is infrastructure, not a template.) If your code looks structurally different from those, you are probably wrong before you are right.
