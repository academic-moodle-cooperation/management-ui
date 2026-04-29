import fs from "node:fs";
import path from "node:path";

import { viteStaticCopy } from "vite-plugin-static-copy";

import { createBaseConfig, type CreateBaseConfigOptions } from "./base.config.js";
import { getAppBasePath, DEFAULT_SHELL_APP_PORT } from "./ports.js";
import { createProxyConfig } from "./proxy.js";

import type { UserConfig, BuildOptions } from "vite";

/** True if at least one JSON file exists under `.local-plugins/<plugin>/modules/<module>/locales/` (avoids empty glob for vite-plugin-static-copy). */
function hasLocalPluginLocaleFiles(monorepoRootPath: string): boolean {
  const localPluginsRoot = path.join(monorepoRootPath, ".local-plugins");
  if (!fs.existsSync(localPluginsRoot) || !fs.statSync(localPluginsRoot).isDirectory()) {
    return false;
  }
  for (const pluginEnt of fs.readdirSync(localPluginsRoot, { withFileTypes: true })) {
    if (!pluginEnt.isDirectory()) continue;
    const modulesRoot = path.join(localPluginsRoot, pluginEnt.name, "modules");
    if (!fs.existsSync(modulesRoot) || !fs.statSync(modulesRoot).isDirectory()) continue;
    for (const modEnt of fs.readdirSync(modulesRoot, { withFileTypes: true })) {
      if (!modEnt.isDirectory()) continue;
      const localesDir = path.join(modulesRoot, modEnt.name, "locales");
      if (!fs.existsSync(localesDir) || !fs.statSync(localesDir).isDirectory()) continue;
      for (const locEnt of fs.readdirSync(localesDir, { withFileTypes: true })) {
        if (locEnt.isFile() && locEnt.name.endsWith(".json")) return true;
        if (locEnt.isDirectory()) {
          const nsDir = path.join(localesDir, locEnt.name);
          try {
            if (
              fs.readdirSync(nsDir).some((name) => name.endsWith(".json"))
            ) {
              return true;
            }
          } catch {
            // ignore
          }
        }
      }
    }
  }
  return false;
}

export interface CreateShellAppViteConfigOptions {
  packageName: string;
  mode: string; // 'development', 'production', etc.
  env: Record<string, string>; // Loaded environment variables
  invokerDir: string; // __dirname of the vite.config.ts file calling this
}

export const createShellAppViteConfig = (options: CreateShellAppViteConfigOptions): UserConfig => {
  const { mode, env, invokerDir } = options;
  const isProduction = mode === "production";

  const monorepoRootPath = path.resolve(invokerDir, "../..");

  // Discover per-plugin asset directories (e.g., plugins/<plugin>/assets/**/*)
  const pluginsRoot = path.resolve(monorepoRootPath, "plugins");
  let perPluginAssetTargets: { src: string; dest: string }[] = [];
  try {
    const pluginEntries = fs.readdirSync(pluginsRoot, { withFileTypes: true });
    perPluginAssetTargets = pluginEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((pluginDirName) => fs.existsSync(path.resolve(pluginsRoot, pluginDirName, "assets")))
      .map((pluginDirName) => ({
        src: path.resolve(pluginsRoot, pluginDirName, "assets/**/*"),
        dest: `assets/${pluginDirName}`,
      }));
  } catch {
    // Silently ignore if plugins directory does not exist in certain environments
  }

  // Discover .local-plugins asset directories (e.g. .local-plugins/univie/assets/**/*)
  const localPluginsRoot = path.resolve(monorepoRootPath, ".local-plugins");
  let localPluginAssetTargets: { src: string; dest: string }[] = [];
  try {
    if (fs.existsSync(localPluginsRoot) && fs.statSync(localPluginsRoot).isDirectory()) {
      const localEntries = fs.readdirSync(localPluginsRoot, { withFileTypes: true });
      localPluginAssetTargets = localEntries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => {
          const assetsDir = path.join(localPluginsRoot, name, "assets");
          return fs.existsSync(assetsDir) && fs.statSync(assetsDir).isDirectory();
        })
        .map((name) => ({
          src: path.join(localPluginsRoot, name, "assets/**/*"),
          dest: `assets/${name}`,
        }));
    }
  } catch {
    // Silently ignore
  }

  // .local-plugins locales only when real files exist (missing dir, empty dir, or no locales → skip; avoids static-copy "no files" noise)
  const localPluginsLocalesTarget = hasLocalPluginLocaleFiles(monorepoRootPath)
    ? [
      {
        src: path.resolve(monorepoRootPath, ".local-plugins/*/modules/*/locales/**/*"),
        dest: "locales",
      },
    ]
    : [];

  // Create static assets copying plugin for i18n and custom assets support
  const staticAssetsCopyPlugin = viteStaticCopy({
    targets: [
      // Core i18n locales
      {
        src: path.resolve(monorepoRootPath, "packages/i18n/src/locales/**/*"),
        dest: "locales",
      },
      // Plugin locales (from packages)
      {
        src: path.resolve(monorepoRootPath, "packages/**/locales/**/*"),
        dest: "locales",
      },
      // All plugin implementations from unified plugins directory
      {
        src: path.resolve(monorepoRootPath, "plugins/**/locales/**/*"),
        dest: "locales",
      },
      // .local-plugins locale namespaces (only when .local-plugins exists)
      ...localPluginsLocalesTarget,
      // Shared plugin assets (global)
      {
        src: path.resolve(monorepoRootPath, "plugins/assets/*"),
        dest: "assets",
      },
      // Per-plugin assets (encapsulated under /assets/<plugin>/...)
      ...perPluginAssetTargets,
      // .local-plugins assets (e.g. assets/univie/logo.png)
      ...localPluginAssetTargets,
    ],
  });

  const baseConfigOptions: CreateBaseConfigOptions = {
    isProduction,
    plugins: [staticAssetsCopyPlugin], // Add static assets copying plugin
    resolveAliases: {
      "@": path.resolve(invokerDir, "src"),
      // Minimal generic roots for workspace packages used in plugin code
      "@workspace/i18n": path.resolve(monorepoRootPath, "packages/i18n/src"),
      "@workspace/ui-config": path.resolve(monorepoRootPath, "packages/ui-config/src"),
      "@workspace/ui/globals.css": path.resolve(
        monorepoRootPath,
        "packages/ui/src/styles/globals.css",
      ),
      "@workspace/utils": path.resolve(monorepoRootPath, "packages/utils/src"),
      "@workspace/router": path.resolve(monorepoRootPath, "packages/router/src"),
      "@workspace/plugin-system": path.resolve(monorepoRootPath, "packages/plugin-system/src"),
      "@workspace/ui": path.resolve(monorepoRootPath, "packages/ui/src"),
      "@workspace/query": path.resolve(monorepoRootPath, "packages/query/src"),
      "@workspace/providers": path.resolve(monorepoRootPath, "packages/providers/src"),
      "@workspace/plugins": path.resolve(monorepoRootPath, "plugins"),
    },
    serverOptions: {
      fs: {
        allow: [monorepoRootPath],
      },
      host: "127.0.0.1",
    },
    buildOptions: {
      // Shell-specific build options can go here
    },
  };

  const baseSettings = createBaseConfig(baseConfigOptions);
  const shellBasePath = getAppBasePath(isProduction, env["VITE_APP_BASE_PATH"]);
  const proxyConfiguration = createProxyConfig({
    isProduction,
    ...(env["VITE_PROXY_TARGET"] !== undefined && { target: env["VITE_PROXY_TARGET"] }),
    // customProxies: { ... } // if shell needs specific proxies from env or hardcoded
  });

  // baseSettings.build will have defaults from createBaseConfig.
  // We are relying on the top-level 'base' property for most path resolutions during build.
  const finalBuildOptions: BuildOptions = {
    ...baseSettings.build,
    // base: shellBasePath, // Removed to avoid persistent linter issue; top-level base should cover most cases.
  };

  return {
    ...baseSettings,
    base: shellBasePath, // Top-level base for dev server and asset paths
    server: {
      ...(baseSettings.server || {}),
      port: DEFAULT_SHELL_APP_PORT,
      proxy: proxyConfiguration,
    },
    preview: {
      ...(baseSettings.preview || {}),
      port: DEFAULT_SHELL_APP_PORT, // Can be the same or different
      proxy: proxyConfiguration,
    },
    build: finalBuildOptions,
  };
};
