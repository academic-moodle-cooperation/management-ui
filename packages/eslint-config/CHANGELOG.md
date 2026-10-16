# @oc-mui/eslint-config

## 1.1.0

### Minor Changes

- 85a910f: The config-slice boundary is mechanical now: the new `local/no-cross-plugin-config` rule flags any raw read of an AppConfig's `plugins` map (`useAppConfig().config.plugins[...]`, `config?.plugins?.[id]`), pointing at the `definePluginConfig` reader instead. The infrastructure that legitimately touches the raw map (the reader itself, the config-merge tests, route protection, the shell's loader and router provider) is enumerated as ignores next to the rule's wiring. The "no lint rule catches this yet, so reviews enforce it" comments across the workspace now name the rule.
- a5c54f6: The wrapper rule now covers drag-and-drop: `@dnd-kit/*` may only be imported by `@oc-mui/ui` itself, everyone else uses `SortableList` from `@oc-mui/ui/components`. Without the rule a plugin could import the library directly and ship its own copy; with it the facade can swap the implementation later without breaking plugins — the same contract `@oc-mui/router`, `@oc-mui/query`, `@oc-mui/i18n` and `@oc-mui/store` already give. `packages/ui` carries the matching self-exemption.
- ac86dd6: The semantic-token theme rule is now lint-enforced, and the codebase is swept clean

  New `local/no-palette-classes` ESLint rule (#297): Tailwind raw palette
  color classes (`text-gray-900`, `bg-amber-50`, `focus:ring-indigo-600`, …)
  are forbidden — they ignore the theme tokens, which is exactly how #279
  (unreadable dark-mode inputs) happened. The rule scans all string and
  template literals, so class strings in plain `.ts` style maps are covered
  too; the shadcn layer keeps its existing lint exemption.

  The sweep replaced ~70 palette usages across the table styles, the
  marketplace's amber/emerald status colors (→ `warning`/`ok` tokens, whose
  theme stability also removes the hand-written `dark:` duplicates), both
  table plugins and the language switcher. Three table row-color variants
  that are NAMED after fixed colors (`purple`, `dark`, `black`) keep their
  values under a reasoned eslint-disable — no semantic equivalent exists and
  removing them would break the exported variant type.

- a16ad96: `@oc-mui/ui/components` is the plugin SDK surface now — the host's assembly layer moved to a new `@oc-mui/ui/internal` entry.

  Moved out of `components`: `Appshell`, the router primitives (`UiRouterProvider`, `UiRouterPrimitives`, `useUiRouter`), `DefaultLandingPage`, the error pages (`ErrorPage`, `ErrorBoundary`, `NotFoundError`, `ForbiddenError`, `GeneralError`, `MaintenanceError`, `UnauthorizedError`) and `ThemeModeProvider`. Nothing a plugin uses changed: `NavMain`, `ThemeModeToggle`, `AppLoader`/`Loading` and every primitive stay in `components`. The internal entry carries no API report, is not shared with remote-loaded plugins, and `@oc-mui/eslint-config` now forbids importing it from `plugins/` and `.local-plugins/` (the shared restricted-import patterns are hoisted so the plugin-scoped rule extends rather than replaces them). `@oc-mui/app-runtime` and `@oc-mui/providers` import `ErrorBoundary` from the new entry instead of a deep path.

  Done before the first npm publish so the published surface is the one we intend to keep: 240 → 226 exports, every remaining one either used by a plugin today or a generic primitive.

### Patch Changes

- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 9fb57a9: SDK metadata fixes from the standalone-consumption findings (#291)

  - `@oc-mui/eslint-config` now declares `eslint-import-resolver-typescript`
    as a real dependency. It only existed at the monorepo root, so standalone
    consumers got ~50 "invalid interface loaded as resolver" warnings that
    failed `--max-warnings 0`.
  - `@oc-mui/vite-config` treats `vite` as a peerDependency instead of a
    dependency: the consumer's own vite must be the one the config plugs
    into, not a second nested copy that can drift from their CLI.
