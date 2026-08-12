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

import { discoverPluginLocaleNamespaceDirs } from "./local-plugin-locales.js";

import type { Plugin } from "vite";

const MANIFEST_PATH = "/local-plugins/manifest.json";
const LOCAL_PLUGINS_PREFIX = "/local-plugins/";

/** Content-Type by file extension for assets served from `.local-plugins/`. */
const LOCAL_PLUGIN_ASSET_MIME: Record<string, string> = {
  ".mjs": "application/javascript",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

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
  /** Optional URL to the plugin stylesheet. */
  cssUrl?: string;
  /** Folder name under .local-plugins/; used for config-based filtering (app.enabledPlugins). */
  namespace: string;
  /** Type from filename (plugin-<namespace>-<type>.mjs); used to filter by config types for that namespace. */
  type?: string;
  /** JAR scopes this local plugin replaces in dev (skip loading those JAR plugins when this manifest entry is loaded) */
  replacesJarScopes?: string[];
  /** Base URL for plugin locales exposed through the dev server */
  localesUrl?: string;
  /** i18n namespaces available for this plugin */
  i18nNamespaces?: string[];
  /** Shared-runtime majors the plugin targets (from plugin.json `workspaceDependencies`). */
  workspaceDependencies?: Record<string, string>;
}

function discoverPluginLocaleNamespaces(pluginDir: string): string[] {
  const namespaces = new Set<string>();
  for (const entry of discoverPluginLocaleNamespaceDirs(pluginDir)) {
    namespaces.add(entry.namespace);
  }
  return [...namespaces];
}

export function discoverLocalPlugins(monorepoRoot: string, basePath: string): LocalPluginEntry[] {
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
    const cssFiles = distFiles.filter((f) => f.endsWith(".css"));
    const cssUrl =
      cssFiles.length === 1
        ? `${basePath}${LOCAL_PLUGINS_PREFIX}${dirent.name}/${cssFiles[0]}`.replace(/\/+/g, "/")
        : undefined;
    const i18nNamespaces = discoverPluginLocaleNamespaces(pluginDir);
    const localesUrl =
      i18nNamespaces.length > 0 ? `${basePath}/dist/locales`.replace(/\/+/g, "/") : undefined;
    const mjsFiles = distFiles.filter((f) => f.endsWith(".mjs"));
    if (mjsFiles.length === 0) continue;

    let displayName = dirent.name;
    let defaultId = dirent.name;
    let replacesJarScopes: string[] | undefined;
    let workspaceDependencies: Record<string, string> | undefined;

    const readWorkspaceDeps = (value: unknown): Record<string, string> | undefined =>
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, string>)
        : undefined;

    // Read plugin.json (canonical manifest), fall back to package.json pluginMetadata
    const pluginJsonPath = path.join(pluginDir, "plugin.json");
    const pkgPath = path.join(pluginDir, "package.json");
    if (fs.existsSync(pluginJsonPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(pluginJsonPath, "utf-8"));
        if (manifest.name) displayName = manifest.name;
        if (manifest.id) defaultId = manifest.id;
        if (Array.isArray(manifest.replacesJarScopes))
          replacesJarScopes = manifest.replacesJarScopes;
        workspaceDependencies = readWorkspaceDeps(manifest.workspaceDependencies);
      } catch {
        // ignore
      }
    } else if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const meta = typeof pkg.pluginMetadata === "string" ? null : pkg.pluginMetadata;
        if (meta?.name) displayName = meta.name;
        if (meta?.id) defaultId = meta.id;
        if (Array.isArray(meta?.replacesJarScopes))
          replacesJarScopes = meta.replacesJarScopes;
        workspaceDependencies = readWorkspaceDeps(meta?.workspaceDependencies);
      } catch {
        // ignore
      }
    }

    // One manifest entry per .mjs so you can split bundles (e.g. plugin-example-sidebar.mjs)
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
        ...(cssUrl ? { cssUrl } : {}),
        namespace: dirent.name,
        ...(type ? { type } : {}),
        ...(replacesJarScopes?.length ? { replacesJarScopes } : {}),
        ...(localesUrl ? { localesUrl } : {}),
        ...(i18nNamespaces.length > 0 ? { i18nNamespaces } : {}),
        ...(workspaceDependencies ? { workspaceDependencies } : {}),
      });
    }
  }

  return entries;
}

/**
 * Build a map: i18n namespace -> absolute path to that namespace's locale folder.
 * Scans both supported layouts per plugin — the root-level
 * `<plugin>/locales/<namespace>/` (relocatable via plugin.json's `locales`
 * field) and `<plugin>/modules/<module>/locales/<namespace>/`. First
 * registration wins: within a plugin the root-level layout, across plugins the
 * first plugin that ships the namespace.
 */
export function discoverLocalPluginLocales(monorepoRoot: string): Map<string, string> {
  const map = new Map<string, string>();
  const localPluginsDir = path.join(monorepoRoot, ".local-plugins");
  if (!fs.existsSync(localPluginsDir) || !fs.statSync(localPluginsDir).isDirectory()) {
    return map;
  }
  const dirs = fs.readdirSync(localPluginsDir, { withFileTypes: true });
  for (const dirent of dirs) {
    if (!dirent.isDirectory()) continue;
    const pluginDir = path.join(localPluginsDir, dirent.name);
    for (const entry of discoverPluginLocaleNamespaceDirs(pluginDir)) {
      if (!map.has(entry.namespace)) {
        map.set(entry.namespace, entry.dir);
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
          // Serve files under .local-plugins/<name>/: dist/<file> for plugin bundles/assets,
          // or other files from plugin root (themes/, assets/, etc.).
          const pluginDir = path.join(localPluginsDir, pluginDirName);
          const firstPart = fileParts[0];
          const isSingleFileRequest = fileParts.length === 1 && typeof firstPart === "string";
          const distCandidate =
            isSingleFileRequest && typeof firstPart === "string"
              ? path.join(pluginDir, "dist", firstPart)
              : null;
          const filePath =
            distCandidate && fs.existsSync(distCandidate) && fs.statSync(distCandidate).isFile()
              ? distCandidate
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
            const ext = path.extname(filePath).toLowerCase();
            // Serve a correct Content-Type per extension. This matters for
            // assets the browser won't content-sniff — notably SVG, which is
            // only treated as an image when served as `image/svg+xml` (an SVG
            // sent as octet-stream silently won't render as a background-image
            // or <img>). Raster formats sniff by magic bytes, but we set them
            // explicitly anyway. Unknown types fall back to octet-stream.
            const mime = LOCAL_PLUGIN_ASSET_MIME[ext] ?? "application/octet-stream";
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
