import type { Plugin } from "@workspace/plugin-system";
import * as AllPlugins from "@workspace/plugins";
import type { AppConfig } from "@workspace/query";
import { logger } from "@workspace/utils";

const isPlugin = (module: unknown): module is Plugin =>
  module !== null &&
  typeof module === "object" &&
  "name" in module &&
  "version" in module &&
  "activate" in module &&
  "deactivate" in module;

/**
 * Return the set of plugin namespaces that are enabled in config.
 *
 * The flat `app.enabledPlugins` list is the single gate for whether a
 * namespace (bundled or .local-plugins folder name) may load at all.
 * Finer-grained deactivation belongs on each plugin's own config slice
 * via `config.plugins[<id>].enabled === false`.
 *
 * Returning an empty set means "no filter" and keeps the dev workflow
 * of an empty/absent config working: everything the shell can see loads.
 */
export function getEnabledPluginNamespaces(config?: AppConfig): Set<string> {
  const list = config?.app?.enabledPlugins;
  if (!Array.isArray(list) || list.length === 0) return new Set();
  return new Set(list);
}

/**
 * Runtime switch per plugin slice: a plugin can be disabled without
 * touching `enabledPlugins` by setting `config.plugins[id].enabled: false`.
 * Missing or non-object slices default to enabled.
 */
export function isPluginEnabledAtRuntime(
  config: AppConfig | undefined,
  pluginId: string,
): boolean {
  const slice = config?.plugins?.[pluginId];
  if (!slice || typeof slice !== "object") return true;
  const enabled = (slice as { enabled?: unknown }).enabled;
  return enabled !== false;
}

/**
 * Load all plugins bundled with the shell. Filtering by `app.enabledPlugins`
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
