import type { Plugin } from "@workspace/plugin-system";
import type { AppConfig, PluginNamespaceItem } from "@workspace/query";
import * as AllPlugins from "@workspace/plugins";
import { logger } from "@workspace/utils";

// Helper function to check if an object is a valid plugin
const isPlugin = (module: unknown): module is Plugin =>
  module !== null &&
  typeof module === "object" &&
  "name" in module &&
  "version" in module &&
  "activate" in module &&
  "deactivate" in module;

/**
 * Parse plugin configuration from the new array-based format
 */
const parsePluginConfig = (
  pluginNamespace: PluginNamespaceItem[]
): Map<string, string[] | "all"> => {
  const configMap = new Map<string, string[] | "all">();

  for (const item of pluginNamespace) {
    if (typeof item === "string") {
      // Simple string means enable all types for this namespace
      configMap.set(item, "all");
    } else {
      // Object with granular control
      Object.entries(item).forEach(([namespace, config]) => {
        configMap.set(namespace, config.types || ["all"]);
      });
    }
  }

  return configMap;
};

/**
 * Check if a plugin should be loaded based on the new configuration format
 */
const shouldLoadPlugin = (plugin: Plugin, config?: AppConfig): boolean => {
  // Extract namespace and type from plugin name (format: "namespace:type")
  const [pluginNamespace, pluginType] = plugin.name.split(":");

  // Handle cases where plugin name doesn't follow namespace:type format
  if (!pluginNamespace) {
    return false; // Invalid plugin name format
  }

  // Always load config plugins
  if (pluginType === "config") {
    return true;
  }

  // Parse the new configuration format
  const pluginConfig = parsePluginConfig(config?.app?.pluginNamespace || []);

  // Check if namespace is enabled
  const namespaceConfig = pluginConfig.get(pluginNamespace);
  if (!namespaceConfig) {
    return false; // Namespace not in config = disabled
  }

  // If namespace config is 'all', enable all types
  if (namespaceConfig === "all") {
    return true;
  }

  // Check if specific type is enabled
  if (pluginType && Array.isArray(namespaceConfig)) {
    return namespaceConfig.includes(pluginType);
  }

  // Default to enabled if no type specified
  return true;
};

/**
 * Load all available plugins without any filtering
 * Used when we need to get all plugins before applying configuration-based filtering
 */
export const loadAllAvailablePlugins = async (): Promise<Plugin[]> => {
  try {
    // Load all available plugins and filter for Plugin type
    const allModules = Object.values(AllPlugins);
    const allPlugins = allModules.filter(isPlugin);

    return allPlugins;
  } catch (error) {
    logger.error(
      "CRITICAL ERROR in loadAllAvailablePlugins",
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};

/**
 * Load plugins based on configuration - Clean Array-Based Filtering
 *
 * Supports the new array format: ["core", {"tuwien": {types: ["episodes-actions"]}}]
 */
export const loadAllPlugins = async (config?: AppConfig): Promise<Plugin[]> => {
  try {
    // Load all available plugins and filter for Plugin type
    const allModules = Object.values(AllPlugins);
    const allPlugins = allModules.filter(isPlugin);

    // Filter plugins based on array configuration
    const filteredPlugins = allPlugins.filter((plugin) => {
      const shouldLoad = shouldLoadPlugin(plugin, config);
      return shouldLoad;
    });

    return filteredPlugins;
  } catch (error) {
    logger.error(
      "CRITICAL ERROR in loadAllPlugins",
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
};
