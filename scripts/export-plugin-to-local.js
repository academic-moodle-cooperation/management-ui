#!/usr/bin/env node

/**
 * Export or create a plugin in /.local-plugins (or custom target dir).
 *
 * Primary workflows:
 * 1) Export existing built-in plugin:
 *    pnpm plugin:export-local <plugin-name> --move
 *
 * 2) Export + convert to community style + namespace wiring:
 *    pnpm plugin:export-local <plugin-name> --move --convert-community --wire-config
 *
 * 3) Create new plugin directly from template:
 *    pnpm plugin:create-local <plugin-name> --wire-config
 */

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const PLUGINS_DIR = path.join(REPO_ROOT, "plugins");
const TEMPLATE_PLUGIN_DIR = path.join(
  REPO_ROOT,
  "examples",
  "community-plugin-template",
);
const BARREL_FILE = path.join(PLUGINS_DIR, "index.ts");
const LOCAL_CONFIG_FILE = path.join(REPO_ROOT, ".local-plugins", "config", "src", "config.ts");

const EXCLUDED_SEGMENTS = new Set([
  "node_modules",
  "dist",
  ".turbo",
  ".git",
  "coverage",
  "target",
]);

const COMMUNITY_TEMPLATE_FILES = [
  "index.ts",
  "vite.config.ts",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
  "AVAILABLE_PACKAGES.md",
  "SETUP.md",
  "backend/pom.xml",
  "backend/README.md",
  ".github/workflows/release.yml",
  "locales/example/en.json",
  "src/styles/index.css",
];

function printUsage() {
  console.log(`\nPlugin local export/create helper\n\nUsage:\n  pnpm plugin:export-local <plugin-name> [options]\n  pnpm plugin:create-local <plugin-name> [options]\n\nOptions:\n  --move                  Remove source plugin folder after successful export\n  --force                 Overwrite existing target folder\n  --dry-run               Print actions without writing files\n  --target-dir <dir>      Export target directory (default: .local-plugins)\n  --keep-barrel           Keep export in plugins/index.ts (default: remove export)\n\n  --from-template         Create plugin from examples/community-plugin-template\n                          (used by plugin:create-local alias)\n  --convert-community     Convert package to community-style runtime plugin setup\n  --community             Alias for --convert-community\n  --wire-config           Add plugin namespace to .local-plugins/config/src/config.ts\n  --namespace <name>      Namespace for --wire-config (default: plugin-name)\n\n  --help                  Show this help\n`);
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    move: false,
    force: false,
    dryRun: false,
    keepBarrel: false,
    fromTemplate: false,
    convertCommunity: false,
    wireConfig: false,
    namespace: undefined,
    targetDir: ".local-plugins",
    pluginName: undefined,
  };

  while (args.length > 0) {
    const token = args.shift();
    if (!token) break;

    if (!token.startsWith("--") && !options.pluginName) {
      options.pluginName = token;
      continue;
    }

    if (token === "--move") {
      options.move = true;
      continue;
    }

    if (token === "--force") {
      options.force = true;
      continue;
    }

    if (token === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (token === "--keep-barrel") {
      options.keepBarrel = true;
      continue;
    }

    if (token === "--from-template") {
      options.fromTemplate = true;
      continue;
    }

    if (token === "--convert-community" || token === "--community") {
      options.convertCommunity = true;
      continue;
    }

    if (token === "--wire-config") {
      options.wireConfig = true;
      continue;
    }

    if (token === "--namespace") {
      const value = args.shift();
      if (!value) {
        throw new Error("Missing value for --namespace");
      }
      options.namespace = value;
      continue;
    }

    if (token === "--target-dir") {
      const value = args.shift();
      if (!value) {
        throw new Error("Missing value for --target-dir");
      }
      options.targetDir = value;
      continue;
    }

    if (token === "--help") {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown option: ${token}`);
  }

  return options;
}

function assertPluginName(name) {
  if (!name) {
    throw new Error("Missing plugin name. Example: pnpm plugin:export-local my-plugin");
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(
      `Invalid plugin name "${name}". Use lowercase kebab-case (letters, numbers, hyphen).`,
    );
  }
}

function humanizePluginName(name) {
  return name
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonFile(filePath, data, dryRun) {
  const relative = path.relative(REPO_ROOT, filePath);
  if (dryRun) {
    console.log(`[dry-run] write ${relative}`);
    return;
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeAuthor(author) {
  if (!author) {
    return {
      name: "Management UI Demo Team",
      email: "demo@example.com",
      url: "https://github.com/opencast/management-ui",
    };
  }

  if (typeof author === "string") {
    return { name: author };
  }

  if (typeof author === "object") {
    return {
      ...author,
      name: author.name || "Management UI Demo Team",
    };
  }

  return { name: "Management UI Demo Team" };
}

function shouldCopy(sourceRoot, sourcePath) {
  const relativePath = path.relative(sourceRoot, sourcePath);

  if (!relativePath) {
    return true;
  }

  const segments = relativePath.split(path.sep);
  if (segments.some((segment) => EXCLUDED_SEGMENTS.has(segment))) {
    return false;
  }

  const basename = path.basename(sourcePath);
  if (basename.endsWith(".tsbuildinfo") || basename === ".DS_Store") {
    return false;
  }

  return true;
}

function ensureDirectory(dirPath, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] mkdir -p ${path.relative(REPO_ROOT, dirPath)}`);
    return;
  }

  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDirectory(dirPath, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] rm -rf ${path.relative(REPO_ROOT, dirPath)}`);
    return;
  }

  fs.rmSync(dirPath, { recursive: true, force: true });
}

function copyDirectory(sourceDir, targetDir, dryRun) {
  if (dryRun) {
    console.log(
      `[dry-run] copy ${path.relative(REPO_ROOT, sourceDir)} -> ${path.relative(REPO_ROOT, targetDir)}`,
    );
    return;
  }

  fs.cpSync(sourceDir, targetDir, {
    recursive: true,
    filter: (sourcePath) => shouldCopy(sourceDir, sourcePath),
  });
}

function copyFileIfMissing(sourceFile, targetFile, dryRun) {
  if (!fs.existsSync(sourceFile) || !fs.statSync(sourceFile).isFile()) {
    throw new Error(`Template file missing: ${path.relative(REPO_ROOT, sourceFile)}`);
  }

  if (fs.existsSync(targetFile)) {
    return false;
  }

  if (dryRun) {
    console.log(
      `[dry-run] copy file ${path.relative(REPO_ROOT, sourceFile)} -> ${path.relative(REPO_ROOT, targetFile)}`,
    );
    return true;
  }

  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.copyFileSync(sourceFile, targetFile);
  return true;
}

function updatePluginsBarrel(pluginName, keepBarrel, dryRun) {
  if (keepBarrel) {
    return { changed: false, removedLine: false };
  }

  if (!fs.existsSync(BARREL_FILE)) {
    throw new Error("plugins/index.ts not found");
  }

  const original = fs.readFileSync(BARREL_FILE, "utf8");
  const lines = original.split(/\r?\n/);
  let removedLine = false;
  const filtered = lines.filter((line) => {
    const normalized = line.replace(/\s+/g, " ").trim();
    const targetA = `export * from \"./${pluginName}\";`;
    const targetB = `export * from './${pluginName}';`;
    const shouldRemove = normalized === targetA || normalized === targetB;
    if (shouldRemove) {
      removedLine = true;
      return false;
    }
    return true;
  });

  if (!removedLine) {
    return { changed: false, removedLine: false };
  }

  const updated = filtered.join("\n");

  if (dryRun) {
    console.log(`[dry-run] remove export from plugins/index.ts: ./${pluginName}`);
    return { changed: true, removedLine: true };
  }

  fs.writeFileSync(BARREL_FILE, `${updated.endsWith("\n") ? updated : `${updated}\n`}`, "utf8");
  return { changed: true, removedLine: true };
}

function inspectPlugin(targetDir) {
  const packageJsonPath = path.join(targetDir, "package.json");
  const viteConfigPath = path.join(targetDir, "vite.config.ts");

  let packageJson = null;
  if (fs.existsSync(packageJsonPath)) {
    packageJson = readJsonFile(packageJsonPath);
  }

  const buildScript = packageJson?.scripts?.build || "";
  const isLibraryStyle =
    !fs.existsSync(viteConfigPath) ||
    /no build step required/i.test(String(buildScript)) ||
    /^echo\s+/i.test(String(buildScript));

  return {
    hasViteConfig: fs.existsSync(viteConfigPath),
    isLibraryStyle,
  };
}

function ensureCommunityTemplateFiles(targetDir, dryRun) {
  if (!fs.existsSync(TEMPLATE_PLUGIN_DIR) || !fs.statSync(TEMPLATE_PLUGIN_DIR).isDirectory()) {
    throw new Error("examples/community-plugin-template not found");
  }

  let copied = 0;
  for (const relativeFile of COMMUNITY_TEMPLATE_FILES) {
    const sourceFile = path.join(TEMPLATE_PLUGIN_DIR, relativeFile);
    const targetFile = path.join(targetDir, relativeFile);
    if (copyFileIfMissing(sourceFile, targetFile, dryRun)) {
      copied += 1;
    }
  }

  return copied;
}

function replaceInFile(filePath, replacer, dryRun) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }

  const original = fs.readFileSync(filePath, "utf8");
  const updated = replacer(original);

  if (updated === original) {
    return false;
  }

  if (dryRun) {
    console.log(`[dry-run] update ${path.relative(REPO_ROOT, filePath)}`);
    return true;
  }

  fs.writeFileSync(filePath, updated, "utf8");
  return true;
}

function updateTemplatePluginSource(targetDir, pluginName, displayName, dryRun) {
  const sourceIndex = path.join(targetDir, "src", "index.ts");
  replaceInFile(
    sourceIndex,
    (content) =>
      content
        .replace(/namespace:\s*"my-plugin"/, `namespace: "${pluginName}"`)
        .replace(/"my-plugin-app"/g, `"${pluginName}-app"`)
        .replace(/"my-plugin-nav"/g, `"${pluginName}-nav"`)
        .replace(/routePath:\s*"\/my-plugin"/, `routePath: "/${pluginName}"`)
        .replace(/path:\s*"\/my-plugin"/, `path: "/${pluginName}"`)
        .replace(/name:\s*"My Plugin"/, `name: "${displayName}"`)
        .replace(/title:\s*"My Plugin"/, `title: "${displayName}"`),
    dryRun,
  );

  const readmeFile = path.join(targetDir, "README.md");
  replaceInFile(
    readmeFile,
    (content) => content.replace(/my-plugin/g, pluginName).replace(/My Community Plugin/g, displayName),
    dryRun,
  );
}

function mergePackageForCommunity(existingPkg, templatePkg, pluginName) {
  const existingDisplayName = existingPkg?.pluginMetadata?.name;
  const existingDescription = existingPkg?.pluginMetadata?.description || existingPkg?.description;
  const isTemplatePlaceholderName =
    typeof existingDisplayName === "string" &&
    (existingDisplayName.trim() === "My Community Plugin" || existingDisplayName.trim() === "");
  const isTemplatePlaceholderDescription =
    typeof existingDescription === "string" &&
    (existingDescription.trim() === "Description of what this plugin does" ||
      existingDescription.trim() === "");

  const displayName =
    (!isTemplatePlaceholderName ? existingDisplayName : undefined) ||
    existingPkg?.name?.replace(/^@[^/]+\//, "").replace(/^my-plugin$/, "") ||
    humanizePluginName(pluginName);
  const description =
    (!isTemplatePlaceholderDescription ? existingPkg?.pluginMetadata?.description : undefined) ||
    (!isTemplatePlaceholderDescription ? existingPkg?.description : undefined) ||
    `Community plugin: ${displayName}`;

  const templateWorkspaceDeps = templatePkg?.pluginMetadata?.workspaceDependencies || {};
  const existingWorkspaceDeps = existingPkg?.pluginMetadata?.workspaceDependencies || {};

  const mergedScripts = {
    ...(existingPkg?.scripts || {}),
    dev:
      existingPkg?.scripts?.dev && !/^echo\s+/i.test(existingPkg.scripts.dev)
        ? existingPkg.scripts.dev
        : "vite build --watch",
    build:
      existingPkg?.scripts?.build && !/^echo\s+/i.test(existingPkg.scripts.build)
        ? existingPkg.scripts.build
        : "vite build",
    preview: existingPkg?.scripts?.preview || "vite preview",
    lint: existingPkg?.scripts?.lint || "eslint . --ext .ts,.tsx",
    typecheck:
      existingPkg?.scripts?.typecheck || existingPkg?.scripts?.["check-types"] || "tsc --noEmit",
  };

  const existingPkgName = existingPkg?.name;
  const isTemplatePlaceholderPackageName =
    typeof existingPkgName === "string" &&
    (existingPkgName === "@community/my-plugin" || existingPkgName === "my-plugin");

  return {
    ...existingPkg,
    name:
      existingPkg?.name &&
      !existingPkg.name.startsWith("@workspace/") &&
      !isTemplatePlaceholderPackageName
        ? existingPkg.name
        : `@community/${pluginName}`,
    version: existingPkg?.version || "1.0.0",
    type: "module",
    private: existingPkg?.private ?? true,
    description,
    author: normalizeAuthor(existingPkg?.author || templatePkg?.author),
    license: existingPkg?.license || templatePkg?.license || "MIT",
    repository: existingPkg?.repository || templatePkg?.repository,
    pluginMetadata: {
      ...(templatePkg?.pluginMetadata || {}),
      ...(existingPkg?.pluginMetadata || {}),
      id: pluginName,
      name: existingPkg?.pluginMetadata?.name || displayName,
      description,
      workspaceDependencies: {
        ...templateWorkspaceDeps,
        ...existingWorkspaceDeps,
      },
    },
    main: `./dist/${pluginName}.mjs`,
    types: existingPkg?.types || "./src/index.ts",
    exports: {
      ".": `./dist/${pluginName}.mjs`,
    },
    files: ["dist"],
    scripts: mergedScripts,
    peerDependencies: {
      ...(templatePkg?.peerDependencies || {}),
      ...(existingPkg?.peerDependencies || {}),
    },
    devDependencies: {
      ...(templatePkg?.devDependencies || {}),
      ...(existingPkg?.devDependencies || {}),
    },
  };
}

function updatePluginMetadata(targetDir, packageJson, pluginName, dryRun) {
  const metadataPath = path.join(targetDir, "plugin-metadata.json");
  const templateMetadata = readJsonFile(path.join(TEMPLATE_PLUGIN_DIR, "plugin-metadata.json")) || {};
  const existingMetadata = readJsonFile(metadataPath) || {};

  const pluginMetadata = packageJson.pluginMetadata || {};
  const repositoryUrl =
    existingMetadata.repositoryUrl ||
    pluginMetadata.repositoryUrl ||
    packageJson.repository?.url ||
    templateMetadata.repositoryUrl ||
    "https://github.com/your-org/your-plugin";

  const homepageUrl =
    existingMetadata.homepageUrl ||
    pluginMetadata.homepageUrl ||
    packageJson.homepage ||
    repositoryUrl;

  const mergedMetadata = {
    ...templateMetadata,
    ...existingMetadata,
    id: pluginName,
    name: pluginMetadata.name || existingMetadata.name || humanizePluginName(pluginName),
    description:
      pluginMetadata.description ||
      existingMetadata.description ||
      packageJson.description ||
      templateMetadata.description ||
      `Community plugin: ${pluginName}`,
    version: packageJson.version || existingMetadata.version || "1.0.0",
    author: normalizeAuthor(existingMetadata.author || packageJson.author),
    category: pluginMetadata.category || existingMetadata.category || templateMetadata.category || "feature",
    icon: pluginMetadata.icon || existingMetadata.icon || templateMetadata.icon || "Puzzle",
    tags: pluginMetadata.tags || existingMetadata.tags || templateMetadata.tags || [],
    repositoryUrl,
    homepageUrl,
    license: packageJson.license || existingMetadata.license || templateMetadata.license || "MIT",
    workspaceDependencies: {
      ...(templateMetadata.workspaceDependencies || {}),
      ...(existingMetadata.workspaceDependencies || {}),
      ...(pluginMetadata.workspaceDependencies || {}),
    },
  };

  writeJsonFile(metadataPath, mergedMetadata, dryRun);
}

function convertPluginToCommunity(targetDir, pluginName, options) {
  const { dryRun, fromTemplate } = options;
  const copiedTemplateFiles = ensureCommunityTemplateFiles(targetDir, dryRun);

  const packageJsonPath = path.join(targetDir, "package.json");
  const templatePkg = readJsonFile(path.join(TEMPLATE_PLUGIN_DIR, "package.json"));
  const existingPkg = readJsonFile(packageJsonPath) || {};

  if (!templatePkg) {
    throw new Error("Failed to read template package.json");
  }

  const mergedPackage = mergePackageForCommunity(existingPkg, templatePkg, pluginName);
  writeJsonFile(packageJsonPath, mergedPackage, dryRun);

  updatePluginMetadata(targetDir, mergedPackage, pluginName, dryRun);

  if (fromTemplate) {
    const displayName = mergedPackage.pluginMetadata?.name || humanizePluginName(pluginName);
    updateTemplatePluginSource(targetDir, pluginName, displayName, dryRun);
  }

  return { copiedTemplateFiles };
}

function findMatchingBracket(text, startIndex) {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    const prev = text[i - 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (prev === "*" && char === "/") inBlockComment = false;
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (char === "/" && next === "/") {
        inLineComment = true;
        i += 1;
        continue;
      }

      if (char === "/" && next === "*") {
        inBlockComment = true;
        i += 1;
        continue;
      }
    }

    if (!inDouble && !inBacktick && char === "'" && prev !== "\\") {
      inSingle = !inSingle;
      continue;
    }

    if (!inSingle && !inBacktick && char === '"' && prev !== "\\") {
      inDouble = !inDouble;
      continue;
    }

    if (!inSingle && !inDouble && char === "`" && prev !== "\\") {
      inBacktick = !inBacktick;
      continue;
    }

    if (inSingle || inDouble || inBacktick) {
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
      continue;
    }
  }

  return -1;
}

function namespaceAlreadyConfigured(configContent, namespace) {
  const asString = new RegExp(`(["'])${namespace}\\1`, "m");
  const asObjectKey = new RegExp(`(["'])${namespace}\\1\\s*:`, "m");
  return asString.test(configContent) || asObjectKey.test(configContent);
}

function wireNamespaceInLocalConfig(namespace, dryRun) {
  if (!fs.existsSync(LOCAL_CONFIG_FILE) || !fs.statSync(LOCAL_CONFIG_FILE).isFile()) {
    return { changed: false, message: "Skipped: .local-plugins/config/src/config.ts not found." };
  }

  const original = fs.readFileSync(LOCAL_CONFIG_FILE, "utf8");

  if (namespaceAlreadyConfigured(original, namespace)) {
    return { changed: false, message: `Namespace already present: ${namespace}` };
  }

  const pluginNamespaceIndex = original.indexOf("pluginNamespace");
  if (pluginNamespaceIndex === -1) {
    return {
      changed: false,
      message: "Skipped: pluginNamespace array not found in .local-plugins/config/src/config.ts",
    };
  }

  const arrayStart = original.indexOf("[", pluginNamespaceIndex);
  if (arrayStart === -1) {
    return {
      changed: false,
      message: "Skipped: pluginNamespace array start not found.",
    };
  }

  const arrayEnd = findMatchingBracket(original, arrayStart);
  if (arrayEnd === -1) {
    return {
      changed: false,
      message: "Skipped: pluginNamespace array end not found.",
    };
  }

  const arrayLineStart = original.lastIndexOf("\n", arrayStart) + 1;
  const arrayIndent = original.slice(arrayLineStart, arrayStart).match(/^\s*/)?.[0] || "";
  const itemIndent = `${arrayIndent}  `;
  const insertion = `${itemIndent}"${namespace}",\n`;

  const updated = `${original.slice(0, arrayEnd)}${insertion}${original.slice(arrayEnd)}`;

  if (dryRun) {
    console.log(`[dry-run] wire namespace in .local-plugins/config/src/config.ts: ${namespace}`);
    return { changed: true, message: `Would add namespace: ${namespace}` };
  }

  fs.writeFileSync(LOCAL_CONFIG_FILE, updated, "utf8");
  return { changed: true, message: `Added namespace: ${namespace}` };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  assertPluginName(options.pluginName);

  if (options.fromTemplate && options.move) {
    throw new Error("--move cannot be used with --from-template");
  }

  const sourceDir = options.fromTemplate
    ? TEMPLATE_PLUGIN_DIR
    : path.join(PLUGINS_DIR, options.pluginName);

  const targetRootDir = path.resolve(REPO_ROOT, options.targetDir);
  const targetDir = path.join(targetRootDir, options.pluginName);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Source plugin not found: ${path.relative(REPO_ROOT, sourceDir)}`);
  }

  if (path.resolve(sourceDir) === path.resolve(targetDir)) {
    throw new Error("Source and target paths are identical. Use a different --target-dir.");
  }

  if (fs.existsSync(targetDir)) {
    if (!options.force) {
      throw new Error(
        `Target already exists: ${path.relative(REPO_ROOT, targetDir)}. Use --force to overwrite.`,
      );
    }
    removeDirectory(targetDir, options.dryRun);
  }

  ensureDirectory(targetRootDir, options.dryRun);
  copyDirectory(sourceDir, targetDir, options.dryRun);

  let barrelResult = { changed: false, removedLine: false };
  if (!options.fromTemplate) {
    barrelResult = updatePluginsBarrel(options.pluginName, options.keepBarrel, options.dryRun);
  }

  if (options.move) {
    removeDirectory(sourceDir, options.dryRun);
  }

  const inspection = inspectPlugin(targetDir);
  let communityResult = null;
  if (options.convertCommunity || options.fromTemplate) {
    communityResult = convertPluginToCommunity(targetDir, options.pluginName, {
      dryRun: options.dryRun,
      fromTemplate: options.fromTemplate,
    });
  }

  let wireResult = null;
  if (options.wireConfig) {
    const namespace = options.namespace || options.pluginName;
    wireResult = wireNamespaceInLocalConfig(namespace, options.dryRun);
  }

  console.log("\nPlugin local export/create completed.");
  console.log(`- Source: ${path.relative(REPO_ROOT, sourceDir)}`);
  console.log(`- Target: ${path.relative(REPO_ROOT, targetDir)}`);
  console.log(`- Operation: ${options.fromTemplate ? "create-from-template" : options.move ? "move" : "copy"}`);

  if (!options.fromTemplate) {
    console.log(`- Barrel export removed: ${barrelResult.removedLine ? "yes" : "no"}`);
  }

  if (communityResult) {
    console.log(`- Community conversion: yes (template files added: ${communityResult.copiedTemplateFiles})`);
  } else {
    console.log("- Community conversion: no");
  }

  if (wireResult) {
    console.log(`- Config wiring: ${wireResult.message}`);
  }

  console.log("\nNext steps:");
  console.log(`1. cd ${path.relative(REPO_ROOT, targetDir)}`);
  console.log("2. pnpm build");
  console.log("3. cd ../.. && pnpm dev --filter=shell");

  if (!communityResult && inspection.isLibraryStyle) {
    console.log("\nWarning:");
    console.log(
      "- This plugin still looks like a library-style built-in plugin (no standalone runtime bundle setup detected).",
    );
    console.log(
      `- Re-run with: pnpm plugin:export-local ${options.pluginName} --force --convert-community --wire-config`,
    );
  }
}

try {
  main();
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  printUsage();
  process.exit(1);
}
