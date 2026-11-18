// Stamp the Maven versions of the poms from the product VERSION.
//
// Maven projects have two states, like with maven-release-plugin:
//
//   release state  (the release commit: made by release.yml on top of the branch
//                   tip and only ever reachable through its tag, not a branch)
//     project version       <VERSION>            20.5.0
//     Opencast parent pin   <MAJOR.MINOR>        org.opencastproject:base:20.5
//     <opencast.version>    <MAJOR.MINOR>        20.5
//     -> no `-SNAPSHOT` anywhere in the poms; what is tagged is what is published.
//
//   development state  (the r/NN.x branch between releases)
//     project version       <next patch>-SNAPSHOT   20.5.1-SNAPSHOT
//     Opencast parent pin   <MAJOR>-SNAPSHOT        org.opencastproject:base:20-SNAPSHOT
//     <opencast.version>    <MAJOR>-SNAPSHOT        20-SNAPSHOT
//
// Modes:
//   --release   -> release state. Run by release.yml to build the release commit.
//   --next      -> development state, version = VERSION's next patch -SNAPSHOT.
//                  Run by release.yml after the tag was pushed and the artifacts
//                  were published; the result is committed to the branch.
//   (no flag)   -> `pnpm line:derive`: re-stamp the pins for the state the
//                  poms are in now. Development state (what a branch is in):
//                  version is kept, only the pins are re-derived - use this
//                  after a forward merge took another line's pom values.
//
// The Opencast major in the pins comes from VERSION's major (issue #443): a line
// differs from develop in VERSION (and the pom versions) only. The scaffold
// template's parent pin is always `MAJOR-SNAPSHOT`: plugin authors build against
// Opencast's development line, whatever state this repo's own poms are in.
//
// Why not the versions-maven-plugin: both parent pins resolve from the AMC
// repositories, so it would work, but a state switch changes three things -
// the project version (`versions:set`), the parent pin (`versions:update-parent`)
// and `<opencast.version>` (`versions:set-property`) - and the scaffold template
// pom is not a reactor module, so it would still need a text edit. This script
// does all of it in one pass with no JDK or network, so `pnpm line:derive` runs
// anywhere. It edits the poms textually, with a hard safety net: every pom must
// contain the current project version EXACTLY once (the org.amc.management
// version, a string the Opencast parent pin never has), otherwise it aborts
// rather than guessing.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const repoRoot = new URL("..", import.meta.url);
const read = (p) => readFileSync(new URL(p, repoRoot), "utf8");

const args = process.argv.slice(2);
const unknown = args.filter((a) => a !== "--release" && a !== "--next");
if (unknown.length > 0 || args.length > 1) {
  console.error("usage: update-maven-versions.mjs [--release | --next]");
  process.exit(1);
}
const mode = args[0]?.slice(2) ?? "keep";

const version = read("VERSION").trim();
const parts = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!parts) {
  console.error(`update-maven-versions: VERSION is not semver: "${version}"`);
  process.exit(1);
}
const [, major, minor, patch] = parts;

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

const released = mode === "release" || (mode === "keep" && !currentVersion.endsWith("-SNAPSHOT"));

let targetVersion;
if (released) targetVersion = version;
else if (mode === "next") targetVersion = `${major}.${minor}.${Number(patch) + 1}-SNAPSHOT`;
else targetVersion = currentVersion;

const pin = released ? `${major}.${minor}` : `${major}-SNAPSHOT`;

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

// --- Opencast pins --------------------------------------------------------
// The parent match is confined to the <parent> block, so a pom whose parent is
// management-ui is never touched. Versions: `20`-style pins, `20.5` releases
// and `20-SNAPSHOT` developments are all recognised, so the script converts in
// both directions.
const pinValue = String.raw`\d+(?:\.\d+)?(?:-SNAPSHOT)?`;
const parentRe = new RegExp(
  String.raw`(<parent>(?:(?!</parent>)[\s\S])*?<artifactId>base</artifactId>(?:(?!</parent>)[\s\S])*?<version>)${pinValue}(</version>)`,
);
const propertyRe = new RegExp(String.raw`(<opencast\.version>)${pinValue}(</opencast\.version>)`, "g");

const templatePom = "scripts/templates/create-plugin-maven/pom.xml.tpl";
let pinned = 0;
for (const f of [...poms, templatePom]) {
  const value = f === templatePom ? `${major}-SNAPSHOT` : pin;
  const before = read(f);
  const after = before.replace(parentRe, `$1${value}$2`).replace(propertyRe, `$1${value}$2`);
  if (after !== before) {
    writeFileSync(new URL(f, repoRoot), after);
    pinned++;
  }
}
if (pinned > 0) {
  console.log(`update-maven-versions: Opencast pins set (poms ${pin}, template ${major}-SNAPSHOT) in ${pinned} file(s).`);
}

if (currentVersion === targetVersion) {
  console.log(`update-maven-versions: poms already at ${targetVersion} — nothing to do.`);
  process.exit(0);
}

for (const pom of poms) {
  const content = read(pom);
  writeFileSync(new URL(pom, repoRoot), content.replace(needle, `<version>${targetVersion}</version>`));
}
console.log(`update-maven-versions: ${currentVersion} -> ${targetVersion} in ${poms.length} pom(s).`);
