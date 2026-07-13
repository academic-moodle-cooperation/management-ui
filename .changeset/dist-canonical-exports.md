---
"@oc-mui/app-runtime": patch
"@oc-mui/i18n": patch
"@oc-mui/plugin-system": patch
"@oc-mui/plugin-testing": patch
"@oc-mui/query": patch
"@oc-mui/router": patch
"@oc-mui/store": patch
"@oc-mui/ui": patch
"@oc-mui/ui-config": patch
"@oc-mui/plugin-core": patch
---

Make `dist` the canonical published entry point so an `npm`-based publish can't ship broken packages.

Previously each package's top-level `main`/`types`/`exports` pointed at `./src/*`,
with the `dist`-pointing map only under `publishConfig`. That is only correct when
the publish tool applies `publishConfig` (pnpm does; `npm publish`/`npm pack` do
not) — so a plain `npm publish` (e.g. the first-publish bootstrap) would ship a
tarball whose entry points resolve to `src/`, which isn't in the published `files`.

Now the top-level `exports` are `dist`-canonical for consumers, and `publishConfig`
is reduced to `{ "access": "public" }`. There is deliberately no `development`
condition pointing at `src`: vite/vitest activate `development` by default, so a
published map carrying it would send *consumers'* tooling to a `src/` path that is
not in the tarball (caught by the SDK publish smoke-test). Inside the monorepo the
dev server resolves source via the shell's vite aliases, and tests resolve built
`dist` (turbo orders `^build`/`^build:types` first). No public API changed; this is
packaging metadata only.

Note this fixes the *entry points* only. `workspace:*` dependency specifiers are
still rewritten to real ranges by `pnpm publish` (which `changeset publish` uses),
not by plain `npm publish` — so the first-publish bootstrap must use `pnpm`, as
documented in `.github/workflows/release.yml`.
