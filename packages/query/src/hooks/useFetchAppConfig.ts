import { type UseQueryResult } from "@tanstack/react-query"; // Assuming useGenericQuery provides this type
import { useGenericQuery } from "./useGenericQuery"; // Corrected path
import { type AppConfig, defaultConfig, getAppConfig } from "@workspace/ui-config";

interface UseFetchAppConfigOptions {
  configUrl?: string;
  staleTime?: number;
  enabled?: boolean;
}

export const useFetchAppConfig = (
  options?: UseFetchAppConfigOptions
): UseQueryResult<AppConfig, Error> => {
  const { configUrl, staleTime = Infinity, enabled = true } = options || {};

  const queryKey = ["appFetchedConfig", configUrl] as const;

  const queryFn = async (): Promise<AppConfig> => {
    if (!configUrl) {
      // If no configUrl is provided, return the defaultConfig directly.
      // The `enabled` flag should ideally be false in this case from the caller if fetching isn't desired.
      return Promise.resolve(defaultConfig);
    }
    
    const response = await fetch(configUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch config from ${configUrl}: ${response.statusText}`);
    }
    const fetchedPartialConfig = await response.json() as Partial<AppConfig>;
    // Use getAppConfig to merge fetched partial config with defaults
    return getAppConfig(fetchedPartialConfig);
  };

  // If no configUrl, the query will use initialData and won't fetch.
  // If configUrl is present, fetching is enabled.
  return useGenericQuery<AppConfig, Error, AppConfig, typeof queryKey>({
    queryKey,
    queryFn,
    staleTime,
    enabled: !!configUrl && enabled, // Only enable if configUrl is present and enabled is true
    // Provide initialData if not fetching, so consumers have a valid config structure immediately.
    ...(!configUrl && { initialData: defaultConfig, isSuccess: true, isLoading: false, isFetched: true, refetchOnWindowFocus: false, refetchOnMount: false, refetchOnReconnect: false }),
  });
}; 