#!/usr/bin/env bash
#
# verify-docs.sh — test-protocol.md §14 (documentation site), automated.
# Wired up as `pnpm test:docs`.
#
# Builds the VitePress site with dead-link checking enabled
# (`ignoreDeadLinks: false` in docs/.vitepress/config.mts), so the build
# fails on any dead internal link and a green build doubles as a link check.
# Then asserts the site is publicly indexable: no `noindex` meta in built
# pages and a permissive robots.txt. (Pre-public these checks asserted the
# opposite — the crawler guards; they flipped with the go-public PR, as the
# guards' comments prescribed.)
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

say "§14.10 built pages carry no noindex meta"
if grep -rqiE 'name="robots"[^>]*noindex' "${DIST}"; then
  fail "noindex meta found in built HTML — the site is public, nothing may reintroduce it"
fi
echo "  ok"

say "§14.11 robots.txt permits crawlers"
test -f "${DIST}/robots.txt" || fail "robots.txt not emitted to ${DIST}"
if grep -Eq "Disallow: */$" "${DIST}/robots.txt"; then
  fail "robots.txt still carries 'Disallow: /' — the site is public"
fi
echo "  ok"

echo
echo "✅ §14 documentation site: PASS"
