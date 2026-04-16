# TODO: extract this template into its own repository

This template currently lives inside the main monorepo so the existing
scaffolding scripts (`scripts/export-plugin-to-local.js`,
`scripts/extract-module-to-plugin.mjs`) can copy from it. Before the
1.0 open-source release it **must** move out, because:

- Community plugin authors should clone a small, focused starter repo,
  not the full Management UI monorepo.
- The template's dependencies are expressed as `peerDependencies`. That
  only makes sense when it is published / cloned independently.
- Keeping it out of tree prevents drift between "what the core needs" and
  "what a community plugin needs".

## Extraction plan

1. Create a new GitHub repository, e.g.
   `academic-moodle-cooperation/management-ui-community-plugin-template`.
2. Move the contents of this folder there using `git subtree split`
   (preserves history):
   ```bash
   git subtree split --prefix=examples/community-plugin-template \
     -b community-plugin-template-export
   # push the branch to the new repo, then clone and continue from there
   ```
3. Update the scaffolding scripts to either:
   - clone the template repo on demand (`git clone ... --depth 1`),
   - or pull a published npm package (`npm pack` artifact).
4. Delete this folder and `examples/` if no other examples remain.
5. Update docs (`docs/COMMUNITY_PLUGIN_DEVELOPMENT.md`,
   `README.md`, `llms.txt`) to point at the new repo URL.

Do **not** remove this file without completing the extraction.
