#!/usr/bin/env bash
#
# verify-docs.sh — test-protocol.md §14 (documentation site), automated.
#
# Builds the VitePress site (which fails on dead internal links, so a green
# build doubles as a link check) and asserts the pre-1.0 crawler guards are
# present in the output: the `noindex` meta on built pages and robots.txt's
# `Disallow: /`. When the project goes public these guards are removed — at
# which point this script's last two checks should be flipped/deleted.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"
DIST="docs/.vitepress/dist"

say() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
fail() { echo "❌ $*"; exit 1; }

say "§14.8 docs build (VitePress — also fails on dead internal links)"
pnpm docs:build >/dev/null 2>&1 || fail "docs:build failed (often a dead internal link)"
test -f "${DIST}/index.html" || fail "no built index.html under ${DIST}"
echo "  ok — built site at ${DIST}"

say "§14.10 noindex guard present in built pages"
grep -rqiE 'name="robots"[^>]*noindex' "${DIST}" || fail "noindex meta missing from built HTML"
echo "  ok"

say "§14.11 robots.txt discourages crawlers"
test -f "${DIST}/robots.txt" || fail "robots.txt not emitted to ${DIST}"
grep -q "Disallow: /" "${DIST}/robots.txt" || fail "robots.txt missing 'Disallow: /'"
echo "  ok"

echo
echo "✅ §14 documentation site: PASS"
