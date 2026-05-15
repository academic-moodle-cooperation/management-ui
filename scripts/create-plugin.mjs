#!/usr/bin/env node
/**
 * pnpm create-plugin <name> [--in-tree]
 *
 * Scaffolds a new plugin directory at either:
 *   .local-plugins/<name>/   (default — for org / community plugin authors)
 *   plugins/<name>/          (--in-tree — for core contributors adding a
 *                             built-in plugin)
 *
 * The scaffolded plugin includes a placeholder `app:header-logo`
 * registration so `pnpm --filter @oc-mui/plugin-<name> test:contract`
 * passes on first run. Edit src/index.ts + plugin.json's extensionPoints
 * to replace the placeholder with real logic.
 *
 * Replaces the previous `scripts/export-plugin-to-local.js` and
 * `scripts/extract-module-to-plugin.mjs`. See AGENTS.md (repo root) for
 * the plugin authoring rules.
 */

import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const templatesDir = resolve(__dirname, "templates", "create-plugin");

const USAGE = `Usage:
  pnpm create-plugin <plugin-name> [--in-tree]

Arguments:
  <plugin-name>   kebab-case, [a-z][a-z0-9-]*. Used as the npm package
                  suffix, the plugin id, and the namespace.

Options:
  --in-tree       Scaffold under plugins/<name>/ instead of the default
                  .local-plugins/<name>/. Use this when adding a built-in
                  plugin that ships with the core repo.
  --help, -h      Show this message.

Examples:
  pnpm create-plugin audience-poll
  pnpm create-plugin admin-dashboard --in-tree`;

function fail(message, code = 1) {
  console.error(`✗ ${message}`);
  process.exit(code);
}

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(USAGE);
  process.exit(0);
}

const flags = new Set(args.filter((a) => a.startsWith("--")));
const positionals = args.filter((a) => !a.startsWith("--"));

const unknownFlags = [...flags].filter((f) => f !== "--in-tree");
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

const targetParent = flags.has("--in-tree") ? "plugins" : ".local-plugins";
const targetDir = resolve(repoRoot, targetParent, pluginName);
const relativeTarget = relative(repoRoot, targetDir);

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
    const relDest = relSrc.endsWith(".tpl") ? relSrc.slice(0, -4) : relSrc;
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

console.log("");
console.log("✓ Done.");
console.log("");
console.log("Next steps (from the repo root):");
console.log("");
console.log(`  1. pnpm install`);
console.log(`  2. pnpm build                  # one-time, populates dist-types/ for upstream packages`);
console.log(`  3. edit ${relativeTarget}/plugin.json   # fill in description, author, real extensionPoints`);
console.log(`  4. edit ${relativeTarget}/src/index.ts  # replace the placeholder registration`);
console.log(`  5. pnpm --filter @oc-mui/plugin-${pluginName} test:contract`);
console.log("");
console.log("Read AGENTS.md (repo root) for the full plugin authoring rules.");
