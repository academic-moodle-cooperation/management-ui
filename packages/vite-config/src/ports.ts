export const DEFAULT_SHELL_APP_PORT = 3000;
const PLUGIN_DEV_PORT_START = 3001;

// Core apps that are always present
const CORE_APP_NAMES = [
  "management-ui-series",
  "management-ui-episodes",
  "management-ui-upload",
  "management-ui-test",
];

// Known plugin packages - simplified to avoid dynamic discovery issues
const discoverPluginPackages = (): string[] => {
  return ["plugin-tuwien", "plugin-univie", "plugin-example-university"];
};

const KNOWN_PLUGIN_PACKAGE_NAMES = [...CORE_APP_NAMES, ...discoverPluginPackages()];

interface PluginPorts {
  dev: number;
  preview: number;
}

/**
 * Gets assigned development and preview ports for a given plugin package name.
 * Core apps get ports 3001-3004, plugin packages get ports 3005+.
 */
export const getPluginPorts = (pluginPackageName: string): PluginPorts | undefined => {
  // Check if it's a core app first
  const coreAppIndex = CORE_APP_NAMES.indexOf(pluginPackageName);
  if (coreAppIndex !== -1) {
    // Core apps get ports 3001-3004
    const devPort = PLUGIN_DEV_PORT_START + coreAppIndex;
    return {
      dev: devPort,
      preview: devPort + 100,
    };
  }

  // Check if it's a plugin package
  const pluginPackages = discoverPluginPackages();
  const pluginIndex = pluginPackages.indexOf(pluginPackageName);
  if (pluginIndex !== -1) {
    // Plugin packages get ports starting after core apps (3005+)
    const devPort = PLUGIN_DEV_PORT_START + CORE_APP_NAMES.length + pluginIndex;
    return {
      dev: devPort,
      preview: devPort + 100,
    };
  }

  console.warn(
    `[vite-config] Plugin "${pluginPackageName}" not found in known plugin list for port assignment.`
  );
  return undefined;
};

/**
 * Generates the base path for a plugin.
 * - Production/Preview: /<shell-base-path>/static/plugins/<plugin-short-name>/
 * - Development: /<shell-base-path>/ for management-ui apps, /<plugin-short-name>/ for other plugins
 */
export const getPluginBasePath = (
  isProduction: boolean,
  pluginPackageName: string,
  shellAppBasePath: string = "/management-ui/"
): string => {
  // Derives "test" from "management-ui-test"
  const pluginShortName = pluginPackageName.replace(/^management-ui-/, "");
  const ensuredShellBase =
    shellAppBasePath === "/"
      ? "/"
      : shellAppBasePath.endsWith("/")
        ? shellAppBasePath
        : `${shellAppBasePath}/`;

  if (isProduction) {
    return `${ensuredShellBase}static/plugins/${pluginShortName}/`;
  }

  // Development: management-ui apps should use the shell base path for consistent asset loading
  if (pluginPackageName.startsWith("management-ui-")) {
    return ensuredShellBase;
  }

  // Other plugins serve from root of their port
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
    return basePath.endsWith("/") ? basePath : `${basePath}/`;
  }
  // Development for shell app: also use /management-ui/ for consistent routing
  return defaultProdBasePath;
};
