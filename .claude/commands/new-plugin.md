---
description: Scaffold a new plugin and wire it to the AGENTS.md layout
argument-hint: <plugin-name> [--in-tree] [--template app]
allowed-tools: Bash(pnpm create-plugin:*), Bash(pnpm install:*), Bash(pnpm test:*), Read, Edit, Glob, Grep
---

Scaffold a new plugin (`$ARGUMENTS`) and finish wiring it per `AGENTS.md`.

1. **Pick the location** (confirm with me if it's ambiguous):
   - `pnpm create-plugin <name>` → `.local-plugins/<name>/` (gitignored; for org /
     community plugins; ships a Maven `backend/` POM by default — pass `--no-pom` to skip).
   - `pnpm create-plugin <name> --in-tree` → `plugins/<name>/` (a built-in plugin shipped
     with the OSS repo; no Maven layout). Only for core contributors.
   - Add `--template app` for a visible screen + sidebar entry; the default `minimal`
     template is a placeholder `app:header-logo` registration with no visible effect.

2. **Run the scaffolder.** It writes the canonical layout (`package.json`, `plugin.json`,
   `tsconfig.json`, `vitest.config.ts`, `src/index.ts`, `src/plugin.contract.test.ts`)
   and runs `pnpm install` to link the package into the workspace.

3. **Confirm the contract test is green out of the box:**
   `pnpm --filter @oc-mui/plugin-<name> test:contract`.

4. **Replace the placeholder.** Update `src/index.ts`'s `initialize()` registrations and
   keep `plugin.json`'s `extensionPoints` array in sync — the contract test fails if a
   declared extension point isn't populated (or vice-versa). Keep all
   `manager.registerObject(...)` calls in `initialize()`, not `activate()`.

5. **Respect the boundaries** (AGENTS.md → Boundaries). The plugin may import only
   `@oc-mui/*`, `plugins/core`, itself, and already-wrapped third-party libs. Never
   import from `apps/*`, another plugin, or a wrapped library directly (use
   `@oc-mui/router`, not `@tanstack/react-router`; `@oc-mui/query`, `@oc-mui/i18n`,
   `@oc-mui/store` likewise).

A `.local-plugins/` plugin is **never** added to `plugins/index.ts`. When the plugin
work is done, run the `pre-flight-check` skill (or `/verify`) before declaring it complete.
