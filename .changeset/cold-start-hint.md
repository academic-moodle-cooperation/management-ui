---
"@oc-mui/vite-config": minor
---

Print a one-line hint when the shell dev server starts with a cold Vite
dependency cache. A cold `pnpm dev` blocks silently for 1–2 minutes during
workspace dependency pre-bundling before Vite's `ready in … ms` line, which
first-time testers read as a hang. A new `coldStartHintPlugin` (exported and
wired into `createShellAppViteConfig`) logs
"pre-bundling dependencies — a cold first run can take a few minutes …" once,
before the blocking phase, when `node_modules/.vite/deps/_metadata.json` is
missing. Dev-server only (`apply: "serve"`); warm starts stay unchanged.
