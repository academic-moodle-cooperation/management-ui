---
---

Phase 8.5.1a — GraphQL Operation Naming Contract 1.0.

New §6 in `docs/architecture/CONTRACTS.md` formalises that every
`query`/`mutation`/`subscription`/`fragment` declared in a plugin (or in
`@oc-mui/query` for shared core operations) must be prefixed with the
plugin's namespace in PascalCase (`MuiGetMyEvents`,
`EpisodesEpisodeFields`, …). Avoids collisions at GraphQL Codegen,
attributes server-side load per plugin, isolates the TanStack Query
cache.

No enforcement code in this PR — documentation + manual review only.
ESLint rule and migration of legacy operations are tracked as the next
follow-ups in `docs/operations/open-followups.md` §5.1.

Scaffold script now exposes a `__PLUGIN_PASCAL_NAME__` template
variable for use in the scaffolded README. Empty changeset records the
doc-only nature of the change.
