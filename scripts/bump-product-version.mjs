// Bump the product VERSION file as part of `pnpm changeset:version`.
//
// Runs immediately after `changeset version` inside the release workflow's
// Version-PR step, so the VERSION bump lands IN the Version PR diff — reviewed
// where the package bumps are reviewed, released by the same merge, impossible
// to forget. (Previously nothing bumped VERSION: release.yml only reads it for
// the product tag, and a stale value made the tag step skip silently.)
//
// Policy (issue #236):
//   - the MAJOR is pinned to the release line's Opencast major and never moves
//     here (r/19.x ships 19.x.y, r/20.x ships 20.x.y; #251 sets the base value
//     per line),
//   - any package receiving a minor or major npm bump  -> product MINOR +1, patch reset,
//   - only patch bumps                                 -> product PATCH +1,
//   - no version changes (nothing to release)          -> VERSION untouched.
//
// The npm bump size is derived from what `changeset version` just wrote: the
// script diffs every versioned package.json against HEAD.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const changed = git("diff", "--name-only")
  .split("\n")
  .filter((p) => /^(packages|plugins)\/[^/]+\/package\.json$/.test(p));

let sawMinorOrMajor = false;
let sawPatch = false;

for (const path of changed) {
  let before;
  try {
    before = JSON.parse(git("show", `HEAD:${path}`));
  } catch {
    continue; // new package — counts via its own version below only if diffed again
  }
  const after = JSON.parse(readFileSync(path, "utf8"));
  if (!before.version || !after.version || before.version === after.version) continue;

  const [bMaj, bMin] = before.version.split(".").map(Number);
  const [aMaj, aMin] = after.version.split(".").map(Number);
  if (aMaj > bMaj || (aMaj === bMaj && aMin > bMin)) sawMinorOrMajor = true;
  else sawPatch = true;
}

if (!sawMinorOrMajor && !sawPatch) {
  console.log("bump-product-version: no package version changes — VERSION untouched.");
  process.exit(0);
}

const versionFile = new URL("../VERSION", import.meta.url);
const current = readFileSync(versionFile, "utf8").trim();
const [major, minor, patch] = current.split(".").map(Number);
if ([major, minor, patch].some(Number.isNaN)) {
  console.error(`bump-product-version: VERSION file is not semver: "${current}"`);
  process.exit(1);
}

const next = sawMinorOrMajor ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;

writeFileSync(versionFile, `${next}\n`);
console.log(`bump-product-version: ${current} -> ${next}`);
