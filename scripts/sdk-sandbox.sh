#!/usr/bin/env bash
#
# Local SDK sandbox — the hands-on companion to `pnpm test:sdk-publish`.
#
# Builds the SDK and publishes it to a Verdaccio registry that STAYS RUNNING,
# so you can manually create a plugin OUTSIDE the monorepo and install + build
# it against the @opencast-mui/* packages exactly as if they were on npm. This is the
# same thing pkg.pr.new gives you on a PR, but entirely local and available now.
#
# Usage:
#   pnpm sdk:sandbox        # publishes the SDK, leaves the registry up
#   (Ctrl-C to stop — the registry shuts down and `private` flags are restored)
set -euo pipefail

REGISTRY="http://localhost:4873"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
VCONFIG="$WORK/verdaccio.yaml"
NPMRC="$WORK/npmrc"
VPID=""

SDK_DIRS=(
  packages/plugin-system plugins/core packages/app-runtime packages/ui
  packages/ui-config packages/utils packages/i18n packages/query
  packages/router packages/store packages/plugin-testing packages/vite-config
  packages/eslint-config packages/typescript-config packages/tailwind-config
)

cleanup() {
  echo ""
  echo "==> Shutting down sandbox"
  [ -n "$VPID" ] && kill "$VPID" 2>/dev/null || true
  ( cd "$ROOT" && git checkout -- "${SDK_DIRS[@]/%//package.json}" 2>/dev/null ) || true
  rm -rf "$WORK"
  echo "    registry stopped, private flags restored."
}
trap cleanup EXIT INT TERM

cd "$ROOT"

echo "==> Building SDK (dist + dist-types)"
pnpm turbo run build build:types >/dev/null

echo "==> Starting Verdaccio at $REGISTRY"
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
  '@opencast-mui/*':
    access: \$all
    publish: \$anonymous
    unpublish: \$anonymous
  '**':
    access: \$all
    proxy: npmjs
log: { type: stdout, format: pretty, level: warn }
EOF
printf '//localhost:4873/:_authToken=sandbox\nregistry=%s/\n' "$REGISTRY" > "$NPMRC"

npx --yes verdaccio --config "$VCONFIG" --listen 4873 >"$WORK/verdaccio.log" 2>&1 &
VPID=$!
for i in $(seq 1 60); do
  curl -sf "$REGISTRY/-/ping" >/dev/null 2>&1 && break
  [ "$i" -eq 60 ] && { echo "Verdaccio did not start"; cat "$WORK/verdaccio.log"; exit 1; }
  sleep 0.5
done

echo "==> Publishing the SDK"
node -e 'for(const d of process.argv.slice(1)){const fs=require("fs"),p=d+"/package.json";const j=JSON.parse(fs.readFileSync(p,"utf8"));delete j.private;fs.writeFileSync(p,JSON.stringify(j,null,2)+"\n");}' "${SDK_DIRS[@]}"
for d in "${SDK_DIRS[@]}"; do
  ( cd "$d" && NPM_CONFIG_USERCONFIG="$NPMRC" pnpm publish --registry "$REGISTRY" --no-git-checks >/dev/null 2>&1 ) || { echo "    FAILED to publish $d"; exit 1; }
done

cat <<EOF

============================================================================
  SDK sandbox registry is UP at $REGISTRY  (15 packages published)
============================================================================

  Now, in a NEW directory OUTSIDE this repo:

    mkdir ~/sdk-test-plugin && cd ~/sdk-test-plugin
    echo 'registry=$REGISTRY/' > .npmrc
    pnpm init
    pnpm add @opencast-mui/plugin-system @opencast-mui/ui @opencast-mui/utils
    pnpm add -D @opencast-mui/plugin-testing @opencast-mui/typescript-config \\
               @opencast-mui/vite-config react react-dom typescript vite

  Then write a plugin (src/index.ts):

    import { createPlugin } from "@opencast-mui/plugin-system";
    import { cn } from "@opencast-mui/ui/lib/utils";
    export default createPlugin({
      namespace: "my-test", type: "app", version: "1.0.0",
      initialize() {}, activate() {}, deactivate() {},
    });

  ...and build it (pnpm exec tsc --noEmit, or a Vite build via
  @opencast-mui/vite-config's createCommunityPluginConfig).

  Leave this terminal open. Press Ctrl-C here when done.
============================================================================
EOF

wait "$VPID"
