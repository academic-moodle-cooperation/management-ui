import path from 'node:path';
import type { UserConfig, BuildOptions } from 'vite';
import { createBaseConfig, type CreateBaseConfigOptions } from './base.config.js';
import { getPluginPorts, getPluginBasePath, getAppBasePath } from './ports.js';
import { createProxyConfig } from './proxy.js';

export interface CreatePluginAppViteConfigOptions {
  packageName: string;
  mode: string; // 'development', 'production', etc.
  env: Record<string, string>; // Loaded environment variables
  invokerDir: string; // __dirname of the vite.config.ts file calling this
}

export const createPluginAppViteConfig = (
  options: CreatePluginAppViteConfigOptions
): UserConfig => {
  const { packageName, mode, env, invokerDir } = options;
  const isProduction = mode === 'production';

  const monorepoRootPath = path.resolve(invokerDir, '../..');

  const baseConfigOptions: CreateBaseConfigOptions = {
    isProduction,
    resolveAliases: {
      '@': path.resolve(invokerDir, 'src'),
      // Plugins might not typically need @monorepo-apps, but can be added if a specific plugin requires it.
    },
    serverOptions: {
      fs: {
        allow: [monorepoRootPath], // Allow access to monorepo root for imports if necessary
      },
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
  const fallbackDevPort = 3100 + (packageName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100);
  const assignedDevPort = ports?.dev || fallbackDevPort;
  const assignedPreviewPort = ports?.preview || (assignedDevPort + 1000); // Ensure preview is distinct

  const currentShellAppBasePath = getAppBasePath(isProduction, env.VITE_APP_BASE_PATH);
  const calculatedPluginBasePath = getPluginBasePath(isProduction, packageName, currentShellAppBasePath);

  // Allow plugin-specific base path override via env, e.g., VITE_PLUGIN_MYPLUGIN_BASE_PATH
  // Example: for 'management-ui-test', check VITE_PLUGIN_MANAGEMENT_UI_TEST_BASE_PATH
  const pluginSpecificEnvVarName = `VITE_PLUGIN_${packageName.toUpperCase().replace(/-/g, '_')}_BASE_PATH`;
  const finalPluginBasePath = env[pluginSpecificEnvVarName] || calculatedPluginBasePath;

  const proxyConfiguration = createProxyConfig({
    isProduction,
    target: env.VITE_PROXY_TARGET,
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