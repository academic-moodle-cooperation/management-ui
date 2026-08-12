/**
 * Shared discovery of `.local-plugins` locale directories.
 *
 * Two layouts are supported:
 *
 * - Root-level (canonical, what `pnpm create-plugin` scaffolds):
 *   `<plugin>/locales/<namespace>/<lng>.json` — the locale root can be moved
 *   via `plugin.json`'s `locales` field (a path relative to the plugin root).
 * - Modules (multi-module org plugins):
 *   `<plugin>/modules/<module>/locales/<namespace>/<lng>.json`
 *
 * Consumed by the dev middleware (`local-plugins-dev.ts`) and by the shell's
 * static-copy targets (`shell.config.ts`).
 */

import fs from "node:fs";
import path from "node:path";

export interface PluginLocaleNamespaceDir {
  namespace: string;
  /** Absolute path to the folder holding this namespace's `<lng>.json` files. */
  dir: string;
}

function isDirectory(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

/** `locales` field from plugin.json (or the package.json `pluginMetadata` fallback). */
function readManifestLocalesField(pluginDir: string): string | undefined {
  const pluginJsonPath = path.join(pluginDir, "plugin.json");
  const pkgPath = path.join(pluginDir, "package.json");
  try {
    if (fs.existsSync(pluginJsonPath)) {
      const manifest = JSON.parse(fs.readFileSync(pluginJsonPath, "utf-8"));
      return typeof manifest.locales === "string" ? manifest.locales : undefined;
    }
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      const meta = typeof pkg.pluginMetadata === "string" ? null : pkg.pluginMetadata;
      return typeof meta?.locales === "string" ? meta.locales : undefined;
    }
  } catch {
    // malformed manifest → fall back to the default layout
  }
  return undefined;
}

/**
 * Root-level locales dir for a plugin: `plugin.json`'s `locales` field when
 * present, else `locales/`. Returns null when the directory does not exist or
 * the manifest points outside the plugin dir (the dev server serves files from
 * here, so the root must stay confined to the plugin).
 */
export function resolveRootLocalesDir(pluginDir: string): string | null {
  const field = readManifestLocalesField(pluginDir);
  const dir = path.resolve(pluginDir, field ?? "locales");
  if (path.relative(pluginDir, dir).startsWith("..")) return null;
  return isDirectory(dir) ? dir : null;
}

function namespaceDirsIn(localesDir: string): PluginLocaleNamespaceDir[] {
  return fs
    .readdirSync(localesDir, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => ({ namespace: ent.name, dir: path.join(localesDir, ent.name) }));
}

/**
 * All namespace dirs of one plugin, root-level layout first — it is the
 * canonical layout and honors the manifest's `locales` field — then the
 * modules layout. Callers that dedupe by namespace therefore prefer the
 * root-level files when both layouts ship the same namespace.
 */
export function discoverPluginLocaleNamespaceDirs(pluginDir: string): PluginLocaleNamespaceDir[] {
  const result: PluginLocaleNamespaceDir[] = [];

  const rootDir = resolveRootLocalesDir(pluginDir);
  if (rootDir) result.push(...namespaceDirsIn(rootDir));

  const modulesDir = path.join(pluginDir, "modules");
  if (isDirectory(modulesDir)) {
    for (const modEnt of fs.readdirSync(modulesDir, { withFileTypes: true })) {
      if (!modEnt.isDirectory()) continue;
      const localesDir = path.join(modulesDir, modEnt.name, "locales");
      if (isDirectory(localesDir)) result.push(...namespaceDirsIn(localesDir));
    }
  }

  return result;
}

/**
 * Static-copy targets for the root-level locale layout across all
 * `.local-plugins` (the modules layout is covered by a glob in shell.config).
 * Each target copies `<plugin>/<locales-root>/<ns>/` to `locales/<ns>/`.
 * Namespace dirs without any `.json` file are skipped, so an empty layout adds
 * no targets (vite-plugin-static-copy errors on targets that match nothing).
 */
export function discoverLocalPluginRootLocaleTargets(
  monorepoRoot: string,
): { src: string; dest: string }[] {
  const targets: { src: string; dest: string }[] = [];
  const localPluginsDir = path.join(monorepoRoot, ".local-plugins");
  if (!isDirectory(localPluginsDir)) return targets;

  for (const dirent of fs.readdirSync(localPluginsDir, { withFileTypes: true })) {
    if (!dirent.isDirectory()) continue;
    const rootDir = resolveRootLocalesDir(path.join(localPluginsDir, dirent.name));
    if (!rootDir) continue;
    for (const ns of namespaceDirsIn(rootDir)) {
      if (!fs.readdirSync(ns.dir).some((name) => name.endsWith(".json"))) continue;
      targets.push({ src: ns.dir, dest: "locales" });
    }
  }

  return targets;
}
