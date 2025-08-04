export const DEFAULT_SHELL_APP_PORT = 3000;
const PLUGIN_DEV_PORT_START = 3001;

// Core apps that are always present
const CORE_APP_NAMES = [
  "management-ui-series",
  "management-ui-episodes",
  "management-ui-upload",
  "management-ui-test",
];

// Dynamically discover plugin packages from the filesystem
const discoverPluginPackages = (): string[] => {
  try {
    // In a Node.js environment (build time), we can scan the plugins directory
    if (typeof process !== 'undefined' && process.cwd) {
      const fs = require('fs');
      const path = require('path');

      const pluginsDir = path.join(process.cwd(), 'plugins');
      if (fs.existsSync(pluginsDir)) {
        const pluginDirs = fs.readdirSync(pluginsDir, { withFileTypes: true })
          .filter((dirent: any) => dirent.isDirectory())
          .map((dirent: any) => dirent.name);

        // Read package.json files to get actual package names
        return pluginDirs.map((dir: string) => {
          const packageJsonPath = path.join(pluginsDir, dir, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            try {
              const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
              return packageJson.name;
            } catch {
              return `plugin-${dir}`; // Fallback to directory name
            }
          }
          return `plugin-${dir}`; // Fallback to directory name
        });
      }
    }
  } catch (error) {
    console.warn('[vite-config] Could not discover plugin packages dynamically:', error);
  }

  // Fallback to known plugins if dynamic discovery fails
  return [
    "plugin-tuwien",
    "plugin-univie",
    "plugin-example-university"
  ];
};

const KNOWN_PLUGIN_PACKAGE_NAMES = [
  ...CORE_APP_NAMES,
  ...discoverPluginPackages()
];

interface PluginPorts {
  dev: number;
  preview: number;
}

/**
 * Gets assigned development and preview ports for a given plugin package name.
 */
export const getPluginPorts = (pluginPackageName: string): PluginPorts | undefined => {
  const pluginIndex = KNOWN_PLUGIN_PACKAGE_NAMES.indexOf(pluginPackageName);
  if (pluginIndex === -1) {
    console.warn(`[vite-config] Plugin "${pluginPackageName}" not found in known plugin list for port assignment.`);
    return undefined;
  }
  const devPort = PLUGIN_DEV_PORT_START + pluginIndex;
  return {
    dev: devPort,
    preview: devPort + 100, // Preview ports start 100 above their dev counterparts
  };
};

/**
 * Generates the base path for a plugin.
 * - Production/Preview: /<shell-base-path>/static/plugins/<plugin-short-name>/
 * - Development (if served standalone): /<plugin-short-name>/
 */
export const getPluginBasePath = (
  isProduction: boolean,
  pluginPackageName: string,
  shellAppBasePath: string = "/management-ui/"
): string => {
  // Derives "test" from "management-ui-test"
  const pluginShortName = pluginPackageName.replace(/^management-ui-/, "");
  const ensuredShellBase = shellAppBasePath === "/" ? "/" : (shellAppBasePath.endsWith("/") ? shellAppBasePath : `${shellAppBasePath}/`);

  if (isProduction) {
    return `${ensuredShellBase}static/plugins/${pluginShortName}/`;
  }
  // Development (standalone plugin): serve from root of its port
  return "/";
};

/**
 * Determines the base path for the main shell application.
 * Uses VITE_APP_BASE_PATH from environment variables if in production and set,
 * otherwise defaults to /management-ui/ for production or / for development.
 */
export const getAppBasePath = (isProduction: boolean, viteAppBasePathEnvVar?: string): string => {
  const defaultProdBasePath = "/management-ui/"; // Always with trailing slash for consistency
  if (isProduction) {
    const basePath = viteAppBasePathEnvVar || defaultProdBasePath;
    return basePath.endsWith('/') ? basePath : `${basePath}/`;
  }
  // Development for shell app: also use /management-ui/ for consistent routing
  return defaultProdBasePath;
};
