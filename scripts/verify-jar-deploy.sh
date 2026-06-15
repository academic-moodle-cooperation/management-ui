#!/usr/bin/env bash
#
# verify-jar-deploy.sh — test-protocol.md §10 (JAR build + deploy), automated
# against a real podman Opencast.
#
# Scaffolds a throwaway plugin, builds its frontend, `mvn package`s the OSGi
# JAR, asserts the bundle headers/contents, `podman cp`s it into Opencast's
# deploy dir, and polls plugins.json until Opencast's PluginBundleTracker reports
# it. Cleans everything up on exit (container JAR, scaffold, lockfile) — pass or
# fail.
#
# This is OPT-IN and backend-mutating: run it against a DISPOSABLE local Opencast
# (your podman stack), never a shared one. It needs: a running podman Opencast,
# `mvn` with the Opencast parent POM reachable (the host that built Opencast
# has it in ~/.m2), and `podman`.
#
# Config (env, with the local-podman defaults):
#   OPENCAST_BASE_URL   http://localhost:8080
#   OPENCAST_USER/PASS  admin / opencast
#   OPENCAST_CONTAINER  opencast-runtime
#   OPENCAST_DEPLOY_DIR /opt/opencast/deploy
#   PLUGINS_JSON_PATH   /management-tool/ui/config/plugins.json
#   PLUGIN_ID           e2e-jar-probe
#   TRACK_TIMEOUT       70   (seconds to wait for Felix fileinstall, ~30s poll)
set -euo pipefail

OPENCAST_BASE_URL="${OPENCAST_BASE_URL:-http://localhost:8080}"
OPENCAST_USER="${OPENCAST_USER:-admin}"
OPENCAST_PASS="${OPENCAST_PASS:-opencast}"
OPENCAST_CONTAINER="${OPENCAST_CONTAINER:-opencast-runtime}"
OPENCAST_DEPLOY_DIR="${OPENCAST_DEPLOY_DIR:-/opt/opencast/deploy}"
PLUGINS_JSON_PATH="${PLUGINS_JSON_PATH:-/management-tool/ui/config/plugins.json}"
PLUGIN_ID="${PLUGIN_ID:-e2e-jar-probe}"
TRACK_TIMEOUT="${TRACK_TIMEOUT:-70}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

PLUGIN_DIR=".local-plugins/${PLUGIN_ID}"
JAR_NAME="${PLUGIN_ID}-1.0.0-SNAPSHOT.jar"
PLUGINS_JSON_URL="${OPENCAST_BASE_URL}${PLUGINS_JSON_PATH}"

say() { printf '\n\033[1m== %s ==\033[0m\n' "$*"; }
ocurl() { curl -fsS -m 10 -u "${OPENCAST_USER}:${OPENCAST_PASS}" "$@"; }

cleanup() {
  set +e
  say "cleanup"
  podman exec "${OPENCAST_CONTAINER}" rm -f "${OPENCAST_DEPLOY_DIR}/${JAR_NAME}" 2>/dev/null \
    && echo "  removed ${JAR_NAME} from ${OPENCAST_CONTAINER}"
  rm -rf "${PLUGIN_DIR}" && echo "  removed scaffold ${PLUGIN_DIR}"
  # The scaffold runs `pnpm install`, which touches the tracked lockfile.
  git -C "${REPO_ROOT}" checkout -- pnpm-lock.yaml 2>/dev/null && echo "  restored pnpm-lock.yaml"
}
trap cleanup EXIT

say "preconditions"
command -v podman >/dev/null || { echo "podman not found"; exit 1; }
command -v mvn >/dev/null || { echo "mvn not found"; exit 1; }
podman container exists "${OPENCAST_CONTAINER}" || { echo "container ${OPENCAST_CONTAINER} not running"; exit 1; }
ocurl -o /dev/null "${OPENCAST_BASE_URL}/info/me.json" || { echo "Opencast not reachable at ${OPENCAST_BASE_URL}"; exit 1; }
echo "  podman + mvn present, ${OPENCAST_CONTAINER} up, Opencast reachable"

# Fresh start
rm -rf "${PLUGIN_DIR}"

say "scaffold ${PLUGIN_ID}"
pnpm create-plugin "${PLUGIN_ID}" </dev/null >/dev/null
echo "  scaffolded ${PLUGIN_DIR}"

say "build frontend"
pnpm --filter "@opencast-mui/plugin-${PLUGIN_ID}" build >/dev/null
test -f "${PLUGIN_DIR}/dist/${PLUGIN_ID}.mjs" || { echo "dist/${PLUGIN_ID}.mjs missing"; exit 1; }
echo "  built dist/${PLUGIN_ID}.mjs"

say "mvn package (§10.1)"
( cd "${PLUGIN_DIR}/backend" && mvn -q package -Dskip.frontend.build=true )
JAR="${PLUGIN_DIR}/backend/target/${JAR_NAME}"
test -f "${JAR}" || { echo "JAR not produced at ${JAR}"; exit 1; }
echo "  produced ${JAR}"

say "assert bundle headers (§10.2) + contents (§10.3)"
# Capture once and glob-match: piping into `grep -q` under `set -o pipefail`
# makes the producer (unzip) SIGPIPE when grep closes the pipe on match, which
# pipefail then reports as a failed pipeline — even on a match.
MF="$(unzip -p "${JAR}" META-INF/MANIFEST.MF || true)"
JAR_LIST="$(unzip -l "${JAR}" || true)"
case "${MF}" in *"Management-Plugin: ${PLUGIN_ID}"*) ;; *) echo "missing Management-Plugin header"; exit 1 ;; esac
case "${MF}" in *"Http-Alias: /management-ui/static/plugins/${PLUGIN_ID}"*) ;; *) echo "missing/bad Http-Alias"; exit 1 ;; esac
case "${JAR_LIST}" in *"static/plugins/${PLUGIN_ID}/${PLUGIN_ID}.mjs"*) ;; *) echo "bundle missing the .mjs"; exit 1 ;; esac
case "${JAR_LIST}" in *"static/plugins/${PLUGIN_ID}/plugin.json"*) ;; *) echo "bundle missing plugin.json"; exit 1 ;; esac
echo "  headers + contents OK"

say "deploy via podman cp (§10.4)"
podman cp "${JAR}" "${OPENCAST_CONTAINER}:${OPENCAST_DEPLOY_DIR}/"
echo "  copied into ${OPENCAST_CONTAINER}:${OPENCAST_DEPLOY_DIR}/"

say "poll plugins.json until tracked (§10.5, Felix fileinstall ~30s)"
deadline=$(( $(date +%s) + TRACK_TIMEOUT ))
while [ "$(date +%s)" -lt "${deadline}" ]; do
  body="$(ocurl "${PLUGINS_JSON_URL}" || true)"
  case "${body}" in
    *"\"${PLUGIN_ID}\""*)
      echo "  TRACKED: ${PLUGIN_ID} is now in plugins.json"
      echo
      echo "✅ §10 JAR build + deploy: PASS"
      exit 0
      ;;
  esac
  echo "  not yet… ($(( deadline - $(date +%s) ))s left)"
  sleep 6
done

echo "❌ ${PLUGIN_ID} never appeared in ${PLUGINS_JSON_URL} within ${TRACK_TIMEOUT}s"
exit 1
