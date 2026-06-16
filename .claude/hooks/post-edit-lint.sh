#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write|MultiEdit).
#
# Runs `eslint --fix` on the file Claude just edited, if it's a .ts/.tsx. Non-blocking
# by design (the edit already happened). We key off ESLint's exit codes:
#   0 → clean (or everything auto-fixed) → stay silent
#   1 → unfixable findings remain        → surface them to Claude (exit 2, non-blocking)
#   2 → ESLint itself crashed            → stay silent (don't nag about tooling)
#
# ESLint isn't a root dependency here (it's run per-package via turbo), so we invoke
# the binary that ships with the in-repo @opencast-mui/eslint-config package and run it from
# the repo root, where the flat config (eslint.config.mjs) and its plugins resolve.
#
# Note: this repo's config uses eslint-plugin-only-warn, so rule violations are
# warnings (exit 0), not errors. In practice this hook's job is the silent auto-fix;
# it only surfaces hard errors that survive only-warn. The blocking lint gate is
# `pnpm lint` / `pnpm verify`, which this hook intentionally does not duplicate.

set -uo pipefail

input=$(cat)

file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.filePath // empty' 2>/dev/null)
[ -z "$file" ] && exit 0

case "$file" in
  *.ts | *.tsx) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

eslint_bin="$repo_root/packages/eslint-config/node_modules/.bin/eslint"
if [ ! -x "$eslint_bin" ]; then
  # Fallback: any workspace package that pulled in eslint.
  eslint_bin=$(ls "$repo_root"/packages/*/node_modules/.bin/eslint 2>/dev/null | head -1)
fi
[ -x "$eslint_bin" ] || exit 0  # ESLint not installed yet → silent

cd "$repo_root" || exit 0

out=$("$eslint_bin" --fix --no-error-on-unmatched-pattern "$file" 2>/dev/null)
code=$?

if [ "$code" -eq 1 ]; then
  printf 'eslint: unresolved findings in %s (auto-fix applied where possible):\n%s\n' "$file" "$out" >&2
  exit 2
fi

exit 0
