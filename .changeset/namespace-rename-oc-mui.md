---
---

Phase 6b: namespace rename `@workspace/*` → `@opencast-mui/*` across the
entire workspace. Plus the special-case unscoped `plugin-core` →
`@opencast-mui/plugin-core`.

This is a package-identifier change, not a behaviour change. Since no
package has been published yet (the changesets config still has
`access: "restricted"` and Phase 6d is the deliberate flip), we are
keeping every package at its current `1.0.0` rather than treating the
rename as a major bump. The first public release on `@opencast-mui/*` will be
`1.0.0` of those packages.

What changed:

- Every `@workspace/<name>` import string in every source file (`.ts`,
  `.tsx`, `.js`, `.jsx`, `.mjs`) rewritten.
- Every `name` and `workspace:*` dependency entry in every
  `package.json` rewritten.
- Documentation refs in `.md`, `llms.txt`, `turbo.json`, and the
  `create-plugin` CLI templates (`scripts/templates/create-plugin/*.tpl`)
  rewritten so newly scaffolded plugins use the new namespace.
- Existing changeset markdown files (`.changeset/*.md`) updated so
  their target package names match.
- `etc/<pkg>.api.md` snapshots regenerated (the import lines they
  record now reference the new namespace).
- `pnpm-lock.yaml` regenerated.
- `pnpm verify` re-run: 88 turbo tasks + Playwright smoke, all green.
- Boundaries rule sanity-checked: deliberate cross-plugin import is
  still caught; the `plugins/core` exception still resolves (the
  boundaries config matches on folder name, not package name, so
  the rename had no effect on it).

What stayed the same:

- `shell`, `playground` — apps with no `@-scope`, unchanged.
- `pnpm-workspace.yaml` patterns — folder-based, not name-based.
- `boundaries/elements` in `@opencast-mui/eslint-config/base.js` — folder
  patterns (`apps/*`, `plugins/*`, `packages/*`), survived untouched.
- All file paths and directory names.
- Plugin namespaces, plugin IDs, plugin types declared in
  `plugin.json` manifests — these are content of the package, not
  the package identifier.

Empty changeset records the rename without bumping versions.
