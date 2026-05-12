import path from "node:path";

import { createBaseConfig, type CreateBaseConfigOptions } from "./base.config.js";
import { getPluginPorts, getPluginBasePath, getAppBasePath } from "./ports.js";
import { createProxyConfig } from "./proxy.js";

import type { UserConfig, BuildOptions } from "vite";

export interface CreatePluginAppViteConfigOptions {
  packageName: string;
  mode: string; // 'development', 'production', etc.
  env: Record<string, string>; // Loaded environment variables
  invokerDir: string; // __dirname of the vite.config.ts file calling this
}

export const createPluginAppViteConfig = (
  options: CreatePluginAppViteConfigOptions,
): UserConfig => {
  const { packageName, mode, env, invokerDir } = options;
  const isProduction = mode === "production";

  // For plugin apps at plugins/<name>/apps/<app>/ or .local-plugins/<name>/apps/<app>/, go up 4 levels to repo root
  // For other plugins at plugins/<name>/ or .local-plugins/<name>/, go up 2 levels
  const isInsidePlugins =
    invokerDir.includes(`${path.sep}plugins${path.sep}`) ||
    invokerDir.includes(`${path.sep}.local-plugins${path.sep}`);
  const isPluginApp = isInsidePlugins && invokerDir.includes(`${path.sep}apps${path.sep}`);
  const monorepoRootPath = isPluginApp
    ? path.resolve(invokerDir, "../../../..") // e.g., plugins/<name>/apps/<app> -> repo root
    : path.resolve(invokerDir, "../.."); // e.g., apps/<app> or plugins/<name> -> repo root

  const baseConfigOptions: CreateBaseConfigOptions = {
    isProduction,
    resolveAliases: {
      "@": path.resolve(invokerDir, "src"),
      // Minimal generic roots for workspace packages used in plugin code
      "@oc-mui/ui/globals.css": path.resolve(
        monorepoRootPath,
        "packages/ui/src/styles/globals.css",
      ),
      "@oc-mui/i18n": path.resolve(monorepoRootPath, "packages/i18n/src"),
      "@oc-mui/router": path.resolve(monorepoRootPath, "packages/router/src"),
      "@oc-mui/plugin-system": path.resolve(monorepoRootPath, "packages/plugin-system/src"),
      "@oc-mui/ui": path.resolve(monorepoRootPath, "packages/ui/src"),
      "@oc-mui/query": path.resolve(monorepoRootPath, "packages/query/src"),
      "@oc-mui/providers": path.resolve(monorepoRootPath, "packages/providers/src"),
      "@oc-mui/utils": path.resolve(monorepoRootPath, "packages/utils/src"),
      "@oc-mui/plugins": path.resolve(monorepoRootPath, "plugins"),
    },
    serverOptions: {
      fs: {
        allow: [monorepoRootPath], // Allow access to monorepo root for imports if necessary
      },
      host: "127.0.0.1",
    },
    buildOptions: {
      // Plugin-specific build options can go here
      // For example, if plugins need to be built as libraries, though current setup treats them as apps.
    },
  };

  const baseSettings = createBaseConfig(baseConfigOptions);

  const ports = getPluginPorts(packageName);
  // Provide a more deterministic fallback if plugin is not in KNOWN_PLUGIN_PACKAGE_NAMES
  // Hashing the package name to a port number could be an option for more stability than Math.random()
  const fallbackDevPort =
    3100 + (packageName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100);
  const assignedDevPort = ports?.dev || fallbackDevPort;
  const assignedPreviewPort = ports?.preview || assignedDevPort + 1000; // Ensure preview is distinct

  const currentShellAppBasePath = getAppBasePath(isProduction, env["VITE_APP_BASE_PATH"]);
  const calculatedPluginBasePath = getPluginBasePath(
    isProduction,
    packageName,
    currentShellAppBasePath,
  );

  // Allow plugin-specific base path override via env: VITE_PLUGIN_<UPPERCASED_PACKAGE>_BASE_PATH.
  const pluginSpecificEnvVarName = `VITE_PLUGIN_${packageName.toUpperCase().replace(/-/g, "_")}_BASE_PATH`;
  const finalPluginBasePath = env[pluginSpecificEnvVarName] || calculatedPluginBasePath;

  const proxyConfiguration = createProxyConfig({
    isProduction,
    ...(env["VITE_PROXY_TARGET"] !== undefined && { target: env["VITE_PROXY_TARGET"] }),
    // customProxies: { ... } // if plugin needs specific proxies from env or hardcoded
  });

  // baseSettings.build will have defaults from createBaseConfig.
  // We are relying on the top-level 'base' property for most path resolutions during build.
  const finalBuildOptions: BuildOptions = {
    ...baseSettings.build,
    // base: finalPluginBasePath, // Removed to avoid persistent linter issue; top-level base should cover most cases.
  };

  return {
    ...baseSettings,
    base: finalPluginBasePath,
    server: {
      ...(baseSettings.server || {}),
      port: assignedDevPort,
      proxy: proxyConfiguration,
    },
    preview: {
      ...(baseSettings.preview || {}),
      port: assignedPreviewPort,
      proxy: proxyConfiguration,
    },
    build: finalBuildOptions,
  };
};
