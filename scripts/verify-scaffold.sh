#!/usr/bin/env bash
#
# verify-scaffold.sh — test-protocol.md §8 (plugin scaffolding), automated.
#
# Scaffolds all three create-plugin modes, asserts the generated tree for each,
# runs the contract test + type-check on the default scaffold, and cleans
# everything up (scaffolds + lockfile + any touched tracked file) on exit.
#
# Mutates the working tree (scaffolds plugins, `pnpm install`), so it's its own
# command, not part of the default suite.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

DEFAULT="trial-default"
NOPOM="trial-no-pom"
INTREE="trial-in-tree"

say() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
fail() { echo "❌ $*"; exit 1; }

cleanup() {
  set +e
  say "cleanup"
  rm -rf ".local-plugins/${DEFAULT}" ".local-plugins/${NOPOM}" "plugins/${INTREE}"
  # create-plugin runs `pnpm install` (touches the lockfile) and --in-tree may
  # edit plugins/index.ts; restore any tracked files it changed.
  git -C "${REPO_ROOT}" checkout -- pnpm-lock.yaml plugins/index.ts 2>/dev/null
  echo "  removed scaffolds; restored tracked files"
}
trap cleanup EXIT

# Fresh start
rm -rf ".local-plugins/${DEFAULT}" ".local-plugins/${NOPOM}" "plugins/${INTREE}"

say "§8.1 default scaffold (.local-plugins/ + backend/)"
pnpm create-plugin "${DEFAULT}" </dev/null >/dev/null
for f in plugin.json src/index.ts src/plugin.contract.test.ts package.json vite.config.ts backend/pom.xml; do
  test -f ".local-plugins/${DEFAULT}/${f}" || fail "default scaffold missing ${f}"
done
echo "  ok — frontend + backend/ Maven layout present"

say "§8.2 --no-pom scaffold (no backend/)"
pnpm create-plugin "${NOPOM}" --no-pom </dev/null >/dev/null
test -f ".local-plugins/${NOPOM}/plugin.json" || fail "--no-pom scaffold missing plugin.json"
test ! -d ".local-plugins/${NOPOM}/backend" || fail "--no-pom scaffold should NOT have backend/"
echo "  ok — no backend/"

say "§8.3 --in-tree scaffold (plugins/ , no backend/)"
pnpm create-plugin "${INTREE}" --in-tree </dev/null >/dev/null
test -f "plugins/${INTREE}/plugin.json" || fail "--in-tree scaffold missing plugin.json"
test ! -d "plugins/${INTREE}/backend" || fail "--in-tree scaffold should NOT have backend/"
echo "  ok — in-tree under plugins/"

say "§8.4 contract test passes on first run"
pnpm --filter "@oc-mui/plugin-${DEFAULT}" test:contract >/dev/null 2>&1 || fail "contract test failed on a fresh scaffold"
echo "  ok — placeholder app:header-logo registration passes its contract"

say "§8.5 type-check passes on first run"
pnpm --filter "@oc-mui/plugin-${DEFAULT}" check-types >/dev/null 2>&1 || fail "check-types failed on a fresh scaffold"
echo "  ok"

echo
echo "✅ §8 plugin scaffolding: PASS"
