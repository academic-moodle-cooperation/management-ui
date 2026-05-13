import { defaultConfig, getAppConfig, type AppConfig } from "@oc-mui/ui-config";

let configPromise: Promise<AppConfig> | null = null;

/**
 * Fetch-and-cache the production `config.json` for call-sites that live
 * outside the React tree (route loaders, bootstrap utilities).
 *
 * The fetched payload is funnelled through `getAppConfig(customConfig)` so it
 * goes through the same default-merge as the `useAppConfig` hook. This keeps
 * the *base layer* consistent between the React-Query-backed hook and the
 * imperative loader — any divergence would only come from plugin-contributed
 * overlays, which are not relevant for these call-sites.
 */
export const getCachedAppConfig = (): Promise<AppConfig> => {
  if (!configPromise) {
    const rawUrl = defaultConfig.productionConfigUrl;
    if (!rawUrl) {
      configPromise = Promise.resolve({ ...defaultConfig });
      return configPromise;
    }
    const configUrl = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    configPromise = fetch(configUrl)
      .then((res) => {
        if (!res.ok) {
          configPromise = null;
          throw new Error(`HTTP error fetching app config! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => getAppConfig(data))
      .catch((err) => {
        configPromise = null;
        throw err;
      });
  }
  return configPromise;
};

/**
 * Clear the cached promise. Useful for tests and for explicit re-fetches.
 */
export const clearAppConfigCache = (): void => {
  configPromise = null;
};
