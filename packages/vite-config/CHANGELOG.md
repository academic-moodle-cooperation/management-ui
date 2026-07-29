# @oc-mui/vite-config

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
