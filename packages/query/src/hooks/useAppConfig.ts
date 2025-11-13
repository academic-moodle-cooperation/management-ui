import { useQuery } from '@tanstack/react-query';
import { defaultConfig, type AppConfig, type PluginNamespaceItem, getAppConfig } from '@workspace/ui-config';
import { useRegistry } from '@workspace/plugin-system';
import { useMemo } from 'react';
import { deepMerge } from '@workspace/utils';

const CONFIG_QUERY_KEY = ['appConfig'];

const fetchAndMergeConfig = async (configUrl?: string): Promise<AppConfig> => {
  if (!configUrl) return { ...defaultConfig };
  const response = await fetch(configUrl);
  if (!response.ok) throw new Error(`Failed to fetch config: ${response.statusText}`);
  const customConfig = await response.json();
  return getAppConfig(customConfig);
};

// Non-hook version for use during plugin initialization
export function getAppConfigSync(pluginManager?: any): AppConfig {
  const configUrl = defaultConfig.productionConfigUrl || undefined;
  const isDev = import.meta.env.DEV;

  // Get plugin configs directly from manager if available
  let pluginConfigObjects: Record<string, any>[] = [];
  if (pluginManager) {
    try {
      pluginConfigObjects = pluginManager.getObjects('app:config') as Record<string, any>[];
    } catch (error) {
      console.warn('getAppConfigSync: Failed to get plugin configs from manager');
    }
  }

  // In dev mode, just use default config merged with plugin configs
  // In production, this would need to be called after config is fetched
  const baseConfig = isDev ? { ...defaultConfig } : { ...defaultConfig };

  return deepMerge(
    baseConfig,
    ...(pluginConfigObjects || [])
  ) as AppConfig;
}

export function useAppConfig() {
  const configUrl = defaultConfig.productionConfigUrl || undefined;
  const isDev = import.meta.env.DEV;

  // Get plugin configs (only used in dev mode)
  const { items: pluginConfigObjects } = useRegistry('app:config');

  // In production, fetch pre-merged config.json (no runtime merging needed)
  // In dev, use defaultConfig and merge plugin configs at runtime
  const queryResult = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: () => fetchAndMergeConfig(configUrl),
    enabled: !isDev && !!configUrl,
    initialData: isDev ? { ...defaultConfig } : undefined,
    staleTime: Infinity,
  });

  // In dev mode: merge plugin configs at runtime (same order as build)
  // In prod mode: use pre-merged config.json as-is (no additional merging)
  const mergedConfig = useMemo(
    () => {
      if (isDev) {
        // Dev: Runtime merging with explicit order
        return deepMerge(
          queryResult.data ?? { ...defaultConfig },
          ...((pluginConfigObjects as Record<string, any>[]) || [])
        ) as AppConfig;
      } else {
        // Prod: Use pre-merged config.json directly
        return (queryResult.data ?? { ...defaultConfig }) as AppConfig;
      }
    },
    [queryResult.data, pluginConfigObjects, isDev]
  );

  // Emulate loading/error state logic as before
  const isLoading = !isDev && !!configUrl ? queryResult.isLoading : false;
  const isError = !isDev && !!configUrl ? queryResult.isError : false;
  const error = !isDev && !!configUrl ? queryResult.error : null;
  const isFetched = !isDev && !!configUrl ? queryResult.isFetched : true;

  return {
    config: mergedConfig,
    isLoading,
    isError,
    error,
    isFetched,
  };
}
export type { AppConfig, PluginNamespaceItem };