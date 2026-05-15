---
---

Docs site: make the VitePress `base` path configurable via the
`DOCS_BASE` env var. Default unchanged (`/management-tool/`); a deploy
targeting a different GitHub Pages URL (e.g. a personal-repo
publication mirror at `<user>.github.io/management-ui/`) sets
`DOCS_BASE=/management-ui/` before building.

The `Deploy docs` workflow forwards the value through a repository
variable (`vars.DOCS_BASE`) — set it on the personal mirror in
**Settings → Secrets and variables → Actions → Variables**.

Strategy note for the interim personal-repo deploy is in
`docs/operations/open-followups.md` §8.3a.

No package code touched. Empty changeset records the doc-tooling
nature of the change.
