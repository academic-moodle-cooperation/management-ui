# `apps/`

**Last Updated:** 2026-04-16

This directory contains the **deployable Vite applications** of the project. Since Phase 3 of the open-source cleanup (see [ADR-003](../docs/architecture/decisions/003-shell-plus-core-plugins.md)) there are only two, and both have a single, clearly scoped job:

| Directory          | Purpose                                                        | Port | Ships in prod? |
| ------------------ | -------------------------------------------------------------- | ---- | -------------- |
| [`shell/`](./shell)           | The one and only production application. Owns routing, layout, auth, theme, i18n, plugin loader. Exposes zero feature code itself. | 3000 | Yes            |
| [`playground/`](./playground) | Dev-only sandbox that boots a single plugin against the test harness, with no other plugins loaded. Used for plugin authoring and automated contract tests. | 3001 | No             |

All features (episodes, series, upload, the admin marketplace, and every organization-specific extension) are **core plugins** under [`plugins/core-*`](../plugins/README.md) or external plugins. The shell renders them by reading the `apps:definitions` extension point at runtime - there is no longer a `dynamic-modules.json` manifest, no `@monorepo-apps/*` Vite alias, and no `app-router.tsx`.

## Running

```bash
# Shell (the actual app)
pnpm --filter shell dev     # http://127.0.0.1:3000

# Playground (single-plugin dev sandbox)
pnpm --filter playground dev
```

From the monorepo root, `pnpm dev` starts both.

## Why this is only two apps

Before Phase 3, `apps/` held five Vite apps (`management-ui-core`, `-episodes`, `-series`, `-upload`, `-test`) and the shell loaded the feature apps dynamically via a second extension mechanism parallel to the plugin system. That produced two contracts, two lifecycles, and two testing stories for what is conceptually the same thing - "something the shell renders in its content area". ADR-003 collapses that into one mechanism: the plugin system. Feature code now lives in `plugins/core-*` and is registered through the same API that external plugin authors use, which keeps the public API honest.

If you are looking for the old app directories, they moved like this:

- `apps/management-ui-core/` → `apps/shell/`
- `apps/management-ui-episodes/` → `plugins/core-episodes/`
- `apps/management-ui-series/` → `plugins/core-series/`
- `apps/management-ui-upload/` → `plugins/core-upload/`
- `apps/management-ui-test/` → `apps/playground/`

## Adding a new app vs. adding a feature

Almost everything new should be a **plugin**, not an app. Only create a new directory under `apps/` if you are adding a second deployable entry point (for example, a standalone reporting UI shipped as its own bundle). For any in-shell feature, see [`plugins/README.md`](../plugins/README.md) and the "Create a core plugin" flow.
