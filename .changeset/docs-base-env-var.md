---
---

Docs site: make the VitePress `base` path configurable via the
`DOCS_BASE` env var. Default unchanged (`/management-tool/`); a deploy
targeting a different GitHub Pages URL sets `DOCS_BASE=/<repo-name>/`
before building.

The `Deploy docs` workflow forwards the value through a repository
variable (`vars.DOCS_BASE`), set in **Settings → Secrets and variables
→ Actions → Variables**.

No package code touched. Empty changeset records the doc-tooling
nature of the change.
