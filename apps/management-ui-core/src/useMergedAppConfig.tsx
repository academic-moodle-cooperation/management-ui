import { useFetchAppConfig } from '@workspace/query';
import { defaultConfig } from '@workspace/ui-config';
import { useRegistry } from '@workspace/plugin-system';
import { useMemo } from 'react';
import type { AppConfig } from '@workspace/ui-config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: Record<string, any>, ...sources: Record<string, any>[]): Record<string, any> {
  for (const source of sources) {
    if (typeof source !== 'object' || source === null) continue;
    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

export function useMergedAppConfig() {
  const configUrl = import.meta.env.VITE_APP_CONFIG_URL || undefined;
  const isDev = import.meta.env.DEV;

  // 1. Get base config
  // Always call the hook, but conditionally enable it
  const shouldFetch = !isDev && !!configUrl;
  const fetchedConfigResult = useFetchAppConfig({ 
    configUrl, 
    enabled: shouldFetch 
  });
  
  const baseConfig = shouldFetch && fetchedConfigResult.data 
    ? fetchedConfigResult.data 
    : defaultConfig;
    
  const isLoading = shouldFetch ? fetchedConfigResult.isLoading : false;
  const isError = shouldFetch ? fetchedConfigResult.isError : false;
  const error = shouldFetch ? fetchedConfigResult.error : null;
  const isFetched = shouldFetch ? fetchedConfigResult.isFetched : true;

  // 2. Merge plugin config
  // Always call useRegistry hook - it's safe even if plugin system isn't ready
  const { items: pluginConfigObjects } = useRegistry('app:config');
  
  // Memoize the merged config to prevent infinite loops
  const mergedConfig = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return deepMerge({ ...baseConfig }, ...(pluginConfigObjects as Record<string, any>[])) as AppConfig;
  }, [baseConfig, pluginConfigObjects]);
  
  return { config: mergedConfig, isLoading, isError, error, isFetched };
} 