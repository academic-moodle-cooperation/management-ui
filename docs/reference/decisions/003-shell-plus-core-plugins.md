# ADR-003: Single App-Shell with Core Plugins

> **Reference — an architecture decision record.** A dated record of why a choice was made; it is not kept in sync with the code. What the code does *today* is [Architecture](../architecture.md) and [Contracts](../contracts.md).

**Status:** Accepted
**Date:** 2026-04-16
**Supersedes:** Parts of ADR-001 (multi-app loading) and ADR-002 (multiple apps in `apps/`)

## Context

The repository currently ships **five separate Vite applications** in `apps/`:

- `management-ui-core` (the app-shell)
- `management-ui-episodes`
- `management-ui-series`
- `management-ui-upload`
- `management-ui-test`

`management-ui-core` dynamically loads the other apps at runtime. At the same time, third-party extensions (org customizations, themes, marketplaces) load through the plugin system. This creates **two parallel extension mechanisms** with different contracts, different lifecycles, and different testing stories:

1. "First-class" features → independent Vite apps with privileged wiring.
2. "Extensions" → plugins loaded through `@oc-mui/plugin-system`.

Consequences observed in practice:

- Testing is split: each app needs its own dev server, build, and E2E setup.
- Theme compatibility is harder to guarantee across app boundaries.
- The plugin API is under-tested because core teams never use it for core features.
- External plugin authors face a different DX than internal developers.
- Configuration used to be merged at two points (build-time in `management-ui-core/vite.config.ts` and runtime via `plugins/index.ts` exports), which routinely drifted. Phase 2b replaced that with a single layered runtime merge (`app:config:defaults` ⊕ base ⊕ `app:config`) documented in [Configuration model](../configuration.md).
- Open-sourcing this model asks contributors to understand two architectures instead of one.

This ADR decides the target architecture for the open-source release.

## Decision

The system will consist of **exactly one deployable application** - the app-shell - plus **core plugins** that ship bundled and cover the features that today live in `apps/management-ui-*`. External/org plugins use the same mechanism.

### Concrete structure

```
apps/
├── shell/          # The only production Vite app; name "shell"
└── playground/     # Dev/test sandbox for isolated plugin development (replaces management-ui-test)

plugins/            # Only core plugins
├── core-episodes/
├── core-series/
├── core-upload/
└── core-marketplace/   # Plugin + theme marketplace (activation UI)
```

> *2026-08 note:* the marketplace plugin landed as
> [`plugins/admin-marketplace/`](../../../plugins/admin-marketplace/), not
> `core-marketplace/`. The rest of the structure shipped as written.

The shell renders routes, layout, auth, and theme - nothing else. Features (episodes, series, upload, dashboard, marketplace) are plugins with identical loading semantics and API surface as any third-party plugin.

### Key properties

1. **One extension mechanism.** Every feature, core or third-party, is a plugin. No privileged path.
2. **Dogfooded API.** Core teams build against the public plugin API. If the API is awkward, core suffers first.
3. **Single Vite build.** One bundle, one dev server, one E2E target. Org-specific deployment happens via config + plugin selection, not per-org builds.
4. **Theme guarantee.** Because everything is a plugin inside one host, themes always apply across all features.
5. **Playground isolation.** `apps/playground` renders a single plugin against the test harness, with no other plugins loaded. This is the sandbox for plugin authors and automated contract tests.

### What this replaces

- `apps/management-ui-core` → `apps/shell` (rename, simplified: only shell responsibilities remain).
- `apps/management-ui-episodes` / `-series` / `-upload` → `plugins/core-episodes` / `core-series` / `core-upload`.
- `apps/management-ui-test` → `apps/playground` (scope expanded from ad-hoc tests to "run any plugin in isolation").

## Rationale

### Why not keep multiple apps?

The multi-app model was originally chosen (ADR-001 "Standalone Apps" hint, ADR-002 structure) to allow independent deployment. In practice, all five apps deploy together through `apps/management-ui-core` anyway. The cost of two parallel extension models outweighs the independence benefit we never realized.

### Why not go all-in on remote runtime plugins?

Remote/JAR plugins remain fully supported - the plugin loader does not distinguish. The change is only that **core features are loaded through the same pipeline**, typically as bundled workspace packages for performance. Nothing prevents swapping a core plugin out for a remote replacement later.

### Why one shell and not a slimmer framework?

The app-shell must own: routing root, theme root, i18n root, auth, error boundaries, plugin loader initialization. Splitting these produces accidental coupling. A single shell with a clear, small surface is easier to keep stable across a major version cycle.

## Alternatives Considered

### Alternative 1: Keep the multi-app model

**Pros:** No migration, teams can theoretically deploy independently, existing test fixtures unchanged.
**Cons:** Two extension models, theme/i18n drift risk, harder E2E, unequal DX for external plugin authors, build-time org config coupling.
**Why rejected:** Preserves the exact problems that block a clean open-source release.

### Alternative 2: Everything is a plugin, including the shell

**Pros:** Maximum composability.
**Cons:** "Shell-level" concerns (error boundary, theme root, i18n root) need a well-defined root - making them plugins creates chicken-and-egg ordering and makes the API harder to stabilize. Routing root and auth also need a well-known owner.
**Why rejected:** Over-engineering without practical benefit. The shell is one file tree, not an extension point.

### Alternative 3: Module federation (Webpack/Vite)

**Pros:** True runtime independence per feature; different teams can ship independently.
**Cons:** Our actual deployment is a single artifact; federation's cost (tooling complexity, shared-deps pitfalls, hard TypeScript integration) does not pay off. Runtime plugin loading via the existing plugin system already covers dynamic loading.
**Why rejected:** Solves a problem we do not have.

## Consequences

### Positive

- One build, one dev server, one CI E2E target.
- External plugin DX equals internal DX - API stays honest.
- Theme, i18n, error, auth all bound to a single root.
- Config per org becomes deployment-time config file instead of a build-time rebuild.
- Open-source narrative is simple: "it's a shell plus plugins".
- Refactor payoff is high because the existing feature apps are small (a few files each).

### Negative

- One-time migration effort (apps → plugins).
- Larger initial bundle for the shell; code-splitting per plugin must be preserved.
- The shell becomes a dependency bottleneck for plugin authors - its API must be stable.

### Neutral

- The plugin loader already supports bundled, `.local-plugins/`, JAR, and remote registry paths; no loader change is required for this decision.
- The existing `plugin.json` manifest and `packages/plugin-system` stay - they are the vehicle for the change, not a casualty.

## Implementation Notes

- Phase 1 (this ADR + contracts) is documentation-only. No code moves.
- Phase 2 (see the repo cleanup plan) migrates apps to core plugins.
- Phase 2b redesigns the config system in line with this ADR so org config does not require rebuilds.

### Phase 3 completion (2026-04-16)

The migration mandated by this ADR has been carried out:

- `apps/management-ui-episodes` → `plugins/core-episodes` (route `/episodes` plus sidebar nav co-located in one plugin)
- `apps/management-ui-series` → `plugins/core-series` (including the "Create series" toolbar action that used to be a separate `series-create-implementation` plugin)
- `apps/management-ui-upload` → `plugins/core-upload` (route `/upload`, nested `/upload/:seriesId` handled by the shell's generic `$routeSubPath` child route)

With the three features gone, the legacy loading path has been removed as well: `apps/shell/src/app-router.tsx`, `apps/shell/public/dynamic-modules.json`, the `@monorepo-apps` Vite alias and tsconfig path, and the `plugins/core/apps/` nav-only plugins all no longer exist. `apps/shell/src/components/DynamicRouterProvider.tsx` now reads exclusively from the `apps:definitions` extension point, and `apps/` contains only `shell/` and `playground/`, as the structure above prescribes.

What has **not** been done yet and remains open:

- `@tanstack/react-table` and `mustache` are kept as plugin-level dependencies in `plugins/core-upload`. A later pass may move them behind `@oc-mui/ui` or a shared data-table seam.

### Phase 2b / C2 update (2026-04-16)

App `id`s and `config.plugins[...]` keys were normalized to the short
namespace (`episodes` / `series` / `upload`) now that Phase 3 is complete and
the core config type is about to become plugin-agnostic. `AppDefinition.id`,
the `apps:definitions` registry key, and every `config.plugins["management-ui-*"]`
lookup in the three core plugins use the short id. The default config in
`@oc-mui/ui-config` was updated to match. This is a breaking change for any
`config.json` keyed on the long names — the Phase 2b docs commit carries the
migration note.

## Related Decisions

- **ADR-001:** Plugin System Architecture - stays accepted, reinforced by this decision.
- **ADR-002:** Monorepo Structure - the dependency-layer model remains; the `apps/` directory will shrink to `shell/` and `playground/`.

## Review

- **Last Reviewed:** 2026-04-16
- **Next Review:** After Phase 2 migration is complete, or when adding any new top-level app.

## Status History

- 2026-04-16: Accepted - Target architecture for the open-source release.
