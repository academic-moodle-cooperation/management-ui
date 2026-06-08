---
"@oc-mui/plugin-testing": patch
"@oc-mui/ui-config": patch
---

Ship a built `dist/` for `@oc-mui/plugin-testing` and `@oc-mui/ui-config` so
external consumers get compiled JS instead of raw `.ts`.

Each gains a tsup `build` (ESM JS → `dist/`) while declarations keep coming
from `tsc` (`build:types` → `dist-types/`), which also feeds api-extractor —
so the `.api.md` pipeline is untouched.

To preserve the in-repo dev/test experience (vite/vitest resolve `@oc-mui/*`
to live TypeScript source via `exports`), the package-level `exports` still
point at `src`. A `publishConfig.exports` (applied by pnpm at pack/publish
time) swaps them to `dist` + `dist-types`, and `files` ships only those. The
result, verified with `pnpm pack`: a tarball whose `exports`/`main`/`types`
resolve to `dist`, containing only `dist/`, `dist-types/`, README, and LICENSE
— no source or tests.

First two packages of the tsup conversion (the source-exporting SDK
packages). The remaining ones follow.
