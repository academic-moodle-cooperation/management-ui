/**
 * Vite plugin: serve .local-plugins/ in development and expose a manifest.
 *
 * - Scans .local-plugins/<name>/ for dist/*.mjs (and optional package.json for id/name).
 * - Serves .local-plugins/<name>/dist at /local-plugins/<name>/
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
    const mjsFile = distFiles.find((f) => f.endsWith(".mjs"));
    if (!mjsFile) continue;

    let id = dirent.name;
    let displayName = dirent.name;
    const pkgPath = path.join(pluginDir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.pluginMetadata?.id) id = pkg.pluginMetadata.id;
        if (pkg.pluginMetadata?.name) displayName = pkg.pluginMetadata.name;
      } catch {
        // ignore
      }
    }

    const urlPath = `${basePath}${LOCAL_PLUGINS_PREFIX}${dirent.name}/${mjsFile}`.replace(/\/+/g, "/");
    entries.push({
      name: displayName,
      id,
      url: urlPath,
    });
  }

  return entries;
}

export function localPluginsDevPlugin(options: LocalPluginsDevPluginOptions): Plugin {
  const { monorepoRoot, basePath = "" } = options;
  const normalizedBase = basePath.replace(/\/$/, "") || "";

  return {
    name: "local-plugins-dev",
    apply: "serve",
    configureServer(server) {
      const localPluginsDir = path.join(monorepoRoot, ".local-plugins");
      if (!fs.existsSync(localPluginsDir)) return;

      server.middlewares.use((req, res, next) => {
        const url = (req.url?.split("?")[0] ?? "").replace(/^\/+/, "/") || "/";
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
          const filePath = path.join(localPluginsDir, pluginDirName, "dist", ...fileParts);
          if (!filePath.startsWith(path.join(localPluginsDir, pluginDirName))) {
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
