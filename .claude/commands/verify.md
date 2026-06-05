---
description: Run the canonical pre-push gate (pnpm verify)
allowed-tools: Bash(pnpm verify:*), Bash(pnpm exec turbo:*), Bash(pnpm exec playwright:*)
---

Run the project's canonical pre-push gate and report the result.

Run `pnpm verify` from the repo root. It runs, in the same order as CI:
**lint → check-types → build → unit tests → contract tests → api-check → Playwright E2E.**

- If it passes, say so plainly — CI will pass too (modulo cold-start E2E flakes that
  Playwright retries).
- If it fails, show the failing step's output and stop at the first failure. Do **not**
  hand-edit generated files to make it pass — API reports come from `pnpm api-check`,
  the lockfile from `pnpm install`, and `etc/*.api.md` / `dist/` are protected by a hook.
- The E2E step starts the shell dev server on **port 3000** via `pnpm --filter shell dev`.
  Because `reuseExistingServer` is on locally, if something else is already serving
  port 3000 the suite tests *that* server, not this build — stop the other process first.
- If you only changed a single plugin/package and want a fast loop instead, prefer
  `pnpm --filter @oc-mui/plugin-<name> test` / `test:contract` (see AGENTS.md).
