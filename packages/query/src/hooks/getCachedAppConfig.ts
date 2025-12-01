import type { AppConfig } from '@workspace/ui-config';
import { defaultConfig } from '@workspace/ui-config';

let configPromise: Promise<AppConfig> | null = null;

/**
 * Fetches the application configuration from the configured productionConfigUrl.
 * Caches the promise of the fetch request, so subsequent calls return the cached data/promise
 * without re-fetching.
 * If a fetch fails, the cache is cleared to allow for retries on subsequent calls.
 */
export const getCachedAppConfig = (): Promise<AppConfig> => {
  if (!configPromise) {
    // Use productionConfigUrl from defaultConfig directly
    // Note: Config is served by OSGi at a different path than regular assets
    // (e.g., /ui/config/... instead of /management-ui/assets/...)
    // so we DON'T use resolveAssetUrl here
    const configUrl = defaultConfig.productionConfigUrl.startsWith('/')
      ? defaultConfig.productionConfigUrl
      : `/${defaultConfig.productionConfigUrl}`;
    configPromise = fetch(configUrl)
      .then((res) => {
        if (!res.ok) {
          // Reset promise on error so retries are possible
          configPromise = null;
          throw new Error(`HTTP error fetching app config! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: AppConfig) => {
        // Type assertion might be needed if the fetched data isn't strictly AppConfig
        return data;
      })
      .catch((err) => {
        // Reset promise on error so retries are possible
        configPromise = null;
        throw err; // Re-throw to allow callers to handle
      });
  }
  return configPromise;
};

/**
 * Clears the cached application configuration promise.
 * Useful for testing or scenarios where a fresh fetch is explicitly required.
 */
export const clearAppConfigCache = (): void => {
  configPromise = null;
}; 