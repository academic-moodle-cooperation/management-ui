---
"@opencast-mui/ui": minor
---

Make `@opencast-mui/ui` router-free (resolves the `@opencast-mui/ui → @opencast-mui/router`
layering inversion, open-followups §3.5).

The three router-aware components (`nav-main`, the data table body +
empty-state) no longer import `@opencast-mui/router`. Instead they read a new
`UiRouterProvider` context (`router-context.tsx`) for their `Link` and the
current pathname; the host app (the shell) fills it with `@opencast-mui/router`'s
real `Link` + a `useRouterState`-derived pathname. The context ships
functional defaults (a plain `<a>` and an empty path), so the components
still render without a provider (tests, Storybook, standalone) — just
without active-route awareness. `@opencast-mui/router` is removed from
`@opencast-mui/ui`'s dependencies.

New exports: `UiRouterProvider`, `useUiRouter`, `UiRouterPrimitives`,
`UiLinkProps`.
