---
"@oc-mui/plugin-testing": patch
"@oc-mui/ui-config": patch
"@oc-mui/store": patch
"@oc-mui/query": patch
"@oc-mui/i18n": patch
"@oc-mui/plugin-system": patch
"@oc-mui/router": patch
"@oc-mui/app-runtime": patch
"@oc-mui/plugin-core": patch
"@oc-mui/ui": patch
---

Ship a built `dist/` for the SDK packages so external consumers get compiled
JS instead of raw `.ts`/`.tsx`.

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
- `app-runtime` — gained a `build:types` + `tsconfig.build.json` and a `types`
  export condition it lacked; declarations emit to `dist-types/src/`.
- `router` — declarations emit to `dist-types/src/` (preserved by its build
  tsconfig); `publishConfig` points there.
- `plugin-core` — had **no `exports` field at all** and was effectively a
  bundler-resolved package; it now declares proper `exports` (root `index.ts`
  entry), a build/types pipeline, and moves `react` from `dependencies` to
  `peerDependencies` (the same fix the other runtime packages got — previously
  missed here).
- `ui` — multi-entry tsup over the whole component tree (~95 components, incl.
  the `./components/*` and `./hooks/*` wildcard targets, structure mirrored
  into `dist/`). `globals.css` and bundled fonts are copied verbatim into
  `dist/styles` (the CSS is a Tailwind-v4 entry the consumer processes, not
  built). `globals.css` was also cleaned for external consumers: the
  monorepo-specific `@source` globs (apps/plugins/.local-plugins) moved out of
  the shared stylesheet into the shell's own Tailwind entry, leaving only a
  self-scan of the library's own files. A consumer now gets working styling
  from `@import "@oc-mui/ui/globals.css"` alone (component classes + tokens +
  fonts; Tailwind v4 auto-scans their own project). Verified pixel-identical
  against the visual-regression baselines and with a real external Tailwind
  build.

Verified with `pnpm pack`: each tarball's `exports`/`main`/`types` resolve to
`dist`, containing only built output + README + LICENSE — no source or tests.
Workspace build + build:types + api-check:ci + check-types all green;
converted packages' tests + a consumer contract test pass.
