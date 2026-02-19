import path from "node:path";

import { defineConfig, loadEnv } from "vite";

import {
  createShellAppViteConfig,
  generateConfigPlugin,
  localPluginsDevPlugin,
} from "@workspace/vite-config";

import { defaultConfig } from "../../packages/ui-config/src/index.ts";

const packageName = process.env["npm_package_name"] || "management-ui-core";

/**
 * PLUGIN CONFIG ORDER
 *
 * This array defines which organization's configuration is active.
 * The order matters - later configs override earlier ones.
 *
 * Note: University/organization-specific configs should be provided via:
 * - Community Plugins (loaded via Registry)
 * - Local development plugins (.local-plugins/)
 * - JAR deployment (plugins.json)
 *
 * Only default/core config is used here for the OSS version.
 */
const PLUGIN_CONFIGS: typeof defaultConfig[] = [];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Calculate monorepo root path (two levels up from apps/management-ui-core)
  const monorepoRootPath = path.resolve(__dirname, "../..");
  const env = loadEnv(mode, monorepoRootPath, ""); // Load all env variables from monorepo root

  const baseConfig = createShellAppViteConfig({
    packageName,
    mode,
    env,
    invokerDir: __dirname, // Pass the directory of the current vite.config.ts
  });

  // In dev, serve .local-plugins/ and expose /local-plugins/manifest.json
  if (mode === "development") {
    const monorepoRootPath = path.resolve(__dirname, "../..");
    const shellBasePath = baseConfig.base ?? "/";
    baseConfig.plugins = baseConfig.plugins || [];
    baseConfig.plugins.push(
      localPluginsDevPlugin({
        monorepoRoot: monorepoRootPath,
        basePath: shellBasePath.replace(/\/$/, ""),
      }),
    );
  }

  // Add config generation plugin in production mode
  // This ensures the same merge order is used in both dev and prod
  if (mode === "production") {
    baseConfig.plugins = baseConfig.plugins || [];
    baseConfig.plugins.push(
      generateConfigPlugin({
        defaultConfig,
        pluginConfigs: PLUGIN_CONFIGS, // Use the explicit ordered list
      }),
    );
  }

  return baseConfig;
});
