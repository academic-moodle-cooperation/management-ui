---
---

Phase 3a — docs/ tree restructure. No versioned package code touched: this
PR rearranges and rewrites markdown files under `docs/` (and refreshes
the cross-references in `README.md`, `AGENTS.md`, `CONTRIBUTING.md`,
`llms.txt`, `SECURITY.md`, and the surviving package/app/plugin READMEs).
Also adds a new pre-flight rule in `AGENTS.md` and `CONTRIBUTING.md`:
docs that go stale because of a behaviour change must be fixed in the
same PR as the code change.

Empty changeset records the doc-only / rules-only nature of the change
without bumping any package versions.
