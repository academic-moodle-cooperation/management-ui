// refresh-schema.mjs — pull the GraphQL SDL from a live Opencast and commit it.
//
// The schema is an INPUT to codegen, not an artifact: codegen itself reads the
// committed `src/schema.graphql` and never talks to a backend. Refreshing the
// file is the deliberate, reviewed step you take when the backend's schema
// changed ("Opencast gained a field") — run this, read the diff, commit it
// together with the regenerated output.
//
//   pnpm --filter @oc-mui/query schema:refresh
//
// Reads GRAPHQL_ENDPOINT (plus optional GRAPHQL_HEADERS as JSON) from the
// repo-root .env, same as the old live-backend codegen did.
//
// Two things worth knowing before comparing diffs:
// - The type order follows the server's introspection order; a different
//   Opencast build may reorder types without changing meaning.
// - Opencast's *MetadataInput types are PER-ORGANISATION: a catalog field
//   configured readOnly on the source instance is absent from the input type
//   (see docs/extend/graphql-field.md). Refresh from an instance whose
//   catalog configuration matches what the UI should support.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = join(__dirname, "schema.graphql");

const endpoint = process.env["GRAPHQL_ENDPOINT"] || "http://127.0.0.1:8080/graphql";
const headers = process.env["GRAPHQL_HEADERS"] ? JSON.parse(process.env["GRAPHQL_HEADERS"]) : {};

const response = await fetch(endpoint, {
  method: "POST",
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify({ query: getIntrospectionQuery() }),
});
if (!response.ok) {
  console.error(`❌ ${endpoint} answered ${response.status}`);
  process.exit(1);
}
const payload = await response.json();
if (!payload.data) {
  // Opencast quirk: HTTP 200 with a bare `null` body means the organisation
  // has no schema — the real error is only in opencast.log.
  console.error(
    "❌ Introspection returned no data — is the GraphQL schema built for this organisation?",
  );
  process.exit(1);
}

// The Opencast version, so the committed file says what it was taken from.
// Fetched from the same host's sysinfo endpoint; falls back to "unknown"
// rather than failing — the version note is documentation, not data.
let version = "unknown";
try {
  const base = endpoint.replace(/\/graphql\/?$/, "");
  const info = await fetch(`${base}/sysinfo/bundles/version?prefix=opencast`);
  if (info.ok) {
    const body = await info.json();
    if (body.version) version = String(body.version);
  }
} catch {
  /* keep "unknown" */
}

const sdl = printSchema(buildClientSchema(payload.data));
const header = `# Opencast GraphQL schema, committed as codegen's input.
#
# Taken from: Opencast ${version}
# Refreshed:  ${new Date().toISOString().slice(0, 10)}
#
# Codegen reads THIS FILE (see src/codegen.ts) — regenerating types needs no
# running backend. To update the schema from a live Opencast instead:
#   pnpm --filter @oc-mui/query schema:refresh
# then review the diff and commit it together with the regenerated output.
#
# Caveat: Opencast's *MetadataInput types are per-organisation — catalog
# fields configured readOnly on the source instance are absent from them.
# Refresh only from an instance whose catalog configuration matches what the
# UI should support (docs/extend/graphql-field.md has the full story).

`;

const previous = (() => {
  try {
    return readFileSync(target, "utf-8");
  } catch {
    return "";
  }
})();

writeFileSync(target, header + sdl + "\n", "utf-8");
console.log(
  previous === header + sdl + "\n"
    ? `✅ schema.graphql unchanged (Opencast ${version})`
    : `✅ schema.graphql refreshed from Opencast ${version} — review the diff, then regenerate: pnpm --filter @oc-mui/query codegen`,
);
