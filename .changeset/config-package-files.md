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

`@oc-mui/eslint-config` additionally gets its dependencies fixed: the ESLint
plugins its exported configs `import` at runtime (`@eslint/js`,
`typescript-eslint`, `eslint-plugin-{boundaries,import,only-warn,react,
react-hooks,turbo}`, `eslint-config-prettier`, `globals`, `graphql`,
`@graphql-eslint/eslint-plugin`) were declared under `devDependencies`, so a
consumer install would not have pulled them in. They move to `dependencies`,
and `eslint` itself becomes a `peerDependency`. This also adds
`eslint-plugin-import`, which `base.js` imports but was missing from the
manifest entirely (resolved only via workspace hoisting).
