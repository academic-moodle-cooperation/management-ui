import type { Plugin } from "@workspace/plugin-system";
import * as AllPlugins from "@workspace/plugins";
import type { AppConfig, PluginNamespaceItem } from "@workspace/query";
import { logger } from "@workspace/utils";

const isPlugin = (module: unknown): module is Plugin =>
  module !== null &&
  typeof module === "object" &&
  "name" in module &&
  "version" in module &&
  "activate" in module &&
  "deactivate" in module;

/**
 * Parse plugin configuration from the array-based `pluginNamespace` format.
 */
const parsePluginConfig = (
  pluginNamespace: PluginNamespaceItem[],
): Map<string, string[] | "all"> => {
  const configMap = new Map<string, string[] | "all">();

  for (const item of pluginNamespace) {
    if (typeof item === "string") {
      configMap.set(item, "all");
    } else {
      Object.entries(item).forEach(([namespace, config]) => {
        configMap.set(namespace, config.types || ["all"]);
      });
    }
  }

  return configMap;
};

/**
 * Return the set of plugin namespace names that are enabled in config.
 * Used to filter .local-plugins manifest entries (folder name = namespace).
 * E.g. pluginNamespace: ["core", "univie"] => Set {"core", "univie"}.
 */
export function getEnabledPluginNamespaces(config?: AppConfig): Set<string> {
  const raw = config?.app?.pluginNamespace;
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return new Set(); // Empty = no filter (load all .local-plugins when no config filter)
  }
  const set = new Set<string>();
  for (const item of raw) {
    if (typeof item === "string") {
      set.add(item);
    } else if (item && typeof item === "object") {
      for (const key of Object.keys(item)) {
        set.add(key);
      }
    }
  }
  return set;
}

/**
 * Return enabled types for a namespace (for .local-plugins type filtering).
 * E.g. univie: { types: ["sidebar", "footer"] } => Set {"sidebar", "footer"}.
 * Returns "all" if the namespace is enabled with no type restriction (string or types: ["all"]).
 */
export function getEnabledTypesForNamespace(
  config: AppConfig | undefined,
  namespace: string,
): Set<string> | "all" {
  const raw = config?.app?.pluginNamespace;
  if (!raw || !Array.isArray(raw)) return "all";
  const configMap = parsePluginConfig(raw);
  const types = configMap.get(namespace);
  if (types === undefined) return "all";
  if (types === "all") return "all";
  return new Set(types);
}

/**
 * Load all plugins bundled with the shell. Filtering by `app.pluginNamespace`
 * happens later in {@link PluginInitializer}, after the merged config is
 * known, so this helper stays intentionally minimal.
 */
export const loadAllAvailablePlugins = async (): Promise<Plugin[]> => {
  try {
    const allModules = Object.values(AllPlugins);
    return allModules.filter(isPlugin);
  } catch (error) {
    logger.error(
      "CRITICAL ERROR in loadAllAvailablePlugins",
      error instanceof Error ? error : new Error(String(error)),
    );
    throw error;
  }
};
