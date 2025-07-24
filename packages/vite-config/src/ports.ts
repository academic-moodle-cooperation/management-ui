export const DEFAULT_SHELL_APP_PORT = 3000;
const PLUGIN_DEV_PORT_START = 3001;

const KNOWN_PLUGIN_PACKAGE_NAMES = [
  "management-ui-series",
  "management-ui-episodes",
  "management-ui-upload",
  "management-ui-test", // Updated: no scope
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
  const pluginShortName = pluginPackageName.replace(/^management-ui-plugin-/, "").replace(/^management-ui-/, "");
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
