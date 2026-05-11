# TODO: extract this template into its own repository (or retire it)

This template lived inside the main monorepo so the previous scaffolding
scripts (`scripts/export-plugin-to-local.js`,
`scripts/extract-module-to-plugin.mjs`) could copy from it. Those scripts
have since been replaced by `pnpm create-plugin` (which carries its own
template under `scripts/templates/create-plugin/`), so this directory's
original reason for existing is gone.

Two possible end-states; the open-source release should pick one:

1. **Retire it.** `scripts/templates/create-plugin/` already provides the
   minimal starting point a new plugin author needs, and `pnpm create-plugin`
   scaffolds it directly. The bigger "community-plugin-template" with its
   own `peerDependencies` story may be redundant after Phase 6 (publishing).
   Delete this folder + `examples/` and update the docs pointers.
2. **Extract it.** If community authors should clone a small, focused
   starter repo rather than scaffold via the CLI:
   - Create a new GitHub repository, e.g.
     `academic-moodle-cooperation/management-ui-community-plugin-template`.
   - Move the contents of this folder there using `git subtree split`
     (preserves history):
     ```bash
     git subtree split --prefix=examples/community-plugin-template \
       -b community-plugin-template-export
     # push the branch to the new repo, then clone and continue from there
     ```
   - Delete this folder and `examples/` if no other examples remain.
   - Update docs (`docs/COMMUNITY_PLUGIN_DEVELOPMENT.md`,
     `README.md`, `llms.txt`) to point at the new repo URL.

Do **not** remove this file without picking and executing one of the
two options above.
