#!/usr/bin/env node

/**
 * Extract a module from a multi-entry org plugin into a standalone community plugin.
 *
 * Usage:
 *   pnpm plugin:extract <org>/<module> [options]
 *
 * Examples:
 *   pnpm plugin:extract tuwien/table-sidebar --name acl-table-sidebar --wire-config
 *   pnpm plugin:extract univie/empty-state --name custom-empty-state
 *   pnpm plugin:extract tuwien/upload-acl-editor --dry-run
 *
 * Options:
 *   --name <name>       Name for the new standalone plugin (default: <module>)
 *   --wire-config       Add namespace to .local-plugins/config/src/config.ts
 *   --target-dir <dir>  Target directory (default: .local-plugins)
 *   --dry-run           Print actions without writing files
 *   --force             Overwrite existing target folder
 *   --help              Show this help
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATE_DIR = path.join(ROOT, "examples", "community-plugin-template");
const LOCAL_CONFIG_FILE = path.join(ROOT, ".local-plugins", "config", "src", "config.ts");

const EXCLUDED = new Set(["node_modules", "dist", ".turbo", ".git", "coverage", "target"]);

// ---------------------------------------------------------------------------
// CLI Parsing
// ---------------------------------------------------------------------------

function printUsage() {
  console.log(`
Extract a module from a multi-entry org plugin into a standalone community plugin.

Usage:
  pnpm plugin:extract <org>/<module> [options]

Examples:
  pnpm plugin:extract tuwien/table-sidebar --name acl-table-sidebar --wire-config
  pnpm plugin:extract univie/empty-state --name custom-empty-state
  pnpm plugin:extract tuwien/upload-acl-editor --dry-run

Options:
  --name <name>       Name for the new standalone plugin (default: <module>)
  --wire-config       Add namespace to .local-plugins/config/src/config.ts
  --target-dir <dir>  Target directory (default: .local-plugins)
  --dry-run           Print actions without writing files
  --force             Overwrite existing target folder
  --help              Show this help
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const opts = {
    source: undefined,
    name: undefined,
    wireConfig: false,
    targetDir: ".local-plugins",
    dryRun: false,
    force: false,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (!token) break;

    if (token === "--help") {
      printUsage();
      process.exit(0);
    }
    if (token === "--name") {
      opts.name = args.shift();
      continue;
    }
    if (token === "--wire-config") {
      opts.wireConfig = true;
      continue;
    }
    if (token === "--target-dir") {
      opts.targetDir = args.shift();
      continue;
    }
    if (token === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (token === "--force") {
      opts.force = true;
      continue;
    }
    if (!token.startsWith("--") && !opts.source) {
      opts.source = token;
      continue;
    }

    console.error(`Unknown option: ${token}`);
    printUsage();
    process.exit(1);
  }

  return opts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function humanize(kebab) {
  return kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function shouldCopy(sourceRoot, sourcePath) {
  const rel = path.relative(sourceRoot, sourcePath);
  if (!rel) return true;
  return !rel.split(path.sep).some((s) => EXCLUDED.has(s));
}

function copyDir(src, dst, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] copy ${path.relative(ROOT, src)} → ${path.relative(ROOT, dst)}`);
    return;
  }
  fs.cpSync(src, dst, {
    recursive: true,
    filter: (p) => shouldCopy(src, p),
  });
}

function writeFile(filePath, content, dryRun) {
  const rel = path.relative(ROOT, filePath);
  if (dryRun) {
    console.log(`[dry-run] write ${rel}`);
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Detect module metadata from source index.ts
// ---------------------------------------------------------------------------

function detectModuleInfo(moduleDir) {
  const indexPath = path.join(moduleDir, "index.ts");
  if (!fs.existsSync(indexPath)) return {};

  const source = fs.readFileSync(indexPath, "utf-8");

  const nsMatch = source.match(/namespace:\s*["']([^"']+)["']/);
  const typeMatch = source.match(/type:\s*["']([^"']+)["']/);
  const versionMatch = source.match(/version:\s*["']([^"']+)["']/);
  const exportMatch = source.match(/export\s+(?:const|let)\s+(\w+)/);

  return {
    originalNamespace: nsMatch?.[1],
    originalType: typeMatch?.[1],
    version: versionMatch?.[1] || "1.0.0",
    exportName: exportMatch?.[1],
  };
}

// ---------------------------------------------------------------------------
// Rewrite the module's index.ts for standalone use
// ---------------------------------------------------------------------------

function rewriteEntryPoint(moduleDir, newName, newNamespace) {
  const indexPath = path.join(moduleDir, "index.ts");
  if (!fs.existsSync(indexPath)) return null;

  let source = fs.readFileSync(indexPath, "utf-8");

  // Update namespace
  source = source.replace(
    /namespace:\s*["'][^"']+["']/,
    `namespace: "${newNamespace}"`,
  );

  // Remove org-specific debug logs
  source = source.replace(/\s*logger\.debug\([^)]*\);\s*/g, "\n");

  // Add CSS import if not present
  if (!source.includes("./styles/")) {
    source = `import "./styles/index.css";\n\n${source}`;
  }

  // Add default export if not present
  if (!source.includes("export default")) {
    const exportMatch = source.match(/export\s+(?:const|let)\s+(\w+)/);
    if (exportMatch) {
      source += `\n\nexport default ${exportMatch[1]};\n`;
    }
  }

  return source;
}

// ---------------------------------------------------------------------------
// Generate scaffolding files
// ---------------------------------------------------------------------------

function generatePluginJson(newName, newNamespace, moduleInfo) {
  return JSON.stringify(
    {
      $schema: "../../packages/plugin-system/src/schemas/plugin.schema.json",
      id: newName,
      name: humanize(newName),
      version: moduleInfo.version || "1.0.0",
      description: `TODO: Describe what ${humanize(newName)} does.`,
      author: {
        name: "Your Name",
        email: "your.email@example.com",
      },
      namespace: newNamespace,
      type: moduleInfo.originalType || "app",
      category: "feature",
      apiVersion: ">=1.0.0",
      visibility: "public",
      entry: `dist/${newName}.mjs`,
      css: `dist/${newName}.css`,
      license: "MIT",
      icon: "Puzzle",
      tags: [],
      workspaceDependencies: {
        "@workspace/plugin-system": ">=1.0.0",
        "@workspace/ui": ">=1.0.0",
      },
    },
    null,
    2,
  );
}

function generatePackageJson(newName) {
  return JSON.stringify(
    {
      name: `@community/${newName}`,
      version: "1.0.0",
      type: "module",
      description: `TODO: Describe what ${humanize(newName)} does.`,
      author: {
        name: "Your Name",
        email: "your.email@example.com",
      },
      license: "MIT",
      pluginMetadata: "./plugin.json",
      main: `./dist/${newName}.mjs`,
      exports: {
        ".": `./dist/${newName}.mjs`,
      },
      files: ["dist"],
      scripts: {
        dev: "vite build --watch",
        build: "vite build",
        preview: "vite preview",
        lint: "eslint . --ext .ts,.tsx",
        typecheck: "tsc --noEmit",
      },
      peerDependencies: {
        "@workspace/plugin-system": "*",
        "@workspace/ui": "*",
        "react": "^18.0.0 || ^19.0.0",
        "react-dom": "^18.0.0 || ^19.0.0",
      },
      devDependencies: {
        "@types/react": "^18.0.0 || ^19.0.0",
        "@types/react-dom": "^18.0.0 || ^19.0.0",
        "@vitejs/plugin-react-swc": "^3.9.0",
        "@workspace/tailwind-config": "workspace:*",
        "eslint": "^9.20.0",
        "rollup": "^4.44.2",
        "tailwindcss": "^4.1.7",
        "typescript": "~5.5.4",
        "vite": "^6.0.0",
      },
    },
    null,
    2,
  );
}

function generateReadme(newName, orgName, moduleName) {
  return `# ${humanize(newName)}

> Extracted from \`${orgName}/modules/${moduleName}\` and generalized for community use.

## Installation

### As a local plugin (development)

1. Place this folder in \`.local-plugins/${newName}/\`
2. Run \`pnpm install && pnpm build\` in this folder
3. Add \`"${newName}"\` to \`pluginNamespace\` in \`.local-plugins/config/src/config.ts\`
4. Restart the dev server

### As a community plugin (production)

1. Build: \`pnpm build\`
2. Host \`dist/${newName}.mjs\` and \`dist/${newName}.css\` on a CDN
3. Register in a plugin registry or install via the Admin Marketplace

## TODO after extraction

- [ ] Update \`plugin.json\` — fill in description, author, tags, icon
- [ ] Update \`package.json\` — fill in description, author, repository
- [ ] Review \`src/index.ts\` — remove org-specific hardcoding, add configuration options
- [ ] Review components — make them generic (no hardcoded org names, logos, URLs)
- [ ] Update namespace from \`${newName}\` to something meaningful
- [ ] Add tests
- [ ] Update this README

## Development

\`\`\`bash
pnpm dev     # watch mode
pnpm build   # production build
pnpm lint    # lint
\`\`\`
`;
}

// ---------------------------------------------------------------------------
// Config wiring
// ---------------------------------------------------------------------------

function wireNamespace(namespace, dryRun) {
  if (!fs.existsSync(LOCAL_CONFIG_FILE)) {
    return `Skipped: ${path.relative(ROOT, LOCAL_CONFIG_FILE)} not found`;
  }

  const content = fs.readFileSync(LOCAL_CONFIG_FILE, "utf-8");

  if (new RegExp(`["']${namespace}["']`).test(content)) {
    return `Namespace "${namespace}" already configured`;
  }

  const nsIdx = content.indexOf("pluginNamespace");
  if (nsIdx === -1) return "Skipped: pluginNamespace not found in config";

  const arrStart = content.indexOf("[", nsIdx);
  if (arrStart === -1) return "Skipped: pluginNamespace array not found";

  const arrEnd = findClosingBracket(content, arrStart);
  if (arrEnd === -1) return "Skipped: could not find closing bracket";

  const lineStart = content.lastIndexOf("\n", arrStart) + 1;
  const indent = content.slice(lineStart, arrStart).match(/^\s*/)?.[0] || "";
  const insertion = `${indent}  "${namespace}",\n`;
  const updated = content.slice(0, arrEnd) + insertion + content.slice(arrEnd);

  if (dryRun) {
    console.log(`[dry-run] wire namespace "${namespace}" in config`);
    return `Would add namespace: ${namespace}`;
  }

  fs.writeFileSync(LOCAL_CONFIG_FILE, updated, "utf-8");
  return `Added namespace: ${namespace}`;
}

function findClosingBracket(text, start) {
  let depth = 0;
  let inStr = false;
  let strChar = "";
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : "";
    if (inStr) {
      if (ch === strChar && prev !== "\\") inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = true;
      strChar = ch;
      continue;
    }
    if (ch === "[") depth++;
    if (ch === "]") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Copy template files that the module won't have
// ---------------------------------------------------------------------------

function copyTemplateFiles(targetDir, dryRun) {
  const templateFiles = [
    "postcss.config.mjs",
    "tailwind.config.ts",
    "tsconfig.json",
    "src/styles/index.css",
  ];

  let copied = 0;
  for (const rel of templateFiles) {
    const src = path.join(TEMPLATE_DIR, rel);
    const dst = path.join(targetDir, rel);
    if (fs.existsSync(dst) || !fs.existsSync(src)) continue;
    if (dryRun) {
      console.log(`[dry-run] copy template ${rel}`);
      copied++;
      continue;
    }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    copied++;
  }
  return copied;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.source || !opts.source.includes("/")) {
    console.error('Error: Source must be in "org/module" format (e.g., tuwien/table-sidebar)');
    printUsage();
    process.exit(1);
  }

  const [orgName, moduleName] = opts.source.split("/", 2);
  const newName = opts.name || moduleName;

  if (!/^[a-z0-9][a-z0-9-]*$/.test(newName)) {
    console.error(`Error: Invalid plugin name "${newName}". Use lowercase kebab-case.`);
    process.exit(1);
  }

  // Resolve source module
  const moduleDir = path.join(ROOT, ".local-plugins", orgName, "modules", moduleName);
  if (!fs.existsSync(moduleDir) || !fs.statSync(moduleDir).isDirectory()) {
    console.error(`Error: Module not found: .local-plugins/${orgName}/modules/${moduleName}`);
    console.error("\nAvailable modules:");
    const modulesDir = path.join(ROOT, ".local-plugins", orgName, "modules");
    if (fs.existsSync(modulesDir)) {
      for (const d of fs.readdirSync(modulesDir, { withFileTypes: true })) {
        if (d.isDirectory()) console.error(`  ${orgName}/${d.name}`);
      }
    }
    process.exit(1);
  }

  // Resolve target
  const targetRoot = path.resolve(ROOT, opts.targetDir);
  const targetDir = path.join(targetRoot, newName);

  if (fs.existsSync(targetDir) && !opts.force) {
    console.error(`Error: Target already exists: ${path.relative(ROOT, targetDir)}`);
    console.error("Use --force to overwrite.");
    process.exit(1);
  }

  if (fs.existsSync(targetDir) && opts.force) {
    if (opts.dryRun) {
      console.log(`[dry-run] rm -rf ${path.relative(ROOT, targetDir)}`);
    } else {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }

  // Detect module metadata
  const moduleInfo = detectModuleInfo(moduleDir);

  console.log(`\nExtracting module: .local-plugins/${orgName}/modules/${moduleName}`);
  console.log(`Target: ${path.relative(ROOT, targetDir)}`);
  console.log(`New name: ${newName}`);
  console.log(`Original: ${moduleInfo.originalNamespace}:${moduleInfo.originalType}`);
  console.log("");

  // 1. Create target directory and copy source files to src/
  const srcDir = path.join(targetDir, "src");
  if (!opts.dryRun) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // Copy module files into src/
  copyDir(moduleDir, srcDir, opts.dryRun);

  // If the module has a top-level index.ts, move it to src/index.ts and rewrite
  const rewritten = rewriteEntryPoint(srcDir, newName, newName);
  if (rewritten) {
    writeFile(path.join(srcDir, "index.ts"), rewritten, opts.dryRun);
  }

  // Copy locale files if present (move from src/locales to top-level locales)
  const srcLocales = path.join(srcDir, "locales");
  const topLocales = path.join(targetDir, "locales");
  if (fs.existsSync(srcLocales)) {
    if (!opts.dryRun) {
      fs.cpSync(srcLocales, topLocales, { recursive: true });
      fs.rmSync(srcLocales, { recursive: true, force: true });
    } else {
      console.log(`[dry-run] move locales to top-level`);
    }
  }

  // 2. Generate plugin.json
  writeFile(
    path.join(targetDir, "plugin.json"),
    generatePluginJson(newName, newName, moduleInfo) + "\n",
    opts.dryRun,
  );

  // 3. Generate package.json
  writeFile(
    path.join(targetDir, "package.json"),
    generatePackageJson(newName) + "\n",
    opts.dryRun,
  );

  // 4. Copy vite.config.ts from template
  const templateVite = path.join(TEMPLATE_DIR, "vite.config.ts");
  if (fs.existsSync(templateVite)) {
    if (opts.dryRun) {
      console.log(`[dry-run] copy template vite.config.ts`);
    } else {
      fs.copyFileSync(templateVite, path.join(targetDir, "vite.config.ts"));
    }
  }

  // 5. Copy other template scaffolding files
  const templateFilesCopied = copyTemplateFiles(targetDir, opts.dryRun);

  // 6. Generate README
  writeFile(
    path.join(targetDir, "README.md"),
    generateReadme(newName, orgName, moduleName),
    opts.dryRun,
  );

  // 7. Generate index.ts barrel export (for production JAR builds)
  writeFile(
    path.join(targetDir, "index.ts"),
    `export * from "./src/index";\n`,
    opts.dryRun,
  );

  // 8. Wire config if requested
  let wireResult = null;
  if (opts.wireConfig) {
    wireResult = wireNamespace(newName, opts.dryRun);
  }

  // Summary
  console.log("\n✓ Extraction complete!\n");
  console.log(`  Source:     .local-plugins/${orgName}/modules/${moduleName}`);
  console.log(`  Target:     ${path.relative(ROOT, targetDir)}`);
  console.log(`  Plugin ID:  ${newName}`);
  console.log(`  Namespace:  ${newName}`);
  console.log(`  Type:       ${moduleInfo.originalType || "app"}`);
  console.log(`  Template files copied: ${templateFilesCopied}`);
  if (wireResult) {
    console.log(`  Config:     ${wireResult}`);
  }

  console.log("\nNext steps:");
  console.log(`  1. cd ${path.relative(ROOT, targetDir)}`);
  console.log(`  2. Review and update plugin.json (description, author, icon, tags)`);
  console.log(`  3. Review src/index.ts — remove org-specific code, add config options`);
  console.log(`  4. pnpm install && pnpm build`);
  console.log(`  5. Test in the dev server`);
  if (!opts.wireConfig) {
    console.log(`  6. Add "${newName}" to pluginNamespace in .local-plugins/config/src/config.ts`);
  }
  console.log(`\n  See ${path.relative(ROOT, targetDir)}/README.md for the full checklist.`);
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
