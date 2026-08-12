---
"@oc-mui/eslint-config": patch
"@oc-mui/vite-config": patch
---

SDK metadata fixes from the standalone-consumption findings (#291)

- `@oc-mui/eslint-config` now declares `eslint-import-resolver-typescript`
  as a real dependency. It only existed at the monorepo root, so standalone
  consumers got ~50 "invalid interface loaded as resolver" warnings that
  failed `--max-warnings 0`.
- `@oc-mui/vite-config` treats `vite` as a peerDependency instead of a
  dependency: the consumer's own vite must be the one the config plugs
  into, not a second nested copy that can drift from their CLI.
