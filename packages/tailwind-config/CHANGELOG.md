# @oc-mui/tailwind-config

## 1.0.3

### Patch Changes

- 9cd60b8: Dependency maintenance: minor/patch bumps of `lucide-react` (0.417 → 0.577, still the host-provided 0.x major), `tailwindcss`/`@tailwindcss/vite`, `autoprefixer`, `typescript-eslint`, `@microsoft/api-extractor`, `@playwright/test`, `@swc/helpers`, `@tanstack/react-query-devtools` and `@graphql-codegen/typescript-operations`.

## 1.0.2

### Patch Changes

- 25ad329: Dependency maintenance: TypeScript 5.5 → 6.0. The `tsconfig.json` files drop
  the now-deprecated `baseUrl` (every `paths` entry was already relative to the
  config file), `@oc-mui/vite-config` sets `rootDir` explicitly, and the
  packages that side-effect-import a stylesheet without resolving `vite/client`
  declare `*.css` themselves, since TypeScript 6 rejects unresolved side-effect
  imports by default.

## 1.0.1

### Patch Changes

- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
