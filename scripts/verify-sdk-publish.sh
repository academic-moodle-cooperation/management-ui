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
cat > "$CONSUMER/package.json" <<'EOF'
{
  "name": "sdk-smoke-plugin",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": { "test": "vitest run" },
  "dependencies": {
    "@oc-mui/plugin-system": "^1.0.0",
    "@oc-mui/utils": "^1.0.0",
    "@oc-mui/ui": "^1.0.0"
  },
  "devDependencies": {
    "@oc-mui/plugin-testing": "^1.0.0",
    "@oc-mui/typescript-config": "^1.0.0",
    "@types/node": "^25.0.6",
    "@types/react": "^19.0.0",
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
