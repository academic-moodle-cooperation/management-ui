---
"@opencast-mui/ui": patch
"@opencast-mui/i18n": patch
"@opencast-mui/router": patch
---

i18n sweep, part 2: translate the remaining shipped user-facing strings (en + de).

- `@opencast-mui/ui`: `DefaultLandingPage`, the datatable empty-state ("No results."),
  `MetadataUpdateField` ("Pick a Date"), and the sidebar a11y strings
  (`sr-only`/`aria-label`/SheetTitle: Sidebar / Toggle Sidebar / Close sidebar).
- shell: `ConfigLoadError` user-facing chrome (title, prod message, buttons).
  The dev-only setup instructions stay English (developer tooling, mirrors the
  English terminal notice).
- `@opencast-mui/router`: the auth-route fallbacks (loading + config-error +
  "no login method"). `@opencast-mui/i18n` added as a router dependency (it's a leaf
  package, so no cycle).

New keys under `common.{landing,configError,authRoutes,a11y,datepicker,noResults}`,
added to both locales (parity verified). `ProtectedRoute`/`protectedRouteUtils`
default fallbacks are left English — they're rarely-shown defaults that consumers
override, and the matching strings in those files are JSDoc examples.
