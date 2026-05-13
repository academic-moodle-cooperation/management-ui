---
---

Phase 3c — wire up VitePress for the public documentation site.

Adds `docs/.vitepress/config.mts` + `docs/index.md` (hero landing
page), `pnpm docs:dev` / `docs:build` / `docs:preview` scripts, and a
`.github/workflows/docs.yml` that builds on every PR (so reviewers see
the build pass) and deploys to GitHub Pages on `workflow_dispatch`.

A custom markdown link transformer rewrites cross-repo links
(`../packages/...`, `../AGENTS.md`, …) to GitHub permalinks at build
time, while leaving same-section docs-internal links alone for
VitePress to handle.

No package code touched. Empty changeset records the doc-tooling
nature of the change.
