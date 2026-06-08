---
"@oc-mui/eslint-config": patch
"@oc-mui/tailwind-config": patch
---

Add a `files` allowlist to the ship-as-source config packages so their
published tarballs contain exactly the consumed files.

`@oc-mui/eslint-config` and `@oc-mui/tailwind-config` had no `files` field,
so a publish would have shipped their tests, fixtures, own lint/tsconfig, and
vitest config. With the allowlist, `npm pack --dry-run` now yields only the
`exports` targets (+ their local imports), README, and package.json:

- eslint-config → `base.js`, `react-internal.js`, `type-aware.js`,
  `rules/index.js`, `rules/graphql-operation-naming.js`
- tailwind-config → `tailwind.config.ts`, `src/` (the two shadcn modules)

`@oc-mui/typescript-config` already had `files: ["*.json"]` and is unchanged.
These three config packages ship source intentionally (consumed by ESLint /
tsc / Tailwind directly), so no build step is involved — this is the first,
zero-risk slice of the broader exports→dist packaging work. `files` only
filters the tarball; monorepo consumers use workspace symlinks and are
unaffected.
