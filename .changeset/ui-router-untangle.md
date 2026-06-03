---
"@oc-mui/ui": minor
---

Make `@oc-mui/ui` router-free (resolves the `@oc-mui/ui → @oc-mui/router`
layering inversion, open-followups §3.5).

The three router-aware components (`nav-main`, the data table body +
empty-state) no longer import `@oc-mui/router`. Instead they read a new
`UiRouterProvider` context (`router-context.tsx`) for their `Link` and the
current pathname; the host app (the shell) fills it with `@oc-mui/router`'s
real `Link` + a `useRouterState`-derived pathname. The context ships
functional defaults (a plain `<a>` and an empty path), so the components
still render without a provider (tests, Storybook, standalone) — just
without active-route awareness. `@oc-mui/router` is removed from
`@oc-mui/ui`'s dependencies.

New exports: `UiRouterProvider`, `useUiRouter`, `UiRouterPrimitives`,
`UiLinkProps`.
