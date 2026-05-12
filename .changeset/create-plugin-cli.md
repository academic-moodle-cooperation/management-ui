---
---

Phase 7 sub-task 3: introduce `pnpm create-plugin <name>` CLI.

This is a developer-tooling change (a new repo-root script + templates +
deleted legacy scripts + doc rewrites). No versioned workspace package
changes runtime behaviour; the only versioned package file that moved
is `plugins/README.md`, which is a docs-only update to the barrel
package and doesn't warrant a release.

The CLI scaffolds a fully-wired plugin (package.json, plugin.json,
tsconfig, vitest, contract test, README) at `.local-plugins/<name>/`
by default, or `plugins/<name>/` with `--in-tree`. The scaffolded
plugin passes `pnpm test:contract` on first run thanks to a placeholder
`app:header-logo` registration that the author replaces with their
real logic.

Removed: `scripts/export-plugin-to-local.js`,
`scripts/extract-module-to-plugin.mjs` and the corresponding root
scripts (`plugin:export-local`, `plugin:create-local`, `plugin:extract`).
Doc references to the legacy commands updated across the repo to point
at `pnpm create-plugin` instead.

See `AGENTS.md` → "Scaffolding a new plugin" for the new authoring
flow.
