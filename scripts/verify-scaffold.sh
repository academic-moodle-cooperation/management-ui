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
APP="trial-app"

say() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
fail() { echo "❌ $*"; exit 1; }

cleanup() {
  set +e
  say "cleanup"
  rm -rf ".local-plugins/${DEFAULT}" ".local-plugins/${NOPOM}" ".local-plugins/${APP}" "plugins/${INTREE}"
  # create-plugin runs `pnpm install` (touches the lockfile) and --in-tree may
  # edit plugins/index.ts; restore any tracked files it changed.
  git -C "${REPO_ROOT}" checkout -- pnpm-lock.yaml plugins/index.ts 2>/dev/null
  echo "  removed scaffolds; restored tracked files"
}
trap cleanup EXIT

# Fresh start
rm -rf ".local-plugins/${DEFAULT}" ".local-plugins/${NOPOM}" ".local-plugins/${APP}" "plugins/${INTREE}"

# The backend's PluginBundleTracker only emits a `scriptUrl` for a
# single-module manifest when `entry` is set (otherwise the shell falls back
# to guessing the bundle URL), so a community scaffold must declare where the
# Maven build puts its bundle. In-tree plugins compile into the shell and
# must NOT carry those fields.
manifest_field() { # <plugin.json> <field> — prints the field's string value or nothing
  node -e 'const m=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const v=m[process.argv[2]];if(typeof v==="string")process.stdout.write(v)' "$1" "$2"
}
assert_jar_manifest_fields() { # <dir> <plugin-name>
  local m="$1/plugin.json" name="$2"
  test "$(manifest_field "${m}" entry)" = "dist/${name}.mjs" || fail "${m}: entry must be dist/${name}.mjs (got '$(manifest_field "${m}" entry)')"
  test "$(manifest_field "${m}" css)" = "dist/${name}.css" || fail "${m}: css must be dist/${name}.css (got '$(manifest_field "${m}" css)')"
  test "$(manifest_field "${m}" locales)" = "locales" || fail "${m}: locales must be 'locales' (got '$(manifest_field "${m}" locales)')"
  node scripts/validate-plugins.mjs "${m}" >/dev/null || fail "${m} fails validate-plugins.mjs"
}
assert_no_jar_manifest_fields() { # <dir>
  local m="$1/plugin.json" field
  for field in entry css locales; do
    test -z "$(manifest_field "${m}" "${field}")" || fail "${m}: in-tree scaffold must not declare '${field}'"
  done
  node scripts/validate-plugins.mjs "${m}" >/dev/null || fail "${m} fails validate-plugins.mjs"
}

say "§8.1 default scaffold (.local-plugins/ + backend/)"
pnpm create-plugin "${DEFAULT}" </dev/null >/dev/null
for f in plugin.json src/index.ts src/plugin.contract.test.ts package.json vite.config.ts backend/pom.xml; do
  test -f ".local-plugins/${DEFAULT}/${f}" || fail "default scaffold missing ${f}"
done
assert_jar_manifest_fields ".local-plugins/${DEFAULT}" "${DEFAULT}"
echo "  ok — frontend + backend/ Maven layout present; plugin.json declares entry/css/locales"

say "§8.2 --no-pom scaffold (no backend/)"
pnpm create-plugin "${NOPOM}" --no-pom </dev/null >/dev/null
test -f ".local-plugins/${NOPOM}/plugin.json" || fail "--no-pom scaffold missing plugin.json"
test ! -d ".local-plugins/${NOPOM}/backend" || fail "--no-pom scaffold should NOT have backend/"
assert_jar_manifest_fields ".local-plugins/${NOPOM}" "${NOPOM}"
echo "  ok — no backend/; plugin.json still declares entry/css/locales (a JAR can be added later)"

say "§8.3 --in-tree scaffold (plugins/ , no backend/)"
pnpm create-plugin "${INTREE}" --in-tree </dev/null >/dev/null
test -f "plugins/${INTREE}/plugin.json" || fail "--in-tree scaffold missing plugin.json"
test ! -d "plugins/${INTREE}/backend" || fail "--in-tree scaffold should NOT have backend/"
assert_no_jar_manifest_fields "plugins/${INTREE}"
echo "  ok — in-tree under plugins/; plugin.json carries no entry/css/locales"

say "§8.3a --template app scaffold (manifest declares the bundle too)"
# --no-install: nothing below runs this plugin's scripts, so skipping the
# workspace link keeps the step cheap.
pnpm create-plugin "${APP}" --template app --no-pom --no-install </dev/null >/dev/null
test -f ".local-plugins/${APP}/plugin.json" || fail "--template app scaffold missing plugin.json"
assert_jar_manifest_fields ".local-plugins/${APP}" "${APP}"
echo "  ok — app template's plugin.json declares entry/css/locales"

say "§8.4 contract test passes on first run"
pnpm --filter "@oc-mui/plugin-${DEFAULT}" test:contract >/dev/null 2>&1 || fail "contract test failed on a fresh scaffold"
echo "  ok — placeholder app:header-logo registration passes its contract"

say "§8.5 type-check passes on first run"
pnpm --filter "@oc-mui/plugin-${DEFAULT}" check-types >/dev/null 2>&1 || fail "check-types failed on a fresh scaffold"
echo "  ok"

say "§8.5a build output matches the manifest's entry/css"
# Add a stylesheet so Vite has CSS to extract — the manifest's `css` field is
# only right if the build names the sheet after the plugin, not after
# package.json (Vite's default would give plugin-<name>.css).
printf '.%s-probe { color: var(--color-foreground); }\n' "${DEFAULT}" > ".local-plugins/${DEFAULT}/src/probe.css"
printf 'import "./probe.css";\n%s' "$(cat ".local-plugins/${DEFAULT}/src/index.ts")" > ".local-plugins/${DEFAULT}/src/index.ts"
pnpm --filter "@oc-mui/plugin-${DEFAULT}" build >/dev/null 2>&1 || fail "build failed on a fresh scaffold"
test -f ".local-plugins/${DEFAULT}/dist/${DEFAULT}.mjs" || fail "build did not produce dist/${DEFAULT}.mjs (manifest entry)"
test -f ".local-plugins/${DEFAULT}/dist/${DEFAULT}.css" || fail "build did not produce dist/${DEFAULT}.css (manifest css); got: $(ls ".local-plugins/${DEFAULT}/dist")"
echo "  ok — dist/${DEFAULT}.mjs + dist/${DEFAULT}.css match plugin.json"

echo
echo "✅ §8 plugin scaffolding: PASS"
