import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useRegistry, type PluginManager } from "@workspace/plugin-system";
import {
  defaultConfig,
  getAppConfig,
  type AppConfig,
  type PluginNamespaceItem,
} from "@workspace/ui-config";
import { deepMerge, logger } from "@workspace/utils";

const CONFIG_QUERY_KEY = ["appConfig"];

/**
 * Fetch `config.json` (if a URL is configured) and normalize it through
 * `getAppConfig` so defaults are guaranteed. When no URL is configured we
 * simply start from `defaultConfig`.
 *
 * This is the *base* layer. Plugin-contributed `app:config` overlays are
 * merged on top at render time in {@link useAppConfig} — identical logic for
 * dev and prod, so the order in which overrides apply is predictable.
 */
const fetchBaseConfig = async (configUrl?: string): Promise<AppConfig> => {
  if (!configUrl) return { ...defaultConfig };
  const resolvedUrl = configUrl.startsWith("/") ? configUrl : `/${configUrl}`;
  const response = await fetch(resolvedUrl);
  if (!response.ok) throw new Error(`Failed to fetch config: ${response.statusText}`);
  const customConfig = await response.json();
  return getAppConfig(customConfig);
};

/**
 * Non-hook, synchronous snapshot of the current effective config.
 *
 * Used inside `PluginInitializer` (two-phase plugin loading) where we need to
 * inspect the currently registered `app:config` overlays *without* subscribing
 * to React state. Callers should pass the already-fetched base config so the
 * snapshot reflects both the deployed `config.json` and registry overlays.
 */
export function getAppConfigSync(
  pluginManager?: PluginManager,
  baseConfig?: AppConfig,
): AppConfig {
  let pluginConfigObjects: Partial<AppConfig>[] = [];
  if (pluginManager) {
    try {
      pluginConfigObjects = pluginManager.getObjects<Partial<AppConfig>>("app:config");
    } catch (error) {
      logger.warn("getAppConfigSync: Failed to get plugin configs from manager", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const base = baseConfig ?? defaultConfig;
  return deepMerge({ ...base }, ...pluginConfigObjects) as AppConfig;
}

export function useAppConfig() {
  const configUrl = defaultConfig.productionConfigUrl || undefined;

  const { items: pluginConfigObjects } = useRegistry("app:config");

  const queryResult = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: () => fetchBaseConfig(configUrl),
    enabled: !!configUrl,
    initialData: configUrl ? undefined : { ...defaultConfig },
    staleTime: Infinity,
  });

  // Unified merge: default/fetched base → plugin overlays, dev and prod alike.
  const mergedConfig = useMemo(() => {
    const base = queryResult.data ?? { ...defaultConfig };
    const overlays = (pluginConfigObjects || []) as Partial<AppConfig>[];
    return deepMerge({ ...base }, ...overlays) as AppConfig;
  }, [queryResult.data, pluginConfigObjects]);

  const hasFetch = !!configUrl;
  const isLoading = hasFetch ? queryResult.isLoading : false;
  const isError = hasFetch ? queryResult.isError : false;
  const error = hasFetch ? queryResult.error : null;
  const isFetched = hasFetch ? queryResult.isFetched : true;

  return {
    config: mergedConfig,
    isLoading,
    isError,
    error,
    isFetched,
  };
}
export type { AppConfig, PluginNamespaceItem };
