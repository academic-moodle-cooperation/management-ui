// Sync the Maven project version to the product VERSION, as part of
// `pnpm changeset:version` (runs right after bump-product-version.mjs in the
// release workflow's Version-PR step).
//
// Why: the JAR artifacts otherwise stay `1.0-SNAPSHOT` forever. With this,
// tag = product version = JAR version (issue #236):
// v19.0.1 ships management-ui-graphql-19.0.1.jar.
//
// Why not `mvn versions:set`: resolving the `org.opencastproject:base` parent
// is impossible on the CI runner — Opencast publishes no release artifacts to
// Maven Central (see #242 / open-followups §9.2). This script edits the poms
// textually instead, with a hard safety net: every pom must contain the
// current project version EXACTLY once (the org.amc.management version — the
// Opencast parent uses `NN-SNAPSHOT`, a different string), otherwise it
// aborts rather than guessing.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const repoRoot = new URL("..", import.meta.url);
const read = (p) => readFileSync(new URL(p, repoRoot), "utf8");

const targetVersion = read("VERSION").trim();
if (!/^\d+\.\d+\.\d+$/.test(targetVersion)) {
  console.error(`update-maven-versions: VERSION is not semver: "${targetVersion}"`);
  process.exit(1);
}

// The project's own version: root pom, the <version> directly following the
// management-ui artifactId.
const rootPom = read("pom.xml");
const m = rootPom.match(
  /<artifactId>management-ui<\/artifactId>\s*<packaging>pom<\/packaging>\s*<version>([^<]+)<\/version>/,
);
if (!m) {
  console.error("update-maven-versions: could not find the project version in pom.xml");
  process.exit(1);
}
const currentVersion = m[1];

const poms = execFileSync("git", ["ls-files", "pom.xml", "**/pom.xml"], { encoding: "utf8" })
  .split("\n")
  .filter((p) => p && !p.includes("templates/"));

// Consistency check runs in the no-op case too: every pom must carry the
// project version exactly once, or something is drifting and we say so.
const needle = `<version>${currentVersion}</version>`;
for (const pom of poms) {
  const content = read(pom);
  const count = content.split(needle).length - 1;
  if (count !== 1) {
    console.error(
      `update-maven-versions: expected exactly 1 occurrence of ${needle} in ${pom}, found ${count} — aborting without changes.`,
    );
    process.exit(1);
  }
}

if (currentVersion === targetVersion) {
  console.log(`update-maven-versions: poms already at ${targetVersion} — nothing to do.`);
  process.exit(0);
}

for (const pom of poms) {
  const content = read(pom);
  writeFileSync(new URL(pom, repoRoot), content.replace(needle, `<version>${targetVersion}</version>`));
}
console.log(
  `update-maven-versions: ${currentVersion} -> ${targetVersion} in ${poms.length} pom(s).`,
);
