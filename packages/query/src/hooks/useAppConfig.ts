import { useQuery } from '@tanstack/react-query';
import { defaultConfig, type AppConfig, type PluginNamespaceItem, getAppConfig } from '@workspace/ui-config';
import { useRegistry } from '@workspace/plugin-system';
import { useMemo } from 'react';

const CONFIG_QUERY_KEY = ['appConfig'];

// Immutable deep merge for objects (no lodash, relaxed type)
function deepMerge(target: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
  return sources.reduce((acc, source) => {
    if (!source) return acc;
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      const accValue = acc[key];
      if (
        Array.isArray(accValue) && Array.isArray(sourceValue)
      ) {
        acc[key] = sourceValue;
      } else if (
        accValue &&
        typeof accValue === 'object' &&
        sourceValue &&
        typeof sourceValue === 'object' &&
        !Array.isArray(accValue) &&
        !Array.isArray(sourceValue)
      ) {
        acc[key] = deepMerge({ ...accValue }, sourceValue);
      } else if (sourceValue !== undefined) {
        acc[key] = sourceValue;
      }
    });
    return acc;
  }, { ...target });
}

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

  // Always get plugin configs
  const { items: pluginConfigObjects } = useRegistry('app:config');

  // In production, fetch and cache config, then merge in plugin configs
  // In dev, just use defaultConfig and merge in plugin configs
  const queryResult = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: () => fetchAndMergeConfig(configUrl),
    enabled: !isDev && !!configUrl,
    initialData: isDev ? { ...defaultConfig } : undefined,
    staleTime: Infinity,
  });

  // Always merge plugin configs last, so they can override
  const mergedConfig = useMemo(
    () =>
      deepMerge(
        queryResult.data ?? { ...defaultConfig },
        ...((pluginConfigObjects as Record<string, any>[]) || [])
      ) as AppConfig,
    [queryResult.data, pluginConfigObjects]
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