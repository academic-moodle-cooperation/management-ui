#!/usr/bin/env node
/**
 * pnpm create-plugin <name> [--in-tree] [--no-pom]
 *
 * Scaffolds a new plugin directory at either:
 *   .local-plugins/<name>/   (default — for org / community plugin authors)
 *   plugins/<name>/          (--in-tree — for core contributors adding a
 *                             built-in plugin)
 *
 * For `.local-plugins/<name>/` scaffolds, a `backend/` subdirectory with
 * a working Maven POM is included by default. Almost every org plugin
 * eventually deploys as a JAR to Opencast (the Management UI itself is
 * one), so the Maven scaffold ships ready-to-build. Pass --no-pom to
 * skip it if you genuinely only want a frontend/CDN-distributed plugin.
 *
 * `--in-tree` scaffolds never include the Maven layout — those plugins
 * ship as part of the shell's JAR, not their own.
 *
 * The scaffolded plugin includes a placeholder `app:header-logo`
 * registration so `pnpm --filter @oc-mui/plugin-<name> test:contract`
 * passes on first run. Edit src/index.ts + plugin.json's extensionPoints
 * to replace the placeholder with real logic.
 *
 * After scaffolding it runs `pnpm install` to link the new package into
 * the workspace (so the `--filter` above resolves immediately). Pass
 * --no-install to skip that for batch/CI use.
 *
 * Replaces the previous `scripts/export-plugin-to-local.js` and
 * `scripts/extract-module-to-plugin.mjs`. See AGENTS.md (repo root) for
 * the plugin authoring rules.
 */

import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const templatesDir = resolve(__dirname, "templates", "create-plugin");
// Overlay copied on top of the base for `--template app`: only the files
// that differ (package.json, plugin.json, src/index.ts, the page component).
const templateAppDir = resolve(__dirname, "templates", "create-plugin-app");
const mavenTemplatesDir = resolve(__dirname, "templates", "create-plugin-maven");

const VALID_TEMPLATES = new Set(["minimal", "app"]);

const USAGE = `Usage:
  pnpm create-plugin <plugin-name> [--template <minimal|app>] [--in-tree] [--no-pom]

Arguments:
  <plugin-name>   kebab-case, [a-z][a-z0-9-]*. Used as the npm package
                  suffix, the plugin id, and the namespace.

Options:
  --template <t>  Which starter to scaffold (default: minimal):
                    minimal  a placeholder app:header-logo registration —
                             passes the contract test but has no visible
                             effect (nothing in the shell renders it).
                    app      a visible screen + sidebar entry
                             (apps:definitions + sidebar:nav-items + a page
                             component). Renders in dev AND production.
  --in-tree       Scaffold under plugins/<name>/ instead of the default
                  .local-plugins/<name>/. Use this when adding a built-in
                  plugin that ships with the core repo. Implies --no-pom
                  (in-tree plugins ship inside the shell's JAR).
  --no-pom        Skip scaffolding the backend/ Maven layout. Default
                  scaffold includes it; pass this flag for plugins that
                  will only ever be distributed as a frontend bundle
                  (CDN / marketplace).
  --no-install    Skip the automatic 'pnpm install' that links the new
                  package into the workspace. Useful for batch scaffolding
                  or CI; you must run 'pnpm install' yourself afterwards.
  --help, -h      Show this message.

Examples:
  pnpm create-plugin audience-poll                # full scaffold including backend/
  pnpm create-plugin reports --template app       # visible screen + sidebar entry
  pnpm create-plugin tiny-widget --no-pom         # frontend-only, no Maven
  pnpm create-plugin admin-dashboard --in-tree    # built-in core plugin`;

function fail(message, code = 1) {
  console.error(`✗ ${message}`);
  process.exit(code);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}

// Pull out `--template <name>` / `--template=<name>` first — its value is
// not a flag or a positional, so it must not reach the splits below.
let template = "minimal";
const restArgs = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--template") {
    template = args[i + 1];
    i++;
    continue;
  }
  if (a.startsWith("--template=")) {
    template = a.slice("--template=".length);
    continue;
  }
  restArgs.push(a);
}
if (!VALID_TEMPLATES.has(template)) {
  console.error(USAGE);
  fail(`Unknown --template "${template ?? ""}". Valid templates: ${[...VALID_TEMPLATES].join(", ")}.`, 2);
}

const flags = new Set(restArgs.filter((a) => a.startsWith("--")));
const positionals = restArgs.filter((a) => !a.startsWith("--"));

const KNOWN_FLAGS = new Set(["--in-tree", "--no-pom", "--no-install"]);
const unknownFlags = [...flags].filter((f) => !KNOWN_FLAGS.has(f));
if (unknownFlags.length > 0) {
  console.error(USAGE);
  fail(`Unknown flag(s): ${unknownFlags.join(", ")}`, 2);
}

if (positionals.length !== 1) {
  console.error(USAGE);
  fail(`Expected exactly one <plugin-name> argument, got ${positionals.length}.`, 2);
}

const pluginName = positionals[0];

if (!/^[a-z][a-z0-9-]*$/.test(pluginName)) {
  fail(
    `"${pluginName}" is not a valid plugin name.\n` +
      `  Must start with a lowercase letter and contain only [a-z0-9-].`,
  );
}

// camelCase identifier for the JS variable export (`my-poll` → `myPoll`).
const pluginVarName = pluginName.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
// PascalCase variant used as the GraphQL operation/fragment prefix per
// CONTRACTS.md §6 (e.g. `my-plugin` → `MyPlugin` → `MyPluginGetSomething`).
const pluginPascalName = pluginVarName.charAt(0).toUpperCase() + pluginVarName.slice(1);

const isInTree = flags.has("--in-tree");
const targetParent = isInTree ? "plugins" : ".local-plugins";
const targetDir = resolve(repoRoot, targetParent, pluginName);
const relativeTarget = relative(repoRoot, targetDir);

// In-tree plugins ship as part of the shell's JAR — they don't get
// their own Maven layout. Explicit --no-pom always wins. Otherwise the
// default for `.local-plugins/` scaffolds includes the Maven template.
const includeMaven = !isInTree && !flags.has("--no-pom");

try {
  await stat(targetDir);
  fail(`${relativeTarget}/ already exists. Refusing to overwrite.`);
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

console.log(`→ Scaffolding plugin "${pluginName}" at ${relativeTarget}/`);

/**
 * Recursively walk a template directory and copy every file into the
 * target, stripping the trailing `.tpl` suffix and substituting
 * placeholders.
 */
async function copyTemplates(srcDir, baseSrc, baseDest) {
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    if (entry.isDirectory()) {
      await copyTemplates(srcPath, baseSrc, baseDest);
      continue;
    }
    if (!entry.isFile()) continue;
    const relSrc = relative(baseSrc, srcPath);
    // Substitute placeholders in the path too (not just the contents), so a
    // file like `src/__PLUGIN_PASCAL_NAME__Page.tsx.tpl` lands as
    // `src/MyPluginPage.tsx`.
    const relDest = (relSrc.endsWith(".tpl") ? relSrc.slice(0, -4) : relSrc)
      .replaceAll("__PLUGIN_NAME__", pluginName)
      .replaceAll("__PLUGIN_VAR_NAME__", pluginVarName)
      .replaceAll("__PLUGIN_PASCAL_NAME__", pluginPascalName);
    const destPath = join(baseDest, relDest);
    await mkdir(dirname(destPath), { recursive: true });
    const content = await readFile(srcPath, "utf8");
    const rendered = content
      .replaceAll("__PLUGIN_NAME__", pluginName)
      .replaceAll("__PLUGIN_VAR_NAME__", pluginVarName)
      .replaceAll("__PLUGIN_PASCAL_NAME__", pluginPascalName);
    await writeFile(destPath, rendered);
    console.log(`  + ${relative(repoRoot, destPath)}`);
  }
}

await mkdir(targetDir, { recursive: true });
await copyTemplates(templatesDir, templatesDir, targetDir);

// `--template app` overlays its variant files on top of the base,
// overwriting src/index.ts + plugin.json + package.json and adding the
// page component. The base contract test is generic and reused as-is.
if (template === "app") {
  await copyTemplates(templateAppDir, templateAppDir, targetDir);
}

if (includeMaven) {
  await copyTemplates(mavenTemplatesDir, mavenTemplatesDir, join(targetDir, "backend"));
}

const skipInstall = flags.has("--no-install");

console.log("");
console.log("✓ Scaffolded.");

// Link the new package into the workspace so `pnpm --filter` resolves it
// immediately (the scaffold lives under a `pnpm-workspace.yaml` glob, but
// its deps aren't linked until an install runs). Skip with --no-install.
if (!skipInstall) {
  console.log("→ Linking the new package (pnpm install)…");
  const result = spawnSync("pnpm", ["install"], { cwd: repoRoot, stdio: "inherit" });
  if (result.status !== 0) {
    console.log("");
    console.log("⚠ pnpm install did not finish cleanly — run it yourself before the next steps.");
  }
}

console.log("");
console.log("Next steps (from the repo root):");
console.log("");
let step = 1;
if (skipInstall) {
  console.log(`  ${step++}. pnpm install                # link the new package (skipped via --no-install)`);
}
console.log(`  ${step++}. pnpm build                  # one-time, populates dist-types/ for upstream packages`);
console.log(`  ${step++}. edit ${relativeTarget}/plugin.json   # fill in description, author, real extensionPoints`);
console.log(`  ${step++}. edit ${relativeTarget}/src/index.ts  # replace the placeholder registration`);
console.log(`  ${step++}. pnpm --filter @oc-mui/plugin-${pluginName} test:contract`);
if (includeMaven) {
  console.log("");
  console.log("Maven-side (the backend/ subdirectory):");
  console.log("");
  console.log(`  ${step++}. edit ${relativeTarget}/backend/pom.xml   # confirm groupId and version`);
  console.log(`  ${step++}. (cd ${relativeTarget}/backend && mvn package)   # produces target/${pluginName}-1.0.0-SNAPSHOT.jar`);
  console.log(`  ${step++}. cp ${relativeTarget}/backend/target/${pluginName}-1.0.0-SNAPSHOT.jar $OPENCAST_HOME/deploy/`);
  console.log("");
  console.log(`  See ${relativeTarget}/backend/README.md for build options and the full deploy story.`);
}
console.log("");
console.log("Read AGENTS.md (repo root) for the full plugin authoring rules.");
