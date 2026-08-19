// Guard half 1 of `test:consumer-types` (#354): the emitted declarations must
// not reference tanstack's `NoInfer` AT ALL.
//
// Whether `import("@tanstack/react-query").NoInfer` resolves depends on which
// tanstack minor the CONSUMER installs (the export appeared mid-5.x). In this
// workspace it resolves, so a tsc-based test cannot catch the regression —
// but a consumer on a different minor gets a silently-broken `.d.ts` where
// every hook's `data` is `any`. Hence a textual check, version-independent.
// The explicit return annotations added by src/fix-fetcher-import.mjs are
// what keep the reference out.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const distTypes = join(dirname(fileURLToPath(import.meta.url)), "..", "dist-types");

const offenders = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".d.ts") && readFileSync(path, "utf-8").includes("NoInfer")) {
      offenders.push(path);
    }
  }
};
walk(distTypes);

if (offenders.length > 0) {
  console.error(
    `❌ NoInfer referenced in emitted declarations (breaks consumers whose @tanstack/react-query does not export it — #354):\n` +
      offenders.map((o) => `   ${o}`).join("\n"),
  );
  process.exit(1);
}
console.log("✅ dist-types reference no NoInfer");
