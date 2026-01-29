/**
 * Vite plugin: serve .local-plugins/ in development and expose a manifest.
 *
 * - Scans .local-plugins/<name>/ for dist/*.mjs (and optional package.json for id/name).
 * - Serves .local-plugins/<name>/ at /local-plugins/<name>/ (dist/, themes/, etc.)
 * - Serves GET /local-plugins/manifest.json with { plugins: [ { name, id, url } ] }
 *
 * Only active in dev mode. In production, .local-plugins are not used.
 */

import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

const MANIFEST_PATH = "/local-plugins/manifest.json";
const LOCAL_PLUGINS_PREFIX = "/local-plugins/";

export interface LocalPluginsDevPluginOptions {
  /** Monorepo root (e.g. path.resolve(__dirname, "../..")) */
  monorepoRoot: string;
  /** Subpath under which local plugins are served (e.g. "" or "/management-ui") */
  basePath?: string;
}

interface LocalPluginEntry {
  name: string;
  id: string;
  url: string;
  /** Folder name under .local-plugins/; used for config-based filtering (pluginNamespace). */
  namespace: string;
  /** Type from filename (plugin-<namespace>-<type>.mjs); used to filter by config types for that namespace. */
  type?: string;
}

function discoverLocalPlugins(monorepoRoot: string, basePath: string): LocalPluginEntry[] {
  const localPluginsDir = path.join(monorepoRoot, ".local-plugins");
  const entries: LocalPluginEntry[] = [];

  if (!fs.existsSync(localPluginsDir) || !fs.statSync(localPluginsDir).isDirectory()) {
    return entries;
  }

  const dirs = fs.readdirSync(localPluginsDir, { withFileTypes: true });
  for (const dirent of dirs) {
    if (!dirent.isDirectory()) continue;

    const pluginDir = path.join(localPluginsDir, dirent.name);
    const distDir = path.join(pluginDir, "dist");
    if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) continue;

    const distFiles = fs.readdirSync(distDir);
    const mjsFiles = distFiles.filter((f) => f.endsWith(".mjs"));
    if (mjsFiles.length === 0) continue;

    let displayName = dirent.name;
    let defaultId = dirent.name;
    const pkgPath = path.join(pluginDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.pluginMetadata?.name) displayName = pkg.pluginMetadata.name;
        if (pkg.pluginMetadata?.id) defaultId = pkg.pluginMetadata.id;
      } catch {
        // ignore
      }
    }

    // One manifest entry per .mjs so you can split bundles (e.g. plugin-univie-sidebar.mjs)
    // Type from filename: plugin-<namespace>-<type>.mjs → type (e.g. "sidebar", "landing-page")
    const namespacePrefix = `plugin-${dirent.name}-`;
    for (const mjsFile of mjsFiles) {
      const stem = mjsFile.replace(/\.mjs$/, "");
      const type =
        stem.startsWith(namespacePrefix) && stem.length > namespacePrefix.length
          ? stem.slice(namespacePrefix.length)
          : undefined;
      const id = mjsFiles.length === 1 ? defaultId : `${dirent.name}/${stem}`;
      const urlPath = `${basePath}${LOCAL_PLUGINS_PREFIX}${dirent.name}/${mjsFile}`.replace(/\/+/g, "/");
      entries.push({
        name: mjsFiles.length === 1 ? displayName : `${displayName} (${type ?? stem})`,
        id,
        url: urlPath,
        namespace: dirent.name,
        ...(type ? { type } : {}),
      });
    }
  }

  return entries;
}

/**
 * Build a map: i18n namespace -> absolute path to that namespace's locale folder.
 * Scans .local-plugins/<name>/implementations/<type>/locales/<namespace>/ for de.json, en.json, etc.
 */
function discoverLocalPluginLocales(monorepoRoot: string): Map<string, string> {
  const map = new Map<string, string>();
  const localPluginsDir = path.join(monorepoRoot, ".local-plugins");
  if (!fs.existsSync(localPluginsDir) || !fs.statSync(localPluginsDir).isDirectory()) {
    return map;
  }
  const dirs = fs.readdirSync(localPluginsDir, { withFileTypes: true });
  for (const dirent of dirs) {
    if (!dirent.isDirectory()) continue;
    const pluginDir = path.join(localPluginsDir, dirent.name);
    const implementationsDir = path.join(pluginDir, "implementations");
    if (!fs.existsSync(implementationsDir) || !fs.statSync(implementationsDir).isDirectory()) continue;
    const types = fs.readdirSync(implementationsDir, { withFileTypes: true });
    for (const typeEnt of types) {
      if (!typeEnt.isDirectory()) continue;
      const localesDir = path.join(implementationsDir, typeEnt.name, "locales");
      if (!fs.existsSync(localesDir) || !fs.statSync(localesDir).isDirectory()) continue;
      const namespaces = fs.readdirSync(localesDir, { withFileTypes: true });
      for (const nsEnt of namespaces) {
        if (!nsEnt.isDirectory()) continue;
        const nsPath = path.join(localesDir, nsEnt.name);
        if (!map.has(nsEnt.name)) {
          map.set(nsEnt.name, nsPath);
        }
      }
    }
  }
  return map;
}

const LOCALES_PATH_RE = /^(.+)\/dist\/locales\/([^/]+)\/([a-z]{2}(-[A-Za-z0-9]+)?)\.json$/;

export function localPluginsDevPlugin(options: LocalPluginsDevPluginOptions): Plugin {
  const { monorepoRoot, basePath = "" } = options;
  const normalizedBase = basePath.replace(/\/$/, "") || "";

  return {
    name: "local-plugins-dev",
    apply: "serve",
    configureServer(server) {
      const localPluginsDir = path.join(monorepoRoot, ".local-plugins");
      if (!fs.existsSync(localPluginsDir)) return;

      const localeNamespaceToPath = discoverLocalPluginLocales(monorepoRoot);

      server.middlewares.use((req, res, next) => {
        const url = (req.url?.split("?")[0] ?? "").replace(/^\/+/, "/") || "/";

        // Serve .local-plugins locale files for i18n: .../dist/locales/<ns>/<lng>.json
        const localesMatch = url.match(LOCALES_PATH_RE);
        if (localesMatch) {
          const basePrefix = localesMatch[1];
          const ns = localesMatch[2];
          const lng = localesMatch[3];
          const baseOk = !normalizedBase || basePrefix === normalizedBase || url.startsWith(normalizedBase + "/");
          if (baseOk && ns !== undefined && lng !== undefined) {
            const localeDir = localeNamespaceToPath.get(ns);
            if (localeDir) {
              const filePath = path.join(localeDir, `${lng}.json`);
              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                try {
                  const content = fs.readFileSync(filePath, "utf-8");
                  res.setHeader("Content-Type", "application/json");
                  res.end(content);
                  return;
                } catch {
                  // fall through to next
                }
              }
            }
          }
        }

        const prefix = (normalizedBase + LOCAL_PLUGINS_PREFIX).replace(/\/+/g, "/");

        if (url === normalizedBase + MANIFEST_PATH) {
          const plugins = discoverLocalPlugins(monorepoRoot, normalizedBase);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ plugins }));
          return;
        }

        if (url.startsWith(prefix)) {
          const rest = url.slice(prefix.length);
          const [pluginDirName, ...fileParts] = rest.split("/").filter(Boolean);
          if (!pluginDirName || fileParts.length === 0) {
            next();
            return;
          }
          // Serve files under .local-plugins/<name>/: dist/<file>.mjs for plugin bundles, or themes/ etc.
          const pluginDir = path.join(localPluginsDir, pluginDirName);
          const firstPart = fileParts[0];
          const filePath =
            fileParts.length === 1 && typeof firstPart === "string" && firstPart.endsWith(".mjs")
              ? path.join(pluginDir, "dist", firstPart)
              : path.join(pluginDir, ...fileParts);
          if (!filePath.startsWith(pluginDir) || path.relative(pluginDir, filePath).startsWith("..")) {
            next();
            return;
          }
          try {
            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
              next();
              return;
            }
            const content = fs.readFileSync(filePath);
            const ext = path.extname(filePath);
            const mime =
              ext === ".mjs" || ext === ".js"
                ? "application/javascript"
                : ext === ".css"
                  ? "text/css"
                  : "application/octet-stream";
            res.setHeader("Content-Type", mime);
            res.end(content);
            return;
          } catch {
            next();
            return;
          }
        }

        next();
      });
    },
  };
}
