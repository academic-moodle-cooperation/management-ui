See @AGENTS.md for all project conventions.

`AGENTS.md` is the canonical operational guide for AI agents in this repo — plugin
layout, import boundaries, contract tests, config slices, versioning/changesets, and
the `pnpm verify` pre-push gate. The human contributor path is
`docs/contribute/` (`CONTRIBUTING.md` is a short pointer into it), and
`docs/reference/architecture.md` is the architecture tour. Read those first; this file only documents the Claude Code-specific layer that sits on top.

## Working with Claude Code

**Slash commands** (you type these):

- `/verify` — run the canonical pre-push gate (`pnpm verify`; the step list lives in
  [AGENTS.md → Pre-push gate](AGENTS.md#pre-push-gate--pnpm-verify)).
- `/new-plugin <name> [--in-tree]` — scaffold a plugin with `pnpm create-plugin` and
  wire it to the AGENTS.md layout (`.local-plugins/` by default; `--in-tree` for a
  built-in plugin shipped with the repo).

**Skills** (Claude invokes these on its own when relevant):

- `pre-flight-check` — walks the AGENTS.md pre-flight checklist before a
  plugin/package change is declared done.

**Subagents**:

- `plugin-boundary-reviewer` — read-only reviewer enforcing the AGENTS.md import
  boundaries, the config-slice rule, the required contract test, and the
  changeset + `api-check` requirement for public-API changes. Runs proactively after
  plugin work; ask for it by name with "review plugin boundaries".
- `docs-impact-reviewer` — read-only reviewer enforcing AGENTS.md pre-flight item 8
  ("any doc your change makes stale is updated in the same PR"): given a diff, it
  finds every doc page naming a touched identifier and flags the unupdated ones.
  Runs proactively after code changes that touch public symbols, commands, or config
  keys; ask for it by name with "review docs impact".

**Hooks** (configured in `.claude/settings.json`, run automatically):

- *Session start* — installs dependencies if `node_modules/` is missing, then loads a
  command cheat-sheet into context.
- *Generated-file guard* — blocks hand-edits to `dist/`, `dist-types/`, `target/`,
  `*.tsbuildinfo`, `pnpm-lock.yaml`, `packages/*/etc/*.api.md`, and GraphQL codegen
  output, pointing to the regeneration command instead.
- *Post-edit lint* — runs `eslint --fix` on edited `.ts`/`.tsx` files (non-blocking).

See `.claude/README.md` for how this configuration is organized and how to extend it.
