#!/usr/bin/env node
/**
 * Validates all plugin.json manifests in the repo against the canonical schema
 * constraints. Exits with code 1 if any manifest is invalid.
 *
 * Usage:
 *   node scripts/validate-plugins.mjs              # validates plugins/ and .local-plugins/
 *   node scripts/validate-plugins.mjs path/to/plugin.json  # validates a single file
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const ALLOWED_CATEGORIES = [
  "feature",
  "theme",
  "integration",
  "utility",
  "config",
  "experimental",
];

const ALLOWED_VISIBILITY = ["public", "private"];

function validate(manifest, filePath) {
  const errors = [];
  const rel = path.relative(ROOT, filePath);

  if (manifest == null || typeof manifest !== "object") {
    return { file: rel, errors: ["Manifest must be a non-null object"] };
  }

  const required = ["id", "name", "version", "description", "author", "namespace"];
  for (const field of required) {
    if (manifest[field] === undefined || manifest[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof manifest.id === "string") {
    if (!/^[a-z0-9][a-z0-9.-]*$/.test(manifest.id)) {
      errors.push(`'id' must match ^[a-z0-9][a-z0-9.-]*$ — got "${manifest.id}"`);
    }
  } else if (manifest.id !== undefined) {
    errors.push("'id' must be a string");
  }

  if (typeof manifest.version === "string") {
    if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(manifest.version)) {
      errors.push(`'version' must be semver — got "${manifest.version}"`);
    }
  } else if (manifest.version !== undefined) {
    errors.push("'version' must be a string");
  }

  if (typeof manifest.namespace === "string") {
    if (!/^[a-z0-9-]+$/.test(manifest.namespace)) {
      errors.push(`'namespace' must match ^[a-z0-9-]+$ — got "${manifest.namespace}"`);
    }
  } else if (manifest.namespace !== undefined) {
    errors.push("'namespace' must be a string");
  }

  if (manifest.author !== undefined) {
    if (typeof manifest.author !== "object" || manifest.author === null) {
      errors.push("'author' must be an object");
    } else if (typeof manifest.author.name !== "string") {
      errors.push("'author.name' is required and must be a string");
    }
  }

  if (manifest.category !== undefined) {
    if (!ALLOWED_CATEGORIES.includes(manifest.category)) {
      errors.push(`'category' must be one of: ${ALLOWED_CATEGORIES.join(", ")}`);
    }
  }

  if (manifest.visibility !== undefined) {
    if (!ALLOWED_VISIBILITY.includes(manifest.visibility)) {
      errors.push(`'visibility' must be one of: ${ALLOWED_VISIBILITY.join(", ")}`);
    }
  }

  const hasModules = Array.isArray(manifest.modules) && manifest.modules.length > 0;

  if (!hasModules && !manifest.entry && !manifest.type) {
    errors.push("Single-module plugins must declare 'entry' or 'type' (or use 'modules' array)");
  }

  if (hasModules) {
    for (let i = 0; i < manifest.modules.length; i++) {
      const mod = manifest.modules[i];
      if (!mod || typeof mod !== "object") {
        errors.push(`modules[${i}] must be an object`);
        continue;
      }
      if (typeof mod.id !== "string" || !mod.id) {
        errors.push(`modules[${i}].id is required`);
      }
      if (typeof mod.type !== "string" || !mod.type) {
        errors.push(`modules[${i}].type is required`);
      }
      if (typeof mod.entry !== "string" || !mod.entry) {
        errors.push(`modules[${i}].entry is required`);
      }
    }

    const moduleIds = manifest.modules.filter((m) => m?.id).map((m) => m.id);
    const dupes = moduleIds.filter((id, i) => moduleIds.indexOf(id) !== i);
    if (dupes.length > 0) {
      errors.push(`Duplicate module ids: ${[...new Set(dupes)].join(", ")}`);
    }
  }

  if (manifest.pluginDependencies !== undefined) {
    if (!Array.isArray(manifest.pluginDependencies)) {
      errors.push("'pluginDependencies' must be an array");
    }
  }

  if (manifest.workspaceDependencies !== undefined) {
    if (typeof manifest.workspaceDependencies !== "object" || manifest.workspaceDependencies === null) {
      errors.push("'workspaceDependencies' must be an object");
    }
  }

  return { file: rel, errors };
}

function findPluginJsonFiles(dirs) {
  const files = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = path.join(dir, entry.name, "plugin.json");
      if (fs.existsSync(candidate)) {
        files.push(candidate);
      }
    }
  }
  return files;
}

function main() {
  const args = process.argv.slice(2);
  let files;

  if (args.length > 0) {
    files = args.map((a) => path.resolve(process.cwd(), a));
    for (const f of files) {
      if (!fs.existsSync(f)) {
        console.error(`File not found: ${f}`);
        process.exit(1);
      }
    }
  } else {
    files = findPluginJsonFiles([
      path.join(ROOT, "plugins"),
      path.join(ROOT, ".local-plugins"),
    ]);
  }

  if (files.length === 0) {
    console.log("No plugin.json files found.");
    process.exit(0);
  }

  let hasErrors = false;
  let valid = 0;

  for (const file of files) {
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (e) {
      console.error(`\n✗ ${path.relative(ROOT, file)}`);
      console.error(`  Parse error: ${e.message}`);
      hasErrors = true;
      continue;
    }

    const result = validate(manifest, file);
    if (result.errors.length > 0) {
      hasErrors = true;
      console.error(`\n✗ ${result.file}`);
      for (const err of result.errors) {
        console.error(`  - ${err}`);
      }
    } else {
      valid++;
      console.log(`✓ ${result.file}`);
    }
  }

  console.log(`\n${valid}/${files.length} manifests valid.`);
  process.exit(hasErrors ? 1 : 0);
}

main();
