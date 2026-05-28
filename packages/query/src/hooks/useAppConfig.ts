import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useRegistry, type PluginManager } from "@oc-mui/plugin-system";
import { defaultConfig, getAppConfig, type AppConfig } from "@oc-mui/ui-config";
import { deepMerge, logger } from "@oc-mui/utils";

const CONFIG_QUERY_KEY = ["appConfig"];

/**
 * Layered merge precedence used across both the hook and the sync snapshot.
 *
 *   defaults   (`app:config:defaults`)          — lowest, plugin-provided
 *   base       (`defaultConfig` ⊕ `config.json`) — shell + deployment
 *   overrides  (`app:config`)                    — highest, runtime overlays
 *
 * Plugins contribute their slice defaults via `app:config:defaults` in
 * `initialize()`. The deployment's `config.json` (loaded via `getAppConfig`)
 * can override any of those defaults key-by-key. Finally, `.local-plugins/`
 * and similar runtime integrations layer on top via `app:config`. This order
 * is identical in dev and prod so the same `config.json` behaves the same
 * way everywhere.
 */
const CONFIG_DEFAULTS_EXTENSION = "app:config:defaults";
const CONFIG_OVERLAYS_EXTENSION = "app:config";

/**
 * Fetch `config.json` (if a URL is configured) and normalize it through
 * `getAppConfig` so shell defaults are guaranteed. When no URL is configured
 * we simply start from `defaultConfig`.
 *
 * This is the *base* layer. Plugin-contributed defaults and overlays are
 * merged around it at render time in {@link useAppConfig}.
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
 * Used inside `PluginInitializer` (two-phase plugin loading) where we need
 * to inspect the currently registered `app:config` overlays *without*
 * subscribing to React state. Callers should pass the already-fetched base
 * config so the snapshot reflects both the deployed `config.json` and the
 * registry layers described at the top of this file.
 */
export function getAppConfigSync(
  pluginManager?: PluginManager,
  baseConfig?: AppConfig,
): AppConfig {
  let defaults: Partial<AppConfig>[] = [];
  let overlays: Partial<AppConfig>[] = [];
  if (pluginManager) {
    try {
      defaults = pluginManager.getObjects<Partial<AppConfig>>(CONFIG_DEFAULTS_EXTENSION);
      overlays = pluginManager.getObjects<Partial<AppConfig>>(CONFIG_OVERLAYS_EXTENSION);
    } catch (error) {
      logger.warn("getAppConfigSync: Failed to get plugin configs from manager", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const base = baseConfig ?? defaultConfig;
  return deepMerge<AppConfig>(
    {} as AppConfig,
    ...defaults,
    { ...base },
    ...overlays,
  ) as AppConfig;
}

export function useAppConfig() {
  const configUrl = defaultConfig.productionConfigUrl || undefined;

  const { items: pluginDefaults } = useRegistry(CONFIG_DEFAULTS_EXTENSION);
  const { items: pluginOverlays } = useRegistry(CONFIG_OVERLAYS_EXTENSION);

  const queryResult = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: () => fetchBaseConfig(configUrl),
    enabled: !!configUrl,
    initialData: configUrl ? undefined : { ...defaultConfig },
    staleTime: Infinity,
  });

  const mergedConfig = useMemo(() => {
    const base = queryResult.data ?? { ...defaultConfig };
    const defaults = (pluginDefaults || []) as Partial<AppConfig>[];
    const overlays = (pluginOverlays || []) as Partial<AppConfig>[];
    return deepMerge<AppConfig>(
      {} as AppConfig,
      ...defaults,
      { ...base },
      ...overlays,
    ) as AppConfig;
  }, [queryResult.data, pluginDefaults, pluginOverlays]);

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
    // Re-runs the underlying TanStack Query fetch. Useful for an
    // error-recovery "Retry" button so callers don't have to full-page-
    // reload to escape a transient failure (e.g. the backend was down
    // when the shell booted and is up now).
    refetch: queryResult.refetch,
    // The URL the hook tried to fetch from. Surfaced so error UIs can
    // show "we tried <url>"; reproduces the value the shell would have
    // computed anyway.
    configUrl,
  };
}
export type { AppConfig };
