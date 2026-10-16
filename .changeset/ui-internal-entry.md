---
"@oc-mui/ui": minor
"@oc-mui/app-runtime": patch
"@oc-mui/providers": patch
"@oc-mui/eslint-config": minor
---

`@oc-mui/ui/components` is the plugin SDK surface now — the host's assembly layer moved to a new `@oc-mui/ui/internal` entry.

Moved out of `components`: `Appshell`, the router primitives (`UiRouterProvider`, `UiRouterPrimitives`, `useUiRouter`), `DefaultLandingPage`, the error pages (`ErrorPage`, `ErrorBoundary`, `NotFoundError`, `ForbiddenError`, `GeneralError`, `MaintenanceError`, `UnauthorizedError`) and `ThemeModeProvider`. Nothing a plugin uses changed: `NavMain`, `ThemeModeToggle`, `AppLoader`/`Loading` and every primitive stay in `components`. The internal entry carries no API report, is not shared with remote-loaded plugins, and `@oc-mui/eslint-config` now forbids importing it from `plugins/` and `.local-plugins/` (the shared restricted-import patterns are hoisted so the plugin-scoped rule extends rather than replaces them). `@oc-mui/app-runtime` and `@oc-mui/providers` import `ErrorBoundary` from the new entry instead of a deep path.

Done before the first npm publish so the published surface is the one we intend to keep: 240 → 226 exports, every remaining one either used by a plugin today or a generic primitive.
