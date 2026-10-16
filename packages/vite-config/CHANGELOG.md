# @oc-mui/vite-config

## 1.1.1

### Patch Changes

- 087db83: `createCommunityPluginConfig` now names the extracted stylesheet after the plugin (`dist/<pluginName>.css`), matching the `.mjs` next to it. Vite's default derived the name from `package.json` instead (`dist/plugin-<name>.css` for a scaffolded `@oc-mui/plugin-<name>`), so a JAR's `cssUrl` — and the remote loader's `<name>.css` fallback — pointed at a file that did not exist. If a plugin's `plugin.json` hard-codes the old `plugin-<name>.css` name in its `css` field, update it to `dist/<name>.css`.
- Dependency maintenance: the October minor/patch group (47 packages) — the Radix primitives, react-aria/react-stately, Tailwind 4.3, zod 4.6, graphql-request 7.4, Playwright 1.64, api-extractor 7.59, typescript-eslint 8.71 and the rest. No code changes.

  Three bumps from the group are deliberately not taken, each with the reason recorded next to the pin:

  - **React stays on 19.1** (`pnpm.overrides` + root dev dependencies so every peer resolves to the same copy). React ≥ 19.2 logs a console error for the theme `<script>` that `next-themes` 0.4.6 renders, and the E2E smoke test asserts zero console errors; upstream is unresolved (pacocoursey/next-themes #385/#387/#397). Lifted once the theme provider no longer renders a script.
  - **`@tanstack/router-devtools` stays on 1.125**, together with `react-router-devtools` and `router-devtools-core`: the devtools import `@tanstack/router-core` internals and only work with the router minor they shipped with; the newer versions broke Vite's pre-bundling and with it the dev server.
  - **`@types/node` is pinned to the workspace's `^25`** across the tree: optional `@types/node` peers otherwise resolve to the newest major in packages that declare none, which splits Vite into two type-incompatible instances.

- 3b40cfc: Documentation-only: correct package READMEs against the code (docs overhaul Phase 1).
- 6f83e29: Serve root-level plugin locales from the `.local-plugins` dev mount. Locale discovery (dev-server manifest + middleware) and the shell's static-copy targets now honor the canonical `<plugin>/locales/<namespace>/<lng>.json` layout — relocatable via `plugin.json`'s `locales` field — in addition to the multi-module `modules/<module>/locales/` layout, so scaffolded plugins get their translations in the dev shell without mirroring files into `modules/`. When both layouts ship the same namespace, the root-level files win.
- 9fb57a9: SDK metadata fixes from the standalone-consumption findings (#291)

  - `@oc-mui/eslint-config` now declares `eslint-import-resolver-typescript`
    as a real dependency. It only existed at the monorepo root, so standalone
    consumers got ~50 "invalid interface loaded as resolver" warnings that
    failed `--max-warnings 0`.
  - `@oc-mui/vite-config` treats `vite` as a peerDependency instead of a
    dependency: the consumer's own vite must be the one the config plugs
    into, not a second nested copy that can drift from their CLI.

- Updated dependencies [3b40cfc]
- Updated dependencies [31c19e7]
- Updated dependencies [9db8ada]
- Updated dependencies [a36e731]
- Updated dependencies [2044d7f]
  - @oc-mui/utils@1.2.0

## 1.1.0

### Minor Changes

- 11f5d2c: Print a one-line hint when the shell dev server starts with a cold Vite
  dependency cache. A cold `pnpm dev` blocks silently for 1–2 minutes during
  workspace dependency pre-bundling before Vite's `ready in … ms` line, which
  first-time testers read as a hang. A new `coldStartHintPlugin` (exported and
  wired into `createShellAppViteConfig`) logs
  "pre-bundling dependencies — a cold first run can take a few minutes …" once,
  before the blocking phase, when `node_modules/.vite/deps/_metadata.json` is
  missing. Dev-server only (`apply: "serve"`); warm starts stay unchanged.

### Patch Changes

- d9ed780: Complete the shell dev-server source aliases: `@oc-mui/app-runtime`,
  `@oc-mui/store` (root-level entry + `atoms`/`useStore`/`useTableStore`
  subpaths), and `@oc-mui/plugin-core` were missing from the alias map. With dist
  as the canonical entry point, un-aliased workspace imports resolve to `dist/` —
  on an unbuilt tree Vite's dependency scan then failed with "Failed to resolve
  entry for package \"@oc-mui/app-runtime\"" and the dev server never became
  ready (this is how the CI E2E job failed). The aliases restore source
  resolution for those packages in shell dev; independently, dev now assumes a
  built SDK (the E2E workflow builds it first).
- 375dc20: Fix stale symbol names in the package README: the usage examples showed
  `shellConfig`, `communityPluginConfig`, and `baseConfig`, which don't exist —
  the real exports are `createShellAppViteConfig`, `createCommunityPluginConfig`,
  and `createBaseConfig`. Examples now match the actual signatures, and the
  internal-plugins section mentions `coldStartHintPlugin`. Docs-only; no runtime
  change.
- Updated dependencies [4451b10]
- Updated dependencies [ed4a3d8]
  - @oc-mui/utils@1.1.0
