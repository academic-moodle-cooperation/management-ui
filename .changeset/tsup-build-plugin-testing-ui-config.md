---
"@oc-mui/plugin-testing": patch
"@oc-mui/ui-config": patch
"@oc-mui/store": patch
"@oc-mui/query": patch
"@oc-mui/i18n": patch
---

Ship a built `dist/` for the pure-TS SDK packages so external consumers get
compiled JS instead of raw `.ts`/`.tsx`.

Each gains a tsup `build` (ESM JS → `dist/`) while declarations keep coming
from `tsc` (`build:types` → `dist-types/`), which also feeds api-extractor —
so the `.api.md` pipeline is untouched (verified green for all four
instrumented packages here).

Dev/test resolution is preserved: package-level `exports` still point at
`src`, so vite/vitest keep resolving `@oc-mui/*` to live TypeScript. A
`publishConfig.exports` (applied by pnpm at pack/publish) swaps them to
`dist` + `dist-types`, and `files` ships only those.

Per-package notes:
- `store` — multi-entry tsup for its 4 subpath exports (flat-root layout).
- `query` — single entry; codegen scripts and `.graphql` are dev-only inputs,
  not bundled.
- `i18n` — tsup replaces the old `tsc --build`; locale JSON (runtime HTTP
  assets) is copied to `dist/locales` on build.

Verified with `pnpm pack`: each tarball's `exports`/`main`/`types` resolve to
`dist`, containing only built output + README + LICENSE — no source or tests.
Workspace build + build:types + api-check:ci + check-types all green;
converted packages' tests + a consumer contract test pass.
