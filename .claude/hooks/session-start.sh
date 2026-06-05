#!/usr/bin/env bash
# SessionStart hook.
#
# 1. If node_modules/ is missing, install once with the frozen lockfile. This is a
#    big monorepo, so we ONLY install when it's actually absent — a warm checkout
#    no-ops and the hook returns near-instantly.
# 2. Emit a command cheat-sheet as SessionStart additionalContext (JSON on stdout).
#
# All install logging goes to stderr so stdout stays clean JSON.

set -uo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$repo_root" || exit 0

if [ ! -d node_modules ]; then
  echo "[session-start] node_modules missing — running 'pnpm install --frozen-lockfile'…" >&2
  if command -v pnpm >/dev/null 2>&1; then
    # Redirect install stdout to stderr so it never pollutes the JSON below.
    pnpm install --frozen-lockfile >&2 \
      || echo "[session-start] pnpm install failed — run 'pnpm install' manually." >&2
  else
    echo "[session-start] pnpm not on PATH — install pnpm@10 (corepack enable)." >&2
  fi
fi

read -r -d '' cheatsheet <<'EOF'
Management UI — Claude Code quick reference (rules live in AGENTS.md):
  pnpm verify         Canonical pre-push gate: lint → check-types → build → unit
                      → contract → api-check → Playwright E2E. Run before finishing.
  pnpm lint           ESLint (wrapper-library + architectural boundary rules)
  pnpm check-types    Project-wide TypeScript
  pnpm test           Vitest unit tests
  pnpm test:contract  Plugin contract tests (every plugin ships plugin.contract.test.ts)
  pnpm api-check      Regenerate packages/*/etc/*.api.md after a public-API change
  pnpm build          Turborepo build
  pnpm dev            Vite dev server → http://127.0.0.1:3000/management-ui/
  pnpm create-plugin <name> [--in-tree]   Scaffold a plugin (.local-plugins/ by default)
Slash commands: /verify, /new-plugin   Skill: pre-flight-check   Subagent: plugin-boundary-reviewer
EOF

if command -v jq >/dev/null 2>&1; then
  jq -n --arg ctx "$cheatsheet" \
    '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}'
else
  # jq absent: still surface the cheat-sheet via stderr; emit no stdout context.
  printf '%s\n' "$cheatsheet" >&2
fi

exit 0
