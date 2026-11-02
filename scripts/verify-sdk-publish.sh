#!/usr/bin/env bash
#
# SDK publish smoke-test (the acceptance gate for the exports→dist work).
#
# Proves that a plugin can install and build against the @oc-mui/* SDK packages
# *as published npm artifacts*, without the monorepo:
#
#   1. build every SDK package (dist/ + dist-types/)
#   2. spin up a throwaway Verdaccio registry
#   3. strip `private` and publish the whole SDK to it
#   4. in a consumer project OUTSIDE the workspace, install the SDK from
#      Verdaccio and run a type-check + a runtime smoke test
#
# Everything is torn down on exit; `private` flags are restored from git.
#
# Usage: bash scripts/verify-sdk-publish.sh
set -euo pipefail

REGISTRY="http://localhost:4873"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
VCONFIG="$WORK/verdaccio.yaml"
NPMRC="$WORK/npmrc"
CONSUMER="$WORK/consumer"
VPID=""

# The 15 publishable SDK packages (dir list).
SDK_DIRS=(
  packages/plugin-system plugins/core packages/app-runtime packages/ui
  packages/ui-config packages/utils packages/i18n packages/query
  packages/router packages/store packages/plugin-testing packages/vite-config
  packages/eslint-config packages/typescript-config packages/tailwind-config
)

cleanup() {
  local code=$?
  [ -n "$VPID" ] && kill "$VPID" 2>/dev/null || true
  # Restore the private flags we stripped for publishing.
  ( cd "$ROOT" && git checkout -- "${SDK_DIRS[@]/%//package.json}" 2>/dev/null ) || true
  rm -rf "$WORK"
  [ "$code" -eq 0 ] && echo "✅ SDK publish smoke-test passed" || echo "❌ SDK publish smoke-test FAILED (exit $code)"
}
trap cleanup EXIT

cd "$ROOT"

echo "==> 1/5 Building SDK packages (dist + dist-types)"
pnpm turbo run build build:types >/dev/null

echo "==> 2/5 Starting throwaway Verdaccio at $REGISTRY"
cat > "$VCONFIG" <<EOF
storage: $WORK/storage
auth:
  htpasswd:
    file: $WORK/htpasswd
    max_users: -1
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    cache: true
packages:
  '@oc-mui/*':
    access: \$all
    publish: \$anonymous
    unpublish: \$anonymous
  '**':
    access: \$all
    proxy: npmjs
log: { type: stdout, format: pretty, level: warn }
EOF
printf '//localhost:4873/:_authToken=smoke\nregistry=%s/\n' "$REGISTRY" > "$NPMRC"

npx --yes verdaccio --config "$VCONFIG" --listen 4873 >"$WORK/verdaccio.log" 2>&1 &
VPID=$!
for i in $(seq 1 60); do
  curl -sf "$REGISTRY/-/ping" >/dev/null 2>&1 && break
  [ "$i" -eq 60 ] && { echo "Verdaccio did not start"; cat "$WORK/verdaccio.log"; exit 1; }
  sleep 0.5
done
echo "    Verdaccio up (pid $VPID)"

echo "==> 3/5 Publishing the SDK to Verdaccio"
# Strip `private` so npm/pnpm will publish (restored in cleanup).
node -e 'for(const d of process.argv.slice(1)){const fs=require("fs"),p=d+"/package.json";const j=JSON.parse(fs.readFileSync(p,"utf8"));delete j.private;fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");}' "${SDK_DIRS[@]}"
for d in "${SDK_DIRS[@]}"; do
  ( cd "$d" && NPM_CONFIG_USERCONFIG="$NPMRC" pnpm publish --registry "$REGISTRY" --no-git-checks --report-summary >/dev/null ) \
    && echo "    published $(node -e "process.stdout.write(require('./$d/package.json').name)")" \
    || { echo "    FAILED to publish $d"; exit 1; }
done

echo "==> 4/5 Scaffolding a consumer plugin OUTSIDE the workspace"
mkdir -p "$CONSUMER/src"
printf '//localhost:4873/:_authToken=smoke\nregistry=%s/\n' "$REGISTRY" > "$CONSUMER/.npmrc"
# The consumer asks for the versions the workspace is about to publish, so a
# major bump of a package does not strand the smoke test on a stale range.
ver() { node -e "process.stdout.write('^' + require('$ROOT/$1/package.json').version)"; }
cat > "$CONSUMER/package.json" <<EOF
{
  "name": "sdk-smoke-plugin",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "vitest run" },
  "dependencies": {
    "@oc-mui/app-runtime": "$(ver packages/app-runtime)",
    "@oc-mui/i18n": "$(ver packages/i18n)",
    "@oc-mui/plugin-core": "$(ver plugins/core)",
    "@oc-mui/plugin-system": "$(ver packages/plugin-system)",
    "@oc-mui/query": "$(ver packages/query)",
    "@oc-mui/router": "$(ver packages/router)",
    "@oc-mui/store": "$(ver packages/store)",
    "@oc-mui/ui": "$(ver packages/ui)",
    "@oc-mui/ui-config": "$(ver packages/ui-config)",
    "@oc-mui/utils": "$(ver packages/utils)"
  },
  "devDependencies": {
    "@oc-mui/eslint-config": "$(ver packages/eslint-config)",
    "@oc-mui/plugin-testing": "$(ver packages/plugin-testing)",
    "@oc-mui/typescript-config": "$(ver packages/typescript-config)",
    "@oc-mui/vite-config": "$(ver packages/vite-config)",
    "@types/node": "^25.0.6",
    "@types/react": "^19.0.0",
    "eslint": "^9.0.0",
    "vite": "^6.4.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "jsdom": "^27.4.0",
    "typescript": "~5.5.4",
    "vitest": "^4.0.17"
  }
}
EOF
cat > "$CONSUMER/tsconfig.json" <<'EOF'
{
  "extends": "@oc-mui/typescript-config/react-library.json",
  "compilerOptions": { "noEmit": true, "skipLibCheck": true, "composite": false },
  "include": ["src"]
}
EOF
# The SDK's React packages import their stylesheets; outside Vite, Node cannot
# load .css. Let Vitest transform the SDK packages (deps.inline) so those
# imports resolve the way they do in a real plugin build.
cat > "$CONSUMER/vitest.config.ts" <<'EOF'
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Matched against the resolved module path (…/node_modules/.pnpm/@oc-mui+ui@…),
    // so no start anchor.
    server: { deps: { inline: [/@oc-mui[/+]/] } },
  },
});
EOF
cat > "$CONSUMER/src/index.ts" <<'EOF'
import { createPlugin } from "@oc-mui/plugin-system";
import { logger } from "@oc-mui/utils";
import { cn } from "@oc-mui/ui/lib/utils";

export const smokePlugin = createPlugin({
  namespace: "sdk-smoke",
  type: "app",
  version: "1.0.0",
  initialize() {
    logger.info(cn("smoke", "ok"));
  },
  activate() {},
  deactivate() {},
});
EOF
# Every published JS entry point is imported once, as a consumer would. This
# is what catches a tarball that forgets a file: `files` in eslint-config
# once omitted two rule modules its own index imports — install passed,
# every external consumer crashed on load (fixed in 1.1.1).
cat > "$CONSUMER/src/exports.test.ts" <<'EOF'
// @vitest-environment node
import { describe, expect, it } from "vitest";

// Literal specifiers so Vite resolves and transforms the packages (their
// stylesheet imports need that); the eslint-config entries ship no type
// declarations, so they are loaded through a string instead — a literal
// import of them would fail the type-check.
const typed: Array<[string, () => Promise<Record<string, unknown>>]> = [
  ["@oc-mui/app-runtime", () => import("@oc-mui/app-runtime")],
  ["@oc-mui/i18n", () => import("@oc-mui/i18n")],
  ["@oc-mui/plugin-core", () => import("@oc-mui/plugin-core")],
  ["@oc-mui/plugin-system", () => import("@oc-mui/plugin-system")],
  ["@oc-mui/plugin-testing", () => import("@oc-mui/plugin-testing")],
  ["@oc-mui/query", () => import("@oc-mui/query")],
  ["@oc-mui/router", () => import("@oc-mui/router")],
  ["@oc-mui/store", () => import("@oc-mui/store")],
  ["@oc-mui/ui", () => import("@oc-mui/ui")],
  ["@oc-mui/ui/components", () => import("@oc-mui/ui/components")],
  ["@oc-mui/ui/hooks", () => import("@oc-mui/ui/hooks")],
  ["@oc-mui/ui/internal", () => import("@oc-mui/ui/internal")],
  ["@oc-mui/ui-config", () => import("@oc-mui/ui-config")],
  ["@oc-mui/utils", () => import("@oc-mui/utils")],
  ["@oc-mui/vite-config", () => import("@oc-mui/vite-config")],
];
const untyped = [
  "@oc-mui/eslint-config/base",
  "@oc-mui/eslint-config/react-internal",
  "@oc-mui/eslint-config/type-aware",
];
// Entry points that are deliberately empty (side effects or docs only).
const knownEmpty = new Set(["@oc-mui/ui"]);

describe("every published entry point loads", () => {
  for (const [name, load] of typed) {
    it(name, async () => {
      const mod = await load();
      if (!knownEmpty.has(name)) {
        expect(Object.keys(mod).length, `${name} exports nothing`).toBeGreaterThan(0);
      }
    });
  }
  for (const name of untyped) {
    it(name, async () => {
      const mod = (await import(/* @vite-ignore */ name)) as Record<string, unknown>;
      expect(Object.keys(mod).length, `${name} exports nothing`).toBeGreaterThan(0);
    });
  }
});
EOF
cat > "$CONSUMER/src/smoke.test.ts" <<'EOF'
import { describe, expect, it } from "vitest";
import { loadPluginInHarness } from "@oc-mui/plugin-testing";
import { smokePlugin } from "./index";

describe("sdk smoke", () => {
  it("the SDK loads and createPlugin works", () => {
    expect(smokePlugin.name).toBe("sdk-smoke:app");
    expect(typeof loadPluginInHarness).toBe("function");
  });
});
EOF

echo "==> 5/5 Installing from Verdaccio + type-check + runtime test"
( cd "$CONSUMER" && pnpm install --registry "$REGISTRY" >/dev/null ) || { echo "install failed"; exit 1; }
echo "    installed @oc-mui/* from the registry:"
( cd "$CONSUMER" && node -e 'const fs=require("fs");for(const n of fs.readdirSync("node_modules/@oc-mui")){const v=JSON.parse(fs.readFileSync("node_modules/@oc-mui/"+n+"/package.json","utf8")).version;console.log("      @oc-mui/"+n+"@"+v);}' )
( cd "$CONSUMER" && pnpm exec tsc -p tsconfig.json ) && echo "    type-check ✓" || { echo "type-check failed"; exit 1; }
( cd "$CONSUMER" && pnpm test >/dev/null 2>&1 ) && echo "    runtime smoke test ✓" || { echo "runtime test failed"; ( cd "$CONSUMER" && pnpm test ); exit 1; }
